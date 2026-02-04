import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { socketService } from '../services/socket.service';
import { deviceService } from '../services/api';
import { useNotification } from '@/context/NotificationContext';

export interface TelemetryReading {
    device_id: string;
    timestamp: string;
    temperature: number;
    humidity: number;
    status: string;
    cooling_active: boolean;
    lat: number;
    lon: number;
    cpu_load?: number;
    ram_usage?: number;
    gpu_load?: number;
    battery_level?: number;
    power_mode?: string;
    alert?: string;
    risk_level?: string;
    anomaly_score?: number;
}

interface TelemetryContextType {
    readings: Record<string, TelemetryReading[]>;
    latestAlert: any;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider = ({ children, maxHistory = 100 }: { children: ReactNode, maxHistory?: number }) => {
    const [readings, setReadings] = useState<Record<string, TelemetryReading[]>>({});
    const [latestAlert, setLatestAlert] = useState<any>(null);
    const riskTracker = useRef<Record<string, string>>({});
    const { showNotification } = useNotification();

    const handleTelemetry = useCallback((event: any) => {
        try {
            const { device_id, data, alert } = event;
            if (!device_id || !data) return;

            const reading: TelemetryReading = {
                device_id,
                timestamp: data.timestamp,
                temperature: data.telemetry?.temperature || 0,
                humidity: data.telemetry?.humidity || 0,
                status: data.status || 'ONLINE',
                cooling_active: data.system?.cooling_active || false,
                lat: data.lat || 0,
                lon: data.lon || 0,
                cpu_load: data.system?.cpu_load,
                ram_usage: data.system?.ram_usage,
                gpu_load: data.system?.gpu_load,
                battery_level: data.system?.battery_level,
                power_mode: data.system?.power_mode,
                alert: alert,
                risk_level: data.risk_level,
                anomaly_score: data.anomaly_score
            };

            // Notification Logic: Only alert on CHANGE of risk level
            const prevRisk = riskTracker.current[device_id];
            const currentRisk = data.risk_level || 'LOW';

            if (currentRisk !== prevRisk) {
                if (alert || currentRisk === 'HIGH') {
                    const message = alert || `High Risk detected (Score: ${data.anomaly_score?.toFixed(2)})`;

                    setLatestAlert({
                        device_id,
                        message: message,
                        timestamp: new Date().toLocaleTimeString(),
                        riskLevel: currentRisk
                    });

                    showNotification({
                        type: (alert?.includes('Critical') || currentRisk === 'HIGH') ? 'critical' : 'warning',
                        title: alert || 'Anomaly Detected',
                        message: `Risk Level: ${currentRisk}. Anomaly Score: ${data.anomaly_score?.toFixed(1)}`,
                        deviceId: device_id
                    });
                }

                // Update the tracker ref silently
                riskTracker.current[device_id] = currentRisk;
            }

            setReadings((prev) => {
                const deviceHistory = prev[device_id] || [];
                const newHistory = [...deviceHistory, reading].slice(-maxHistory);
                return { ...prev, [device_id]: newHistory };
            });
        } catch (err) {
            console.error("Telemetry Processing Error:", err);
        }
    }, [maxHistory, showNotification]);

    useEffect(() => {
        const seedDiscovery = async () => {
            try {
                const ids = await deviceService.getDiscoveredAssets();
                setReadings(prev => {
                    const next = { ...prev };
                    (ids || []).forEach((id: string) => {
                        if (!next[id]) next[id] = [];
                    });
                    return next;
                });
            } catch (err) {
                console.error("Discovery Seeding Failed:", err);
            }
        };

        seedDiscovery();
        socketService.connect();
        socketService.subscribeToTelemetry(handleTelemetry);

        return () => {
            socketService.unsubscribeFromTelemetry(handleTelemetry);
        };
    }, [handleTelemetry]);

    return (
        <TelemetryContext.Provider value={{ readings, latestAlert }}>
            {children}
        </TelemetryContext.Provider>
    );
};

export const useTelemetryData = () => {
    const context = useContext(TelemetryContext);
    if (!context) {
        throw new Error('useTelemetryData must be used within a TelemetryProvider');
    }
    return context;
};
