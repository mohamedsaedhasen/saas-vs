'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Shield,
    AlertTriangle,
    AlertCircle,
    Info,
    Zap,
    Key,
    UserCog,
    Lock,
    Download,
    Trash2,
    ArrowRight,
    RefreshCw,
    Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecurityLog {
    id: string;
    user_id?: string;
    user_name?: string;
    event_type: string;
    description?: string;
    resource_type?: string;
    resource_id?: string;
    ip_address?: string;
    old_value?: Record<string, unknown>;
    new_value?: Record<string, unknown>;
    severity: string;
    created_at: string;
}

const severityColors = {
    low: 'bg-slate-100 text-slate-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-amber-100 text-amber-700',
    critical: 'bg-red-100 text-red-700',
};

const severityLabels = {
    low: 'منخفض',
    medium: 'متوسط',
    high: 'عالي',
    critical: 'حرج',
};

const eventIcons: Record<string, typeof Key> = {
    password_change: Key,
    role_change: UserCog,
    permission_change: Lock,
    data_export: Download,
    bulk_delete: Trash2,
    suspicious_activity: AlertTriangle,
};

const eventLabels: Record<string, string> = {
    password_change: 'تغيير كلمة المرور',
    email_change: 'تغيير البريد',
    phone_change: 'تغيير الهاتف',
    '2fa_enabled': 'تفعيل التحقق الثنائي',
    '2fa_disabled': 'إلغاء التحقق الثنائي',
    role_change: 'تغيير الدور',
    permission_change: 'تغيير الصلاحيات',
    data_export: 'تصدير بيانات',
    bulk_delete: 'حذف جماعي',
    settings_change: 'تغيير الإعدادات',
    api_key_generated: 'إنشاء مفتاح API',
    api_key_revoked: 'إلغاء مفتاح API',
    suspicious_activity: 'نشاط مشبوه',
};

export default function SecurityLogsPage() {
    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [severityFilter, setSeverityFilter] = useState<string>('all');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await fetch('/api/logs/security?limit=100');
            const data = await response.json();
            setLogs(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLogs = severityFilter === 'all'
        ? logs
        : logs.filter(l => l.severity === severityFilter);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Stats by severity
    const criticalCount = logs.filter(l => l.severity === 'critical').length;
    const highCount = logs.filter(l => l.severity === 'high').length;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings" className="p-2 hover:bg-muted rounded-lg">
                    <ArrowRight size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="text-primary" size={24} />
                        سجل الأمان
                    </h1>
                    <p className="text-muted-foreground">تتبع الأحداث الأمنية المهمة</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-lg transition-colors"
                >
                    <RefreshCw size={16} />
                    تحديث
                </button>
            </div>

            {/* Alert if critical events */}
            {criticalCount > 0 && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertTriangle className="text-red-600" size={20} />
                    <div>
                        <p className="font-medium text-red-800">تنبيه أمني</p>
                        <p className="text-sm text-red-600">
                            يوجد {criticalCount} حدث أمني حرج يتطلب المراجعة
                        </p>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['low', 'medium', 'high', 'critical'] as const).map((severity) => {
                    const count = logs.filter(l => l.severity === severity).length;
                    return (
                        <button
                            key={severity}
                            onClick={() => setSeverityFilter(severity)}
                            className={cn(
                                "p-4 rounded-xl border transition-all",
                                severityFilter === severity
                                    ? "ring-2 ring-primary border-primary"
                                    : "border-border hover:border-primary/50"
                            )}
                        >
                            <div className={cn("inline-flex px-2 py-1 rounded-full text-xs font-medium mb-2", severityColors[severity])}>
                                {severityLabels[severity]}
                            </div>
                            <p className="text-2xl font-bold">{count}</p>
                        </button>
                    );
                })}
            </div>

            {/* Filter Reset */}
            {severityFilter !== 'all' && (
                <button
                    onClick={() => setSeverityFilter('all')}
                    className="text-sm text-primary hover:underline"
                >
                    إظهار الكل
                </button>
            )}

            {/* Logs List */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Shield size={32} className="mx-auto mb-2 opacity-50" />
                            <p>لا توجد أحداث أمنية</p>
                        </div>
                    ) : (
                        filteredLogs.map((log) => {
                            const Icon = eventIcons[log.event_type] || Info;

                            return (
                                <div key={log.id} className="flex gap-4 p-4 border-b border-border hover:bg-muted/30">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                        severityColors[log.severity as keyof typeof severityColors]
                                    )}>
                                        <Icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="font-medium text-sm">
                                                    {eventLabels[log.event_type] || log.event_type}
                                                </span>
                                                <span className={cn(
                                                    "mr-2 px-2 py-0.5 text-xs rounded-full",
                                                    severityColors[log.severity as keyof typeof severityColors]
                                                )}>
                                                    {severityLabels[log.severity as keyof typeof severityLabels]}
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDate(log.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {log.description}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            {log.user_name && (
                                                <span>المستخدم: {log.user_name}</span>
                                            )}
                                            {log.ip_address && (
                                                <span>IP: <code className="bg-muted px-1 rounded">{log.ip_address}</code></span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
