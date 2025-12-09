'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    Download,
    FileText,
    DollarSign,
    Clock,
    CheckCircle,
    AlertCircle,
    Eye,
    Printer,
    Send,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SalesInvoice {
    id: string;
    invoice_number: string;
    invoice_date: string;
    due_date?: string;
    status: string;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
    paid_amount: number;
    remaining_amount: number;
    customer?: {
        id: string;
        name: string;
        name_ar?: string;
        phone?: string;
    };
    branch?: {
        id: string;
        name: string;
        name_ar?: string;
    };
}

interface Stats {
    total: number;
    totalAmount: number;
    unpaid: number;
    unpaidAmount: number;
}

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
    draft: { label: 'مسودة', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
    confirmed: { label: 'مؤكدة', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
    paid: { label: 'مدفوعة', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
    partial: { label: 'جزئي', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
    cancelled: { label: 'ملغية', bgColor: 'bg-red-100', textColor: 'text-red-700' },
};

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, totalAmount: 0, unpaid: 0, unpaidAmount: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchInvoices();
    }, [statusFilter]);

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            const response = await fetch(`/api/sales/invoices?${params}`);
            if (response.ok) {
                const data = await response.json();
                setInvoices(data.invoices || []);
                setStats(data.stats || { total: 0, totalAmount: 0, unpaid: 0, unpaidAmount: 0 });
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredInvoices = invoices.filter((inv) => {
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchNumber = inv.invoice_number?.toLowerCase().includes(term);
            const matchCustomer = inv.customer?.name?.toLowerCase().includes(term) ||
                inv.customer?.name_ar?.toLowerCase().includes(term);
            if (!matchNumber && !matchCustomer) return false;
        }
        return true;
    });

    const getStatusConfig = (status: string) => {
        return statusConfig[status] || statusConfig.draft;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Link href="/dashboard/sales" className="hover:text-primary">المبيعات</Link>
                        <span>/</span>
                        <span className="text-foreground">الفواتير</span>
                    </div>
                    <h1 className="text-2xl font-bold">فواتير المبيعات</h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchInvoices}
                        className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        تحديث
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted">
                        <Download size={16} />
                        تصدير
                    </button>
                    <Link
                        href="/dashboard/sales/invoices/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                    >
                        <Plus size={18} />
                        فاتورة جديدة
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        <span className="text-sm text-muted-foreground">غير مدفوعة</span>
                        <AlertCircle size={16} className="text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">{stats.unpaid}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">المستحقات</span>
                        <Clock size={16} className="text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-amber-600">{stats.unpaidAmount.toLocaleString('ar-EG')}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[250px] relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="بحث برقم الفاتورة أو اسم العميل..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2.5 bg-card border border-border rounded-lg focus:border-primary outline-none"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-card border border-border rounded-lg focus:border-primary outline-none"
                >
                    <option value="all">كل الحالات</option>
                    {Object.entries(statusConfig).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <FileText size={48} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium">لا توجد فواتير</p>
                        <p className="text-sm">ابدأ بإنشاء فاتورة جديدة</p>
                        <Link
                            href="/dashboard/sales/invoices/new"
                            className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                        >
                            <Plus size={18} />
                            فاتورة جديدة
                        </Link>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-right py-3 px-4 font-medium text-sm">الفاتورة</th>
                                <th className="text-right py-3 px-4 font-medium text-sm">التاريخ</th>
                                <th className="text-right py-3 px-4 font-medium text-sm">العميل</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">الإجمالي</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">المتبقي</th>
                                <th className="text-center py-3 px-4 font-medium text-sm">الحالة</th>
                                <th className="text-center py-3 px-4 font-medium text-sm">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map((invoice) => {
                                const statusCfg = getStatusConfig(invoice.status);
                                const remaining = invoice.remaining_amount ?? (invoice.total - invoice.paid_amount);

                                return (
                                    <tr key={invoice.id} className="border-b border-border/50 hover:bg-muted/30">
                                        <td className="py-3 px-4">
                                            <Link href={`/dashboard/sales/invoices/${invoice.id}`} className="font-medium hover:text-primary">
                                                {invoice.invoice_number}
                                            </Link>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                            {new Date(invoice.invoice_date).toLocaleDateString('ar-EG')}
                                        </td>
                                        <td className="py-3 px-4">
                                            {invoice.customer ? (
                                                <Link
                                                    href={`/dashboard/sales/customers/${invoice.customer.id}`}
                                                    className="text-sm hover:text-primary"
                                                >
                                                    {invoice.customer.name_ar || invoice.customer.name}
                                                </Link>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">عميل نقدي</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-left font-mono font-semibold">
                                            {invoice.total.toLocaleString('ar-EG')} ج.م
                                        </td>
                                        <td className="py-3 px-4 text-left font-mono">
                                            <span className={remaining > 0 ? 'text-red-600' : 'text-emerald-600'}>
                                                {remaining.toLocaleString('ar-EG')} ج.م
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={cn(
                                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                                statusCfg.bgColor,
                                                statusCfg.textColor
                                            )}>
                                                {statusCfg.label}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <Link
                                                    href={`/dashboard/sales/invoices/${invoice.id}`}
                                                    className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary"
                                                    title="عرض"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                <button
                                                    className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary"
                                                    title="طباعة"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                <button
                                                    className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary"
                                                    title="إرسال"
                                                >
                                                    <Send size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
