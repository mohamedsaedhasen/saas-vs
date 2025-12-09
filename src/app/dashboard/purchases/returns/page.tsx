'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    Download,
    ArrowLeftRight,
    Clock,
    Package,
    Eye,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PurchaseReturn {
    id: string;
    return_number: string;
    return_date: string;
    original_invoice?: string;
    supplier_name?: string;
    reason?: string;
    items_count?: number;
    total: number;
    status: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'قيد المراجعة', color: 'amber' },
    approved: { label: 'معتمد', color: 'blue' },
    completed: { label: 'مكتمل', color: 'emerald' },
    rejected: { label: 'مرفوض', color: 'red' },
};

export default function PurchaseReturnsPage() {
    const [returns, setReturns] = useState<PurchaseReturn[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function fetchReturns() {
            try {
                setIsLoading(true);
                const res = await fetch('/api/purchases/returns');
                const data = await res.json();

                if (Array.isArray(data)) {
                    setReturns(data);
                } else if (data && Array.isArray(data.data)) {
                    setReturns(data.data);
                } else if (!res.ok) {
                    throw new Error(data.error || 'فشل في جلب المرتجعات');
                } else {
                    setReturns([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
                setReturns([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchReturns();
    }, []);

    const filteredReturns = returns.filter((ret) => {
        if (searchTerm && !ret.return_number?.includes(searchTerm) && !ret.supplier_name?.includes(searchTerm)) {
            return false;
        }
        return true;
    });

    const stats = {
        total: returns.length,
        pending: returns.filter(r => r.status === 'pending').length,
        totalAmount: returns.reduce((sum, r) => sum + (r.total || 0), 0),
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">خطأ في تحميل البيانات</h2>
                <p className="text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Link href="/dashboard/purchases" className="hover:text-primary">المشتريات</Link>
                        <span>/</span>
                        <span className="text-foreground">المرتجعات</span>
                    </div>
                    <h1 className="text-2xl font-bold">مرتجعات المشتريات</h1>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted">
                        <Download size={16} />
                        تصدير
                    </button>
                    <Link
                        href="/dashboard/purchases/returns/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                    >
                        <Plus size={18} />
                        مرتجع جديد
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">المرتجعات</span>
                        <ArrowLeftRight size={16} className="text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">قيد المراجعة</span>
                        <Clock size={16} className="text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">إجمالي المبالغ</span>
                        <Package size={16} className="text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">{stats.totalAmount.toLocaleString('ar-EG')}</div>
                </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                    type="text"
                    placeholder="بحث برقم المرتجع أو المورد..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 bg-card border border-border rounded-lg focus:border-primary outline-none"
                />
            </div>

            {/* Empty State */}
            {filteredReturns.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ArrowLeftRight className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد مرتجعات</h3>
                    <p className="text-muted-foreground mb-4">لم يتم تسجيل أي مرتجعات بعد</p>
                </div>
            )}

            {/* Table */}
            {filteredReturns.length > 0 && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-right py-3 px-4 font-medium text-sm">رقم المرتجع</th>
                                <th className="text-right py-3 px-4 font-medium text-sm">التاريخ</th>
                                <th className="text-right py-3 px-4 font-medium text-sm">الفاتورة الأصلية</th>
                                <th className="text-right py-3 px-4 font-medium text-sm">المورد</th>
                                <th className="text-right py-3 px-4 font-medium text-sm">السبب</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">المبلغ</th>
                                <th className="text-center py-3 px-4 font-medium text-sm">الحالة</th>
                                <th className="text-center py-3 px-4 font-medium text-sm">عرض</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReturns.map((ret) => (
                                <tr key={ret.id} className="border-b border-border/50 hover:bg-muted/30">
                                    <td className="py-3 px-4 font-medium">{ret.return_number}</td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                        {ret.return_date ? new Date(ret.return_date).toLocaleDateString('ar-EG') : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-sm font-mono text-primary">{ret.original_invoice || '-'}</td>
                                    <td className="py-3 px-4 text-sm">{ret.supplier_name || '-'}</td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">{ret.reason || '-'}</td>
                                    <td className="py-3 px-4 text-left font-mono font-semibold text-emerald-600">
                                        {(ret.total || 0).toLocaleString('ar-EG')} ج.م
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={cn(
                                            'px-2 py-0.5 rounded-full text-xs font-medium',
                                            `bg-${statusConfig[ret.status]?.color || 'gray'}-100 text-${statusConfig[ret.status]?.color || 'gray'}-700`
                                        )}>
                                            {statusConfig[ret.status]?.label || ret.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary">
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
