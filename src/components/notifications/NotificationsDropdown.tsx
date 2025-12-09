'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
    Bell,
    Check,
    CheckCheck,
    ShoppingCart,
    CreditCard,
    Package,
    Truck,
    AlertCircle,
    Info,
    CheckCircle,
    AlertTriangle,
    X,
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
    info: 'text-blue-600 bg-blue-100',
    success: 'text-emerald-600 bg-emerald-100',
    warning: 'text-amber-600 bg-amber-100',
    error: 'text-red-600 bg-red-100',
    action: 'text-purple-600 bg-purple-100',
};

export default function NotificationsDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch notifications
    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/notifications?limit=10');
            const data = await response.json();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true }),
            });
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [id] }),
            });
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
            setUnreadCount(Math.max(0, unreadCount - 1));
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        return date.toLocaleDateString('ar-EG');
    };

    return (
        <div ref={dropdownRef} className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute left-0 mt-2 w-96 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-2">
                            <Bell size={18} className="text-primary" />
                            <h3 className="font-semibold">الإشعارات</h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                                    {unreadCount} جديد
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                                <CheckCheck size={14} />
                                قراءة الكل
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-8 text-center">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell size={32} className="mx-auto text-muted-foreground/50 mb-2" />
                                <p className="text-muted-foreground text-sm">لا توجد إشعارات</p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const Icon = typeIcons[notification.type] || Info;
                                const colorClass = typeColors[notification.type] || typeColors.info;

                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "flex gap-3 p-4 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer",
                                            !notification.is_read && "bg-primary/5"
                                        )}
                                        onClick={() => !notification.is_read && markAsRead(notification.id)}
                                    >
                                        {/* Icon */}
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", colorClass)}>
                                            <Icon size={18} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className={cn("font-medium text-sm", !notification.is_read && "font-semibold")}>
                                                    {notification.title}
                                                </h4>
                                                {!notification.is_read && (
                                                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                            {notification.message && (
                                                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {getTimeAgo(notification.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-border bg-muted/30">
                        <Link
                            href="/dashboard/notifications"
                            className="block text-center text-sm text-primary hover:underline"
                            onClick={() => setIsOpen(false)}
                        >
                            عرض كل الإشعارات
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
