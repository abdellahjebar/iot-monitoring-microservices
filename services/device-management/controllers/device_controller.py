import requests
from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from helpers.config import get_db, SECRET_KEY, logger
from dto.device_dto import DeviceRequest, DeviceResponse
from dal.device_dao import create_device, get_devices_by_owner, get_device_by_id, delete_device
from entities.device import Device

router = APIRouter(prefix="/devices", tags=["devices"])
security = HTTPBearer()

AUTH_SERVICE_URL = "http://auth-ms:8000/users/verify-token" # Fixed host to match docker-compose service name

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        # Synchronous HTTP call to Signing Microservice for verification
        response = requests.post(AUTH_SERVICE_URL, json={"token": token}, timeout=5)
        
        if response.status_code != 200:
            logger.error(f"Auth verification failed: {response.text}")
            raise HTTPException(status_code=401, detail="Authentication failed via Signing Service")
        
        data = response.json()
        payload = data.get("payload")
        email = payload.get("sub")
        
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token payload from Auth Service")
            
        return email
    except requests.exceptions.RequestException as e:
        logger.error(f"Connection to Auth Service failed: {e}")
        raise HTTPException(status_code=503, detail="Authentication Service Unavailable")
    except Exception as e:
        logger.error(f"Unexpected error during auth sync: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

from helpers.publisher import publish_event

@router.post("/", response_model=DeviceResponse)
@router.post("/provision", response_model=DeviceResponse)
def add_device(request: DeviceRequest, db: Session = Depends(get_db), user_email: str = Depends(get_current_user)):
    new_device = Device(
        name=request.name,
        type=request.type,
        location=request.location, # Save location to DB
        owner_id=user_email
    )
    created_device = create_device(db, new_device)
    if not created_device:
        raise HTTPException(status_code=500, detail="Failed to create device")
    
    # --- DOMAIN LOGIC MOVED TO BACKEND ---
    # Automatically trigger simulation if config is present
    if request.simulation_config and request.simulation_config.is_active:
        publish_event("simulation.start", {
            "device_id": str(created_device.id),
            "type": created_device.type,
            "location": created_device.location, # Send location to Simulator
            "config": request.simulation_config.model_dump()
        })
        logger.info(f"🚀 Simulation auto-triggered for {created_device.id} at {created_device.location}")
    
    # Legacy event for other listeners (Simulator 2.0 listens to device.created now)
    publish_event("device.created", { # Changed from device.registered to device.created to match new Sim
        "device_id": str(created_device.id),
        "owner_id": created_device.owner_id,
        "type": created_device.type,
        "location": created_device.location,
        "timestamp": created_device.created_at.isoformat()
    })
    
    return created_device.to_dict()

@router.get("/", response_model=list[DeviceResponse])
def my_devices(db: Session = Depends(get_db), user_email: str = Depends(get_current_user)):
    devices = get_devices_by_owner(db, user_email)
    return [d.to_dict() for d in devices]

@router.get("/active", response_model=list[DeviceResponse])
def get_all_active_devices(db: Session = Depends(get_db)):
    """
    System endpoint for proper Simulation.
    Returns ALL devices so the simulator can simulate them.
    Protected by checking if the request comes from the internal network (optional) or just open for this demo.
    """
    # For now, just return all devices.
    # ideally we would filter by 'status=active' but we assume all are simulatible.
    from entities.device import Device
    devices = db.query(Device).all()
    return [d.to_dict() for d in devices]

@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(device_id: str, db: Session = Depends(get_db), user_email: str = Depends(get_current_user)):
    device = get_device_by_id(db, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    # Optional: Check ownership?
    if device.owner_id != user_email:
        # Maybe allow viewing if admin, but for now strict ownership
        raise HTTPException(status_code=403, detail="Not authorized to view this device")
    return device.to_dict()

@router.delete("/{device_id}")
def remove_device(device_id: str, db: Session = Depends(get_db), user_email: str = Depends(get_current_user)):
    success = delete_device(db, device_id, user_email)
    if not success:
        raise HTTPException(status_code=404, detail="Device not found or not authorized")
    
    # Publish Event
    publish_event("device.deleted", {
        "device_id": device_id,
        "owner_id": user_email
    })
    
    return {"message": "Device deleted"}
