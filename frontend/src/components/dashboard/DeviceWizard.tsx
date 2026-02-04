import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { deviceCreateSchema, type DeviceCreateValues } from '@/types/device';
import { deviceService } from '@/services/api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Cpu,
    ShieldCheck,
    ChevronRight,
    ChevronLeft,
    Loader2,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeviceWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export const DeviceWizard = ({ open, onOpenChange, onSuccess }: DeviceWizardProps) => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<DeviceCreateValues>({
        resolver: zodResolver(deviceCreateSchema) as any,
        defaultValues: {
            device_id: '',
            category: 'SENSOR',
            location: 'Casablanca',
            simulation_config: {
                is_active: true,
                temp_min: 20,
                temp_max: 35,
                humidity_min: 40,
                humidity_max: 60,
                update_interval: 5,
            }
        },
        mode: 'onChange'
    });

    const onSubmit = async (data: DeviceCreateValues) => {
        setIsSubmitting(true);
        try {
            // Map frontend fields (device_id, category) to backend naming (name, type)
            const backendPayload = {
                name: data.device_id,
                type: data.category,
                location: data.location,
                simulation_config: data.simulation_config
            };

            await deviceService.createDevice(backendPayload);

            form.reset();
            setStep(1);
            onOpenChange(false);
            onSuccess?.();
        } catch (error) {
            console.error('Device creation failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };


    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                            <Cpu className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle>Nexus_Provision_Wizard</DialogTitle>
                            <DialogDescription>Step {step} of 3: {step === 1 ? 'Node Authentication' : step === 2 ? 'Simulation Matrix' : 'Final Verification'}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-6 min-h-[300px]">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unique Node ID</label>
                                        <Input
                                            {...form.register('device_id')}
                                            placeholder="e.g. CORE_NODE_01"
                                            className="h-12 bg-black/40 border-white/5"
                                        />
                                        {form.formState.errors.device_id && (
                                            <p className="text-[10px] text-rose-500 font-bold uppercase">{form.formState.errors.device_id.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Asset Category</label>
                                        <Select
                                            onValueChange={(v) => form.setValue('category', v as "SENSOR" | "GATEWAY" | "ACTUATOR")}
                                            defaultValue={form.getValues('category')}
                                        >
                                            <SelectTrigger className="h-12 bg-black/40 border-white/5">
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SENSOR">Sensor Node</SelectItem>
                                                <SelectItem value="GATEWAY">Network Gateway</SelectItem>
                                                <SelectItem value="ACTUATOR">Control Actuator</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Geo-Location (Weather Source)</label>
                                        <Select
                                            onValueChange={(v) => form.setValue('location', v)}
                                            defaultValue={form.getValues('location')}
                                        >
                                            <SelectTrigger className="h-12 bg-black/40 border-white/5">
                                                <SelectValue placeholder="Select City" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Casablanca">Casablanca (Coastal)</SelectItem>
                                                <SelectItem value="Rabat">Rabat (Coastal)</SelectItem>
                                                <SelectItem value="Marrakech">Marrakech (Inland)</SelectItem>
                                                <SelectItem value="Fes">Fes (Inland)</SelectItem>
                                                <SelectItem value="Tanger">Tanger (Northern)</SelectItem>
                                                <SelectItem value="Laayoune">Laayoune (Southern)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Min Temp (°C)</label>
                                        <Input
                                            type="number"
                                            {...form.register('simulation_config.temp_min', { valueAsNumber: true })}
                                            className="h-12 bg-black/40 border-white/5"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Max Temp (°C)</label>
                                        <Input
                                            type="number"
                                            {...form.register('simulation_config.temp_max', { valueAsNumber: true })}
                                            className="h-12 bg-black/40 border-white/5"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Zap className="w-4 h-4 text-primary" />
                                        <span className="text-xs font-bold text-slate-300">Live Virtual Twin Simulation</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        {...form.register('simulation_config.is_active')}
                                        className="w-5 h-5 rounded-md bg-black/40 border-white/10 text-primary focus:ring-primary/20"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 space-y-4">
                                    <div className="flex items-center gap-3 text-emerald-400">
                                        <ShieldCheck className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Protocol Validated</span>
                                    </div>
                                    <div className="space-y-2 border-t border-white/5 pt-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Target ID: <span className="text-white">{form.watch('device_id')}</span></p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Class: <span className="text-white">{form.watch('category')}</span></p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Telemetry: <span className="text-emerald-500">Ready</span></p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <DialogFooter className="border-t border-white/5 pt-6">
                    {step > 1 && (
                        <Button variant="ghost" onClick={prevStep} className="mr-auto rounded-xl uppercase font-black text-[10px] tracking-widest text-slate-500">
                            <ChevronLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                    )}

                    {step < 3 ? (
                        <Button
                            onClick={nextStep}
                            disabled={step === 1 && !form.watch('device_id')}
                            className="rounded-xl px-8 h-12 uppercase font-black text-[10px] tracking-widest"
                        >
                            Continue <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={() => form.handleSubmit(onSubmit)()}
                            disabled={isSubmitting}
                            className="rounded-xl px-8 h-12 bg-primary text-black hover:bg-primary/90 shadow-lg shadow-primary/20 uppercase font-black text-[10px] tracking-widest"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                            Initialize Node
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
