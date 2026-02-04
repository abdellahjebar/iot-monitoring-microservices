import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTelemetry } from '@/hooks/useTelemetry';
import { DeviceCard } from '@/components/dashboard/DeviceCard';
import { TelemetryChart } from '@/components/dashboard/TelemetryChart';
import { GlobalMap } from '@/components/map/GlobalMap';
import { StatCard } from '@/components/dashboard/StatCard';
import { DeviceWizard } from '@/components/dashboard/DeviceWizard';
import { InspectorDrawer } from '@/components/dashboard/InspectorDrawer';
import { deviceService } from '@/services/api';
import {
    Activity,
    Signal,
    Thermometer,
    AlertTriangle,
    Plus,
    Map as MapIcon,
    BarChart,
    ShieldCheck,
} from 'lucide-react';

type ViewMode = 'chart' | 'map';

export function Dashboard() {
    // Hooks - All data from backend via useTelemetry
    const { readings, latestAlert } = useTelemetry();

    // Local UI state only
    const [activeDevice, setActiveDevice] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('chart');
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);
    const [inspectedDevice, setInspectedDevice] = useState<string | null>(null);

    // Derived data (computed from backend data, no business logic)
    const deviceList = Object.keys(readings).sort();
    const currentDevice = activeDevice || deviceList[0];
    const latestData = currentDevice ? readings[currentDevice] : [];

    // Stats computed from readings
    const stats = {
        total: deviceList.length,
        online: deviceList.filter(id => {
            const last = readings[id]?.[readings[id].length - 1];
            return last?.status === 'ONLINE';
        }).length,
        alerts: deviceList.filter(id => {
            const last = readings[id]?.[readings[id].length - 1];
            return !!last?.alert;
        }).length,
        avgTemp: deviceList.length > 0
            ? deviceList.reduce((acc, id) => {
                const last = readings[id]?.[readings[id].length - 1];
                return acc + (last?.temperature || 0);
            }, 0) / deviceList.length
            : 0,
    };

    // Callbacks for child components
    const handleDeviceClick = (deviceId: string) => {
        setInspectedDevice(deviceId);
        setIsInspectorOpen(true);
    };

    const handleToggleCooling = async (deviceId: string, isActive: boolean) => {
        const action = isActive ? 'COOLING_OFF' : 'COOLING_ON';
        await deviceService.sendCommand(deviceId, action);
    };

    const handleReboot = async () => {
        if (inspectedDevice) {
            await deviceService.sendCommand(inspectedDevice, 'REBOOT');
        }
    };

    const handleSabotage = async (chaosType: string) => {
        if (inspectedDevice) {
            await deviceService.sabotageDevice(inspectedDevice, chaosType);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-h1 text-text-primary">Overview</h1>
                    <p className="text-body text-text-secondary mt-1">
                        Real-time monitoring of {deviceList.length} devices
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsWizardOpen(true)}
                        className="btn-primary"
                    >
                        <Plus className="w-4 h-4" />
                        Add Device
                    </button>
                    <div className="flex items-center bg-bg-1 border border-border-subtle rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('chart')}
                            className={cn(
                                "flex items-center gap-2 px-3 h-8 rounded-md text-body-sm font-medium transition-colors",
                                viewMode === 'chart' ? "bg-bg-2 text-text-primary" : "text-text-tertiary hover:text-text-secondary"
                            )}
                        >
                            <BarChart className="w-4 h-4" />
                            Charts
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={cn(
                                "flex items-center gap-2 px-3 h-8 rounded-md text-body-sm font-medium transition-colors",
                                viewMode === 'map' ? "bg-bg-2 text-text-primary" : "text-text-tertiary hover:text-text-secondary"
                            )}
                        >
                            <MapIcon className="w-4 h-4" />
                            Map
                        </button>
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Devices"
                    value={stats.total}
                    icon={Activity}
                    trend={{ value: "+3", positive: true }}
                />
                <StatCard
                    title="Online"
                    value={stats.online}
                    icon={Signal}
                    variant="success"
                />
                <StatCard
                    title="Avg Temperature"
                    value={`${stats.avgTemp.toFixed(1)}°C`}
                    icon={Thermometer}
                    variant={stats.avgTemp > 35 ? 'warning' : 'default'}
                />
                <StatCard
                    title="Active Alerts"
                    value={stats.alerts}
                    icon={AlertTriangle}
                    variant={stats.alerts > 0 ? 'error' : 'success'}
                />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Chart/Map Area */}
                <div className="xl:col-span-2 space-y-6">
                    {viewMode === 'chart' ? (
                        <div className="card p-0 overflow-hidden">
                            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="status-dot status-dot-online" />
                                    <span className="text-body-sm font-medium text-text-primary">
                                        {currentDevice || 'No device selected'}
                                    </span>
                                </div>
                                <span className="text-caption text-text-tertiary">Last 30 readings</span>
                            </div>
                            <TelemetryChart
                                data={latestData}
                                title={`Telemetry: ${currentDevice}`}
                            />
                        </div>
                    ) : (
                        <div className="card p-0 h-[500px] overflow-hidden">
                            <GlobalMap
                                devices={readings}
                                onDeviceSelect={(id: string) => {
                                    setActiveDevice(id);
                                    setViewMode('chart');
                                }}
                            />
                        </div>
                    )}

                    {/* Device Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {deviceList.slice(0, 4).map(id => {
                            const history = readings[id];
                            const last = history?.[history.length - 1];

                            return (
                                <DeviceCard
                                    key={id}
                                    deviceId={id}
                                    status={last?.status || 'OFFLINE'}
                                    temperature={last?.temperature || 0}
                                    humidity={last?.humidity || 0}
                                    cpuLoad={last?.cpu_load}
                                    batteryLevel={last?.battery_level}
                                    coolingActive={last?.cooling_active || false}
                                    alert={last?.alert}
                                    lastUpdate={last ? new Date(last.timestamp).toLocaleTimeString() : '--'}
                                    selected={id === currentDevice}
                                    onClick={() => handleDeviceClick(id)}
                                    onToggleCooling={() => handleToggleCooling(id, last?.cooling_active || false)}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Recent Alerts */}
                    <div className="card">
                        <h3 className="label-uppercase mb-4">Recent Alerts</h3>
                        {latestAlert ? (
                            <div className="p-3 rounded-md bg-error-soft border border-error/20">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-body-sm font-medium text-text-primary">{latestAlert.device_id}</p>
                                        <p className="text-caption text-text-secondary mt-1">{latestAlert.message}</p>
                                        <p className="text-caption text-text-tertiary mt-2">{latestAlert.timestamp}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <div className="w-10 h-10 rounded-full bg-success-soft border border-success/20 flex items-center justify-center mx-auto mb-3">
                                    <ShieldCheck className="w-5 h-5 text-success" />
                                </div>
                                <p className="text-body-sm text-text-tertiary">All systems operational</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className="card">
                        <h3 className="label-uppercase mb-4">System Status</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                                <span className="text-body-sm text-text-secondary">Uptime</span>
                                <span className="text-body-sm font-mono text-text-primary">99.97%</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                                <span className="text-body-sm text-text-secondary">Latency</span>
                                <span className="text-body-sm font-mono text-text-primary">24ms</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-body-sm text-text-secondary">Messages/sec</span>
                                <span className="text-body-sm font-mono text-text-primary">{deviceList.length * 0.5}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <DeviceWizard
                open={isWizardOpen}
                onOpenChange={setIsWizardOpen}
                onSuccess={() => setIsWizardOpen(false)}
            />

            <InspectorDrawer
                deviceId={inspectedDevice}
                history={inspectedDevice ? readings[inspectedDevice] : []}
                open={isInspectorOpen}
                onOpenChange={setIsInspectorOpen}
                onReboot={handleReboot}
                onSabotage={handleSabotage}
            />
        </div>
    );
}
