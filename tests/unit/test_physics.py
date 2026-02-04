import pytest
import sys
import os

# Add service directory to path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../services/iot-simulator')))

from app.domain.physics import PhysicsEngine
from app.domain.models import DeviceState, CityConfig, DeviceStatus

@pytest.fixture
def base_state():
    return DeviceState(
        status=DeviceStatus.ONLINE,
        cpu_load=10.0,
        gpu_load=0.0,
        internal_temp=30.0,
        battery_level=100.0,
        chaos_mode=None
    )

@pytest.fixture
def city_config():
    return CityConfig(name="TestCity", lat=0.0, lon=0.0, current_temp=25.0, current_humid=50.0)

def test_physics_normal_behavior(base_state, city_config):
    """Ensure physics engine updates state within reasonable bounds."""
    next_state = PhysicsEngine.calculate_next_state(base_state, city_config, dt_seconds=5.0)
    
    assert next_state.cpu_load >= 5.0
    assert next_state.internal_temp != base_state.internal_temp # Should change
    assert next_state.battery_level < base_state.battery_level # Should drain

def test_chaos_thermal_runaway(base_state, city_config):
    """Ensure Thermal Runaway causes rapid temperature rise."""
    base_state.chaos_mode = "THERMAL_RUNAWAY"
    next_state = PhysicsEngine.calculate_next_state(base_state, city_config, dt_seconds=5.0)
    
    # In normal physics, temp might rise slightly or cool down.
    # In Chaos, it adds +2.0 degrees * 5s = +10.0 degrees (approx)
    assert next_state.internal_temp > base_state.internal_temp + 5.0

def test_chaos_battery_drain(base_state, city_config):
    """Ensure Battery Drain is aggressive."""
    base_state.chaos_mode = "BATTERY_DRAIN"
    next_state = PhysicsEngine.calculate_next_state(base_state, city_config, dt_seconds=5.0)
    
    # 5.0 * 5s = 25% drain!
    assert next_state.battery_level <= 76.0 

def test_chaos_sensor_flicker(base_state, city_config):
    """Ensure SENSOR_FLICKER changes telemetry but NOT internal state."""
    base_state.chaos_mode = "SENSOR_FLICKER"
    
    # 1. State calculation shouldn't be crazy (physics is real, sensor is broken)
    next_state = PhysicsEngine.calculate_next_state(base_state, city_config, dt_seconds=5.0)
    assert abs(next_state.internal_temp - base_state.internal_temp) < 5.0 # Normal physics
    
    # 2. Telemetry generation SHOULD be crazy
    payload = PhysicsEngine.generate_telemetry("test-id", base_state, city_config)
    
    diff = abs(payload.telemetry['temperature'] - base_state.internal_temp)
    # Flicker adds +/- 15.0 random. So difference should be significant > 0 usually
    # (Remote chance it picks 0.0, but unlikely in float)
    assert diff > 0.0

def test_chaos_ghost_data(base_state, city_config):
    """Ensure GHOST_DATA sends zeros."""
    base_state.chaos_mode = "GHOST_DATA"
    payload = PhysicsEngine.generate_telemetry("test-id", base_state, city_config)
    
    assert payload.telemetry['temperature'] == 0.0
    assert payload.telemetry['humidity'] == 0.0
