import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    Info,
    ShieldAlert,
    X,
    Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/context/NotificationContext';

interface NotificationItemProps {
    notification: Notification;
    onClose: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
    const { type, title, message, deviceId } = notification;

    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        info: <Info className="w-5 h-5 text-cyan-400" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        critical: <ShieldAlert className="w-5 h-5 text-rose-500" />
    };

    const styles = {
        info: "before:bg-cyan-500/20",
        warning: "before:bg-amber-500/20",
        critical: "before:bg-rose-500/40 border-rose-500/20 shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)]"
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={cn(
                "pointer-events-auto relative overflow-hidden flex items-start gap-4 p-5 rounded-3xl border border-white/5 bg-slate-950/80 backdrop-blur-2xl transition-all",
                "before:absolute before:inset-0 before:-z-10 before:opacity-10",
                styles[type]
            )}
        >
            <div className={cn(
                "p-3 rounded-2xl bg-black/40 border border-white/5",
                type === 'critical' && "animate-pulse"
            )}>
                {icons[type]}
            </div>

            <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-white">{title}</h4>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {deviceId && (
                    <div className="flex items-center gap-1.5 mb-1">
                        <Cpu className="w-3 h-3 text-slate-500" />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">NODE: {deviceId}</span>
                    </div>
                )}

                <p className="text-[10px] font-medium text-slate-400 leading-relaxed uppercase tracking-tight">
                    {message}
                </p>
            </div>

            {/* Progress Bar (Auto-dismiss timer) */}
            <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
                className={cn(
                    "absolute bottom-0 left-0 h-0.5 opacity-40",
                    type === 'info' ? "bg-cyan-500" : type === 'warning' ? "bg-amber-500" : "bg-rose-500"
                )}
            />
        </motion.div>
    );
};
