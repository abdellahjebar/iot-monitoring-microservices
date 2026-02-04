import { type FC } from 'react';
import { Thermometer, Droplets, Cpu, BatteryMedium, AlertTriangle, Fan } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceCardProps {
    deviceId: string;
    status: string;
    temperature: number;
    humidity: number;
    cpuLoad?: number;
    batteryLevel?: number;
    coolingActive: boolean;
    alert?: string;
    lastUpdate: string;
    selected?: boolean;
    onClick?: () => void;
    onToggleCooling?: () => void;
}

export const DeviceCard: FC<DeviceCardProps> = ({
    deviceId,
    status,
    temperature,
    humidity,
    cpuLoad,
    batteryLevel,
    coolingActive,
    alert,
    lastUpdate,
    selected = false,
    onClick,
    onToggleCooling,
}) => {
    const isOnline = status === 'ONLINE';
    const hasAlert = !!alert;

    const statusStyles: Record<string, string> = {
        ONLINE: 'bg-success-soft text-success',
        OFFLINE: 'bg-error-soft text-error',
        MAINTENANCE: 'bg-warning-soft text-warning',
    };

    const statusClass = statusStyles[status] || 'bg-bg-3 text-text-secondary';

    return (
        <div
            onClick={onClick}
            className={cn(
                "card cursor-pointer transition-all duration-200",
                selected && "border-cyan ring-2 ring-cyan/20",
                hasAlert && !selected && "border-error/50",
                coolingActive && !selected && "border-cyan/30"
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-body font-semibold text-text-primary flex items-center gap-2">
                        {deviceId}
                        {coolingActive && <Fan className="w-3 h-3 text-cyan animate-spin" />}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                            "status-dot",
                            isOnline ? "status-dot-online" : "status-dot-offline"
                        )} />
                        <span className="text-caption text-text-tertiary font-mono">{lastUpdate}</span>
                    </div>
                </div>
                <span className={cn("badge", statusClass)}>
                    {status}
                </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Temperature */}
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-text-tertiary">
                        <Thermometer className="w-3.5 h-3.5" />
                        <span className="label-uppercase">Temp</span>
                    </div>
                    <p className={cn(
                        "text-h2 font-mono font-bold",
                        coolingActive ? "text-cyan" : "text-text-primary"
                    )}>
                        {temperature.toFixed(1)}<span className="text-body-sm text-text-tertiary">°C</span>
                    </p>
                </div>

                {/* Humidity */}
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-text-tertiary">
                        <Droplets className="w-3.5 h-3.5" />
                        <span className="label-uppercase">Humidity</span>
                    </div>
                    <p className="text-h2 font-mono font-bold text-text-primary">
                        {humidity.toFixed(0)}<span className="text-body-sm text-text-tertiary">%</span>
                    </p>
                </div>

                {/* CPU (if available) */}
                {cpuLoad !== undefined && (
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-text-tertiary">
                            <Cpu className="w-3.5 h-3.5" />
                            <span className="label-uppercase">CPU</span>
                        </div>
                        <p className="text-h2 font-mono font-bold text-text-primary">
                            {cpuLoad.toFixed(0)}<span className="text-body-sm text-text-tertiary">%</span>
                        </p>
                    </div>
                )}

                {/* Battery (if available) */}
                {batteryLevel !== undefined && (
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-text-tertiary">
                            <BatteryMedium className="w-3.5 h-3.5" />
                            <span className="label-uppercase">Battery</span>
                        </div>
                        <p className="text-h2 font-mono font-bold text-text-primary">
                            {batteryLevel.toFixed(0)}<span className="text-body-sm text-text-tertiary">%</span>
                        </p>
                    </div>
                )}
            </div>

            {/* Action Area */}
            <div className="space-y-3">
                {/* Cooling Toggle */}
                {onToggleCooling && (
                    <button
                        disabled={!isOnline}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleCooling();
                        }}
                        className={cn(
                            "w-full h-9 rounded-md font-medium text-body-sm flex items-center justify-center gap-2 transition-all",
                            coolingActive
                                ? "btn-primary"
                                : "btn-secondary"
                        )}
                    >
                        <Fan className="w-4 h-4" />
                        {coolingActive ? 'Cooling Active' : 'Activate Cooling'}
                    </button>
                )}

                {/* Alert Banner */}
                {hasAlert && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-error-soft border border-error/20">
                        <AlertTriangle className="w-4 h-4 text-error flex-shrink-0" />
                        <span className="text-caption font-medium text-error truncate">{alert}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
