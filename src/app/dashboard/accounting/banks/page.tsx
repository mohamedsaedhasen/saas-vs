'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Loader2, AlertCircle } from 'lucide-react';

interface Bank {
    id: string;
    name: string;
    account_number?: string;
    iban?: string;
    balance?: number;
    current_balance?: number;
    currency?: string;
    branch?: string;
    branch_name?: string;
    status?: 'active' | 'inactive';
    is_active?: boolean;
}

export default function BanksPage() {
    const [banks, setBanks] = useState<Bank[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        async function fetchBanks() {
            try {
                setIsLoading(true);
                const res = await fetch('/api/accounting/banks');
                const data = await res.json();

                if (Array.isArray(data)) {
                    setBanks(data);
                } else if (data && Array.isArray(data.data)) {
                    setBanks(data.data);
                } else {
                    setBanks([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
                setBanks([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchBanks();
    }, []);

    const totalBalance = banks.reduce((sum, b) => sum + (b.balance || b.current_balance || 0), 0);
    const activeBanks = banks.filter(b => b.status === 'active' || b.is_active !== false);

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
                        <Link href="/dashboard/accounting" className="hover:text-indigo-600">المحاسبة</Link>
                        <span>/</span>
                        <span className="text-gray-900">البنوك</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">الحسابات البنكية</h1>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    إضافة حساب بنكي
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">عدد الحسابات</div>
                    <div className="text-2xl font-bold text-gray-900">{banks.length}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">حسابات نشطة</div>
                    <div className="text-2xl font-bold text-green-600">{activeBanks.length}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm md:col-span-1 col-span-2">
                    <div className="text-sm text-gray-500">إجمالي الأرصدة</div>
                    <div className="text-2xl font-bold text-indigo-600">{totalBalance.toLocaleString('ar-EG')} ج.م</div>
                </div>
            </div>

            {/* Empty State */}
            {banks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl shadow-sm">
                    <span className="text-6xl mb-4">🏛️</span>
                    <h3 className="text-lg font-semibold mb-2">لا توجد حسابات بنكية</h3>
                    <p className="text-gray-500 mb-4">ابدأ بإضافة حساب بنكي جديد</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <Plus size={18} />
                        إضافة حساب بنكي
                    </button>
                </div>
            )}

            {/* Banks Table */}
            {banks.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">البنك</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">رقم الحساب</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">الفرع</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">الرصيد</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">الحالة</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {banks.map((bank) => {
                                const balance = bank.balance || bank.current_balance || 0;
                                const isActive = bank.status === 'active' || bank.is_active !== false;
                                const branchName = bank.branch || bank.branch_name || '-';

                                return (
                                    <tr key={bank.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                                    <span className="text-lg">🏛️</span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{bank.name}</div>
                                                    {bank.iban && (
                                                        <div className="text-xs text-gray-500 font-mono">{bank.iban.slice(0, 20)}...</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-gray-600">{bank.account_number || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600">{branchName}</td>
                                        <td className="px-4 py-3 text-left">
                                            <span className="font-mono font-bold text-gray-900">{balance.toLocaleString('ar-EG')} ج.م</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {isActive ? 'نشط' : 'غير نشط'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200 transition-colors">
                                                    إيداع
                                                </button>
                                                <button className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition-colors">
                                                    سحب
                                                </button>
                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">إضافة حساب بنكي</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">اسم البنك</label>
                                <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الحساب</label>
                                <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                                <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">فرع البنك</label>
                                <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الرصيد الافتتاحي</label>
                                <input type="number" defaultValue="0" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">
                                    إلغاء
                                </button>
                                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700">
                                    حفظ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
