'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    Filter,
    AlertCircle,
    Info,
    CheckCircle,
    AlertTriangle,
    ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notification, NotificationType } from '@/types/notifications';

const typeIcons: Record<NotificationType, typeof Info> = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
    action: Bell,
};

const typeColors: Record<NotificationType, string> = {
    info: 'text-blue-600 bg-blue-50',
    success: 'text-emerald-600 bg-emerald-50',
    warning: 'text-amber-600 bg-amber-50',
    error: 'text-red-600 bg-red-50',
    action: 'text-purple-600 bg-purple-50',
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications?limit=100');
            const data = await response.json();
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true }),
            });
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.is_read)
        : notifications;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

        if (diffDays === 0) {
            return `اليوم ${date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays === 1) {
            return 'أمس';
        } else if (diffDays < 7) {
            return `منذ ${diffDays} أيام`;
        }
        return date.toLocaleDateString('ar-EG');
    };

    // Group by date
    const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
        const date = new Date(notification.created_at).toLocaleDateString('ar-EG');
        if (!groups[date]) groups[date] = [];
        groups[date].push(notification);
        return groups;
    }, {} as Record<string, Notification[]>);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-muted rounded-lg">
                        <ArrowRight size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Bell className="text-primary" size={24} />
                            الإشعارات
                        </h1>
                        <p className="text-muted-foreground">
                            {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'لا توجد إشعارات جديدة'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors"
                        >
                            <CheckCheck size={16} />
                            قراءة الكل
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        filter === 'all' ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                >
                    الكل ({notifications.length})
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        filter === 'unread' ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                >
                    غير المقروء ({unreadCount})
                </button>
            </div>

            {/* Notifications List */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <Bell size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="font-medium text-lg mb-1">لا توجد إشعارات</h3>
                        <p className="text-muted-foreground text-sm">ستظهر الإشعارات الجديدة هنا</p>
                    </div>
                ) : (
                    Object.entries(groupedNotifications).map(([date, items]) => (
                        <div key={date}>
                            <div className="px-4 py-2 bg-muted/50 text-sm font-medium text-muted-foreground">
                                {date}
                            </div>
                            {items.map((notification) => {
                                const Icon = typeIcons[notification.type] || Info;
                                const colorClass = typeColors[notification.type] || typeColors.info;

                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "flex gap-4 p-4 border-b border-border/50 hover:bg-muted/30 transition-colors",
                                            !notification.is_read && "bg-primary/5"
                                        )}
                                    >
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", colorClass)}>
                                            <Icon size={22} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className={cn("font-medium", !notification.is_read && "font-semibold")}>
                                                    {notification.title}
                                                </h4>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatDate(notification.created_at)}
                                                </span>
                                            </div>
                                            {notification.message && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {notification.message}
                                                </p>
                                            )}
                                        </div>
                                        {!notification.is_read && (
                                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
