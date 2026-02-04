from fastapi import FastAPI
import uvicorn
from helpers.config import Base, engine
from helpers.mqtt_listener import init_mqtt
from entities.device import Device

# Create Tables
Base.metadata.create_all(bind=engine)

from controllers.device_controller import router as device_router
from controllers.command_controller import router as command_router

app = FastAPI(
    title="Device Management Service",
    description="Microservice for managing IoT devices inventory",
    version="1.0.0"
)

# Init MQTT
init_mqtt(app)

app.include_router(device_router)
app.include_router(command_router)

from prometheus_fastapi_instrumentator import Instrumentator
Instrumentator().instrument(app).expose(app)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "device-management"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
