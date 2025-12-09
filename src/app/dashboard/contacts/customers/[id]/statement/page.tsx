'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';

interface Transaction {
    id: string;
    date: string;
    type: 'invoice' | 'payment' | 'return' | 'opening';
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

interface Customer {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    balance: number;
}

const typeLabels: Record<string, string> = { invoice: 'فاتورة', payment: 'سند قبض', return: 'مرتجع', opening: 'رصيد افتتاحي' };
const typeColors: Record<string, string> = { invoice: 'bg-blue-100 text-blue-700', payment: 'bg-green-100 text-green-700', return: 'bg-orange-100 text-orange-700', opening: 'bg-gray-100 text-gray-700' };

export default function CustomerStatementPage() {
    const params = useParams();
    const customerId = params?.id as string;

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState('2024-01-01');
    const [dateTo, setDateTo] = useState('2024-12-31');

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                const [custRes, stmtRes] = await Promise.all([
                    fetch(`/api/customers/${customerId}`),
                    fetch(`/api/customers/${customerId}/statement?from=${dateFrom}&to=${dateTo}`),
                ]);
                const custData = await custRes.json();
                const stmtData = await stmtRes.json();

                if (custData && !custData.error) setCustomer(custData);
                else setError('العميل غير موجود');

                setTransactions(Array.isArray(stmtData) ? stmtData : stmtData.data || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
            } finally {
                setIsLoading(false);
            }
        }
        if (customerId) fetchData();
    }, [customerId, dateFrom, dateTo]);

    if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    if (error || !customer) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">خطأ</h2>
            <p className="text-muted-foreground">{error}</p>
            <Link href="/dashboard/contacts" className="mt-4 text-primary hover:underline">العودة</Link>
        </div>
    );

    const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0);
    const totalCredit = transactions.reduce((sum, t) => sum + t.credit, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Link href="/dashboard" className="hover:text-indigo-600">لوحة التحكم</Link>
                        <span>/</span>
                        <Link href="/dashboard/contacts" className="hover:text-indigo-600">جهات الاتصال</Link>
                        <span>/</span>
                        <span className="text-gray-900">كشف حساب عميل</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">كشف حساب عميل</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => alert('Excel')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-gray-700 hover:bg-gray-50">Excel</button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">طباعة</button>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">{customer.name.charAt(0)}</div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
                            <p className="text-gray-500">{customer.phone}</p>
                            <p className="text-gray-500">{customer.email}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-4 justify-end">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-4 py-2.5 rounded-xl border" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-4 py-2.5 rounded-xl border" /></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm"><div className="text-sm text-gray-500">إجمالي المدين</div><div className="text-2xl font-bold text-red-600">{totalDebit.toLocaleString('ar-EG')} ج.م</div></div>
                <div className="bg-white rounded-xl p-4 shadow-sm"><div className="text-sm text-gray-500">إجمالي الدائن</div><div className="text-2xl font-bold text-green-600">{totalCredit.toLocaleString('ar-EG')} ج.م</div></div>
                <div className="bg-white rounded-xl p-4 shadow-sm"><div className="text-sm text-gray-500">الرصيد</div><div className={`text-2xl font-bold ${customer.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{customer.balance.toLocaleString('ar-EG')} ج.م <span className="text-sm font-normal text-gray-500">(مدين)</span></div></div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">التاريخ</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">النوع</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">المرجع</th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">البيان</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">مدين</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">دائن</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">الرصيد</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {transactions.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">لا توجد حركات</td></tr>
                        ) : transactions.map((t) => (
                            <tr key={t.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-600">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[t.type]}`}>{typeLabels[t.type]}</span></td>
                                <td className="px-4 py-3 font-mono text-gray-600">{t.reference}</td>
                                <td className="px-4 py-3 text-gray-900">{t.description}</td>
                                <td className="px-4 py-3 text-left font-mono">{t.debit > 0 ? <span className="text-red-600">{t.debit.toLocaleString('ar-EG')}</span> : '-'}</td>
                                <td className="px-4 py-3 text-left font-mono">{t.credit > 0 ? <span className="text-green-600">{t.credit.toLocaleString('ar-EG')}</span> : '-'}</td>
                                <td className="px-4 py-3 text-left font-mono font-bold">{t.balance.toLocaleString('ar-EG')}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2">
                        <tr className="font-bold">
                            <td colSpan={4} className="px-4 py-3 text-gray-900">الإجمالي</td>
                            <td className="px-4 py-3 text-left font-mono text-red-600">{totalDebit.toLocaleString('ar-EG')}</td>
                            <td className="px-4 py-3 text-left font-mono text-green-600">{totalCredit.toLocaleString('ar-EG')}</td>
                            <td className="px-4 py-3 text-left font-mono text-blue-600">{customer.balance.toLocaleString('ar-EG')}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
