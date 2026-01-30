from fastapi import APIRouter, Depends, HTTPException
from typing import List
from dto.monitoring_dto import HistoryResponse, HistoryRecord
from dal.monitoring_dao import MonitoringDAO
from helpers.config import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(prefix="/monitoring", tags=["Monitoring"])

# Dependency Injection for DAO
def get_dao(db=Depends(get_database)) -> MonitoringDAO:
    return MonitoringDAO(db)

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
