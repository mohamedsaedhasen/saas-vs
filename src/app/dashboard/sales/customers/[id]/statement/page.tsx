'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    ArrowRight,
    Download,
    Printer,
    Calendar,
    Filter,
    ChevronDown,
    Loader2,
    AlertCircle,
} from 'lucide-react';

interface Transaction {
    id: string;
    date: string;
    type: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

interface Statement {
    customer: {
        id: string;
        name: string;
        code: string;
    };
    opening_balance: number;
    transactions: Transaction[];
    closing_balance: number;
    total_debit: number;
    total_credit: number;
}

export default function CustomerStatementPage() {
    const params = useParams();
    const customerId = params.id as string;

    const [statement, setStatement] = useState<Statement | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        // Set default dates
        const today = new Date();
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setDateFrom(firstOfMonth.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        async function fetchStatement() {
            if (!customerId || !dateFrom || !dateTo) return;

            try {
                setIsLoading(true);
                const res = await fetch(`/api/customers/${customerId}/statement?from=${dateFrom}&to=${dateTo}`);
                const data = await res.json();

                if (data && !data.error) {
                    setStatement(data);
                } else {
                    // Create empty statement if no data
                    setStatement({
                        customer: { id: customerId, name: 'العميل', code: '' },
                        opening_balance: 0,
                        transactions: [],
                        closing_balance: 0,
                        total_debit: 0,
                        total_credit: 0,
                    });
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
            } finally {
                setIsLoading(false);
            }
        }
        fetchStatement();
    }, [customerId, dateFrom, dateTo]);

    const applyFilters = () => {
        // Refetch with new dates (useEffect will handle it)
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
                <div className="flex items-center gap-4">
                    <Link
                        href={`/dashboard/sales/customers/${params.id}`}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
                    >
                        <ArrowRight size={20} />
                    </Link>
                    <div>
                        <div className="text-sm text-muted-foreground mb-1">كشف حساب</div>
                        <h1 className="text-2xl font-bold">{statement?.customer.name || 'العميل'}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted">
                        <Printer size={16} />
                        طباعة
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                        <Download size={16} />
                        تصدير PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">من:</span>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="px-3 py-1.5 border border-border rounded-lg text-sm"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">إلى:</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="px-3 py-1.5 border border-border rounded-lg text-sm"
                    />
                </div>
                <button
                    onClick={applyFilters}
                    className="px-4 py-1.5 bg-muted rounded-lg text-sm hover:bg-muted/80"
                >
                    تطبيق
                </button>
            </div>

            {/* Statement */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Opening Balance */}
                <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
                    <span className="font-medium">رصيد أول المدة</span>
                    <span className="font-mono font-bold">
                        {(statement?.opening_balance || 0).toLocaleString('ar-EG')} ج.م
                    </span>
                </div>

                {/* Transactions Table */}
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border bg-muted/50">
                            <th className="text-right py-3 px-4 font-medium text-sm">التاريخ</th>
                            <th className="text-right py-3 px-4 font-medium text-sm">المرجع</th>
                            <th className="text-right py-3 px-4 font-medium text-sm">البيان</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">مدين</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">دائن</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">الرصيد</th>
                        </tr>
                    </thead>
                    <tbody>
                        {statement?.transactions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                    لا توجد حركات في هذه الفترة
                                </td>
                            </tr>
                        ) : (
                            statement?.transactions.map((tx) => (
                                <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/30">
                                    <td className="py-3 px-4 text-sm">
                                        {new Date(tx.date).toLocaleDateString('ar-EG')}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="text-sm font-mono text-primary hover:underline cursor-pointer">
                                            {tx.reference}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm">{tx.description}</td>
                                    <td className="py-3 px-4 text-left font-mono text-red-600">
                                        {tx.debit > 0 ? tx.debit.toLocaleString('ar-EG') : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-left font-mono text-emerald-600">
                                        {tx.credit > 0 ? tx.credit.toLocaleString('ar-EG') : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-left font-mono font-semibold">
                                        {tx.balance.toLocaleString('ar-EG')}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="border-t border-border">
                    <div className="flex items-center justify-between p-4 bg-muted/30">
                        <span className="font-medium">الإجمالي</span>
                        <div className="flex items-center gap-8">
                            <span className="font-mono text-red-600">
                                {(statement?.total_debit || 0).toLocaleString('ar-EG')} ج.م
                            </span>
                            <span className="font-mono text-emerald-600">
                                {(statement?.total_credit || 0).toLocaleString('ar-EG')} ج.م
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-primary/5">
                        <span className="font-bold">رصيد آخر المدة</span>
                        <span className="font-mono font-bold text-lg text-primary">
                            {(statement?.closing_balance || 0).toLocaleString('ar-EG')} ج.م
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
