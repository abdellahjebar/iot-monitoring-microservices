from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from enum import Enum
from datetime import datetime

class DeviceStatus(str, Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    MAINTENANCE = "MAINTENANCE"

@dataclass
class CityConfig:
    name: str
    lat: float
    lon: float
    current_temp: float = 20.0
    current_humid: float = 50.0

@dataclass
class DeviceConfig:
    device_id: str
    type: str
    city: CityConfig
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class DeviceState:
    """Mutable runtime state of a device simulation."""
    status: DeviceStatus = DeviceStatus.ONLINE
    cpu_load: float = 10.0
    gpu_load: float = 0.0
    ram_usage: float = 30.0
    internal_temp: float = 25.0
    cooling_active: bool = False
    battery_level: float = 100.0
    chaos_mode: Optional[str] = None
    chaos_intensity: float = 0.0

@dataclass
class TelemetryPayload:
    device_id: str
    timestamp: str
    status: str
    location: str
    lat: float
    lon: float
    telemetry: Dict[str, float]
    system: Dict[str, Any]
