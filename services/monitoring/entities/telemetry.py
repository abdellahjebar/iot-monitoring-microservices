from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any

class TelemetryData(BaseModel):
    temperature: float
    humidity: float
    battery: float

class DeviceEvent(BaseModel):
    topic: str
    device_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    type: str # 'telemetry' or 'lifecycle'
    payload: Dict[str, Any]
    alert: Optional[str] = None

    class Config:
        # Allow ObjectId if needed later
        arbitrary_types_allowed = True
