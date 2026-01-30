import pika
import json
import os
import logging
from typing import Final

logger = logging.getLogger("device_management")

RABBITMQ_HOST: Final[str] = os.getenv('RABBITMQ_HOST', 'localhost')
EXCHANGE_NAME = 'iot_events'

def get_connection():
    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
        return connection
    except Exception as e:
        logger.error(f"Failed to connect to RabbitMQ: {e}")
        return None

def publish_event(routing_key: str, message: dict):
    connection = get_connection()
    if not connection:
        return
    
    try:
        channel = connection.channel()
        channel.exchange_declare(exchange=EXCHANGE_NAME, exchange_type='topic', durable=True)
        
        body = json.dumps(message)
        channel.basic_publish(
            exchange=EXCHANGE_NAME,
            routing_key=routing_key,
            body=body,
            properties=pika.BasicProperties(
                delivery_mode=2,  # make message persistent
                content_type='application/json'
            )
        )
        logger.info(f"Published event '{routing_key}': {message}")
    except Exception as e:
        logger.error(f"Failed to publish event: {e}")
    finally:
        connection.close()
