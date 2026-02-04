import { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type TelemetryReading } from '@/hooks/useTelemetry';
import {
    Cpu,
    Zap,
    RefreshCcw,
    Power,
    ShieldAlert,
    Activity,
    Thermometer,
    Droplets,
    History,
    MemoryStick,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InspectorDrawerProps {
    deviceId: string | null;
    history: TelemetryReading[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // Callbacks - No business logic in frontend
    onReboot?: () => void;
    onSabotage?: (chaosType: string) => void;
}

interface MetricCardProps {
    icon: React.ElementType;
    label: string;
    value: string | number;
    unit?: string;
    progress?: number;
}

const MetricCard = ({ icon: Icon, label, value, unit, progress }: MetricCardProps) => (
    <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2 text-text-tertiary">
            <Icon className="w-4 h-4" />
            <span className="label-uppercase">{label}</span>
        </div>
        <div className="space-y-2">
            <p className="text-h2 font-mono font-bold text-text-primary">
                {value}
                {unit && <span className="text-body text-text-tertiary ml-1">{unit}</span>}
            </p>
            {progress !== undefined && (
                <div className="w-full bg-bg-3 h-1.5 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-500",
                            progress > 80 ? "bg-error" : progress > 60 ? "bg-warning" : "bg-cyan"
                        )}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            )}
        </div>
    </div>
);

export const InspectorDrawer = ({
    deviceId,
    history,
    open,
    onOpenChange,
    onReboot,
    onSabotage,
}: InspectorDrawerProps) => {
    const [isRebooting, setIsRebooting] = useState(false);
    const current = history[history.length - 1];

    if (!deviceId || !current) return null;

    const handleReboot = () => {
        if (onReboot) {
            setIsRebooting(true);
            onReboot();
            setTimeout(() => setIsRebooting(false), 2000);
        }
    };

    const chaosOptions = [
        { id: 'THERMAL_RUNAWAY', label: 'Thermal Runaway', icon: Thermometer, description: 'Simulate overheating' },
        { id: 'SENSOR_FLICKER', label: 'Sensor Flicker', icon: RefreshCcw, description: 'Unstable readings' },
        { id: 'GHOST_DATA', label: 'Ghost Data', icon: Zap, description: 'Send null values' },
    ];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-lg border-l border-border-subtle bg-bg-0 p-0 overflow-hidden">
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-border-subtle bg-bg-1">
                        <SheetHeader className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-cyan-soft border border-cyan/20 flex items-center justify-center">
                                        <Cpu className="w-5 h-5 text-cyan" />
                                    </div>
                                    <div>
                                        <SheetTitle className="text-h3 text-text-primary">{deviceId}</SheetTitle>
                                        <p className="text-body-sm text-text-tertiary">IoT Edge Node</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {current.risk_level && (
                                        <span className={cn(
                                            "badge",
                                            current.risk_level === 'HIGH' ? "badge-error" :
                                                current.risk_level === 'MEDIUM' ? "badge-warning" : "badge-success"
                                        )}>
                                            RISK: {current.risk_level}
                                        </span>
                                    )}
                                    <span className={cn(
                                        "badge",
                                        current.status === 'ONLINE' ? "badge-success" : "badge-error"
                                    )}>
                                        {current.status}
                                    </span>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleReboot}
                                    disabled={isRebooting}
                                    className="btn-secondary flex-1"
                                >
                                    {isRebooting ? (
                                        <RefreshCcw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Power className="w-4 h-4" />
                                    )}
                                    Reboot
                                </button>
                                <button
                                    onClick={() => onOpenChange(false)}
                                    className="btn-ghost"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </SheetHeader>
                    </div>

                    {/* Tabs Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="w-full bg-bg-2 border border-border-subtle p-1 rounded-lg h-10 mb-6">
                                <TabsTrigger value="overview" className="flex-1 h-full rounded-md text-body-sm">Overview</TabsTrigger>
                                <TabsTrigger value="history" className="flex-1 h-full rounded-md text-body-sm">History</TabsTrigger>
                                <TabsTrigger value="chaos" className="flex-1 h-full rounded-md text-body-sm">Chaos</TabsTrigger>
                            </TabsList>

                            {/* Overview Tab */}
                            <TabsContent value="overview" className="space-y-4 animate-fade-in">
                                {/* AI Analysis */}
                                {current.anomaly_score !== undefined ? (
                                    <div className="mb-6 animate-fade-in">
                                        <h4 className="label-uppercase mb-3 flex items-center gap-2">
                                            <ShieldAlert className="w-3.5 h-3.5 text-cyan" />
                                            Predictive Diagnostics
                                        </h4>
                                        <div className="card p-4 bg-gradient-to-br from-bg-2 to-bg-1 border-cyan/20 relative overflow-hidden">
                                            <div className="flex items-center justify-between relative z-10">
                                                <div>
                                                    <p className="text-body-sm text-text-secondary">Anomaly Probability</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className={cn(
                                                            "text-h2 font-mono font-bold",
                                                            (current.anomaly_score || 0) < 0 ? "text-error" :
                                                                (current.anomaly_score || 0) < 0.2 ? "text-warning" : "text-success"
                                                        )}>
                                                            {current.anomaly_score?.toFixed(3) || "0.000"}
                                                        </span>
                                                        <span className="text-caption text-text-tertiary">ISOLATION SCORE</span>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "w-12 h-12 rounded-full flex items-center justify-center border-2",
                                                    current.risk_level === 'HIGH' ? "border-error bg-error/10 text-error" :
                                                        current.risk_level === 'MEDIUM' ? "border-warning bg-warning/10 text-warning" :
                                                            "border-success bg-success/10 text-success"
                                                )}>
                                                    <Activity className="w-6 h-6" />
                                                </div>
                                            </div>
                                            {/* Background glow */}
                                            <div className={cn(
                                                "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20",
                                                current.risk_level === 'HIGH' ? "bg-error" :
                                                    current.risk_level === 'MEDIUM' ? "bg-warning" : "bg-success"
                                            )} />
                                        </div>
                                    </div>
                                ) : null}

                                {/* System Metrics */}
                                <h4 className="label-uppercase mb-3">System Metrics</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <MetricCard
                                        icon={Cpu}
                                        label="CPU"
                                        value={current.cpu_load?.toFixed(0) ?? 0}
                                        unit="%"
                                        progress={current.cpu_load ?? 0}
                                    />
                                    <MetricCard
                                        icon={MemoryStick}
                                        label="RAM"
                                        value={current.ram_usage?.toFixed(0) ?? 0}
                                        unit="%"
                                        progress={current.ram_usage ?? 0}
                                    />
                                    <MetricCard
                                        icon={Activity}
                                        label="GPU"
                                        value={current.gpu_load?.toFixed(0) ?? 0}
                                        unit="%"
                                        progress={current.gpu_load ?? 0}
                                    />
                                    <MetricCard
                                        icon={Zap}
                                        label="Battery"
                                        value={current.battery_level?.toFixed(0) ?? 100}
                                        unit="%"
                                        progress={current.battery_level ?? 100}
                                    />
                                </div>

                                {/* Environment */}
                                <h4 className="label-uppercase mt-6 mb-3">Environment</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <MetricCard
                                        icon={Thermometer}
                                        label="Temperature"
                                        value={current.temperature.toFixed(1)}
                                        unit="°C"
                                    />
                                    <MetricCard
                                        icon={Droplets}
                                        label="Humidity"
                                        value={current.humidity.toFixed(0)}
                                        unit="%"
                                    />
                                </div>

                                {/* Live Pulse */}
                                <div className="card p-4 mt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 text-cyan">
                                            <Activity className="w-4 h-4" />
                                            <span className="label-uppercase text-cyan">Live Telemetry</span>
                                        </div>
                                        <span className="text-caption text-cyan animate-pulse-live">LIVE</span>
                                    </div>
                                    <div className="h-16 flex items-end gap-0.5">
                                        {history.slice(-30).map((r, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 bg-cyan/30 rounded-t-sm transition-all duration-300"
                                                style={{ height: `${Math.min((r.temperature / 80) * 100, 100)}%` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* History Tab */}
                            <TabsContent value="history" className="space-y-2 animate-fade-in">
                                <h4 className="label-uppercase mb-3 flex items-center gap-2">
                                    <History className="w-3.5 h-3.5" /> Recent Events
                                </h4>
                                <div className="space-y-1">
                                    {history.slice().reverse().slice(0, 20).map((r, i) => (
                                        <div
                                            key={i}
                                            className="flex justify-between items-center p-3 rounded-md hover:bg-bg-2 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={cn(
                                                    "status-dot",
                                                    r.alert ? "status-dot-offline" : "status-dot-online"
                                                )} />
                                                <span className="text-body-sm text-text-secondary">
                                                    {r.alert || 'Normal operation'}
                                                </span>
                                            </div>
                                            <span className="text-caption font-mono text-text-tertiary">
                                                {new Date(r.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* Chaos Tab */}
                            <TabsContent value="chaos" className="space-y-4 animate-fade-in">
                                <div className="card p-4 bg-error-soft border-error/20">
                                    <div className="flex items-center gap-2 text-error mb-2">
                                        <ShieldAlert className="w-4 h-4" />
                                        <span className="text-body-sm font-semibold">Chaos Engineering</span>
                                    </div>
                                    <p className="text-body-sm text-text-tertiary">
                                        Inject faults to test system resilience and alerting.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    {chaosOptions.map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => onSabotage?.(mode.id)}
                                            className="w-full p-4 rounded-lg bg-bg-1 border border-border-subtle hover:border-error/50 hover:bg-error-soft/50 transition-all group text-left"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <mode.icon className="w-5 h-5 text-error group-hover:text-error" />
                                                    <div>
                                                        <p className="text-body-sm font-medium text-text-primary">{mode.label}</p>
                                                        <p className="text-caption text-text-tertiary">{mode.description}</p>
                                                    </div>
                                                </div>
                                                <div className="w-2 h-2 rounded-full bg-bg-3 group-hover:bg-error transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-bg-1 border-t border-border-subtle">
                        <p className="text-caption text-text-tertiary text-center">
                            Last updated: {new Date(current.timestamp).toLocaleString()}
                        </p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
