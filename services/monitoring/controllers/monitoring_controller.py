from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional, Dict, Any
from dto.monitoring_dto import HistoryResponse, HistoryRecord
from dal.monitoring_dao import MonitoringDAO
from helpers.config import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(prefix="/monitoring", tags=["Monitoring"])

# Dependency Injection for DAO
def get_dao(db=Depends(get_database)) -> MonitoringDAO:
    return MonitoringDAO(db)

@router.get("/discovered", response_model=List[str])
async def get_discovered_assets(dao: MonitoringDAO = Depends(get_dao)):
    """ Returns unique device IDs discovered in the telemetry stream. """
    return await dao.get_active_devices()

@router.get("/history/{device_id}", response_model=HistoryResponse)
async def get_device_history(
    device_id: str, 
    limit: int = 50, 
    dao: MonitoringDAO = Depends(get_dao)
):
    """
    Get historical events/telemetry for a specific device.
    """
    events = await dao.get_history(device_id, limit)
    
    # Map Entity (DB) -> DTO (API)
    records = []
    for e in events:
        records.append(HistoryRecord(
            timestamp=e.get("processed_at") or e.get("timestamp"),
            topic=e.get("topic"),
            payload=e.get("payload"),
            alert=e.get("alert")
        ))
        
    return HistoryResponse(
        device_id=device_id,
        count=len(records),
        history=records
    )

from datetime import datetime, timedelta, timezone
from dto.monitoring_dto import AnalyticsResponse, AggregatedStats

@router.get("/analytics/{device_id}", response_model=AnalyticsResponse)
async def get_device_analytics(
    device_id: str,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    dao: MonitoringDAO = Depends(get_dao)
):
    """
    Aggregated health analytics and time-series data for the dashboard.
    """
    if not end_time:
        end_time = datetime.now(timezone.utc)
    if not start_time:
        start_time = end_time - timedelta(hours=24)
        
    stats_data = await dao.get_aggregated_stats(device_id, start_time, end_time)
    timeseries = await dao.get_timeseries(device_id, start_time, end_time)
    
    return AnalyticsResponse(
        device_id=device_id,
        start_time=start_time,
        end_time=end_time,
        stats=AggregatedStats(**stats_data),
        timeseries=timeseries
    )
