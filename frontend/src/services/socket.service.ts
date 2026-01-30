import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_MONITORING_URL || '';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (this.socket) return;

        this.socket = io(SOCKET_URL, {
            transports: ['websocket'],
            autoConnect: true,
        });

        this.socket.on('connect', () => {
            console.log('Connected to Monitoring Socket');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from Monitoring Socket');
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    subscribeToTelemetry(callback: (data: any) => void) {
        if (!this.socket) this.connect();
        this.socket?.on('event', callback);
    }

    unsubscribeFromTelemetry(callback: (data: any) => void) {
        this.socket?.off('event', callback);
    }
}

export const socketService = new SocketService();
