import threading
from typing import Dict, List, Optional
from .models import DeviceState, DeviceConfig

class FleetManager:
    def __init__(self):
        self._devices: Dict[str, DeviceConfig] = {}
        self._states: Dict[str, DeviceState] = {}
        self._lock = threading.Lock()

    def add_device(self, config: DeviceConfig):
        with self._lock:
            self._devices[config.device_id] = config
            if config.device_id not in self._states:
                self._states[config.device_id] = DeviceState()

    def remove_device(self, device_id: str):
        with self._lock:
            if device_id in self._devices:
                del self._devices[device_id]
            if device_id in self._states:
                del self._states[device_id]

    def get_all_devices(self) -> List[DeviceConfig]:
        with self._lock:
            return list(self._devices.values())

    def get_state(self, device_id: str) -> Optional[DeviceState]:
        with self._lock:
            return self._states.get(device_id)

    def update_state(self, device_id: str, new_state: DeviceState):
        with self._lock:
            if device_id in self._states:
                # Merge logic: if new_state has None for chaos, keep the old one
                # unless explicitly cleared (but here we just assume None means 'not updated in this tick')
                old_state = self._states[device_id]
                if new_state.chaos_mode is None and old_state.chaos_mode is not None:
                    new_state.chaos_mode = old_state.chaos_mode
                    new_state.chaos_intensity = old_state.chaos_intensity
                
                self._states[device_id] = new_state
