import type { FC } from 'react';
import { cn } from '@/lib/utils';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';

interface TelemetryChartProps {
    data: any[];
    title: string;
}

export const TelemetryChart: FC<TelemetryChartProps> = ({ data, title }) => {
    return (
        <div className={cn("glass p-6 rounded-2xl h-[400px] border border-white/5", "bg-black/20 backdrop-blur-3xl")}>
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">{title}</h3>
            <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00f2fe" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4facfe" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#4facfe" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                    <XAxis
                        dataKey="timestamp"
                        stroke="#6e7681"
                        fontSize={10}
                        tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    />
                    <YAxis stroke="#6e7681" fontSize={10} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="temperature"
                        stroke="#00f2fe"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorTemp)"
                        name="Temperature (°C)"
                        animationDuration={300}
                    />
                    <Area
                        type="monotone"
                        dataKey="humidity"
                        stroke="#4facfe"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorHum)"
                        name="Humidity (%)"
                        animationDuration={300}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
