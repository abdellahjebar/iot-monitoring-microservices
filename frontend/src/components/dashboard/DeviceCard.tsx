import { useState, type FC } from 'react';
import { Thermometer, Droplets, AlertTriangle, Snowflake, Fan } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { deviceService } from '../../services/api';

interface DeviceCardProps {
    deviceId: string;
    status: string;
    temperature: number;
    humidity: number;
    coolingActive: boolean;
    alert?: string;
    lastUpdate: string;
}

export const DeviceCard: FC<DeviceCardProps> = ({
    deviceId,
    status,
    temperature,
    humidity,
    coolingActive,
    alert,
    lastUpdate,
}) => {
    const isOnline = status === 'ONLINE';
    const hasAlert = !!alert;
    const [isCommanding, setIsCommanding] = useState(false);

    const toggleCooling = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsCommanding(true);
        try {
            const nextAction = coolingActive ? "COOLING_OFF" : "COOLING_ON";
            await deviceService.sendCommand(deviceId, nextAction);
        } catch (err) {
            console.error("Failed to send command:", err);
        } finally {
            setIsCommanding(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className={clsx(
                "glass p-5 rounded-3xl transition-all duration-500 relative overflow-hidden group border border-white/5",
                hasAlert && !coolingActive && "border-red-500/30 shadow-2xl shadow-red-500/10",
                coolingActive && "border-cyan-400/40 shadow-2xl shadow-cyan-500/20"
            )}
        >
            {/* Animated Background Frost */}
            <AnimatePresence>
                {coolingActive && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none"
                    >
                        <motion.div
                            animate={{
                                rotate: 360,
                                scale: [1, 1.1, 1],
                            }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-10 -right-10 opacity-10"
                        >
                            <Snowflake className="w-40 h-40 text-cyan-200" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="space-y-1">
                    <h3 className="text-lg font-black text-white tracking-widest uppercase flex items-center gap-2">
                        {deviceId}
                        {coolingActive && (
                            <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <Fan className="w-3 h-3 text-cyan-400" />
                            </motion.span>
                        )}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        <p className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase">{lastUpdate}</p>
                    </div>
                </div>

                <div className={clsx(
                    "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border transition-colors",
                    isOnline ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                )}>
                    {status}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 relative z-10 mb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                        <Thermometer className={clsx("w-3.5 h-3.5", coolingActive ? "text-cyan-400" : "text-primary")} />
                        Temp
                    </div>
                    <motion.p
                        key={temperature}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        className={clsx("text-3xl font-black font-mono tracking-tighter transition-colors", coolingActive && "text-cyan-400")}
                    >
                        {temperature}<span className="text-sm opacity-50">°C</span>
                    </motion.p>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                        <Droplets className="w-3.5 h-3.5 text-secondary" />
                        Humid
                    </div>
                    <p className="text-3xl font-black font-mono tracking-tighter">
                        {humidity}<span className="text-sm opacity-50">%</span>
                    </p>
                </div>
            </div>

            {/* Action Area */}
            <div className="relative z-10 space-y-4">
                <button
                    disabled={!isOnline || isCommanding}
                    onClick={toggleCooling}
                    className={clsx(
                        "w-full group/btn relative py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all overflow-hidden border",
                        coolingActive
                            ? "bg-cyan-500 text-black border-cyan-400 active:scale-95"
                            : "bg-white/5 text-gray-400 border-white/5 hover:border-cyan-500/40 hover:text-cyan-400 active:scale-95"
                    )}
                >
                    <div className="relative z-10 flex items-center justify-center gap-3">
                        <motion.div
                            animate={coolingActive ? { rotate: 360 } : {}}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            <Fan className="w-4 h-4" />
                        </motion.div>
                        {isCommanding ? 'Establishing Link...' : coolingActive ? 'Active Cooling' : 'Initialize Fan'}
                    </div>
                    {/* Hover Glow */}
                    {!coolingActive && <div className="absolute inset-0 bg-cyan-500/0 group-hover/btn:bg-cyan-500/5 transition-colors" />}
                </button>

                {hasAlert && !coolingActive && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
                    >
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">{alert}</span>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};
