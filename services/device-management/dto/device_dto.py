from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class SimulationConfig(BaseModel):
    is_active: bool = False
    temp_min: float = 20.0
    temp_max: float = 35.0
    humidity_min: float = 40.0
    humidity_max: float = 60.0
    update_interval: int = 5

class DeviceRequest(BaseModel):
    name: str
    type: str
    location: Optional[str] = "Casablanca"
    simulation_config: Optional[SimulationConfig] = None

class DeviceResponse(BaseModel):
    id: str
    name: str
    type: str
    location: Optional[str] = "Casablanca"
    status: str
    owner_id: str
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)
