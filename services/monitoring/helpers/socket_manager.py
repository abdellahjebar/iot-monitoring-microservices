import socketio
import logging

logger = logging.getLogger("monitoring_service")

class SocketManager:
    def __init__(self):
        self.sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
        self.app = socketio.ASGIApp(self.sio)
        self.register_handlers()

    def register_handlers(self):
        @self.sio.event
        async def connect(sid, environ):
            logger.info(f"⚡ Client connected: {sid}")
            await self.sio.emit('status', {'msg': 'Connected to Monitoring Service'}, room=sid)

        @self.sio.event
        async def disconnect(sid):
            logger.info(f"🔌 Client disconnected: {sid}")

        @self.sio.event
        async def subscribe(sid, data):
            # Client can subscribe to specific device updates
            device_id = data.get('device_id')
            if device_id:
                logger.info(f"Client {sid} subscribed to {device_id}")
                await self.sio.enter_room(sid, device_id)
                await self.sio.emit('subscribed', {'device_id': device_id}, room=sid)

    async def emit_to_all(self, event: str, data: dict):
        """Broadcast to everyone"""
        await self.sio.emit(event, data)

    async def emit_to_device(self, device_id: str, event: str, data: dict):
        """Emit to specific device room"""
        await self.sio.emit(event, data, room=device_id)

# Singleton Instance
socket_manager = SocketManager()
