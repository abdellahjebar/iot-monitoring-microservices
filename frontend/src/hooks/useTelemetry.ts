import { useTelemetryData } from '../context/TelemetryContext';
export type { TelemetryReading } from '../context/TelemetryContext';

export const useTelemetry = () => {
    const { readings, latestAlert } = useTelemetryData();
    return { readings, latestAlert };
};
