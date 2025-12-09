'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Shield,
    Monitor,
    Smartphone,
    Tablet,
    LogIn,
    LogOut,
    AlertCircle,
    CheckCircle,
    XCircle,
    MapPin,
    Clock,
    ArrowRight,
    RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoginLog {
    id: string;
    user_id?: string;
    user_email?: string;
    user_name?: string;
    event_type: string;
    status: string;
    failure_reason?: string;
    ip_address?: string;
    user_agent?: string;
    device_type?: string;
    browser?: string;
    os?: string;
    country?: string;
    city?: string;
    created_at: string;
}

const deviceIcons = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Tablet,
};

const eventLabels: Record<string, string> = {
    login: 'تسجيل دخول',
    logout: 'تسجيل خروج',
    login_failed: 'محاولة فاشلة',
    password_reset: 'إعادة تعيين كلمة المرور',
    token_refresh: 'تجديد الجلسة',
};

export default function LoginHistoryPage() {
    const [logs, setLogs] = useState<LoginLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await fetch('/api/logs/login?limit=100');
            const data = await response.json();
            setLogs(data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        if (filter === 'all') return true;
        return log.status === filter;
    });

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

    // Stats
    const successCount = logs.filter(l => l.status === 'success').length;
    const failedCount = logs.filter(l => l.status === 'failed').length;
    const uniqueIPs = new Set(logs.map(l => l.ip_address)).size;

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
                        سجل تسجيل الدخول
                    </h1>
                    <p className="text-muted-foreground">تتبع جميع عمليات تسجيل الدخول والخروج</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-lg transition-colors"
                >
                    <RefreshCw size={16} />
                    تحديث
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <LogIn size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{logs.length}</p>
                            <p className="text-sm text-muted-foreground">إجمالي العمليات</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{successCount}</p>
                            <p className="text-sm text-muted-foreground">ناجحة</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                            <XCircle size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{failedCount}</p>
                            <p className="text-sm text-muted-foreground">فاشلة</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{uniqueIPs}</p>
                            <p className="text-sm text-muted-foreground">عناوين IP مختلفة</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                {(['all', 'success', 'failed'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            filter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                    >
                        {f === 'all' ? 'الكل' : f === 'success' ? 'ناجحة' : 'فاشلة'}
                    </button>
                ))}
            </div>

            {/* Logs Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-right py-3 px-4 text-sm font-medium">المستخدم</th>
                            <th className="text-right py-3 px-4 text-sm font-medium">الحدث</th>
                            <th className="text-right py-3 px-4 text-sm font-medium">الجهاز</th>
                            <th className="text-right py-3 px-4 text-sm font-medium">IP</th>
                            <th className="text-right py-3 px-4 text-sm font-medium">التوقيت</th>
                            <th className="text-center py-3 px-4 text-sm font-medium">الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                                </td>
                            </tr>
                        ) : filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                    لا توجد سجلات
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map((log) => {
                                const DeviceIcon = deviceIcons[log.device_type as keyof typeof deviceIcons] || Monitor;

                                return (
                                    <tr key={log.id} className="border-t border-border hover:bg-muted/30">
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-sm">{log.user_name || 'غير معروف'}</div>
                                            <div className="text-xs text-muted-foreground">{log.user_email}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm">
                                                {eventLabels[log.event_type] || log.event_type}
                                            </span>
                                            {log.failure_reason && (
                                                <div className="text-xs text-red-500 mt-0.5">
                                                    {log.failure_reason}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <DeviceIcon size={16} className="text-muted-foreground" />
                                                <div>
                                                    <div className="text-sm">{log.browser || 'غير معروف'}</div>
                                                    <div className="text-xs text-muted-foreground">{log.os}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <code className="text-sm bg-muted px-2 py-0.5 rounded">
                                                {log.ip_address || 'N/A'}
                                            </code>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Clock size={14} />
                                                {formatDate(log.created_at)}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {log.status === 'success' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                                                    <CheckCircle size={12} />
                                                    نجاح
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                                    <XCircle size={12} />
                                                    فشل
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
