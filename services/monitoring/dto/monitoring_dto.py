from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional, Dict, Any

class TelemetryPayload(BaseModel):
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    status: Optional[str] = None
    # Allow other fields
    model_config = ConfigDict(extra='allow')

class HistoryRecord(BaseModel):
    timestamp: datetime
    topic: str
    payload: Dict[str, Any]
    alert: Optional[str] = None
    
    # We map 'processed_at' from DB to 'timestamp' in response
    # or use the timestamp inside payload if available.

class HistoryResponse(BaseModel):
    device_id: str
    count: int
    history: List[HistoryRecord]
