'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    Edit,
    Printer,
    Download,
    Send,
    DollarSign,
    CreditCard,
    User,
    Calendar,
    Package,
    Loader2,
    Trash2,
    MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvoiceItem {
    id: string;
    product_id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    product?: {
        id: string;
        sku: string;
        name: string;
        name_ar?: string;
    };
}

interface Invoice {
    id: string;
    invoice_number: string;
    invoice_date: string;
    due_date?: string;
    status: string;
    payment_method?: string;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    shipping_amount: number;
    total: number;
    paid_amount: number;
    notes?: string;
    internal_notes?: string;
    customer?: {
        id: string;
        code?: string;
        name: string;
        name_ar?: string;
        phone?: string;
        email?: string;
        address?: string;
        balance?: number;
    };
    branch?: {
        id: string;
        name: string;
        name_ar?: string;
    };
    items: InvoiceItem[];
}

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
    draft: { label: 'مسودة', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
    confirmed: { label: 'مؤكدة', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
    paid: { label: 'مدفوعة', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
    partial: { label: 'جزئي', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
    cancelled: { label: 'ملغية', bgColor: 'bg-red-100', textColor: 'text-red-700' },
};

export default function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    const fetchInvoice = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/sales/invoices/${id}`);
            if (response.ok) {
                const data = await response.json();
                setInvoice(data);
            } else {
                setError('لم يتم العثور على الفاتورة');
            }
        } catch (error) {
            console.error('Error fetching invoice:', error);
            setError('حدث خطأ أثناء تحميل الفاتورة');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;

        try {
            const response = await fetch(`/api/sales/invoices/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                router.push('/dashboard/sales/invoices');
            } else {
                const data = await response.json();
                alert(data.error || 'فشل حذف الفاتورة');
            }
        } catch (error) {
            console.error('Error deleting invoice:', error);
        }
    };

    const getStatusConfig = (status: string) => {
        return statusConfig[status] || statusConfig.draft;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
                <p className="text-lg">{error || 'لم يتم العثور على الفاتورة'}</p>
                <Link href="/dashboard/sales/invoices" className="mt-4 text-primary hover:underline">
                    العودة للفواتير
                </Link>
            </div>
        );
    }

    const statusCfg = getStatusConfig(invoice.status);
    const remaining = invoice.total - invoice.paid_amount;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/sales/invoices" className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
                        <ArrowRight size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
                            <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                statusCfg.bgColor,
                                statusCfg.textColor
                            )}>
                                {statusCfg.label}
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {new Date(invoice.invoice_date).toLocaleDateString('ar-EG', { dateStyle: 'full' })}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted">
                        <Printer size={16} />
                        طباعة
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted">
                        <Download size={16} />
                        PDF
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted">
                        <Send size={16} />
                        إرسال
                    </button>
                    {invoice.status === 'draft' && (
                        <>
                            <Link
                                href={`/dashboard/sales/invoices/${id}/edit`}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                            >
                                <Edit size={16} />
                                تعديل
                            </Link>
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="p-4 border-b border-border flex items-center gap-2">
                            <Package size={18} className="text-primary" />
                            <h3 className="font-semibold">المنتجات</h3>
                            <span className="text-sm text-muted-foreground mr-auto">
                                {invoice.items?.length || 0} بند
                            </span>
                        </div>
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-right py-2 px-4 text-sm font-medium">المنتج</th>
                                    <th className="text-left py-2 px-4 text-sm font-medium">السعر</th>
                                    <th className="text-center py-2 px-4 text-sm font-medium">الكمية</th>
                                    <th className="text-left py-2 px-4 text-sm font-medium">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items?.map((item) => (
                                    <tr key={item.id} className="border-t border-border">
                                        <td className="py-3 px-4">
                                            <div className="font-medium">
                                                {item.product?.name_ar || item.product?.name || item.description}
                                            </div>
                                            {item.product?.sku && (
                                                <div className="text-xs text-muted-foreground">{item.product.sku}</div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-left font-mono">{item.unit_price.toLocaleString('ar-EG')}</td>
                                        <td className="py-3 px-4 text-center">{item.quantity}</td>
                                        <td className="py-3 px-4 text-left font-mono font-semibold">{item.total.toLocaleString('ar-EG')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="border-t border-border bg-muted/30 p-4">
                            <div className="max-w-xs mr-auto space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">المجموع الفرعي</span>
                                    <span className="font-mono">{invoice.subtotal.toLocaleString('ar-EG')} ج.م</span>
                                </div>
                                {invoice.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm text-emerald-600">
                                        <span>خصم</span>
                                        <span className="font-mono">-{invoice.discount_amount.toLocaleString('ar-EG')} ج.م</span>
                                    </div>
                                )}
                                {invoice.tax_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">الضريبة</span>
                                        <span className="font-mono">{invoice.tax_amount.toLocaleString('ar-EG')} ج.م</span>
                                    </div>
                                )}
                                {invoice.shipping_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">الشحن</span>
                                        <span className="font-mono">{invoice.shipping_amount.toLocaleString('ar-EG')} ج.م</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                                    <span>الإجمالي</span>
                                    <span className="font-mono text-primary">{invoice.total.toLocaleString('ar-EG')} ج.م</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {invoice.notes && (
                        <div className="bg-card rounded-xl border border-border p-4">
                            <h3 className="font-semibold mb-2">ملاحظات</h3>
                            <p className="text-muted-foreground">{invoice.notes}</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Payment Status */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <DollarSign size={16} className="text-emerald-600" />
                            حالة الدفع
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">الإجمالي</span>
                                <span className="font-mono font-semibold">{invoice.total.toLocaleString('ar-EG')} ج.م</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">المدفوع</span>
                                <span className="font-mono text-emerald-600">{invoice.paid_amount.toLocaleString('ar-EG')} ج.م</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">المتبقي</span>
                                <span className={cn(
                                    "font-mono font-semibold",
                                    remaining > 0 ? "text-red-600" : "text-emerald-600"
                                )}>
                                    {remaining.toLocaleString('ar-EG')} ج.م
                                </span>
                            </div>
                        </div>
                        {remaining > 0 && invoice.status !== 'draft' && (
                            <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                                <CreditCard size={16} />
                                تسجيل دفعة
                            </button>
                        )}
                    </div>

                    {/* Customer */}
                    {invoice.customer && (
                        <div className="bg-card rounded-xl border border-border p-4">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <User size={16} className="text-blue-600" />
                                العميل
                            </h3>
                            <div className="space-y-2">
                                <Link href={`/dashboard/sales/customers/${invoice.customer.id}`} className="font-medium hover:text-primary block">
                                    {invoice.customer.name_ar || invoice.customer.name}
                                </Link>
                                {invoice.customer.phone && (
                                    <div className="text-sm text-muted-foreground">{invoice.customer.phone}</div>
                                )}
                                {invoice.customer.email && (
                                    <div className="text-sm text-muted-foreground">{invoice.customer.email}</div>
                                )}
                                {invoice.customer.address && (
                                    <div className="text-sm text-muted-foreground">{invoice.customer.address}</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Branch */}
                    {invoice.branch && (
                        <div className="bg-card rounded-xl border border-border p-4">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <MapPin size={16} className="text-green-600" />
                                الفرع
                            </h3>
                            <div className="text-sm">
                                {invoice.branch.name_ar || invoice.branch.name}
                            </div>
                        </div>
                    )}

                    {/* Dates */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Calendar size={16} className="text-purple-600" />
                            التواريخ
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">تاريخ الفاتورة</span>
                                <span>{new Date(invoice.invoice_date).toLocaleDateString('ar-EG')}</span>
                            </div>
                            {invoice.due_date && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">تاريخ الاستحقاق</span>
                                    <span>{new Date(invoice.due_date).toLocaleDateString('ar-EG')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
