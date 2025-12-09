'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Loader2, AlertCircle } from 'lucide-react';

interface JournalEntry {
    id: string;
    entry_number: string;
    date?: string;
    entry_date?: string;
    description: string;
    debit_total?: number;
    credit_total?: number;
    total_debit?: number;
    total_credit?: number;
    status: 'draft' | 'posted' | 'cancelled';
    created_by?: string;
    created_by_user?: { name: string };
    lines?: {
        account_code?: string;
        account_name?: string;
        account?: { code: string; name: string };
        debit: number;
        credit: number;
        description?: string;
    }[];
    journal_entry_lines?: {
        account_code?: string;
        account_name?: string;
        account?: { code: string; name: string };
        debit: number;
        credit: number;
        description?: string;
    }[];
}

const statusColors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-700',
    posted: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
    draft: 'مسودة',
    posted: 'مرحّل',
    cancelled: 'ملغي',
};

export default function JournalEntriesPage() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
    const [showNewEntryModal, setShowNewEntryModal] = useState(false);

    useEffect(() => {
        async function fetchEntries() {
            try {
                setIsLoading(true);
                const res = await fetch('/api/accounting/journal-entries');
                const data = await res.json();

                if (Array.isArray(data)) {
                    setEntries(data);
                } else if (data && Array.isArray(data.data)) {
                    setEntries(data.data);
                } else {
                    setEntries([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
                setEntries([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchEntries();
    }, []);

    const filteredEntries = entries.filter((entry) => {
        if (filterStatus !== 'all' && entry.status !== filterStatus) return false;
        if (searchTerm && !entry.description?.includes(searchTerm) && !entry.entry_number?.includes(searchTerm)) return false;
        return true;
    });

    const postedCount = entries.filter((e) => e.status === 'posted').length;
    const draftCount = entries.filter((e) => e.status === 'draft').length;

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
                        <span className="text-gray-900">قيود اليومية</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">قيود اليومية</h1>
                </div>
                <button
                    onClick={() => setShowNewEntryModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    قيد جديد
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="بحث برقم القيد أو الوصف..."
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

                <input
                    type="date"
                    className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                >
                    <option value="all">كل الحالات</option>
                    <option value="draft">مسودة</option>
                    <option value="posted">مرحّل</option>
                    <option value="cancelled">ملغي</option>
                </select>
            </div>

            {/* Empty State */}
            {filteredEntries.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl shadow-sm">
                    <span className="text-6xl mb-4">📝</span>
                    <h3 className="text-lg font-semibold mb-2">لا توجد قيود</h3>
                    <p className="text-gray-500 mb-4">ابدأ بإنشاء قيد يومية جديد</p>
                    <button
                        onClick={() => setShowNewEntryModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <Plus size={18} />
                        قيد جديد
                    </button>
                </div>
            )}

            {/* Entries List */}
            {filteredEntries.length > 0 && (
                <div className="space-y-4">
                    {filteredEntries.map((entry) => {
                        const debitTotal = entry.debit_total || entry.total_debit || 0;
                        const creditTotal = entry.credit_total || entry.total_credit || 0;
                        const entryDate = entry.date || entry.entry_date;
                        const createdBy = entry.created_by || entry.created_by_user?.name || '';
                        const lines = entry.lines || entry.journal_entry_lines || [];

                        return (
                            <div key={entry.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                {/* Entry Header */}
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-medium text-gray-900">{entry.entry_number}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[entry.status] || 'bg-gray-100 text-gray-700'}`}>
                                                    {statusLabels[entry.status] || entry.status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-500">{entry.description}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-left">
                                            <div className="text-sm text-gray-500">المبلغ</div>
                                            <div className="font-mono font-medium text-gray-900">{debitTotal.toLocaleString('ar-EG')} ج.م</div>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm text-gray-500">التاريخ</div>
                                            <div className="text-gray-900">{entryDate ? new Date(entryDate).toLocaleDateString('ar-EG') : '-'}</div>
                                        </div>
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform ${expandedEntry === entry.id ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Entry Details */}
                                {expandedEntry === entry.id && lines.length > 0 && (
                                    <div className="border-t border-gray-100 p-4">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="text-sm text-gray-500">
                                                    <th className="text-right py-2 font-medium">الحساب</th>
                                                    <th className="text-left py-2 font-medium">مدين</th>
                                                    <th className="text-left py-2 font-medium">دائن</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {lines.map((line, index) => {
                                                    const accountCode = line.account_code || line.account?.code || '';
                                                    const accountName = line.account_name || line.account?.name || '';
                                                    return (
                                                        <tr key={index} className="border-t border-gray-50">
                                                            <td className="py-2">
                                                                <span className="font-mono text-sm text-gray-500">{accountCode}</span>
                                                                <span className="mx-2">-</span>
                                                                <span className="text-gray-900">{accountName}</span>
                                                            </td>
                                                            <td className="py-2 text-left font-mono">
                                                                {line.debit > 0 ? `${line.debit.toLocaleString('ar-EG')} ج.م` : '-'}
                                                            </td>
                                                            <td className="py-2 text-left font-mono">
                                                                {line.credit > 0 ? `${line.credit.toLocaleString('ar-EG')} ج.م` : '-'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                <tr className="border-t-2 border-gray-200 font-bold">
                                                    <td className="py-2">الإجمالي</td>
                                                    <td className="py-2 text-left font-mono">{debitTotal.toLocaleString('ar-EG')} ج.م</td>
                                                    <td className="py-2 text-left font-mono">{creditTotal.toLocaleString('ar-EG')} ج.م</td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                            <div className="text-sm text-gray-500">
                                                {createdBy && <>بواسطة: <span className="text-gray-900">{createdBy}</span></>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {entry.status === 'draft' && (
                                                    <button className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors">
                                                        ترحيل
                                                    </button>
                                                )}
                                                <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
                                                    طباعة
                                                </button>
                                                {entry.status === 'draft' && (
                                                    <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
                                                        تعديل
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">إجمالي القيود</div>
                    <div className="text-2xl font-bold text-gray-900">{entries.length}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">قيود مرحلة</div>
                    <div className="text-2xl font-bold text-green-600">{postedCount}</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-sm text-gray-500 mb-1">قيود مسودة</div>
                    <div className="text-2xl font-bold text-yellow-600">{draftCount}</div>
                </div>
            </div>
        </div>
    );
}
