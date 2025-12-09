'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    Plus,
    Calendar,
    Clock,
    Play,
    Pause,
    Edit,
    Trash2,
    RefreshCw,
    CheckCircle,
    AlertCircle,
    ChevronDown,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScheduledExpense, RecurringFrequency } from '@/types/expenses';

const frequencyLabels: Record<RecurringFrequency, string> = {
    daily: 'يومي',
    weekly: 'أسبوعي',
    monthly: 'شهري',
    quarterly: 'ربع سنوي',
    yearly: 'سنوي',
};

export default function ScheduledExpensesPage() {
    const [expenses, setExpenses] = useState<ScheduledExpense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/expenses/scheduled');
            const data = await res.json();

            if (Array.isArray(data)) {
                setExpenses(data);
            } else if (data && Array.isArray(data.data)) {
                setExpenses(data.data);
            } else {
                setExpenses([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
            setExpenses([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        await fetchExpenses();
    };

    const handleToggleActive = async (id: string) => {
        const expense = expenses.find(e => e.id === id);
        if (!expense) return;

        try {
            await fetch(`/api/expenses/scheduled/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !expense.is_active }),
            });
            setExpenses((prev) =>
                prev.map((e) => (e.id === id ? { ...e, is_active: !e.is_active } : e))
            );
        } catch (err) {
            console.error('Error toggling:', err);
        }
    };

    const handleGenerateNow = async (id: string) => {
        try {
            await fetch(`/api/expenses/scheduled/${id}/generate`, {
                method: 'POST',
            });
            handleRefresh();
        } catch (err) {
            console.error('Error generating:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المصروف المجدول؟')) return;
        try {
            await fetch(`/api/expenses/scheduled/${id}`, {
                method: 'DELETE',
            });
            setExpenses((prev) => prev.filter((e) => e.id !== id));
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    // Count upcoming and overdue
    const now = new Date();
    const upcoming = expenses.filter((e) => {
        if (!e.next_due_date || !e.is_active) return false;
        const due = new Date(e.next_due_date);
        const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
    });

    const overdue = expenses.filter((e) => {
        if (!e.next_due_date || !e.is_active) return false;
        return new Date(e.next_due_date) < now;
    });

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
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/expenses"
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                    >
                        <ArrowRight size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">المصاريف المجدولة</h1>
                        <p className="text-muted-foreground mt-1">
                            إدارة المصاريف المتكررة والجدولة التلقائية
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                        disabled={isLoading}
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                        <Plus size={18} />
                        إضافة مصروف مجدول
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="text-sm text-muted-foreground">إجمالي المجدولات</div>
                    <div className="text-2xl font-bold mt-1">{expenses.length}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="text-sm text-muted-foreground">نشطة</div>
                    <div className="text-2xl font-bold mt-1 text-emerald-600">
                        {expenses.filter((e) => e.is_active).length}
                    </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="text-sm text-muted-foreground">مستحقة خلال 7 أيام</div>
                    <div className="text-2xl font-bold mt-1 text-amber-600">{upcoming.length}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="text-sm text-muted-foreground">متأخرة</div>
                    <div className="text-2xl font-bold mt-1 text-red-600">{overdue.length}</div>
                </div>
            </div>

            {/* Alerts */}
            {overdue.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} className="text-red-600" />
                        <div>
                            <div className="font-medium text-red-900">مصاريف متأخرة!</div>
                            <div className="text-sm text-red-700">
                                يوجد {overdue.length} مصروف متأخر يحتاج للصرف
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {upcoming.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Clock size={20} className="text-amber-600" />
                        <div>
                            <div className="font-medium text-amber-900">مصاريف مستحقة قريباً</div>
                            <div className="text-sm text-amber-700">
                                يوجد {upcoming.length} مصروف مستحق خلال الأسبوع القادم
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border bg-muted/50">
                            <th className="text-right py-3 px-4 font-medium text-sm">المصروف</th>
                            <th className="text-right py-3 px-4 font-medium text-sm">التصنيف</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">المبلغ</th>
                            <th className="text-center py-3 px-4 font-medium text-sm">التكرار</th>
                            <th className="text-center py-3 px-4 font-medium text-sm">الاستحقاق التالي</th>
                            <th className="text-center py-3 px-4 font-medium text-sm">الحالة</th>
                            <th className="text-center py-3 px-4 font-medium text-sm">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map((expense) => {
                            const isOverdue = expense.next_due_date && new Date(expense.next_due_date) < now;
                            const isDueSoon = expense.next_due_date && !isOverdue &&
                                ((new Date(expense.next_due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) <= 7;

                            return (
                                <tr
                                    key={expense.id}
                                    className={cn(
                                        'border-b border-border/50 hover:bg-muted/30 transition-colors',
                                        !expense.is_active && 'opacity-50'
                                    )}
                                >
                                    <td className="py-3 px-4">
                                        <div className="font-medium">{expense.name}</div>
                                        <div className="text-xs text-muted-foreground">{expense.description}</div>
                                        {expense.supplier_name && (
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                المورد: {expense.supplier_name}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm">{expense.category_name}</div>
                                        <div className="text-xs text-muted-foreground font-mono">
                                            {expense.category_code}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-left">
                                        <div className="font-semibold">{(expense.amount || 0).toLocaleString('ar-EG')}</div>
                                        <div className="text-xs text-muted-foreground">ج.م</div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className="px-2 py-1 bg-muted rounded text-xs">
                                            {frequencyLabels[expense.frequency] || expense.frequency}
                                        </span>
                                        {expense.day_of_month && (
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                يوم {expense.day_of_month}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {expense.next_due_date ? (
                                            <div
                                                className={cn(
                                                    'text-sm',
                                                    isOverdue && 'text-red-600 font-medium',
                                                    isDueSoon && 'text-amber-600'
                                                )}
                                            >
                                                {expense.next_due_date}
                                                {isOverdue && (
                                                    <div className="text-xs">متأخر!</div>
                                                )}
                                            </div>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {expense.is_active ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                <CheckCircle size={12} /> نشط
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                <Pause size={12} /> متوقف
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleGenerateNow(expense.id)}
                                                className="p-1.5 hover:bg-primary/10 rounded-lg text-primary"
                                                title="إنشاء سند الآن"
                                            >
                                                <Play size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(expense.id)}
                                                className={cn(
                                                    'p-1.5 rounded-lg',
                                                    expense.is_active
                                                        ? 'hover:bg-amber-100 text-amber-600'
                                                        : 'hover:bg-emerald-100 text-emerald-600'
                                                )}
                                                title={expense.is_active ? 'إيقاف' : 'تفعيل'}
                                            >
                                                {expense.is_active ? <Pause size={16} /> : <Play size={16} />}
                                            </button>
                                            <button
                                                onClick={() => { }}
                                                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"
                                                title="تعديل"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="p-1.5 hover:bg-red-100 rounded-lg text-red-600"
                                                title="حذف"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {expenses.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">
                        <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                        <p>لا توجد مصاريف مجدولة</p>
                    </div>
                )}
            </div>
        </div>
    );
}
