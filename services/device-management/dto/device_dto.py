from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class DeviceRequest(BaseModel):
    name: str
    type: str

class DeviceResponse(BaseModel):
    id: str
    name: str
    type: str
    status: str
    owner_id: str
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)
