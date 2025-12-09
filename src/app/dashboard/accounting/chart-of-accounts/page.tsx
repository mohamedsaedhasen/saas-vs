'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Loader2, AlertCircle } from 'lucide-react';

// Account Types
type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

interface Account {
    id: string;
    code: string;
    name: string;
    type: AccountType;
    account_type?: AccountType;
    parent_id: string | null;
    is_group: boolean;
    balance: number;
    current_balance?: number;
    children?: Account[];
}

const typeColors: Record<AccountType, string> = {
    asset: 'bg-blue-100 text-blue-700',
    liability: 'bg-red-100 text-red-700',
    equity: 'bg-purple-100 text-purple-700',
    revenue: 'bg-green-100 text-green-700',
    expense: 'bg-orange-100 text-orange-700',
};

const typeLabels: Record<AccountType, string> = {
    asset: 'أصول',
    liability: 'خصوم',
    equity: 'حقوق ملكية',
    revenue: 'إيرادات',
    expense: 'مصروفات',
};

function AccountRow({ account, level = 0 }: { account: Account; level?: number }) {
    const [expanded, setExpanded] = useState(level < 2);
    const accountType = account.type || account.account_type || 'asset';
    const balance = account.balance || account.current_balance || 0;

    return (
        <>
            <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2" style={{ paddingRight: `${level * 20}px` }}>
                        {account.is_group && account.children && account.children.length > 0 ? (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
                            >
                                <svg
                                    className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ) : (
                            <span className="w-6" />
                        )}
                        <span className={`font-mono text-sm ${account.is_group ? 'font-bold' : ''}`}>
                            {account.code}
                        </span>
                    </div>
                </td>
                <td className="px-4 py-3">
                    <span className={account.is_group ? 'font-semibold text-gray-900' : 'text-gray-700'}>
                        {account.name}
                    </span>
                </td>
                <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[accountType] || 'bg-gray-100 text-gray-700'}`}>
                        {typeLabels[accountType] || accountType}
                    </span>
                </td>
                <td className="px-4 py-3 text-left font-mono">
                    {balance.toLocaleString('ar-EG')} ج.م
                </td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        {!account.is_group && (
                            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                </td>
            </tr>
            {expanded && account.children?.map((child) => (
                <AccountRow key={child.id} account={child} level={level + 1} />
            ))}
        </>
    );
}

export default function ChartOfAccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<AccountType | 'all'>('all');
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        async function fetchAccounts() {
            try {
                setIsLoading(true);
                const res = await fetch('/api/accounting/chart-of-accounts');
                const data = await res.json();

                if (Array.isArray(data)) {
                    setAccounts(data);
                } else if (data && Array.isArray(data.data)) {
                    setAccounts(data.data);
                } else {
                    setAccounts([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
                setAccounts([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAccounts();
    }, []);

    const filteredAccounts = accounts.filter((account) => {
        const accountType = account.type || account.account_type;
        if (filterType !== 'all' && accountType !== filterType) return false;
        return true;
    });

    // Calculate totals by type
    const typeTotals = accounts.reduce((acc, account) => {
        const accountType = account.type || account.account_type || 'asset';
        const balance = account.balance || account.current_balance || 0;
        acc[accountType] = (acc[accountType] || 0) + balance;
        return acc;
    }, {} as Record<string, number>);

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
                        <span className="text-gray-900">شجرة الحسابات</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">شجرة الحسابات</h1>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    إضافة حساب
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="بحث بالاسم أو الكود..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                        <svg
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as AccountType | 'all')}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                >
                    <option value="all">كل الأنواع</option>
                    <option value="asset">الأصول</option>
                    <option value="liability">الخصوم</option>
                    <option value="equity">حقوق الملكية</option>
                    <option value="revenue">الإيرادات</option>
                    <option value="expense">المصروفات</option>
                </select>

                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    تصدير
                </button>
            </div>

            {/* Empty State */}
            {filteredAccounts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl shadow-sm">
                    <span className="text-6xl mb-4">📊</span>
                    <h3 className="text-lg font-semibold mb-2">لا توجد حسابات</h3>
                    <p className="text-gray-500 mb-4">ابدأ بإضافة حساب جديد</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <Plus size={18} />
                        إضافة حساب
                    </button>
                </div>
            )}

            {/* Accounts Table */}
            {filteredAccounts.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">الكود</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">اسم الحساب</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">النوع</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">الرصيد</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAccounts.map((account) => (
                                <AccountRow key={account.id} account={account} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(typeLabels).map(([type, label]) => {
                    const total = typeTotals[type] || 0;
                    return (
                        <div key={type} className="bg-white rounded-xl p-4 shadow-sm">
                            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${typeColors[type as AccountType]}`}>
                                {label}
                            </div>
                            <div className="text-xl font-bold text-gray-900">
                                {total.toLocaleString('ar-EG')} ج.م
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Account Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">إضافة حساب جديد</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">كود الحساب</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    placeholder="مثال: 1101"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الحساب</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    placeholder="مثال: الصندوق الرئيسي"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">نوع الحساب</label>
                                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none">
                                    <option value="">اختر نوع الحساب</option>
                                    <option value="asset">أصول</option>
                                    <option value="liability">خصوم</option>
                                    <option value="equity">حقوق ملكية</option>
                                    <option value="revenue">إيرادات</option>
                                    <option value="expense">مصروفات</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الحساب الأب</label>
                                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none">
                                    <option value="">بدون (حساب رئيسي)</option>
                                    {accounts.filter(a => a.is_group).map(a => (
                                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="is_group" className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                                <label htmlFor="is_group" className="text-sm text-gray-700">هذا حساب مجموعة (يحتوي على حسابات فرعية)</label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                                >
                                    حفظ الحساب
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
