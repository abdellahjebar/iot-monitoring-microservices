from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from entities.telemetry import DeviceEvent
from helpers.config import get_database
from typing import List, Optional
import logging

logger = logging.getLogger("monitoring_service")

class MonitoringDAO:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db['events']

    async def save_event_async(self, event: dict):
        """Async save (used by API)"""
        result = await self.collection.insert_one(event)
        return str(result.inserted_id)

    async def get_history(self, device_id: str, limit: int = 50) -> List[dict]:
        """Get processed events for a device"""
        cursor = self.collection.find(
            {"payload.device_id": device_id}
        ).sort("processed_at", -1).limit(limit)
        
        events = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string for JSON serialization if needed
        for event in events:
            event["_id"] = str(event["_id"])
        return events

    # ------------------------------------------------------------------
    # SYNC METHODS (For RabbitMQ Consumer Thread)
    # ------------------------------------------------------------------
    # Note: We need a separate Sync Client for the thread, 
    # or pass the pymongo db instance to this class.
    # For Clean Architecture, let's keep this DAO Async (Motor) 
    # and let the Consumer handle Sync Ops or use a SyncDAO subclass.
