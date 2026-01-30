import { useState } from 'react';
import { useTelemetry } from '../../hooks/useTelemetry';
import { DeviceCard } from '../../components/dashboard/DeviceCard';
import { TelemetryChart } from '../../components/dashboard/TelemetryChart';
import { GlobalMap } from '../../components/map/GlobalMap';
import { useAuth } from '../../context/AuthContext';
import { Layout, LayoutDashboard, Settings, User, Bell, LogOut, Map as MapIcon, BarChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Dashboard() {
    const { readings, latestAlert } = useTelemetry(30);
    const [activeDevice, setActiveDevice] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'chart' | 'map'>('chart');
    const { user, logout } = useAuth();

    // Group readings for charting the active device or all combined
    const deviceList = Object.keys(readings).sort();
    const currentDevice = activeDevice || deviceList[0];
    const activeHistory = readings[currentDevice] || [];

    return (
        <div className="flex min-h-screen bg-[#070707] font-sans text-white overflow-hidden">
            {/* Sidebar */}
            <aside className="w-20 lg:w-64 border-r border-white/5 flex flex-col items-center lg:items-start p-4 bg-black/40 backdrop-blur-3xl z-50">
                <div className="flex items-center gap-3 mb-10 px-2 lg:px-4">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
                        <Layout className="w-6 h-6 text-black" />
                    </div>
                    <span className="hidden lg:block font-black text-xl tracking-tighter">
                        ANTIGRAVITY <span className="text-primary font-light text-[10px] block tracking-[0.3em] uppercase opacity-50">Intelligence</span>
                    </span>
                </div>

                <nav className="flex-1 space-y-2 w-full">
                    {[
                        { icon: LayoutDashboard, label: 'Overview', active: true },
                        { icon: Bell, label: 'Incidents' },
                        { icon: Settings, label: 'Preferences' },
                        { icon: User, label: 'Account' },
                    ].map((item, idx) => (
                        <button key={idx} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${item.active ? 'bg-white/5 text-primary border border-white/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                            <item.icon className="w-5 h-5" />
                            <span className="hidden lg:block font-bold text-xs uppercase tracking-widest">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-500/60 hover:text-red-400 hover:bg-red-500/5 transition-all mt-auto border border-transparent hover:border-red-500/20"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="hidden lg:block font-bold text-xs uppercase tracking-widest">Terminate Session</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col p-6 lg:p-10 relative overflow-y-auto custom-scrollbar">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <motion.h1
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="text-4xl font-black tracking-tighter mb-2"
                        >
                            System Command
                        </motion.h1>
                        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-gray-500">
                            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Live Node: <span className="text-white">Global-01</span></span>
                            <span className="opacity-20">|</span>
                            <span>Operator: <span className="text-white">{user?.email}</span></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 p-1 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setViewMode('chart')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'chart' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-white'}`}
                        >
                            <BarChart className="w-4 h-4" />
                            Analytics
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-white'}`}
                        >
                            <MapIcon className="w-4 h-4" />
                            Geospatial
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 flex-1">
                    {/* Visualizer (Chart or Map) */}
                    <div className="xl:col-span-3 space-y-6">
                        <div className="glass rounded-[2rem] border border-white/5 overflow-hidden h-[500px] shadow-2xl relative">
                            <AnimatePresence mode="wait">
                                {viewMode === 'chart' ? (
                                    <motion.div
                                        key="chart"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="h-full"
                                    >
                                        <TelemetryChart
                                            data={activeHistory}
                                            title={currentDevice ? `Streamed Metrics: ${currentDevice}` : 'Awaiting Connection...'}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="map"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="h-full"
                                    >
                                        <GlobalMap
                                            devices={readings}
                                            onDeviceSelect={(id) => {
                                                setActiveDevice(id);
                                                setViewMode('chart');
                                            }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Node Grid */}
                        <div className="space-y-6">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 flex items-center gap-4">
                                Active Node Cluster
                                <div className="flex-1 h-px bg-white/5" />
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                                {deviceList.map((id) => {
                                    const history = readings[id];
                                    const latest = history[history.length - 1];
                                    return (
                                        <div key={id} onClick={() => setActiveDevice(id)} className="cursor-pointer">
                                            <DeviceCard
                                                deviceId={id}
                                                status={latest.status}
                                                temperature={latest.temperature}
                                                humidity={latest.humidity}
                                                coolingActive={latest.cooling_active}
                                                alert={latest.alert}
                                                lastUpdate={latest.timestamp}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Stats */}
                    <div className="space-y-6">
                        <div className="glass p-6 rounded-[2rem] border-white/10 space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">System Health</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Total Nodes</span>
                                    <span className="text-2xl font-black">{deviceList.length}</span>
                                </div>
                                <div className="flex justify-between items-center text-red-500">
                                    <span className="text-xs font-bold uppercase tracking-tighter">Incident Reports</span>
                                    <span className="text-2xl font-black">{deviceList.filter(id => readings[id][readings[id].length - 1].alert).length}</span>
                                </div>
                            </div>
                        </div>

                        {latestAlert && (
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] space-y-2 shadow-2xl shadow-red-500/10"
                            >
                                <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest">
                                    <Bell className="w-4 h-4" /> High Priority Alert
                                </div>
                                <p className="text-red-400 text-sm font-bold">
                                    Node <span className="text-white underline">{latestAlert.device_id}</span> reported {latestAlert.message}.
                                </p>
                                <span className="text-[10px] text-red-500/50 block font-mono">Timestamp: {latestAlert.timestamp}</span>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
