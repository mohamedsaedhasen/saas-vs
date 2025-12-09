'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowRight, Check, X, Edit, Printer, FileText, Calendar,
    Wallet, Building2, User, Paperclip, AlertCircle, Loader2,
} from 'lucide-react';
import type { ExpenseVoucher } from '@/types/expenses';

export default function VoucherDetailsPage() {
    const params = useParams();
    const voucherId = params?.id as string;

    const [voucher, setVoucher] = useState<ExpenseVoucher | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        async function fetchVoucher() {
            try {
                setIsLoading(true);
                const res = await fetch(`/api/expenses/vouchers/${voucherId}`);
                const data = await res.json();
                if (data && !data.error) setVoucher(data);
                else setError('السند غير موجود');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
            } finally {
                setIsLoading(false);
            }
        }
        if (voucherId) fetchVoucher();
    }, [voucherId]);

    const handleConfirm = async () => {
        if (!voucher) return;
        setIsProcessing(true);
        try {
            const res = await fetch(`/api/expenses/vouchers/${voucherId}/confirm`, { method: 'POST' });
            if (res.ok) setVoucher(await res.json());
        } finally { setIsProcessing(false); }
    };

    const handleCancel = async () => {
        if (!confirm('هل أنت متأكد من إلغاء هذا السند؟')) return;
        setIsProcessing(true);
        try {
            const res = await fetch(`/api/expenses/vouchers/${voucherId}/cancel`, { method: 'POST' });
            if (res.ok) setVoucher(await res.json());
        } finally { setIsProcessing(false); }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            confirmed: 'bg-emerald-100 text-emerald-700',
            draft: 'bg-amber-100 text-amber-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        const labels: Record<string, string> = { confirmed: 'مؤكد', draft: 'مسودة', cancelled: 'ملغي' };
        return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>{labels[status]}</span>;
    };

    const getPaymentLabel = (method: string) => {
        const labels: Record<string, string> = { cash: 'نقدي', bank: 'تحويل بنكي', check: 'شيك', card: 'بطاقة' };
        return labels[method] || method;
    };

    if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    if (error || !voucher) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">خطأ</h2>
            <p className="text-muted-foreground">{error}</p>
            <Link href="/dashboard/expenses/vouchers" className="mt-4 text-primary hover:underline">العودة</Link>
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/expenses/vouchers" className="p-2 hover:bg-muted rounded-lg"><ArrowRight size={20} /></Link>
                    <div>
                        <h1 className="text-2xl font-bold">تفاصيل سند الصرف</h1>
                        <p className="text-muted-foreground font-mono">{voucher.voucher_number}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {voucher.status === 'draft' && (
                        <>
                            <button onClick={handleConfirm} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg">
                                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} تأكيد
                            </button>
                            <Link href={`/dashboard/expenses/vouchers/${voucherId}/edit`} className="flex items-center gap-2 px-4 py-2 border rounded-lg"><Edit size={16} /> تعديل</Link>
                        </>
                    )}
                    {voucher.status === 'confirmed' && (
                        <button onClick={handleCancel} disabled={isProcessing} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg">
                            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} إلغاء
                        </button>
                    )}
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 border rounded-lg"><Printer size={16} /> طباعة</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card rounded-xl border p-6">
                        <div className="flex items-center justify-between mb-6">
                            {getStatusBadge(voucher.status)}
                            <div className="text-left">
                                <div className="text-sm text-muted-foreground">المبلغ</div>
                                <div className="text-3xl font-bold">{(voucher.amount || 0).toLocaleString('ar-EG')} ج.م</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><div className="text-sm text-muted-foreground">التاريخ</div><div className="flex items-center gap-2"><Calendar size={16} /> {voucher.date}</div></div>
                            <div><div className="text-sm text-muted-foreground">التصنيف</div><div><span className="font-mono text-sm">{voucher.category_code}</span> {voucher.category_name}</div></div>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl border p-6">
                        <h3 className="font-semibold mb-3">الوصف</h3>
                        <p>{voucher.description}</p>
                        {voucher.notes && <div className="mt-4 pt-4 border-t"><h4 className="text-sm font-medium text-muted-foreground mb-2">ملاحظات</h4><p className="text-sm">{voucher.notes}</p></div>}
                    </div>

                    <div className="bg-card rounded-xl border p-6">
                        <h3 className="font-semibold mb-4">تفاصيل الدفع</h3>
                        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                {voucher.payment_method === 'cash' ? <Wallet size={18} /> : <Building2 size={18} />}
                            </div>
                            <div><div className="font-medium">{getPaymentLabel(voucher.payment_method)}</div><div className="text-sm text-muted-foreground">{voucher.vault_name || voucher.bank_name}</div></div>
                        </div>
                    </div>

                    {voucher.journal_entry_id && (
                        <div className="bg-card rounded-xl border p-6">
                            <h3 className="font-semibold mb-4">القيد المحاسبي</h3>
                            <Link href={`/dashboard/accounting/journal-entries/${voucher.journal_entry_id}`} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
                                <div className="flex items-center gap-3"><FileText size={20} className="text-blue-600" /><div className="font-mono text-sm text-blue-600">{voucher.journal_entry_number}</div></div>
                                <ArrowRight size={18} className="text-blue-600 rotate-180" />
                            </Link>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {voucher.cost_center_name && <div className="bg-card rounded-xl border p-4"><h3 className="text-sm font-medium text-muted-foreground mb-2">مركز التكلفة</h3><div className="font-medium">{voucher.cost_center_name}</div></div>}
                    {voucher.supplier_name && <div className="bg-card rounded-xl border p-4"><h3 className="text-sm font-medium text-muted-foreground mb-2">المورد</h3><div className="flex items-center gap-2"><User size={16} /> {voucher.supplier_name}</div></div>}
                    <div className="bg-card rounded-xl border p-4"><h3 className="text-sm font-medium text-muted-foreground mb-3">المرفقات</h3>
                        {voucher.attachment_urls?.length ? voucher.attachment_urls.map((url, i) => <a key={i} href={url} target="_blank" className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm"><Paperclip size={14} /> مرفق {i + 1}</a>) : <p className="text-sm text-muted-foreground">لا توجد مرفقات</p>}
                    </div>
                    <div className="bg-card rounded-xl border p-4 text-sm">
                        <div className="space-y-2 text-muted-foreground">
                            <div className="flex justify-between"><span>أنشئ بواسطة</span><span className="text-foreground">{voucher.created_by_name}</span></div>
                            <div className="flex justify-between"><span>تاريخ الإنشاء</span><span className="text-foreground">{new Date(voucher.created_at).toLocaleString('ar-EG')}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
