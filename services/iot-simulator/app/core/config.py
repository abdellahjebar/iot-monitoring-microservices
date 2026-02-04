import os
import logging

class Settings:
    MQTT_BROKER: str = os.getenv("MQTT_BROKER", "mosquitto")
    MQTT_PORT: int = int(os.getenv("MQTT_PORT", 1883))
    RABBITMQ_HOST: str = os.getenv("RABBITMQ_HOST", "rabbitmq")
    DEVICE_MANAGEMENT_URL: str = os.getenv("DEVICE_MANAGEMENT_URL", "http://device-management:8001")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
settings = Settings()

def setup_logging():
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    return logging.getLogger("Simulator")

def receive_logger():
    return logging.getLogger("Simulator")
