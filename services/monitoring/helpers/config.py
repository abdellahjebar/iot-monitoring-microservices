from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from typing import Final

# LOGGING
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("monitoring_service")

# ENV VARIABLES
MONGO_USER: Final[str] = os.getenv("MONGO_USER", "admin")
MONGO_PASSWORD: Final[str] = os.getenv("MONGO_PASSWORD", "1234")
MONGO_HOST: Final[str] = os.getenv("MONGO_HOST", "mongo")
MONGO_PORT: Final[str] = os.getenv("MONGO_PORT", "27017")
MONGO_DB: Final[str] = os.getenv("MONGO_DB", "db_monitoring")

MONGO_URI = f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}@{MONGO_HOST}:{MONGO_PORT}"

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def connect_to_mongo():
    try:
        db.client = AsyncIOMotorClient(MONGO_URI)
        logger.info("✅ Connected to MongoDB")
    except Exception as e:
        logger.error(f"❌ Could not connect to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    if db.client:
        db.client.close()
        logger.info("🛑 Closed MongoDB Connection")

def get_database():
    return db.client[MONGO_DB]
