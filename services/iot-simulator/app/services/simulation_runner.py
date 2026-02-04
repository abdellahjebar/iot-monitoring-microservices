import time
import threading
from typing import Dict, Any, Set

from ..core.config import receive_logger
from ..domain.fleet_manager import FleetManager
from ..domain.physics import PhysicsEngine
from ..domain.models import DeviceConfig, DeviceState
from ..infrastructure.backend_api import BackendClient
from ..infrastructure.mqtt_client import MQTTClientWrapper
from ..infrastructure.rabbitmq_consumer import RabbitMQConsumer
from ..infrastructure.weather_client import WeatherClient
from ..core.metrics import ACTIVE_DEVICES, PHYSICS_TICK_DURATION, MESSAGES_PUBLISHED, SIMULATION_ERRORS

logger = receive_logger()

class SimulationRunner:
    def __init__(self):
        self.fleet_manager = FleetManager()
        self.backend_api = BackendClient()
        self.mqtt_client = MQTTClientWrapper()
        self.rabbitmq_consumer = RabbitMQConsumer(self.on_device_event)
        self.weather_client = WeatherClient()
        
        self.running = False
        self.last_weather_update = 0.0

    def on_device_event(self, event_data: Dict[str, Any]):
        """Callback for when RabbitMQ receives a device.created event."""
        device_id = event_data.get('device_id')
        if not device_id:
            return

        # Check if we already have it
        if self.fleet_manager.get_state(device_id):
            logger.info(f"ℹ️ Device {device_id} already exists in fleet.")
            return

        logger.info(f"✨ Event received for {device_id}. Provisioning in Simulator...")
        
        # Determine Location from event or random fallback
        location = event_data.get('location')
        if not location:
            from ..infrastructure.backend_api import CITY_MAP
            import random
            city_name = random.choice(list(CITY_MAP.keys()))
            location = city_name
            
        # Add to Fleet
        from ..infrastructure.backend_api import CITY_MAP
        # Use existing map or default to Casablanca if unknown
        city_config = CITY_MAP.get(location, CITY_MAP["Casablanca"])
        
        config = DeviceConfig(
            device_id=device_id,
            type=event_data.get('type', 'SENSOR'),
            city=city_config
        )
        self.fleet_manager.add_device(config)
        
        # Update Metric
        ACTIVE_DEVICES.labels(status='active').inc()
        
        logger.info(f"✅ Dynamically added {device_id} ({location}) to simulation fleet.")

    def handle_command(self, device_id: str, payload: Dict[str, Any]):
        """Handle commands from MQTT (Consumer -> Device -> MQTT -> Simulator)."""
        action = payload.get('action')
        params = payload.get('params', {})
        
        logger.info(f"📥 Received command for {device_id}: {action} (params: {params})")
        
        if action == "SABOTAGE":
            chaos_type = params.get('type') # e.g., 'THERMAL_RUNAWAY'
            logger.warning(f"🔥 INJECTING CHAOS on {device_id}: {chaos_type}")
            
            state = self.fleet_manager.get_state(device_id)
            if state:
                state.chaos_mode = chaos_type
                state.chaos_intensity = 1.0 # Default intensity
        
        elif action == "REBOOT":
            logger.info(f"🔄 Rebooting {device_id}...")
            state = self.fleet_manager.get_state(device_id)
            if state:
                state.chaos_mode = None
                state.chaos_intensity = 0.0
                state.status = "OFFLINE"
                # Logic to auto-restart would be in physics engine or here
                threading.Timer(5.0, lambda: setattr(state, 'status', 'ONLINE')).start()
                logger.info(f"✅ Reboot sequence initiated for {device_id}")

    def _update_weather_for_fleet(self):
        """Updates weather data for all active cities in the fleet."""
        try:
            current_time = time.time()
            if current_time - self.last_weather_update < 900: # 15 mins
                return

            logger.info("🌤️ Syncing Real-Time Weather for fleet...")
            devices = self.fleet_manager.get_all_devices()
            
            # Identify unique cities to minimize API calls
            unique_cities = {d.city.name: d.city for d in devices}
            
            updated_count = 0
            for city_name, city_config in unique_cities.items():
                weather = self.weather_client.fetch_current_weather(city_config.lat, city_config.lon)
                if weather:
                    city_config.current_temp = weather['temp']
                    city_config.current_humid = weather['humid']
                    updated_count += 1
            
            if updated_count > 0:
                logger.info(f"✅ Updated real weather for {updated_count} cities.")
                self.last_weather_update = current_time
            
        except Exception as e:
            logger.error(f"⚠️ Weather Sync Failed: {e}")

    def run(self):
        logger.info("🚀 Starting Simulator Service...")
        
        # 1. Start Infrastructure
        self.mqtt_client.set_command_handler(self.handle_command)
        self.mqtt_client.start()
        self.rabbitmq_consumer.start()
        
        # 2. Initial Sync
        try:
            active_devices = self.backend_api.fetch_active_device_list()
            for d in active_devices:
                self.fleet_manager.add_device(d)
            # Update Metric
            ACTIVE_DEVICES.labels(status='active').set(len(active_devices))
        except Exception as e:
            logger.error(f"⚠️ Initial Sync Failed: {e}. Starting with empty fleet.")
            SIMULATION_ERRORS.labels(error_type='sync_failed').inc()

        # 3. Main Loop
        self.running = True
        logger.info("🔄 Entering Main Physics Loop...")
        
        # Trigger initial weather sync immediately
        self._update_weather_for_fleet()
        
        try:
            while self.running:
                # Periodic Weather Sync
                self._update_weather_for_fleet()

                # Start Timing the Tick
                with PHYSICS_TICK_DURATION.time():
                    start_time = time.time()
                    
                    # Snapshot devices
                    devices = self.fleet_manager.get_all_devices()
                    ACTIVE_DEVICES.labels(status='active').set(len(devices))
                    
                    batch_msg_count = 0
                    
                    for device_conf in devices:
                        try:
                            # Get current state
                            current_state = self.fleet_manager.get_state(device_conf.device_id)
                            if not current_state:
                                continue
                                
                            if current_state.status != "OFFLINE": 
                                # Calculate Next State
                                next_state = PhysicsEngine.calculate_next_state(
                                     current_state, device_conf.city, dt_seconds=5.0
                                )
                                
                                # Update State Manager
                                self.fleet_manager.update_state(device_conf.device_id, next_state)
                                
                                # Generate Telemetry Payload
                                payload = PhysicsEngine.generate_telemetry(
                                    device_conf.device_id, next_state, device_conf.city
                                )
                                
                                # Publish
                                self.mqtt_client.publish_telemetry(payload)
                                batch_msg_count += 1
                        except Exception as e:
                            logger.error(f"Error simulating {device_conf.device_id}: {e}")
                            SIMULATION_ERRORS.labels(error_type='physics_step').inc()
                    
                    if batch_msg_count > 0:
                        MESSAGES_PUBLISHED.labels(topic_type='telemetry').inc(batch_msg_count)
                
                # Sleep remainder of 5s tick
                elapsed = time.time() - start_time
                sleep_time = max(0.1, 5.0 - elapsed)
                time.sleep(sleep_time)
                
        except KeyboardInterrupt:
            logger.info("🛑 Stopping Simulator...")
            self.stop()

    def stop(self):
        self.running = False
        self.mqtt_client.stop()
