import { useEffect, useState, useCallback } from 'react';
import { socketService } from '../services/socket.service';

export interface TelemetryReading {
    device_id: string;
    timestamp: string;
    temperature: number;
    humidity: number;
    status: string;
    cooling_active: boolean; // Added for Bi-Directional Control
    lat: number;
    lon: number;
    alert?: string;
}

export const useTelemetry = (maxHistory = 20) => {
    const [readings, setReadings] = useState<Record<string, TelemetryReading[]>>({});
    const [latestAlert, setLatestAlert] = useState<any>(null);

    const handleTelemetry = useCallback((event: any) => {
        const { device_id, data, alert } = event;
        const reading: TelemetryReading = {
            device_id,
            timestamp: data.timestamp,
            temperature: data.telemetry.temperature,
            humidity: data.telemetry.humidity,
            status: data.status,
            cooling_active: data.system?.cooling_active || false,
            lat: data.lat || 0,
            lon: data.lon || 0,
            alert: alert,
        };

        if (alert) {
            setLatestAlert({
                device_id,
                message: alert,
                timestamp: new Date().toLocaleTimeString(),
            });
        }

        setReadings((prev) => {
            const deviceHistory = prev[device_id] || [];
            const newHistory = [...deviceHistory, reading].slice(-maxHistory);
            return { ...prev, [device_id]: newHistory };
        });
    }, [maxHistory]);

    useEffect(() => {
        socketService.connect();
        socketService.subscribeToTelemetry(handleTelemetry);

        return () => {
            socketService.unsubscribeFromTelemetry(handleTelemetry);
        };
    }, [handleTelemetry]);

    return { readings, latestAlert };
};
