import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { deviceService } from '@/services/api';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import {
    Thermometer,
    Droplets,
    TrendingUp,
    TrendingDown,
    Clock,
    Download,
    FileJson,
    FileSpreadsheet,
    BarChart3
} from 'lucide-react';

export const AnalyticsPage = () => {
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [timeRange, setTimeRange] = useState('24h');

    const { data: devices } = useQuery({
        queryKey: ['devices'],
        queryFn: deviceService.getDevices
    });

    const { data: discoveredIds } = useQuery({
        queryKey: ['discovered-assets'],
        queryFn: deviceService.getDiscoveredAssets
    });

    // Merge registered and discovered assets
    const allAssets = Array.from(new Set([
        ...(devices?.map((d: any) => ({ id: d.id, name: d.name })) || []),
        ...(discoveredIds?.map((id: string) => ({ id, name: id })) || [])
    ].map(a => JSON.stringify(a)))).map(s => JSON.parse(s))
        .filter((v: any, i: number, a: any[]) => a.findIndex(t => t.id === v.id) === i);

    const { data: analytics, isLoading } = useQuery({
        queryKey: ['analytics', selectedDeviceId, timeRange],
        queryFn: () => deviceService.getAnalytics(selectedDeviceId),
        enabled: !!selectedDeviceId
    });

    const downloadReport = (format: 'csv' | 'json') => {
        if (!analytics) return;
        const data = format === 'json'
            ? JSON.stringify(analytics, null, 2)
            : convertToCSV(analytics.timeseries);

        const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${selectedDeviceId}_${new Date().toISOString()}.${format}`;
        a.click();
    };

    const convertToCSV = (data: any[]) => {
        if (!data?.length) return '';
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
        return `${headers}\n${rows}`;
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-h1 text-text-primary">Analytics</h1>
                    <p className="text-body text-text-secondary mt-1">
                        Time-series aggregation and trend analysis
                    </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                    {/* Device Selector */}
                    <select
                        value={selectedDeviceId}
                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                        className="h-10 px-4 rounded-lg bg-bg-1 border border-border-subtle text-text-primary text-body-sm focus:outline-none focus:border-cyan transition-colors"
                    >
                        <option value="">Select Device</option>
                        {allAssets.map((d: any) => (
                            <option key={d.id} value={d.id}>{d.name || d.id}</option>
                        ))}
                    </select>

                    {/* Time Range */}
                    <div className="flex items-center gap-1 bg-bg-1 border border-border-subtle rounded-lg p-1">
                        {['1h', '24h', '7d'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={cn(
                                    "px-3 h-8 rounded-md text-body-sm font-medium transition-colors",
                                    timeRange === range
                                        ? "bg-bg-2 text-text-primary"
                                        : "text-text-tertiary hover:text-text-secondary"
                                )}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Content */}
            {!selectedDeviceId ? (
                <div className="card border-dashed flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-bg-2 flex items-center justify-center mb-4">
                        <BarChart3 className="w-8 h-8 text-text-tertiary" />
                    </div>
                    <h3 className="text-h3 text-text-primary mb-2">Select a Device</h3>
                    <p className="text-body text-text-secondary max-w-sm">
                        Choose a device from the dropdown above to view its analytics and telemetry history.
                    </p>
                </div>
            ) : isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Stats Column Skeleton */}
                    <div className="space-y-4">
                        <div className="card animate-pulse">
                            <div className="h-4 w-24 bg-bg-3 rounded mb-6" />
                            <div className="h-10 w-20 bg-bg-3 rounded mb-4" />
                            <div className="h-10 w-20 bg-bg-3 rounded" />
                        </div>
                    </div>
                    {/* Chart Skeleton */}
                    <div className="lg:col-span-3 card animate-pulse">
                        <div className="h-4 w-48 bg-bg-3 rounded mb-6" />
                        <div className="h-[400px] bg-bg-2 rounded-lg" />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
                    {/* Stats Column */}
                    <div className="space-y-4">
                        {/* Health Aggregate */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <span className="label-uppercase">Health Summary</span>
                                <span className="text-caption text-cyan animate-pulse-live">LIVE</span>
                            </div>

                            {/* Temperature */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 text-text-tertiary mb-2">
                                    <Thermometer className="w-4 h-4" />
                                    <span className="text-caption">Average Temperature</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-h1 font-mono text-text-primary">
                                        {analytics?.stats.avg_temp.toFixed(1)}°
                                    </span>
                                    <span className="text-body-sm text-success flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        +2.4%
                                    </span>
                                </div>
                            </div>

                            {/* Humidity */}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 text-text-tertiary mb-2">
                                    <Droplets className="w-4 h-4" />
                                    <span className="text-caption">Average Humidity</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-h1 font-mono text-text-primary">
                                        {analytics?.stats.avg_humidity.toFixed(1)}%
                                    </span>
                                    <span className="text-body-sm text-error flex items-center gap-1">
                                        <TrendingDown className="w-3 h-3" />
                                        -1.2%
                                    </span>
                                </div>
                            </div>

                            {/* Min/Max */}
                            <div className="pt-4 border-t border-border-subtle grid grid-cols-2 gap-4">
                                <div>
                                    <p className="label-uppercase text-text-tertiary mb-1">Max Temp</p>
                                    <p className="text-body font-mono text-text-primary">
                                        {analytics?.stats.max_temp.toFixed(1)}°C
                                    </p>
                                </div>
                                <div>
                                    <p className="label-uppercase text-text-tertiary mb-1">Min Temp</p>
                                    <p className="text-body font-mono text-text-primary">
                                        {analytics?.stats.min_temp.toFixed(1)}°C
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Export Card */}
                        <div className="card bg-cyan-soft/50 border-cyan/20">
                            <div className="flex items-center gap-2 mb-4">
                                <Download className="w-4 h-4 text-cyan" />
                                <span className="text-body-sm font-medium text-cyan">Export Report</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => downloadReport('csv')}
                                    className="btn-secondary h-9 text-body-sm"
                                >
                                    <FileSpreadsheet className="w-4 h-4" />
                                    CSV
                                </button>
                                <button
                                    onClick={() => downloadReport('json')}
                                    className="btn-secondary h-9 text-body-sm"
                                >
                                    <FileJson className="w-4 h-4" />
                                    JSON
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="lg:col-span-3 card">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-cyan" />
                                <span className="text-body font-medium text-text-primary">Time Series</span>
                            </div>
                            <span className="text-caption text-text-tertiary">
                                Last {timeRange}
                            </span>
                        </div>

                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics?.timeseries}>
                                    <defs>
                                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                                    <XAxis
                                        dataKey="time"
                                        stroke="var(--text-tertiary)"
                                        fontSize={10}
                                        tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="var(--text-tertiary)"
                                        fontSize={10}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(val) => `${val}°`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--bg-1)',
                                            border: '1px solid var(--border-subtle)',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontFamily: 'var(--font-mono)'
                                        }}
                                        itemStyle={{ color: 'var(--cyan)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="temp"
                                        name="Temperature"
                                        stroke="#00d4ff"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorTemp)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="humidity"
                                        name="Humidity"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        fill="transparent"
                                        strokeDasharray="5 5"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 pt-4 border-t border-border-subtle mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-cyan" />
                                <span className="text-body-sm text-text-secondary">Temperature</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-error" />
                                <span className="text-body-sm text-text-secondary">Humidity</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
