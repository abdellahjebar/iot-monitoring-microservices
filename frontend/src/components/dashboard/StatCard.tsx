import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: string;
        positive: boolean;
    };
    variant?: 'default' | 'success' | 'warning' | 'error';
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon: Icon,
    description,
    trend,
    variant = 'default'
}) => {
    const variantStyles = {
        default: 'text-cyan',
        success: 'text-success',
        warning: 'text-warning',
        error: 'text-error',
    };

    return (
        <div className="card group">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", variantStyles[variant])} />
                    <span className="label-uppercase">{title}</span>
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 text-caption font-medium",
                        trend.positive ? "text-success" : "text-error"
                    )}>
                        {trend.positive ? (
                            <TrendingUp className="w-3 h-3" />
                        ) : (
                            <TrendingDown className="w-3 h-3" />
                        )}
                        <span>{trend.value}</span>
                    </div>
                )}
            </div>

            {/* Value */}
            <div className="metric-value mb-1">
                {value}
            </div>

            {/* Description */}
            {description && (
                <p className="text-body-sm text-text-tertiary">{description}</p>
            )}
        </div>
    );
};
