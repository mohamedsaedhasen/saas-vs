'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, Plus } from 'lucide-react';

interface Contact {
    id: string;
    name: string;
    type: 'customer' | 'supplier';
    contact_type?: 'customer' | 'supplier';
    phone?: string;
    email?: string;
    address?: string;
    balance?: number;
    current_balance?: number;
    total_transactions?: number;
    transactions_count?: number;
    status: 'active' | 'inactive';
    is_active?: boolean;
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'customer' | 'supplier'>('all');

    useEffect(() => {
        async function fetchContacts() {
            try {
                setIsLoading(true);

                // Fetch both customers and suppliers
                const [customersRes, suppliersRes] = await Promise.all([
                    fetch('/api/customers'),
                    fetch('/api/suppliers'),
                ]);

                const customersData = await customersRes.json();
                const suppliersData = await suppliersRes.json();

                const customers = (Array.isArray(customersData) ? customersData : customersData?.data || []).map((c: any) => ({
                    ...c,
                    type: 'customer' as const,
                }));

                const suppliers = (Array.isArray(suppliersData) ? suppliersData : suppliersData?.data || []).map((s: any) => ({
                    ...s,
                    type: 'supplier' as const,
                }));

                setContacts([...customers, ...suppliers]);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
                setContacts([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchContacts();
    }, []);

    const filteredContacts = contacts.filter((contact) => {
        const contactType = contact.type || contact.contact_type;
        if (filterType !== 'all' && contactType !== filterType) return false;
        if (searchTerm && !contact.name?.includes(searchTerm) && !contact.phone?.includes(searchTerm)) return false;
        return true;
    });

    const customers = contacts.filter((c) => (c.type || c.contact_type) === 'customer');
    const suppliers = contacts.filter((c) => (c.type || c.contact_type) === 'supplier');
    const totalReceivable = customers.reduce((sum, c) => sum + Math.max(0, c.balance || c.current_balance || 0), 0);
    const totalPayable = Math.abs(suppliers.reduce((sum, c) => sum + Math.min(0, c.balance || c.current_balance || 0), 0));

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
                        <span className="text-gray-900">جهات الاتصال</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">جهات الاتصال</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard/contacts/customers/new"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        <Plus size={18} />
                        عميل جديد
                    </Link>
                    <Link
                        href="/dashboard/contacts/suppliers/new"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={18} />
                        مورد جديد
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">العملاء</div>
                    <div className="text-2xl font-bold text-blue-600">{customers.length}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">الموردين</div>
                    <div className="text-2xl font-bold text-purple-600">{suppliers.length}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">مستحقات العملاء</div>
                    <div className="text-2xl font-bold text-green-600">{totalReceivable.toLocaleString('ar-EG')} ج.م</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500">مستحقات الموردين</div>
                    <div className="text-2xl font-bold text-red-600">{totalPayable.toLocaleString('ar-EG')} ج.م</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="بحث بالاسم أو رقم الهاتف..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        />
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-1">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        الكل
                    </button>
                    <button
                        onClick={() => setFilterType('customer')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'customer' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        العملاء
                    </button>
                    <button
                        onClick={() => setFilterType('supplier')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'supplier' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        الموردين
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {filteredContacts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl shadow-sm">
                    <span className="text-6xl mb-4">👥</span>
                    <h3 className="text-lg font-semibold mb-2">لا توجد جهات اتصال</h3>
                    <p className="text-gray-500 mb-4">ابدأ بإضافة عميل أو مورد جديد</p>
                </div>
            )}

            {/* Contacts Table */}
            {filteredContacts.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">الاسم</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">النوع</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">الهاتف</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">الرصيد</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">المعاملات</th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredContacts.map((contact) => {
                                const contactType = contact.type || contact.contact_type || 'customer';
                                const balance = contact.balance || contact.current_balance || 0;
                                const transactions = contact.total_transactions || contact.transactions_count || 0;

                                return (
                                    <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${contactType === 'customer' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                                    {contact.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{contact.name}</div>
                                                    <div className="text-sm text-gray-500">{contact.email || ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${contactType === 'customer' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                {contactType === 'customer' ? 'عميل' : 'مورد'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 font-mono">{contact.phone || '-'}</td>
                                        <td className="px-4 py-3 text-left font-mono">
                                            <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {Math.abs(balance).toLocaleString('ar-EG')} ج.م
                                                {balance < 0 && ' (دائن)'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-left text-gray-600">{transactions}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/dashboard/contacts/${contactType === 'customer' ? 'customers' : 'suppliers'}/${contact.id}/statement`}
                                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors"
                                                    title="كشف حساب"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </Link>
                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors" title="عرض">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors" title="تعديل">
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
        </div>
    );
}
