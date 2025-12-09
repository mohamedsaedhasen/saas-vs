'use client';

import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import {
    Activity,
    User,
    Calendar,
    Filter,
    Search,
    ChevronLeft,
    ChevronRight,
    FileEdit,
    Trash2,
    Plus,
    Eye,
    LogIn,
    LogOut,
    Download
} from 'lucide-react';

interface ActivityLog {
    id: string;
    user_name: string;
    user_email: string;
    action: string;
    module: string;
    resource_type: string;
    resource_name: string;
    details: Record<string, any>;
    created_at: string;
}

const actionIcons: Record<string, any> = {
    create: Plus,
    update: FileEdit,
    delete: Trash2,
    view: Eye,
    login: LogIn,
    logout: LogOut,
    export: Download,
};

const actionColors: Record<string, string> = {
    create: 'bg-green-100 text-green-700',
    update: 'bg-blue-100 text-blue-700',
    delete: 'bg-red-100 text-red-700',
    view: 'bg-gray-100 text-gray-700',
    login: 'bg-purple-100 text-purple-700',
    logout: 'bg-orange-100 text-orange-700',
    export: 'bg-yellow-100 text-yellow-700',
};

const actionLabels: Record<string, string> = {
    create: 'إنشاء',
    update: 'تعديل',
    delete: 'حذف',
    view: 'عرض',
    login: 'تسجيل دخول',
    logout: 'تسجيل خروج',
    export: 'تصدير',
};

const moduleLabels: Record<string, string> = {
    sales: 'المبيعات',
    purchases: 'المشتريات',
    inventory: 'المخزون',
    products: 'المنتجات',
    customers: 'العملاء',
    suppliers: 'الموردين',
    accounting: 'المحاسبة',
    shipping: 'الشحن',
    settings: 'الإعدادات',
    users: 'المستخدمين',
    auth: 'المصادقة',
};

export default function ActivityLogsPage() {
    const { company } = useCompany();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModule, setFilterModule] = useState('all');
    const [filterAction, setFilterAction] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        loadLogs();
    }, [company?.id, page, filterModule, filterAction]);

    const loadLogs = async () => {
        if (!company?.id) return;
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                company_id: company.id,
                page: page.toString(),
                limit: '20',
            });
            if (filterModule !== 'all') params.append('module', filterModule);
            if (filterAction !== 'all') params.append('action', filterAction);

            const response = await fetch(`/api/activity-logs?${params}`);
            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs || []);
                setTotalPages(data.totalPages || 1);
            }
        } catch (error) {
            console.error('Error loading logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.resource_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        if (hours < 24) return `منذ ${hours} ساعة`;
        if (days < 7) return `منذ ${days} يوم`;
        return d.toLocaleDateString('ar-EG');
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Activity className="w-6 h-6" />
                    سجل الأنشطة
                </h1>
                <p className="text-muted-foreground">تتبع جميع الأنشطة والتغييرات في النظام</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="بحث بالاسم أو المورد..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                <select
                    value={filterModule}
                    onChange={(e) => setFilterModule(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                    <option value="all">كل الأقسام</option>
                    {Object.entries(moduleLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>

                <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                    <option value="all">كل الإجراءات</option>
                    {Object.entries(actionLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
            </div>

            {/* Activity List */}
            <div className="bg-card rounded-xl border overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">
                        جاري التحميل...
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        لا توجد أنشطة
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredLogs.map((log) => {
                            const ActionIcon = actionIcons[log.action] || Activity;
                            return (
                                <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-start gap-4">
                                        {/* Action Icon */}
                                        <div className={`p-2 rounded-lg ${actionColors[log.action] || 'bg-gray-100'}`}>
                                            <ActionIcon className="w-5 h-5" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium">{log.user_name}</span>
                                                <span className="text-muted-foreground">قام بـ</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionColors[log.action]}`}>
                                                    {actionLabels[log.action] || log.action}
                                                </span>
                                                {log.resource_name && (
                                                    <>
                                                        <span className="text-muted-foreground">:</span>
                                                        <span className="font-medium truncate">{log.resource_name}</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(log.created_at)}
                                                </span>
                                                {log.module && (
                                                    <span className="flex items-center gap-1">
                                                        قسم: {moduleLabels[log.module] || log.module}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Time */}
                                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleTimeString('ar-EG', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg hover:bg-muted disabled:opacity-50"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <span className="px-4 py-2">
                        صفحة {page} من {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-lg hover:bg-muted disabled:opacity-50"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
