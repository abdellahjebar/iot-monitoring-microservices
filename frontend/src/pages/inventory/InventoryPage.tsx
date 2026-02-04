import { useMemo, useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
    getSortedRowModel,
    getFilteredRowModel,
} from '@tanstack/react-table';
import { useTelemetryData, type TelemetryReading } from '@/context/TelemetryContext';
import { GlassCard } from '@/components/ui/glass-card';
import {
    Search,
    ArrowUpDown,
    ChevronRight,
    Fan,
    AlertCircle,
    Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { InspectorDrawer } from '@/components/dashboard/InspectorDrawer';

const columnHelper = createColumnHelper<TelemetryReading>();

export const InventoryPage = () => {
    const { readings } = useTelemetryData(); // Changed to useTelemetryData
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);
    const [inspectedDevice, setInspectedDevice] = useState<string | null>(null);

    const data = useMemo(() => {
        return Object.keys(readings).map(id => {
            const history = readings[id];
            return history && history.length > 0 ? history[history.length - 1] : {
                device_id: id,
                status: 'PROVISIONING',
                temperature: 0,
                humidity: 0,
                cooling_active: false,
                timestamp: new Date().toISOString()
            } as TelemetryReading;
        });
    }, [readings]);

    const columns = [
        columnHelper.accessor('device_id', {
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="hover:bg-transparent p-0 font-black text-[10px] uppercase tracking-widest text-slate-500">
                    Node ID <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            ),
            cell: info => <span className="font-black text-white">{info.getValue()}</span>,
        }),
        columnHelper.accessor('status', {
            header: 'Condition',
            cell: info => {
                const status = info.getValue() as string;
                const isOnline = status === 'ONLINE';
                return (
                    <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest",
                        isOnline ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    )}>
                        <div className={cn("w-1 h-1 rounded-full", isOnline ? "bg-emerald-500" : "bg-rose-500")} />
                        {status}
                    </div>
                );
            },
        }),
        columnHelper.accessor('temperature', {
            header: 'Thermal',
            cell: info => (
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "font-mono font-bold text-sm",
                        (info.getValue() || 0) > 80 ? "text-rose-400" : "text-slate-300"
                    )}>
                        {(info.getValue() || 0).toFixed(1)}°C
                    </span>
                    <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full transition-all duration-500", info.getValue() > 80 ? "bg-rose-500" : "bg-primary")}
                            style={{ width: `${Math.min(info.getValue(), 100)}%` }}
                        />
                    </div>
                </div>
            ),
        }),
        columnHelper.accessor('humidity', {
            header: 'Atmospheric',
            cell: info => <span className="font-mono text-slate-400">{(info.getValue() || 0).toFixed(1)}% RH</span>,
        }),
        columnHelper.accessor('cooling_active', {
            header: 'System State',
            cell: info => (
                <div className="flex items-center gap-2">
                    {info.getValue() ? (
                        <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                                <Fan className="w-3.5 h-3.5" />
                            </motion.div>
                            Active
                        </div>
                    ) : (
                        <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Idle</span>
                    )}
                </div>
            ),
        }),
        columnHelper.accessor('alert', {
            header: 'Diagnostics',
            cell: info => {
                const alert = info.getValue();
                if (!alert) return <span className="text-emerald-500/40 text-[9px] font-black tracking-widest uppercase">Nominal</span>;
                return (
                    <div className="flex items-center gap-2 text-rose-400 text-[10px] font-bold uppercase leading-tight">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate max-w-[150px]">{alert}</span>
                    </div>
                );
            }
        }),
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <div className="space-y-8 pb-12">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Fleet_Inventory</h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
                        Managing {data.length} provisioned assets across 4 sectors
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-colors group-focus-within:text-primary" />
                        <Input
                            placeholder="Search nodes..."
                            className="pl-10 h-11 w-64 bg-[#0a0f1d] border-white/5 rounded-xl focus:border-primary/50 transition-all placeholder:text-slate-600 font-bold text-sm"
                        />
                    </div>
                    <Button variant="outline" className="h-11 border-white/5 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
                        <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                </div>
            </header>

            <GlassCard className="border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id} className="border-b border-white/5 bg-white/[0.02]">
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id} className="px-6 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-slate-500">
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                    <th className="px-6 py-6" /> {/* Action column header */}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {table.getRowModel().rows.map(row => (
                                <motion.tr
                                    key={row.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={() => {
                                        setInspectedDevice(row.original.device_id);
                                        setIsInspectorOpen(true);
                                    }}
                                    className="group hover:bg-primary/5 transition-colors cursor-pointer"
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="px-6 py-6">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                    <td className="px-6 py-6 text-right">
                                        <Button size="icon" variant="ghost" className="rounded-xl opacity-0 group-hover:opacity-100 transition-all text-slate-500 hover:text-white hover:bg-white/10">
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {data.length === 0 && (
                    <div className="py-24 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mx-auto">
                            <Search className="w-6 h-6 text-slate-600" />
                        </div>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Awaiting cluster synchronization...</p>
                    </div>
                )}
            </GlassCard>

            <InspectorDrawer
                deviceId={inspectedDevice}
                history={inspectedDevice ? readings[inspectedDevice] : []}
                open={isInspectorOpen}
                onOpenChange={setIsInspectorOpen}
            />
        </div>
    );
};
