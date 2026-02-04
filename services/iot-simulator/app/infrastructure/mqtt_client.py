import json
import socket
import paho.mqtt.client as mqtt
from ..core.config import receive_logger, settings
from ..domain.models import TelemetryPayload

logger = receive_logger()

class MQTTClientWrapper:
    def __init__(self):
        self.connected = False
        # Determine protocol version
        try:
            from paho.mqtt.enums import CallbackAPIVersion
            self.client = mqtt.Client(CallbackAPIVersion.VERSION1, client_id=f"sim_gateway_{socket.gethostname()}")
        except (ImportError, AttributeError):
            self.client = mqtt.Client(client_id=f"sim_gateway_{socket.gethostname()}")

        self.command_handler = None # Callback function

        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_message = self.on_message

    def set_command_handler(self, handler):
        self.command_handler = handler

    def on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            self.connected = True
            logger.info("✅ Connected to MQTT Broker")
            # Subscribe to all command topics
            self.client.subscribe("device/+/command")
            logger.info("channel set to: device/+/command")
        else:
            logger.error(f"❌ Failed to connect to MQTT Broker: {rc}")

    def on_message(self, client, userdata, msg):
        """Handle incoming MQTT messages."""
        try:
            payload = json.loads(msg.payload.decode())
            topic_parts = msg.topic.split('/')
            
            # Topic: device/{device_id}/command
            if len(topic_parts) == 3 and topic_parts[2] == 'command':
                device_id = topic_parts[1]
                if self.command_handler:
                    self.command_handler(device_id, payload)
                    
        except Exception as e:
            logger.error(f"⚠️ Failed to process MQTT message: {e}")

    def on_disconnect(self, client, userdata, rc):
        self.connected = False
        logger.warning("⚠️ Disconnected from MQTT Broker")

    def start(self):
        try:
            logger.info(f"🔌 Connecting to MQTT Broker {settings.MQTT_BROKER}:{settings.MQTT_PORT}...")
            self.client.connect(settings.MQTT_BROKER, settings.MQTT_PORT, 60)
            self.client.loop_start()
        except Exception as e:
            logger.error(f"❌ MQTT Connection Error: {e}")

    def stop(self):
        self.client.loop_stop()
        self.client.disconnect()

    def publish_telemetry(self, payload: TelemetryPayload):
        if not self.connected:
            return

        topic = f"device/{payload.device_id}/telemetry"
        # Convert dataclass to dict
        data = {
            "device_id": payload.device_id,
            "timestamp": payload.timestamp,
            "status": payload.status,
            "location": payload.location,
            "lat": payload.lat,
            "lon": payload.lon,
            "telemetry": payload.telemetry,
            "system": payload.system
        }
        self.client.publish(topic, json.dumps(data))
