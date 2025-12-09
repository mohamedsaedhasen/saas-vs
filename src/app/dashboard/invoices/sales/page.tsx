'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Loader2, AlertCircle, FileText } from 'lucide-react';

interface Invoice {
    id: string;
    invoice_number: string;
    customer_name?: string;
    customer?: { name: string };
    date?: string;
    invoice_date?: string;
    due_date: string;
    subtotal: number;
    tax?: number;
    tax_amount?: number;
    total: number;
    paid?: number;
    paid_amount?: number;
    status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled' | 'posted';
    items_count?: number;
}

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    partial: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
    posted: 'bg-emerald-100 text-emerald-700',
};

const statusLabels: Record<string, string> = {
    draft: 'مسودة',
    sent: 'مرسلة',
    paid: 'مدفوعة',
    partial: 'مدفوعة جزئياً',
    overdue: 'متأخرة',
    cancelled: 'ملغية',
    posted: 'مرحلة',
};

export default function SalesInvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        async function fetchInvoices() {
            try {
                setIsLoading(true);
                const res = await fetch('/api/sales/invoices');
                const data = await res.json();

                if (Array.isArray(data)) {
                    setInvoices(data);
                } else if (data && Array.isArray(data.data)) {
                    setInvoices(data.data);
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

    const filteredInvoices = invoices.filter((invoice) => {
        if (filterStatus !== 'all' && invoice.status !== filterStatus) return false;
        if (searchTerm) {
            const customerName = invoice.customer_name || invoice.customer?.name || '';
            if (!invoice.invoice_number?.includes(searchTerm) && !customerName.includes(searchTerm)) return false;
        }
        return true;
    });

    const totalSales = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paid || inv.paid_amount || 0), 0);
    const totalDue = totalSales - totalPaid;
    const overdueAmount = invoices
        .filter((inv) => inv.status === 'overdue')
        .reduce((sum, inv) => sum + ((inv.total || 0) - (inv.paid || inv.paid_amount || 0)), 0);

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
        <div className="space-y-6 p-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Link href="/dashboard" className="hover:text-indigo-600">لوحة التحكم</Link>
                        <span>/</span>
                        <Link href="/dashboard/invoices" className="hover:text-indigo-600">الفواتير</Link>
                        <span>/</span>
                        <span className="text-gray-900">فواتير المبيعات</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">فواتير المبيعات</h1>
                </div>
                <Link
                    href="/dashboard/invoices/sales/new"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    فاتورة جديدة
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">إجمالي المبيعات</div>
                    <div className="text-2xl font-bold text-gray-900">{totalSales.toLocaleString('ar-EG')} ج.م</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">المحصّل</div>
                    <div className="text-2xl font-bold text-green-600">{totalPaid.toLocaleString('ar-EG')} ج.م</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">المتبقي</div>
                    <div className="text-2xl font-bold text-yellow-600">{totalDue.toLocaleString('ar-EG')} ج.م</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">متأخر السداد</div>
                    <div className="text-2xl font-bold text-red-600">{overdueAmount.toLocaleString('ar-EG')} ج.م</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="بحث برقم الفاتورة أو العميل..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-indigo-500 outline-none"
                >
                    <option value="all">كل الحالات</option>
                    <option value="draft">مسودة</option>
                    <option value="sent">مرسلة</option>
                    <option value="paid">مدفوعة</option>
                    <option value="partial">مدفوعة جزئياً</option>
                    <option value="overdue">متأخرة</option>
                </select>

                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    تصدير
                </button>
            </div>

            {/* Empty State */}
            {filteredInvoices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl shadow-sm">
                    <FileText className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد فواتير</h3>
                    <p className="text-gray-500 mb-4">ابدأ بإنشاء فاتورة مبيعات جديدة</p>
                    <Link
                        href="/dashboard/invoices/sales/new"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <Plus size={18} />
                        فاتورة جديدة
                    </Link>
                </div>
            )}

            {/* Invoices Table */}
            {filteredInvoices.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">الفاتورة</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">العميل</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">التاريخ</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">الإجمالي</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">المدفوع</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">الحالة</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredInvoices.map((invoice) => {
                                const customerName = invoice.customer_name || invoice.customer?.name || '-';
                                const invoiceDate = invoice.date || invoice.invoice_date;
                                const paidAmount = invoice.paid || invoice.paid_amount || 0;

                                return (
                                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <div className="font-mono font-medium text-gray-900">{invoice.invoice_number}</div>
                                                    <div className="text-sm text-gray-500">{invoice.items_count || 0} منتجات</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900">{customerName}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-gray-900">{invoiceDate ? new Date(invoiceDate).toLocaleDateString('ar-EG') : '-'}</div>
                                            <div className="text-sm text-gray-500">استحقاق: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('ar-EG') : '-'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-left font-mono font-medium text-gray-900">
                                            {(invoice.total || 0).toLocaleString('ar-EG')} ج.م
                                        </td>
                                        <td className="px-4 py-3 text-left font-mono">
                                            <span className={paidAmount === invoice.total ? 'text-green-600' : 'text-gray-600'}>
                                                {paidAmount.toLocaleString('ar-EG')} ج.م
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status] || 'bg-gray-100 text-gray-700'}`}>
                                                {statusLabels[invoice.status] || invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/dashboard/invoices/sales/${invoice.id}`}
                                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors"
                                                    title="عرض"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </Link>
                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors" title="طباعة">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
