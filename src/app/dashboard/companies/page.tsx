'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Loader2, AlertCircle } from 'lucide-react';

interface Company {
    id: string;
    name: string;
    tax_number?: string;
    address?: string;
    phone?: string;
    email?: string;
    branches_count?: number;
    users_count?: number;
    status: 'active' | 'inactive';
    is_active?: boolean;
    is_main?: boolean;
    is_default?: boolean;
}

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        async function fetchCompanies() {
            try {
                setIsLoading(true);
                const res = await fetch('/api/companies');
                const data = await res.json();

                if (Array.isArray(data)) {
                    setCompanies(data);
                } else if (data && Array.isArray(data.data)) {
                    setCompanies(data.data);
                } else {
                    setCompanies([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
                setCompanies([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchCompanies();
    }, []);

    const mainCompanies = companies.filter(c => c.is_main || c.is_default);
    const branches = companies.filter(c => !c.is_main && !c.is_default);
    const totalUsers = companies.reduce((sum, c) => sum + (c.users_count || 0), 0);
    const activeCompanies = companies.filter(c => c.status === 'active' || c.is_active).length;

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
                        <span className="text-gray-900">الشركات والفروع</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">الشركات والفروع</h1>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    إضافة فرع
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">عدد الشركات</div>
                    <div className="text-2xl font-bold text-gray-900">{mainCompanies.length}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">عدد الفروع</div>
                    <div className="text-2xl font-bold text-indigo-600">{branches.length}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">إجمالي المستخدمين</div>
                    <div className="text-2xl font-bold text-green-600">{totalUsers}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">فروع نشطة</div>
                    <div className="text-2xl font-bold text-blue-600">{activeCompanies}</div>
                </div>
            </div>

            {/* Empty State */}
            {companies.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl shadow-sm">
                    <span className="text-6xl mb-4">🏢</span>
                    <h3 className="text-lg font-semibold mb-2">لا توجد شركات</h3>
                    <p className="text-gray-500 mb-4">ابدأ بإضافة شركة أو فرع جديد</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <Plus size={18} />
                        إضافة فرع
                    </button>
                </div>
            )}

            {/* Companies Grid */}
            {companies.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companies.map((company) => {
                        const isMain = company.is_main || company.is_default;
                        const isActive = company.status === 'active' || company.is_active;

                        return (
                            <div key={company.id} className={`bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow ${isMain ? 'ring-2 ring-indigo-500' : ''}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                                        <span className="text-2xl">{isMain ? '🏢' : '🏬'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isMain && (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">الرئيسية</span>
                                        )}
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {isActive ? 'نشط' : 'غير نشط'}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-2">{company.name}</h3>
                                {company.address && <p className="text-sm text-gray-500 mb-1">{company.address}</p>}
                                {company.tax_number && <p className="text-sm text-gray-500 mb-4 font-mono">{company.tax_number}</p>}

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                    <div>
                                        <div className="text-sm text-gray-500">المستخدمين</div>
                                        <div className="font-bold text-gray-900">{company.users_count || 0}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">الفروع</div>
                                        <div className="font-bold text-gray-900">{company.branches_count || 0}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                                    <Link
                                        href={`/dashboard/companies/${company.id}`}
                                        className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors text-center"
                                    >
                                        إدارة
                                    </Link>
                                    <button className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">إضافة فرع جديد</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الفرع</label>
                                <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                                <textarea rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none resize-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                                <input type="tel" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                                <input type="email" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" />
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
