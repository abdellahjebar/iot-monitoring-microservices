from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional, Dict, Any

class TelemetryPayload(BaseModel):
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    status: Optional[str] = None
    # Allow other fields
    model_config = ConfigDict(extra='allow')

class AggregatedStats(BaseModel):
    avg_temp: float
    max_temp: float
    min_temp: float
    avg_humidity: float
    max_humidity: float
    min_humidity: float
    sample_count: int

class AnalyticsResponse(BaseModel):
    device_id: str
    start_time: datetime
    end_time: datetime
    stats: AggregatedStats
    timeseries: List[Dict[str, Any]] # For charts

class HistoryRecord(BaseModel):
    timestamp: datetime
    topic: str
    payload: Dict[str, Any]
    alert: Optional[str] = None

class HistoryResponse(BaseModel):
    device_id: str
    count: int
    history: List[HistoryRecord]
