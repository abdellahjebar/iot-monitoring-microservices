import random
from datetime import datetime
from typing import Tuple, Dict, Any
from .models import DeviceState, CityConfig, TelemetryPayload

class PhysicsEngine:
    @staticmethod
    def calculate_next_state(state: DeviceState, city: CityConfig, dt_seconds: float = 5.0) -> DeviceState:
        """
        Pure function: Takes current state + environment, returns next state.
        Does NOT modify state in place.
        """
        # 1. Fluctuating Load (Brownian Motion-ish)
        delta_load = random.uniform(-5, 5)
        new_cpu_load = max(5.0, min(100.0, state.cpu_load + delta_load))
        
        # GPU Load mimics CPU but spikier
        new_gpu_load = max(0.0, min(100.0, new_cpu_load * random.uniform(0.8, 1.2)))
        
        # 2. Thermal Physics
        # Heat Sources
        cpu_heat = new_cpu_load * 0.4
        gpu_heat = new_gpu_load * 0.6  # GPU runs hotter
        total_heat_gen = cpu_heat + gpu_heat
        
        # Cooling
        cooling_factor = 2.0 if state.cooling_active else 0.5
        ambient_delta = state.internal_temp - city.current_temp
        heat_dissipation = ambient_delta * cooling_factor * (dt_seconds / 10.0)
        
        new_temp = state.internal_temp + (total_heat_gen * 0.1) - heat_dissipation
        
        # Thermal Throttling Logic
        if new_temp > 85.0:
            new_cpu_load *= 0.7  # Throttle down
            new_gpu_load *= 0.5
        
        # 3. Energy Physics (Battery Drain)
        # Drain per second = Base + Load
        drain_rate = (0.01 + (new_cpu_load * 0.0005) + (new_gpu_load * 0.001)) * dt_seconds
        
        # Solar Charging (Simple approximation)
        is_daytime = True # TODO: Calculate based on time
        charge_rate = 0.05 * dt_seconds if is_daytime else 0.0
        
        new_battery = max(0.0, min(100.0, state.battery_level - drain_rate + charge_rate))
        
        # 4. Chaos Injection
        if state.chaos_mode == "THERMAL_RUNAWAY":
            new_temp += 2.0 * dt_seconds
        elif state.chaos_mode == "BATTERY_DRAIN":
            new_battery -= 5.0 * dt_seconds

        return DeviceState(
            status=state.status, # Status managed by connectivity logic, not physics
            cpu_load=round(new_cpu_load, 2),
            gpu_load=round(new_gpu_load, 2),
            ram_usage=state.ram_usage, # Static for now
            internal_temp=round(new_temp, 2),
            cooling_active=state.cooling_active,
            battery_level=round(new_battery, 2),
            chaos_mode=state.chaos_mode,
            chaos_intensity=state.chaos_intensity
        )

    @staticmethod
    def generate_telemetry(device_id: str, state: DeviceState, city: CityConfig) -> TelemetryPayload:
        # Defaults
        temp = state.internal_temp
        humid = city.current_humid + random.uniform(-2, 2)
        
        # Chaos: Sensor Flicker
        if state.chaos_mode == "SENSOR_FLICKER":
            temp += random.uniform(-15.0, 15.0)
            humid = random.uniform(0, 100)
            
        # Chaos: Ghost Data (Send Zeros)
        if state.chaos_mode == "GHOST_DATA":
            temp = 0.0
            humid = 0.0
            
        # Safely get status string
        status_str = state.status if isinstance(state.status, str) else state.status.value
        
        return TelemetryPayload(
            device_id=device_id,
            timestamp=datetime.utcnow().isoformat(),
            status=status_str,
            location=city.name,
            lat=city.lat,
            lon=city.lon,
            telemetry={
                "temperature": round(temp, 2),
                "humidity": round(humid, 2),
                "ambient_temp": city.current_temp
            },
            system={
                "cpu_load": state.cpu_load,
                "gpu_load": state.gpu_load,
                "disk_usage": 45.0,
                "cooling_active": state.cooling_active,
                "battery_level": state.battery_level,
                "power_mode": "BATTERY" if state.battery_level < 99 else "MAINS"
            }
        )
