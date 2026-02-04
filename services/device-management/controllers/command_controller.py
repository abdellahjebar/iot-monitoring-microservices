from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from helpers.mqtt_listener import mqtt_client
from controllers.device_controller import get_current_user
from helpers.config import get_db
from sqlalchemy.orm import Session
from dal.device_dao import get_device_by_id
import json

router = APIRouter(prefix="/devices/commands", tags=["Commands"])

class DeviceCommand(BaseModel):
    action: str  # e.g., "COOLING_ON", "COOLING_OFF"
    params: dict = {}

@router.post("/{device_id}")
async def send_command(
    device_id: str, 
    command: DeviceCommand, 
    db: Session = Depends(get_db),
    user_email: str = Depends(get_current_user)
):
    """
    Sends a security-validated command to a specific device via MQTT.
    """
    # 1. Verify Device exists and belongs to User
    device = get_device_by_id(db, device_id)
    if not device:
        # For simulation purposes, we might want to allow 'sim_device_xxx' or check them too
        if not device_id.startswith("sim_"):
            raise HTTPException(status_code=404, detail="Device not found in registry")
    elif device.owner_id != user_email:
        raise HTTPException(status_code=403, detail="Not authorized to control this device")

    # 2. Publish to MQTT
    topic = f"device/{device_id}/command"
    payload = {
        "device_id": device_id,
        "action": command.action,
        "params": command.params,
        "sender": user_email
    }
    
    if mqtt_client is None:
        raise HTTPException(status_code=500, detail="MQTT broker connectivity error")
        
    await mqtt_client.publish(topic, json.dumps(payload))
    from helpers.config import logger
    logger.info(f"📤 Published command {command.action} to {topic}")
    
    return {
        "status": "success", 
        "message": f"Command {command.action} dispatched to {device_id}",
        "target": device_id
    }
