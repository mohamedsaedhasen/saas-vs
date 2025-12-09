'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Loader2, AlertCircle, Warehouse } from 'lucide-react';

interface WarehouseType {
    id: string;
    name: string;
    code: string;
    address?: string;
    manager?: string;
    manager_name?: string;
    products_count?: number;
    total_value?: number;
    status: 'active' | 'inactive';
    is_active?: boolean;
}

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        async function fetchWarehouses() {
            try {
                setIsLoading(true);
                const res = await fetch('/api/inventory/warehouses');
                const data = await res.json();

                if (Array.isArray(data)) {
                    setWarehouses(data);
                } else if (data && Array.isArray(data.data)) {
                    setWarehouses(data.data);
                } else {
                    setWarehouses([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
                setWarehouses([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchWarehouses();
    }, []);

    const filteredWarehouses = warehouses.filter((wh) =>
        wh.name?.includes(searchTerm) || wh.code?.includes(searchTerm)
    );

    const totalProducts = warehouses.reduce((sum, wh) => sum + (wh.products_count || 0), 0);
    const totalValue = warehouses.reduce((sum, wh) => sum + (wh.total_value || 0), 0);
    const activeWarehouses = warehouses.filter(w => w.status === 'active' || w.is_active).length;

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
                        <span className="text-gray-900">المخازن</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">المخازن</h1>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    إضافة مخزن
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">عدد المخازن</div>
                    <div className="text-2xl font-bold text-gray-900">{warehouses.length}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">مخازن نشطة</div>
                    <div className="text-2xl font-bold text-green-600">{activeWarehouses}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">إجمالي المنتجات</div>
                    <div className="text-2xl font-bold text-blue-600">{totalProducts}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">إجمالي القيمة</div>
                    <div className="text-2xl font-bold text-indigo-600">{totalValue.toLocaleString('ar-EG')} ج.م</div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="relative max-w-md">
                    <input
                        type="text"
                        placeholder="بحث بالاسم أو الكود..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Empty State */}
            {filteredWarehouses.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl shadow-sm">
                    <span className="text-6xl mb-4">🏭</span>
                    <h3 className="text-lg font-semibold mb-2">لا توجد مخازن</h3>
                    <p className="text-gray-500 mb-4">ابدأ بإضافة مخزن جديد</p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <Plus size={18} />
                        إضافة مخزن
                    </button>
                </div>
            )}

            {/* Warehouses Grid */}
            {filteredWarehouses.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWarehouses.map((warehouse) => (
                        <div key={warehouse.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${(warehouse.status === 'active' || warehouse.is_active) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {(warehouse.status === 'active' || warehouse.is_active) ? 'نشط' : 'غير نشط'}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1">{warehouse.name}</h3>
                            <p className="text-sm text-gray-500 font-mono mb-3">{warehouse.code}</p>
                            {warehouse.address && <p className="text-sm text-gray-600 mb-4">{warehouse.address}</p>}

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                <div>
                                    <div className="text-sm text-gray-500">المنتجات</div>
                                    <div className="font-bold text-gray-900">{warehouse.products_count || 0}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">القيمة</div>
                                    <div className="font-bold text-gray-900">{(warehouse.total_value || 0).toLocaleString('ar-EG')}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                                <Link
                                    href={`/dashboard/inventory/warehouses/${warehouse.id}`}
                                    className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors text-center"
                                >
                                    عرض المخزون
                                </Link>
                                <button className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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
                            <h2 className="text-xl font-bold text-gray-900">إضافة مخزن جديد</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المخزن</label>
                                <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">كود المخزن</label>
                                <input type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                                <textarea rows={2} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none resize-none" />
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
