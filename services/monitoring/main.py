from fastapi import FastAPI
from contextlib import asynccontextmanager
from helpers.config import connect_to_mongo, close_mongo_connection, logger
import threading
from helpers.consumer import start_consumer
from helpers.socket_manager import socket_manager
from controllers.monitoring_controller import router as monitoring_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Path
    await connect_to_mongo()
    
    # Capture the running event loop
    import asyncio
    loop = asyncio.get_running_loop()
    
    # Start Consumer in a separate thread because pika.BlockingConnection blocks!
    # We pass 'loop' so the consumer thread can schedule async tasks back on this main loop.
    consumer_thread = threading.Thread(target=start_consumer, args=(loop,), daemon=True)
    consumer_thread.start()
    logger.info("🚀 RabbitMQ Consumer started in background thread")
    
    yield
    # Shutdown Path
    await close_mongo_connection()

app = FastAPI(
    title="Monitoring Service",
    description="Real-time IoT Telemetry & Events",
    version="1.0.0",
    lifespan=lifespan
)

# Connect Router
app.include_router(monitoring_router)

# Mount Socket.IO to /socket.io
app.mount("/", socket_manager.app)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "monitoring"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
