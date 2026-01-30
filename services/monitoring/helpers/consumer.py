import pika
import os
import json
import logging
import asyncio
import functools
from typing import Final
from pymongo import MongoClient
from datetime import datetime
from helpers.socket_manager import socket_manager

logger = logging.getLogger("monitoring_service")

RABBITMQ_HOST: Final[str] = os.getenv('RABBITMQ_HOST', 'rabbitmq')
MONGO_URI = f"mongodb://{os.getenv('MONGO_USER', 'admin')}:{os.getenv('MONGO_PASSWORD', '1234')}@{os.getenv('MONGO_HOST', 'mongo')}:{os.getenv('MONGO_PORT', '27017')}"
EXCHANGE_NAME = 'iot_events'
QUEUE_NAME = 'monitoring_queue'

# Synchronous Client for the background thread
mongo_client = MongoClient(MONGO_URI)
db = mongo_client[os.getenv("MONGO_DB", "db_monitoring")]

def process_message(ch, method, properties, body, loop):
    """
    Called by Pika when a message is received.
    'loop' is the Main AsyncIO Loop passed via partial.
    """
    try:
        message = json.loads(body)
        routing_key = method.routing_key
        logger.info(f"Received event '{routing_key}'")
        
        # Determine Collection
        collection = db['events']
        
         # Initialize Document
        document = {
            "topic": routing_key,
            "payload": message,
            "processed_at": datetime.utcnow()
        }
        
        # ---------------------------------------------------------
        # 🧠 BUSINESS LOGIC / ANOMALY DETECTION
        # ---------------------------------------------------------
        payload = message
        
        # 1. Check for High Temp
        if 'telemetry' in payload and payload['telemetry'].get('temperature', 0) > 80:
             logger.warning(f"🔥 CRITICAL ALERT: Device {payload.get('device_id')} overheating!")
             document['alert'] = "Overheating"
             
        # 2. Check for Offline
        if payload.get('status') == 'OFFLINE':
             logger.warning(f"⚠️ ALERT: Device {payload.get('device_id')} went OFFLINE")
        
        # 3. Real-Time Push (The Bridge 🌉)
        try:
            # Prepare the Async Task
            # We emit to the room named after the device_id so not everyone gets spam
            device_id = payload.get('device_id', 'unknown')
            
            # Emit to 'monitor' room or specific device room
            coro = socket_manager.emit_to_all('event', {
                'topic': routing_key,
                'device_id': device_id,
                'data': payload,
                'alert': document.get('alert')
            })
            
            # Fire and Forget into main loop
            asyncio.run_coroutine_threadsafe(coro, loop)
            logger.info(f"📡 Emitted SocketIO event for {device_id}")
            
        except Exception as bridge_err:
            logger.error(f"Failed to bridge to SocketIO: {bridge_err}")

        # ---------------------------------------------------------

        # Synchronous Insert
        collection.insert_one(document)
        logger.info(f" [x] Saved to MongoDB: {routing_key} (ID: {document.get('_id', 'unknown')})")
        
    except Exception as e:
        logger.error(f"Error processing message: {e}")

def start_consumer(loop):
    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
        channel = connection.channel()

        channel.exchange_declare(exchange=EXCHANGE_NAME, exchange_type='topic', durable=True)
        result = channel.queue_declare(queue=QUEUE_NAME, exclusive=False, durable=True)
        queue_name = result.method.queue
        channel.queue_bind(exchange=EXCHANGE_NAME, queue=queue_name, routing_key="device.#")

        logger.info(' [*] Waiting for device logs. To exit press CTRL+C')

        # Use functools.partial to inject the 'loop' argument into the callback
        on_message_callback = functools.partial(process_message, loop=loop)

        channel.basic_consume(
            queue=queue_name,
            on_message_callback=on_message_callback,
            auto_ack=True
        )

        channel.start_consuming()
    except Exception as e:
        logger.error(f"Consumer error: {e}")
