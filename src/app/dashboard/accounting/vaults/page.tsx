'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Loader2, AlertCircle, Vault } from 'lucide-react';

interface VaultType {
    id: string;
    name: string;
    code: string;
    balance: number;
    currency: string;
    branch?: string;
    branch_name?: string;
    last_transaction?: string;
    status: 'active' | 'inactive';
    is_active?: boolean;
}

export default function VaultsPage() {
    const [vaults, setVaults] = useState<VaultType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        async function fetchVaults() {
            try {
                setIsLoading(true);
                const res = await fetch('/api/accounting/vaults');
                const data = await res.json();

                if (Array.isArray(data)) {
                    setVaults(data);
                } else if (data && Array.isArray(data.data)) {
                    setVaults(data.data);
                } else {
                    setVaults([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
                setVaults([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchVaults();
    }, []);

    const totalBalance = vaults.reduce((sum, v) => sum + (v.balance || 0), 0);
    const activeVaults = vaults.filter(v => v.status === 'active' || v.is_active).length;

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
                        <span className="text-gray-900">الخزن</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">الخزن</h1>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    إضافة خزنة
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">عدد الخزن</div>
                    <div className="text-2xl font-bold text-gray-900">{vaults.length}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">خزن نشطة</div>
                    <div className="text-2xl font-bold text-green-600">{activeVaults}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm md:col-span-1 col-span-2">
                    <div className="text-sm text-gray-500">إجمالي الأرصدة</div>
                    <div className="text-2xl font-bold text-indigo-600">{totalBalance.toLocaleString('ar-EG')} ج.م</div>
                </div>
            </div>

            {/* Empty State */}
            {vaults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl shadow-sm">
                    <span className="text-6xl mb-4">🏦</span>
                    <h3 className="text-lg font-semibold mb-2">لا توجد خزن</h3>
                    <p className="text-gray-500 mb-4">ابدأ بإضافة خزنة جديدة</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <Plus size={18} />
                        إضافة خزنة
                    </button>
                </div>
            )}

            {/* Vaults Grid */}
            {vaults.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vaults.map((vault) => (
                        <div key={vault.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                                    <span className="text-2xl">🏦</span>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${(vault.status === 'active' || vault.is_active) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {(vault.status === 'active' || vault.is_active) ? 'نشط' : 'غير نشط'}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1">{vault.name}</h3>
                            <p className="text-sm text-gray-500 font-mono mb-2">{vault.code}</p>
                            <p className="text-sm text-gray-600 mb-4">{vault.branch || vault.branch_name || 'الفرع الرئيسي'}</p>

                            <div className="p-4 bg-indigo-50 rounded-xl mb-4">
                                <div className="text-sm text-indigo-600 mb-1">الرصيد الحالي</div>
                                <div className="text-2xl font-bold text-indigo-700">{(vault.balance || 0).toLocaleString('ar-EG')} ج.م</div>
                            </div>

                            {vault.last_transaction && (
                                <div className="text-sm text-gray-500">
                                    آخر معاملة: {new Date(vault.last_transaction).toLocaleDateString('ar-EG')}
                                </div>
                            )}

                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                                <Link href={`/dashboard/payments/receipts/new?vault=${vault.id}`} className="flex-1 py-2 rounded-lg bg-green-100 text-green-700 text-sm font-medium text-center hover:bg-green-200 transition-colors">
                                    إيداع
                                </Link>
                                <Link href={`/dashboard/payments/payments/new?vault=${vault.id}`} className="flex-1 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-medium text-center hover:bg-red-200 transition-colors">
                                    سحب
                                </Link>
                                <button className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">إضافة خزنة جديدة</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الخزنة</label>
                                <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">كود الخزنة</label>
                                <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الفرع</label>
                                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-indigo-500 outline-none">
                                    <option>الفرع الرئيسي</option>
                                    <option>فرع الإسكندرية</option>
                                </select>
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
