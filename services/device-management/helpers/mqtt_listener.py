from fastapi_mqtt import FastMQTT, MQTTConfig
import os
import json
import logging
from helpers.publisher import publish_event
from fastapi import FastAPI

logger = logging.getLogger("device_manager")

MQTT_BROKER = os.getenv("MQTT_BROKER", "mosquitto")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))

mqtt_config = MQTTConfig(
    host=MQTT_BROKER,
    port=MQTT_PORT,
    keepalive=60,
    username=None,
    password=None
)

mqtt_client = FastMQTT(config=mqtt_config)

@mqtt_client.on_connect()
def connect(client, flags, rc, properties):
    logger.info("✅ Connected to MQTT Broker: " + MQTT_BROKER)
    # Subscribe to all device telemetry
    mqtt_client.client.subscribe("device/+/telemetry")
    logger.info("📡 Subscribed to device/+/telemetry")

@mqtt_client.on_message()
async def message(client, topic, payload, qos, properties):
    try:
        data = json.loads(payload.decode())
        logger.info(f"📥 Received MQTT: {topic} -> {data}")
        
        # Forward to RabbitMQ (Gateway Pattern)
        # Using the same Routing Key logic as if it came via HTTP
        # topic: device/sim_device_001/telemetry
        
        # We want to publish to RabbitMQ with routing key 'device.telemetry'
        # or maybe 'device.{device_id}.telemetry'?
        # The Consumer listens to 'device.#'.
        
        # Let's clean the topic to routing key format
        # device/001/telemetry -> device.telemetry (or device.001.telemetry)
        
        # Ideally, we include device_id in the payload (Simulator does this).
        # So routing key can be 'device.telemetry'.
        
        publish_event("device.telemetry", data)
        logger.info("➡️ Forwarded to RabbitMQ")
        
    except Exception as e:
        logger.error(f"Error processing MQTT message: {e}")

def init_mqtt(app: FastAPI):
    mqtt_client.init_app(app)
