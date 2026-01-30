from sqlalchemy.orm import Session
from entities.device import Device, DeviceStatus
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger("device_management")

def create_device(db: Session, device: Device):
    try:
        db.add(device)
        db.commit()
        db.refresh(device)
        return device
    except SQLAlchemyError as e:
        logger.error(f"Error creating device: {e}")
        db.rollback()
        return None

def get_devices_by_owner(db: Session, owner_id: str):
    return db.query(Device).filter(Device.owner_id == owner_id).all()

def get_device_by_id(db: Session, device_id: str):
    # Cast to UUID if needed, but SQLA handles string-to-uuid usually
    return db.query(Device).filter(Device.id == device_id).first()

def delete_device(db: Session, device_id: str, owner_id: str):
    device = db.query(Device).filter(Device.id == device_id, Device.owner_id == owner_id).first()
    if device:
        db.delete(device)
        db.commit()
        return True
    return False

def update_device_status(db: Session, device_id: str, status: str):
    device = db.query(Device).filter(Device.id == device_id).first()
    if device:
        device.status = status
        db.commit()
        db.refresh(device)
        return device
    return None
