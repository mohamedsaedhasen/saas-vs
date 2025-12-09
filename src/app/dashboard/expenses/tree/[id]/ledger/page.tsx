'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, Download, Printer, Calendar, RefreshCw, FileText, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExpenseCategoryWithStats } from '@/types/expenses';

interface Transaction {
    id: string;
    date: string;
    voucher_number: string;
    description: string;
    debit: number;
    balance: number;
}

export default function CategoryLedgerPage() {
    const params = useParams();
    const categoryId = params?.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [category, setCategory] = useState<ExpenseCategoryWithStats | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setDateFrom(firstDay.toISOString().split('T')[0]);
        setDateTo(lastDay.toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        async function fetchData() {
            if (!categoryId || !dateFrom || !dateTo) return;
            try {
                setIsLoading(true);
                const [catRes, transRes] = await Promise.all([
                    fetch(`/api/expenses/categories/${categoryId}`),
                    fetch(`/api/expenses/categories/${categoryId}/ledger?from=${dateFrom}&to=${dateTo}`),
                ]);
                const catData = await catRes.json();
                const transData = await transRes.json();

                if (catData && !catData.error) setCategory(catData);
                else setError('التصنيف غير موجود');

                setTransactions(Array.isArray(transData) ? transData : transData.data || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [categoryId, dateFrom, dateTo]);

    const handleRefresh = () => {
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 500);
    };

    const setDatePreset = (preset: 'month' | 'quarter' | 'year' | 'all') => {
        const now = new Date();
        let from: Date;
        switch (preset) {
            case 'month': from = new Date(now.getFullYear(), now.getMonth(), 1); break;
            case 'quarter': from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1); break;
            case 'year': from = new Date(now.getFullYear(), 0, 1); break;
            case 'all': from = new Date(2020, 0, 1); break;
        }
        setDateFrom(from.toISOString().split('T')[0]);
        setDateTo(now.toISOString().split('T')[0]);
    };

    const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0);
    const closingBalance = transactions[transactions.length - 1]?.balance || 0;

    if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    if (error || !category) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">خطأ</h2>
            <p className="text-muted-foreground">{error}</p>
            <Link href="/dashboard/expenses/tree" className="mt-4 text-primary hover:underline">العودة</Link>
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/expenses/tree" className="p-2 hover:bg-muted rounded-lg"><ArrowRight size={20} /></Link>
                    <div>
                        <h1 className="text-2xl font-bold">كشف حساب المصروف</h1>
                        <p className="text-muted-foreground">{category.code} - {category.name_ar}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleRefresh} className="p-2 hover:bg-muted rounded-lg"><RefreshCw size={18} /></button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 border rounded-lg"><Printer size={16} /> طباعة</button>
                </div>
            </div>

            <div className="bg-card rounded-xl border p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><div className="text-sm text-muted-foreground">الكود</div><div className="font-mono font-semibold">{category.code}</div></div>
                    <div><div className="text-sm text-muted-foreground">الحساب</div><div className="font-mono font-semibold">{category.account_code || '-'}</div></div>
                    <div><div className="text-sm text-muted-foreground">الموازنة</div><div className="font-semibold">{category.budget_amount?.toLocaleString('ar-EG') || '-'} ج.م</div></div>
                    <div><div className="text-sm text-muted-foreground">السندات</div><div className="font-semibold">{category.voucher_count}</div></div>
                </div>
            </div>

            <div className="bg-card rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Calendar size={18} className="text-muted-foreground" />
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm" />
                        <span>إلى</span>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm" />
                    </div>
                    <div className="flex gap-2">
                        {['month', 'quarter', 'year', 'all'].map((p) => (
                            <button key={p} onClick={() => setDatePreset(p as any)} className="px-3 py-1.5 text-xs border rounded-lg hover:bg-muted">
                                {p === 'month' ? 'الشهر' : p === 'quarter' ? 'الربع' : p === 'year' ? 'السنة' : 'الكل'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-xl border overflow-hidden">
                <table className="w-full">
                    <thead><tr className="border-b bg-muted/50">
                        <th className="text-right py-3 px-4 text-sm font-medium">التاريخ</th>
                        <th className="text-right py-3 px-4 text-sm font-medium">رقم السند</th>
                        <th className="text-right py-3 px-4 text-sm font-medium">البيان</th>
                        <th className="text-left py-3 px-4 text-sm font-medium">مدين</th>
                        <th className="text-left py-3 px-4 text-sm font-medium">الرصيد</th>
                    </tr></thead>
                    <tbody>
                        <tr className="border-b bg-blue-50/50">
                            <td className="py-3 px-4 text-sm">{dateFrom}</td>
                            <td className="py-3 px-4 text-sm">-</td>
                            <td className="py-3 px-4 text-sm font-medium">رصيد أول المدة</td>
                            <td className="py-3 px-4 text-sm">-</td>
                            <td className="py-3 px-4 text-sm font-mono font-semibold">0.00</td>
                        </tr>
                        {transactions.map((t, i) => (
                            <tr key={t.id} className={cn('border-b hover:bg-muted/30', i % 2 === 0 ? 'bg-background' : 'bg-muted/10')}>
                                <td className="py-3 px-4 text-sm">{t.date}</td>
                                <td className="py-3 px-4"><Link href={`/dashboard/expenses/vouchers/${t.id}`} className="font-mono text-sm text-primary hover:underline">{t.voucher_number}</Link></td>
                                <td className="py-3 px-4 text-sm">{t.description}</td>
                                <td className="py-3 px-4 text-sm font-mono">{t.debit.toLocaleString('ar-EG')}</td>
                                <td className="py-3 px-4 text-sm font-mono font-semibold">{t.balance.toLocaleString('ar-EG')}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot><tr className="border-t-2 bg-muted/50 font-semibold">
                        <td colSpan={3} className="py-3 px-4 text-sm">الإجمالي</td>
                        <td className="py-3 px-4 text-sm font-mono">{totalDebit.toLocaleString('ar-EG')}</td>
                        <td className="py-3 px-4 text-sm font-mono text-primary">{closingBalance.toLocaleString('ar-EG')}</td>
                    </tr></tfoot>
                </table>
                {transactions.length === 0 && <div className="py-12 text-center text-muted-foreground"><FileText size={48} className="mx-auto mb-4 opacity-50" /><p>لا توجد حركات</p></div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl border p-4"><div className="text-sm text-muted-foreground mb-1">إجمالي المصروفات</div><div className="text-2xl font-bold">{totalDebit.toLocaleString('ar-EG')} ج.م</div></div>
                <div className="bg-card rounded-xl border p-4"><div className="text-sm text-muted-foreground mb-1">عدد الحركات</div><div className="text-2xl font-bold">{transactions.length}</div></div>
                <div className="bg-card rounded-xl border p-4"><div className="text-sm text-muted-foreground mb-1">متوسط الحركة</div><div className="text-2xl font-bold">{transactions.length > 0 ? Math.round(totalDebit / transactions.length).toLocaleString('ar-EG') : 0} ج.م</div></div>
            </div>
        </div>
    );
}
