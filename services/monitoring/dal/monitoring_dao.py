from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from entities.telemetry import DeviceEvent
from helpers.config import get_database
from typing import List, Optional
from datetime import datetime
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

    async def get_active_devices(self) -> List[str]:
        """Discovery Engine: Returns unique device_ids found in telemetry."""
        # Note: In our consumer, we store telemetry in the 'events' collection
        # and the device_id is nested inside the 'payload' document.
        return await self.collection.distinct("payload.device_id")

    async def get_aggregated_stats(self, device_id: str, start_time: datetime, end_time: datetime) -> dict:
        """Calculates Min/Max/Avg telemetry using MongoDB Aggregation Pipeline."""
        pipeline = [
            {
                "$match": {
                    "payload.device_id": device_id,
                    "processed_at": {"$gte": start_time, "$lte": end_time},
                    "topic": {"$regex": "telemetry$"}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "avg_temp": {"$avg": "$payload.telemetry.temperature"},
                    "max_temp": {"$max": "$payload.telemetry.temperature"},
                    "min_temp": {"$min": "$payload.telemetry.temperature"},
                    "avg_humidity": {"$avg": "$payload.telemetry.humidity"},
                    "max_humidity": {"$max": "$payload.telemetry.humidity"},
                    "min_humidity": {"$min": "$payload.telemetry.humidity"},
                    "sample_count": {"$sum": 1}
                }
            }
        ]
        
        result = await self.collection.aggregate(pipeline).to_list(length=1)
        if not result:
            return {
                "avg_temp": 0, "max_temp": 0, "min_temp": 0,
                "avg_humidity": 0, "max_humidity": 0, "min_humidity": 0,
                "sample_count": 0
            }
        return result[0]

    async def get_timeseries(self, device_id: str, start_time: datetime, end_time: datetime, limit: int = 200) -> List[dict]:
        """Fetches telemetry points for charting."""
        cursor = self.collection.find({
            "payload.device_id": device_id,
            "processed_at": {"$gte": start_time, "$lte": end_time},
            "topic": {"$regex": "telemetry$"}
        }).sort("processed_at", 1).limit(limit)
        
        events = await cursor.to_list(length=limit)
        return [
            {
                "time": e["processed_at"].isoformat(),
                "temp": e["payload"]["telemetry"]["temperature"],
                "humidity": e["payload"]["telemetry"]["humidity"]
            }
            for e in events
        ]

    # ------------------------------------------------------------------
    # SYNC METHODS (For RabbitMQ Consumer Thread)
    # ------------------------------------------------------------------
    # Note: We need a separate Sync Client for the thread, 
    # or pass the pymongo db instance to this class.
    # For Clean Architecture, let's keep this DAO Async (Motor) 
    # and let the Consumer handle Sync Ops or use a SyncDAO subclass.
