import json
import threading
import time
import pika
from typing import Callable
from ..core.config import receive_logger, settings

logger = receive_logger()

class RabbitMQConsumer:
    def __init__(self, on_device_created: Callable[[dict], None]):
        self.host = settings.RABBITMQ_HOST
        self.on_device_created = on_device_created
        self.running = False
        self.thread = None

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._consume_loop)
        self.thread.daemon = True
        self.thread.start()

    def _consume_loop(self):
        while self.running:
            try:
                connection = pika.BlockingConnection(
                    pika.ConnectionParameters(host=self.host, heartbeat=600, blocked_connection_timeout=300)
                )
                channel = connection.channel()
                channel.exchange_declare(exchange='events', exchange_type='topic')
                
                result = channel.queue_declare('', exclusive=True)
                queue_name = result.method.queue
                
                # Bind to device creation events
                channel.queue_bind(exchange='events', queue=queue_name, routing_key='device.created')
                # Also support legacy simulation.start
                channel.queue_bind(exchange='events', queue=queue_name, routing_key='simulation.start')

                def callback(ch, method, properties, body):
                    try:
                        data = json.loads(body)
                        logger.info(f"📨 Received Event: {method.routing_key}")
                        
                        if method.routing_key == 'device.created' or method.routing_key == 'simulation.start':
                            # Normalize payload
                            # Event payload might be just {id: "..."} or full config
                            self.on_device_created(data)
                            
                    except Exception as e:
                        logger.error(f"❌ Error processing event: {e}")

                channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
                logger.info("🎧 RabbitMQ Consumer Started. Listening for events...")
                channel.start_consuming()
                
            except Exception as e:
                logger.error(f"❌ RabbitMQ Connection Error: {e}. Retrying in 5s...")
                time.sleep(5)
