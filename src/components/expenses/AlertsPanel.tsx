'use client';

import React, { useState } from 'react';
import {
    Bell,
    AlertCircle,
    AlertTriangle,
    Clock,
    CheckCircle,
    X,
    ChevronDown,
    Settings,
    Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExpenseAlert, AlertPriority } from '@/types/expenses';

interface AlertsPanelProps {
    alerts: ExpenseAlert[];
    onDismiss: (id: string) => void;
    onMarkRead: (id: string) => void;
    onViewDetails: (alert: ExpenseAlert) => void;
}

const priorityConfig: Record<AlertPriority, { color: string; icon: React.ElementType; label: string }> = {
    critical: { color: 'red', icon: AlertCircle, label: 'حرج' },
    high: { color: 'orange', icon: AlertTriangle, label: 'مرتفع' },
    medium: { color: 'amber', icon: Clock, label: 'متوسط' },
    low: { color: 'blue', icon: Bell, label: 'منخفض' },
};

export function AlertsPanel({ alerts, onDismiss, onMarkRead, onViewDetails }: AlertsPanelProps) {
    const [filter, setFilter] = useState<'all' | 'unread'>('unread');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filteredAlerts = alerts.filter((a) => {
        if (a.is_dismissed) return false;
        if (filter === 'unread' && a.is_read) return false;
        return true;
    });

    const unreadCount = alerts.filter((a) => !a.is_read && !a.is_dismissed).length;

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Bell size={20} className="text-muted-foreground" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <h3 className="font-semibold">التنبيهات</h3>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center border border-border rounded-lg overflow-hidden text-sm">
                        <button
                            onClick={() => setFilter('unread')}
                            className={cn(
                                'px-3 py-1.5 transition-colors',
                                filter === 'unread' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                            )}
                        >
                            غير مقروء
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            className={cn(
                                'px-3 py-1.5 transition-colors',
                                filter === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                            )}
                        >
                            الكل
                        </button>
                    </div>
                </div>
            </div>

            {/* Alerts List */}
            <div className="max-h-96 overflow-y-auto">
                {filteredAlerts.length > 0 ? (
                    <div className="divide-y divide-border">
                        {filteredAlerts.map((alert) => {
                            const config = priorityConfig[alert.priority];
                            const Icon = config.icon;

                            return (
                                <div
                                    key={alert.id}
                                    className={cn(
                                        'p-4 transition-colors',
                                        !alert.is_read && 'bg-muted/30'
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={cn(
                                                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                                config.color === 'red' && 'bg-red-100 text-red-600',
                                                config.color === 'orange' && 'bg-orange-100 text-orange-600',
                                                config.color === 'amber' && 'bg-amber-100 text-amber-600',
                                                config.color === 'blue' && 'bg-blue-100 text-blue-600'
                                            )}
                                        >
                                            <Icon size={16} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium">{alert.title}</span>
                                                {!alert.is_read && (
                                                    <span className="w-2 h-2 bg-primary rounded-full" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                <span>{new Date(alert.created_at).toLocaleDateString('ar-EG')}</span>
                                                <span
                                                    className={cn(
                                                        'px-1.5 py-0.5 rounded',
                                                        config.color === 'red' && 'bg-red-100 text-red-700',
                                                        config.color === 'orange' && 'bg-orange-100 text-orange-700',
                                                        config.color === 'amber' && 'bg-amber-100 text-amber-700',
                                                        config.color === 'blue' && 'bg-blue-100 text-blue-700'
                                                    )}
                                                >
                                                    {config.label}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {!alert.is_read && (
                                                <button
                                                    onClick={() => onMarkRead(alert.id)}
                                                    className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"
                                                    title="تحديد كمقروء"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                            )}
                                            {alert.reference_id && (
                                                <button
                                                    onClick={() => onViewDetails(alert)}
                                                    className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"
                                                    title="عرض التفاصيل"
                                                >
                                                    <ChevronDown size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onDismiss(alert.id)}
                                                className="p-1.5 hover:bg-red-100 rounded-lg text-red-600"
                                                title="تجاهل"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-12 text-center text-muted-foreground">
                        <CheckCircle size={40} className="mx-auto mb-3 opacity-50" />
                        <p>لا توجد تنبيهات جديدة</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ==========================================
// Budget Warnings Component
// ==========================================

interface BudgetWarning {
    category_id: string;
    category_name: string;
    category_code: string;
    budget: number;
    spent: number;
    percentage: number;
}

interface BudgetWarningsProps {
    warnings: BudgetWarning[];
}

export function BudgetWarnings({ warnings }: BudgetWarningsProps) {
    const critical = warnings.filter((w) => w.percentage >= 100);
    const high = warnings.filter((w) => w.percentage >= 80 && w.percentage < 100);

    if (warnings.length === 0) return null;

    return (
        <div className="space-y-3">
            {critical.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle size={18} className="text-red-600" />
                        <span className="font-medium text-red-900">تجاوز الموازنة</span>
                    </div>
                    <div className="space-y-2">
                        {critical.map((w) => (
                            <div key={w.category_id} className="flex items-center justify-between text-sm">
                                <span className="text-red-800">{w.category_name}</span>
                                <span className="font-mono text-red-600">{w.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {high.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={18} className="text-amber-600" />
                        <span className="font-medium text-amber-900">تحذير موازنة (80%+)</span>
                    </div>
                    <div className="space-y-2">
                        {high.map((w) => (
                            <div key={w.category_id} className="flex items-center justify-between text-sm">
                                <span className="text-amber-800">{w.category_name}</span>
                                <span className="font-mono text-amber-600">{w.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
