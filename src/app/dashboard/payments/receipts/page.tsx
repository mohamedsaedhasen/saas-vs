'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Loader2, AlertCircle } from 'lucide-react';

interface Receipt {
    id: string;
    receipt_number: string;
    date?: string;
    payment_date?: string;
    customer_name?: string;
    customer?: { name: string };
    amount: number;
    payment_method: 'cash' | 'bank' | 'check';
    vault_or_bank?: string;
    vault?: { name: string };
    reference?: string;
    status: 'confirmed' | 'pending';
}

const methodLabels: Record<string, string> = { cash: 'نقدي', bank: 'تحويل بنكي', check: 'شيك' };
const methodColors: Record<string, string> = { cash: 'bg-green-100 text-green-700', bank: 'bg-blue-100 text-blue-700', check: 'bg-yellow-100 text-yellow-700' };

export default function ReceiptsPage() {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMethod, setFilterMethod] = useState('all');

    useEffect(() => {
        async function fetchReceipts() {
            try {
                setIsLoading(true);
                const res = await fetch('/api/payments/receipts');
                const data = await res.json();

                if (Array.isArray(data)) {
                    setReceipts(data);
                } else if (data && Array.isArray(data.data)) {
                    setReceipts(data.data);
                } else {
                    setReceipts([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
                setReceipts([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchReceipts();
    }, []);

    const filteredReceipts = receipts.filter((receipt) => {
        if (filterMethod !== 'all' && receipt.payment_method !== filterMethod) return false;
        const customerName = receipt.customer_name || receipt.customer?.name || '';
        if (searchTerm && !receipt.receipt_number?.includes(searchTerm) && !customerName.includes(searchTerm)) return false;
        return true;
    });

    const totalReceipts = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
    const cashTotal = receipts.filter(r => r.payment_method === 'cash').reduce((sum, r) => sum + (r.amount || 0), 0);
    const bankTotal = receipts.filter(r => r.payment_method === 'bank').reduce((sum, r) => sum + (r.amount || 0), 0);

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
                        <Link href="/dashboard/payments" className="hover:text-indigo-600">المدفوعات</Link>
                        <span>/</span>
                        <span className="text-gray-900">سندات القبض</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">سندات القبض</h1>
                </div>
                <Link
                    href="/dashboard/payments/receipts/new"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                >
                    <Plus size={20} />
                    سند قبض جديد
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">عدد السندات</div>
                    <div className="text-2xl font-bold text-gray-900">{receipts.length}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">إجمالي المقبوضات</div>
                    <div className="text-2xl font-bold text-green-600">{totalReceipts.toLocaleString('ar-EG')} ج.م</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">نقدي</div>
                    <div className="text-2xl font-bold text-gray-900">{cashTotal.toLocaleString('ar-EG')} ج.م</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">تحويلات بنكية</div>
                    <div className="text-2xl font-bold text-blue-600">{bankTotal.toLocaleString('ar-EG')} ج.م</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="بحث برقم السند أو العميل..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none"
                        />
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
                <input type="date" className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" />
                <select
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-indigo-500 outline-none"
                >
                    <option value="all">كل الطرق</option>
                    <option value="cash">نقدي</option>
                    <option value="bank">تحويل بنكي</option>
                    <option value="check">شيك</option>
                </select>
            </div>

            {/* Empty State */}
            {filteredReceipts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl shadow-sm">
                    <span className="text-6xl mb-4">💰</span>
                    <h3 className="text-lg font-semibold mb-2">لا توجد سندات قبض</h3>
                    <p className="text-gray-500 mb-4">ابدأ بإنشاء سند قبض جديد</p>
                    <Link
                        href="/dashboard/payments/receipts/new"
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <Plus size={18} />
                        سند قبض جديد
                    </Link>
                </div>
            )}

            {/* Receipts Table */}
            {filteredReceipts.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">رقم السند</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">التاريخ</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">العميل</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">طريقة الدفع</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">المبلغ</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredReceipts.map((receipt) => {
                                const customerName = receipt.customer_name || receipt.customer?.name || '-';
                                const receiptDate = receipt.date || receipt.payment_date;
                                const vaultName = receipt.vault_or_bank || receipt.vault?.name || '';

                                return (
                                    <tr key={receipt.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                                    <span className="text-lg">💰</span>
                                                </div>
                                                <div>
                                                    <div className="font-mono font-medium text-gray-900">{receipt.receipt_number}</div>
                                                    <div className="text-xs text-gray-500">{receipt.reference || ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {receiptDate ? new Date(receiptDate).toLocaleDateString('ar-EG') : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-900">{customerName}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${methodColors[receipt.payment_method] || 'bg-gray-100 text-gray-700'}`}>
                                                {methodLabels[receipt.payment_method] || receipt.payment_method}
                                            </span>
                                            {vaultName && <div className="text-xs text-gray-500 mt-1">{vaultName}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-left font-mono font-bold text-green-600">
                                            +{(receipt.amount || 0).toLocaleString('ar-EG')} ج.م
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="عرض">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="طباعة">
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
