import time
import json
import random
import threading
import logging
import os
import requests
import psutil
import paho.mqtt.client as mqtt
from typing import Dict, Any, List, Optional
from enum import Enum
from datetime import datetime

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("IoT_Simulator")

# Configuration
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))

# --- 🌍 REAL-WORLD CONTEXT (OpenMeteo) ---
class CityConfig:
    def __init__(self, name: str, lat: float, lon: float):
        self.name = name
        self.lat = lat
        self.lon = lon
        self.current_temp = 20.0  # Default fallback
        self.current_humid = 50.0

CITIES = [
    CityConfig("Casablanca", 33.57, -7.58),
    CityConfig("Rabat", 34.02, -6.83),
    CityConfig("Fes", 34.03, -5.00),
    CityConfig("Tanger", 35.75, -5.83),
    CityConfig("Laayoune", 27.12, -13.17),
    CityConfig("Marrakech", 31.62, -7.98)
]

class EnvironmentContext:
    """Fetches real weather data to influence simulation physics."""
    def __init__(self):
        self.running = True
        self.thread = threading.Thread(target=self._poll_weather)
        self.thread.daemon = True
        self.thread.start()

    def _poll_weather(self):
        while self.running:
            for city in CITIES:
                try:
                    url = f"https://api.open-meteo.com/v1/forecast?latitude={city.lat}&longitude={city.lon}&current_weather=true"
                    resp = requests.get(url, timeout=5)
                    data = resp.json()
                    if 'current_weather' in data:
                        city.current_temp = data['current_weather']['temperature']
                        # OpenMeteo simple API might not give humidity in 'current_weather', simplified logic:
                        city.current_humid = random.uniform(30, 80) 
                        logger.info(f"🌍 Weather Update [{city.name}]: {city.current_temp}°C")
                except Exception as e:
                    logger.error(f"❌ Weather fetch failed for {city.name}: {e}")
            
            time.sleep(300) # Update every 10 mins

env_context = EnvironmentContext()

# --- 💻 DEVICE HEALTH (psutil) ---
def get_system_metrics():
    """Captures REAL container/host metrics."""
    return {
        "cpu_usage": psutil.cpu_percent(interval=None),
        "ram_usage": psutil.virtual_memory().percent,
        "disk_usage": psutil.disk_usage('/').percent
    }

class SensorType(str, Enum):
    TEMPERATURE = "TEMPERATURE"
    HUMIDITY = "HUMIDITY"

class BaseDevice:
    def __init__(self, device_id: str):
        self.device_id = device_id
        self.connected = False
        
    def connect(self):
        raise NotImplementedError

class IoTDevice(BaseDevice):
    def __init__(self, device_id: str, city: CityConfig, broker_host: str, broker_port: int = 1883):
        super().__init__(device_id)
        self.city = city
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.client = mqtt.Client(client_id=device_id)
        self.client.on_connect = self.on_connect
        self.status = "ONLINE"
        
        # simulated internal workload (0-100%)
        self.virtual_cpu_load = random.uniform(10, 30) 
        self.cooling_active = False # New state for remote control

        self.client.on_message = self.on_message # Register message callback

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.connected = True
            logger.info(f"✅ Device {self.device_id} ({self.city.name}) connected")
            # Subscribe to commands
            self.client.subscribe(f"device/{self.device_id}/command")
        else:
            logger.error(f"❌ Device {self.device_id} connection failed: {rc}")

    def on_message(self, client, userdata, msg):
        """Processes remote commands."""
        try:
            payload = json.loads(msg.payload.decode())
            action = payload.get("action")
            
            if action == "COOLING_ON":
                self.cooling_active = True
                logger.info(f"❄️ {self.device_id}: COOLING ACTIVATED remotely")
            elif action == "COOLING_OFF":
                self.cooling_active = False
                logger.info(f"🔥 {self.device_id}: COOLING DEACTIVATED remotely")
                
        except Exception as e:
            logger.error(f"Error processing command: {e}")

    def connect(self):
        try:
            self.client.connect(self.broker_host, self.broker_port, 60)
            self.client.loop_start()
        except Exception as e:
            logger.error(f"Connection Error: {e}")

    def _calculate_physics(self):
        """
        The 'WOW' Physics Engine:
        Device Temp = Ambient Temp (Real) + Internal Heat (from Workload)
        """
        # Fluctuate virtual load
        self.virtual_cpu_load += random.uniform(-5, 5)
        self.virtual_cpu_load = max(0, min(100, self.virtual_cpu_load))

        # Heat Formula: 
        # Base = Ambient
        # Heat = CPU * 0.5 (e.g. 100% CPU adds +50°C)
        # Cooling = -20°C if active
        ambient = self.city.current_temp
        heat_coefficient = 0.4
        if self.cooling_active:
             heat_coefficient = 0.1 # Much lower heat gain when cooling is on
             
        internal_heat = self.virtual_cpu_load * heat_coefficient
        if self.cooling_active:
            internal_heat -= 10 # Extra active cooling effect
        
        # Final values (Base Physics)
        telemetry_temp = ambient + internal_heat
        
        # Add Jitter (from original code)
        change = random.uniform(-1.5, 1.5)
        telemetry_temp += change
        
        # Add Occasional Spike (from original code)
        if random.random() > 0.95:
             telemetry_temp += random.uniform(5, 10)
             
        # Round final
        telemetry_temp = round(telemetry_temp, 2)
        telemetry_humid = round(self.city.current_humid + random.uniform(-2, 2), 2)
        
        return telemetry_temp, telemetry_humid

    def publish_telemetry(self):
        if not self.connected: 
            return

        # 1. Calculate Physics-based Telemetry
        temp, humid = self._calculate_physics()
        
        # 2. Get Real System Metrics (The requirement)
        real_metrics = get_system_metrics()

        # 3. Construct Payload
        payload = {
            "device_id": self.device_id,
            "timestamp": datetime.utcnow().isoformat(),
            "status": self.status,
            "location": self.city.name,
            "lat": self.city.lat,
            "lon": self.city.lon,
            "telemetry": {
                "temperature": temp,
                "humidity": humid,
                "ambient_temp": self.city.current_temp, # Context data
            },
            "system": {
                "cpu_load": real_metrics['cpu_usage'],
                "ram_usage": real_metrics['ram_usage'],
                "virtual_load": int(self.virtual_cpu_load),
                "cooling_active": self.cooling_active # Report state
            }
        }
        
        # 4. Publish
        topic = f"device/{self.device_id}/command" if False else f"device/{self.device_id}/telemetry"
        self.client.publish(f"device/{self.device_id}/telemetry", json.dumps(payload))
        
        cooling_str = "❄️ [COOLING ON]" if self.cooling_active else "🔥 [NORMAL]"
        logger.info(f"📤 {self.device_id} [{self.city.name}] {cooling_str}: T={temp}°C (Amb={self.city.current_temp})")

        # Simulate Offline
        if random.random() > 0.99:
            self.status = "OFFLINE"
            off_payload = payload.copy()
            off_payload['status'] = "OFFLINE"
            self.client.publish(topic, json.dumps(off_payload))

def run_simulation():
    devices = []
    
    # Create 5 Devices assigned to 5 Global Cities
    for i, city in enumerate(CITIES):
        d_id = f"sim_device_{i+1:03}"
        device = IoTDevice(d_id, city, MQTT_BROKER, MQTT_PORT)
        devices.append(device)
    
    # Connect
    for d in devices:
        d.connect()
        # Set different initial workloads
        d.virtual_cpu_load = random.uniform(10, 90) 
        time.sleep(0.5)
        
    logger.info("🚀 PHYSICS ENGINE STARTED. Simulating Global Fleet.")
    
    try:
        while True:
            for d in devices:
                if d.status == "ONLINE":
                    d.publish_telemetry()
                elif random.random() > 0.8:
                    d.status = "ONLINE"
                    logger.info(f"♻️ {d.device_id} back ONLINE")
            
            time.sleep(5) # Slower tick for realism
            
    except KeyboardInterrupt:
        logger.info("Stopping Simulation...")
        for d in devices:
            d.client.loop_stop()

if __name__ == "__main__":
    time.sleep(5)
    run_simulation()
