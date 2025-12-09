'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    Download,
    FileText,
    DollarSign,
    AlertCircle,
    Eye,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PurchaseInvoice, PurchaseInvoiceStatus } from '@/types/purchases';

const statusConfig: Record<PurchaseInvoiceStatus, { label: string; color: string }> = {
    draft: { label: 'مسودة', color: 'gray' },
    confirmed: { label: 'مؤكدة', color: 'blue' },
    paid: { label: 'مدفوعة', color: 'emerald' },
    partial: { label: 'جزئي', color: 'amber' },
    cancelled: { label: 'ملغية', color: 'red' },
};

export default function PurchaseInvoicesPage() {
    const [invoices, setInvoices] = useState<(PurchaseInvoice & { supplier_name?: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function fetchInvoices() {
            try {
                setIsLoading(true);
                const res = await fetch('/api/purchases/invoices');
                const data = await res.json();

                if (Array.isArray(data)) {
                    setInvoices(data);
                } else if (data && Array.isArray(data.data)) {
                    setInvoices(data.data);
                } else if (!res.ok) {
                    throw new Error(data.error || 'فشل في جلب الفواتير');
                } else {
                    setInvoices([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
                setInvoices([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchInvoices();
    }, []);

    const filteredInvoices = invoices.filter((inv) => {
        if (searchTerm && !inv.invoice_number?.includes(searchTerm) && !inv.supplier_name?.includes(searchTerm)) {
            return false;
        }
        return true;
    });

    const stats = {
        total: invoices.length,
        totalAmount: invoices.reduce((sum, i) => sum + (i.total || 0), 0),
        unpaidAmount: invoices.reduce((sum, i) => sum + (i.remaining_amount || 0), 0),
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
                        <span className="text-foreground">الفواتير</span>
                    </div>
                    <h1 className="text-2xl font-bold">فواتير المشتريات</h1>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted">
                        <Download size={16} />
                        تصدير
                    </button>
                    <Link
                        href="/dashboard/purchases/invoices/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                    >
                        <Plus size={18} />
                        فاتورة جديدة
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">الفواتير</span>
                        <FileText size={16} className="text-blue-600" />
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
                        <span className="text-sm text-muted-foreground">المستحقات</span>
                        <AlertCircle size={16} className="text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">{stats.unpaidAmount.toLocaleString('ar-EG')}</div>
                </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                    type="text"
                    placeholder="بحث برقم الفاتورة أو المورد..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 bg-card border border-border rounded-lg focus:border-primary outline-none"
                />
            </div>

            {/* Empty State */}
            {filteredInvoices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد فواتير</h3>
                    <p className="text-muted-foreground mb-4">ابدأ بإنشاء فاتورة مشتريات جديدة</p>
                    <Link
                        href="/dashboard/purchases/invoices/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                        <Plus size={18} />
                        فاتورة جديدة
                    </Link>
                </div>
            )}

            {/* Table */}
            {filteredInvoices.length > 0 && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-right py-3 px-4 font-medium text-sm">الفاتورة</th>
                                <th className="text-right py-3 px-4 font-medium text-sm">التاريخ</th>
                                <th className="text-right py-3 px-4 font-medium text-sm">المورد</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">الإجمالي</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">المتبقي</th>
                                <th className="text-center py-3 px-4 font-medium text-sm">الحالة</th>
                                <th className="text-center py-3 px-4 font-medium text-sm">عرض</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map((invoice) => (
                                <tr key={invoice.id} className="border-b border-border/50 hover:bg-muted/30">
                                    <td className="py-3 px-4 font-medium">{invoice.invoice_number}</td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                        {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('ar-EG') : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-sm">{invoice.supplier_name || '-'}</td>
                                    <td className="py-3 px-4 text-left font-mono font-semibold">
                                        {(invoice.total || 0).toLocaleString('ar-EG')} ج.م
                                    </td>
                                    <td className="py-3 px-4 text-left font-mono">
                                        <span className={(invoice.remaining_amount || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}>
                                            {(invoice.remaining_amount || 0).toLocaleString('ar-EG')} ج.م
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={cn(
                                            'px-2 py-0.5 rounded-full text-xs font-medium',
                                            `bg-${statusConfig[invoice.status]?.color || 'gray'}-100 text-${statusConfig[invoice.status]?.color || 'gray'}-700`
                                        )}>
                                            {statusConfig[invoice.status]?.label || invoice.status}
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
