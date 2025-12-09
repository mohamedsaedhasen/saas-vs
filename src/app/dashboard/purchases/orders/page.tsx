'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    Download,
    Package,
    DollarSign,
    Clock,
    AlertCircle,
    Eye,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types/purchases';

const statusConfig: Record<PurchaseOrderStatus, { label: string; color: string }> = {
    draft: { label: 'مسودة', color: 'gray' },
    sent: { label: 'مرسل', color: 'blue' },
    confirmed: { label: 'مؤكد', color: 'indigo' },
    partial: { label: 'استلام جزئي', color: 'amber' },
    received: { label: 'تم الاستلام', color: 'purple' },
    completed: { label: 'مكتمل', color: 'emerald' },
    cancelled: { label: 'ملغي', color: 'red' },
};

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<(PurchaseOrder & { supplier_name?: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all');

    useEffect(() => {
        async function fetchOrders() {
            try {
                setIsLoading(true);
                const res = await fetch('/api/purchases/orders');
                const data = await res.json();

                if (Array.isArray(data)) {
                    setOrders(data);
                } else if (data && Array.isArray(data.data)) {
                    setOrders(data.data);
                } else if (!res.ok) {
                    throw new Error(data.error || 'فشل في جلب طلبات الشراء');
                } else {
                    setOrders([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
                setOrders([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchOrders();
    }, []);

    const filteredOrders = orders.filter((order) => {
        if (searchTerm && !order.order_number?.includes(searchTerm) && !order.supplier_name?.includes(searchTerm)) {
            return false;
        }
        if (statusFilter !== 'all' && order.status !== statusFilter) return false;
        return true;
    });

    const stats = {
        total: orders.length,
        totalAmount: orders.reduce((sum, o) => sum + (o.total || 0), 0),
        pending: orders.filter(o => ['draft', 'sent', 'confirmed'].includes(o.status)).length,
        unpaidAmount: orders.reduce((sum, o) => sum + (o.remaining_amount || 0), 0),
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
                        <span className="text-foreground">طلبات الشراء</span>
                    </div>
                    <h1 className="text-2xl font-bold">طلبات الشراء</h1>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted">
                        <Download size={16} />
                        تصدير
                    </button>
                    <Link
                        href="/dashboard/purchases/orders/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                    >
                        <Plus size={18} />
                        طلب جديد
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">الطلبات</span>
                        <Package size={16} className="text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">الإجمالي</span>
                        <DollarSign size={16} className="text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold">{stats.totalAmount.toLocaleString('ar-EG')}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">قيد المعالجة</span>
                        <Clock size={16} className="text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">المستحقات</span>
                        <AlertCircle size={16} className="text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">{stats.unpaidAmount.toLocaleString('ar-EG')}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[250px] relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="بحث برقم الطلب أو اسم المورد..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2.5 bg-card border border-border rounded-lg focus:border-primary outline-none"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as PurchaseOrderStatus | 'all')}
                    className="px-4 py-2.5 bg-card border border-border rounded-lg focus:border-primary outline-none"
                >
                    <option value="all">كل الحالات</option>
                    {Object.entries(statusConfig).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                    ))}
                </select>
            </div>

            {/* Empty State */}
            {filteredOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد طلبات شراء</h3>
                    <p className="text-muted-foreground mb-4">ابدأ بإنشاء طلب شراء جديد</p>
                    <Link
                        href="/dashboard/purchases/orders/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                        <Plus size={18} />
                        طلب جديد
                    </Link>
                </div>
            )}

            {/* Table */}
            {filteredOrders.length > 0 && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-right py-3 px-4 font-medium text-sm">رقم الطلب</th>
                                <th className="text-right py-3 px-4 font-medium text-sm">التاريخ</th>
                                <th className="text-right py-3 px-4 font-medium text-sm">المورد</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">الإجمالي</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">المتبقي</th>
                                <th className="text-center py-3 px-4 font-medium text-sm">الحالة</th>
                                <th className="text-center py-3 px-4 font-medium text-sm">عرض</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30">
                                    <td className="py-3 px-4">
                                        <Link href={`/dashboard/purchases/orders/${order.id}`} className="font-medium hover:text-primary">
                                            {order.order_number}
                                        </Link>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                        {order.order_date ? new Date(order.order_date).toLocaleDateString('ar-EG') : '-'}
                                    </td>
                                    <td className="py-3 px-4">
                                        <Link href={`/dashboard/purchases/suppliers/${order.supplier_id}`} className="text-sm hover:text-primary">
                                            {order.supplier_name || '-'}
                                        </Link>
                                    </td>
                                    <td className="py-3 px-4 text-left font-mono font-semibold">
                                        {(order.total || 0).toLocaleString('ar-EG')} ج.م
                                    </td>
                                    <td className="py-3 px-4 text-left font-mono">
                                        <span className={(order.remaining_amount || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}>
                                            {(order.remaining_amount || 0).toLocaleString('ar-EG')} ج.م
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={cn(
                                            'px-2 py-0.5 rounded-full text-xs font-medium',
                                            `bg-${statusConfig[order.status]?.color || 'gray'}-100 text-${statusConfig[order.status]?.color || 'gray'}-700`
                                        )}>
                                            {statusConfig[order.status]?.label || order.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <Link
                                            href={`/dashboard/purchases/orders/${order.id}`}
                                            className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary inline-block"
                                        >
                                            <Eye size={16} />
                                        </Link>
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
