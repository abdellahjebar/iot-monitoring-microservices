import type { FC } from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Cpu, Activity } from 'lucide-react';
import { deviceService } from '../../services/api';

interface RegisterDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const RegisterDeviceModal: FC<RegisterDeviceModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [deviceId, setDeviceId] = useState('');
    const [type, setType] = useState('Sensor');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await deviceService.register(deviceId, type);
            onSuccess();
            onClose();
            setDeviceId('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to register device');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl pointer-events-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-white">Add Device</h2>
                                    <p className="text-neutral-500 text-sm">Expand your fleet</p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-neutral-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Device ID</label>
                                    <div className="relative group">
                                        <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600 group-focus-within:text-cyan-400 transition-colors" />
                                        <input
                                            type="text"
                                            value={deviceId}
                                            onChange={(e) => setDeviceId(e.target.value)}
                                            placeholder="e.g. sim_device_001"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-neutral-600 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-neutral-500 pl-1">Use an ID from your simulator logs (e.g. sim_device_001)</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Device Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Sensor', 'Gateway', 'Actuator', 'Camera'].map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setType(t)}
                                                className={`py-3 rounded-xl text-sm font-medium border transition-all ${type === t
                                                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                                                    : 'bg-white/5 border-transparent text-neutral-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2">
                                        <Activity className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 rounded-xl mt-4 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:grayscale"
                                >
                                    {isSubmitting ? (
                                        'Registering...'
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5" />
                                            Register Device
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
