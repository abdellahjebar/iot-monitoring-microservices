import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { loginSchema, type LoginFormValues } from '@/types/auth';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import { Mail, Lock, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema) as any,
        defaultValues: {
            email: '',
            password: '',
        }
    });

    const onSubmit = async (data: LoginFormValues) => {
        setServerError(null);
        try {
            const response = await api.post('/auth/auth', data);
            const { token, payload } = response.data;

            login(token, {
                email: payload.sub,
                is_admin: payload.role
            });

            navigate('/');
        } catch (err: any) {
            setServerError(
                err.response?.data?.detail ||
                'Access denied. Please verify your credentials.'
            );
        }
    };

    return (
        <div className="min-h-screen bg-bg-0 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] bg-cyan/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] bg-cyan/5 blur-[120px] rounded-full" />
            </div>

            {/* Login Card */}
            <div className="w-full max-w-md z-10 animate-fade-in">
                <div className="card bg-bg-1/80 backdrop-blur-xl border-border-subtle p-8 md:p-10">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-8 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-cyan-soft border border-cyan/20 flex items-center justify-center mb-6">
                            <ShieldCheck className="w-8 h-8 text-cyan" />
                        </div>
                        <h1 className="text-h1 text-text-primary mb-2">Fleet Console</h1>
                        <p className="text-body text-text-secondary">
                            Secure access to IoT monitoring system
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email Field */}
                        <div>
                            <label className="label-uppercase mb-2 block">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-cyan transition-colors" />
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder="operator@nexus.io"
                                    className={cn(
                                        "w-full h-12 pl-11 pr-4 rounded-lg bg-bg-2 border border-border-subtle text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan transition-colors",
                                        errors.email && "border-error focus:border-error"
                                    )}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-body-sm text-error mt-2">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="label-uppercase mb-2 block">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-cyan transition-colors" />
                                <input
                                    {...register('password')}
                                    type="password"
                                    placeholder="••••••••"
                                    className={cn(
                                        "w-full h-12 pl-11 pr-4 rounded-lg bg-bg-2 border border-border-subtle text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan transition-colors",
                                        errors.password && "border-error focus:border-error"
                                    )}
                                />
                            </div>
                            {errors.password && (
                                <p className="text-body-sm text-error mt-2">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Server Error */}
                        {serverError && (
                            <div className="p-3 bg-error-soft border border-error/20 rounded-lg text-error text-body-sm text-center animate-fade-in">
                                {serverError}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary w-full h-12 justify-center"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-border-subtle text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="status-dot status-dot-online" />
                            <span className="text-caption font-mono text-text-tertiary">
                                GATEWAY_ACTIVE v2.4.0
                            </span>
                        </div>
                        <p className="text-caption text-text-tertiary">
                            Secured by enterprise-grade authentication
                        </p>
                    </div>
                </div>

                {/* Bottom Text */}
                <p className="text-center mt-6 text-caption text-text-tertiary">
                    Authorized personnel only
                </p>
            </div>
        </div>
    );
};
