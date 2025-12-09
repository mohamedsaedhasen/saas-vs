'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    Download,
    Filter,
    Search,
    Calendar,
    ChevronDown,
    X,
    ArrowDownToLine,
} from 'lucide-react';
import type { ExpenseVoucherFilters, PaymentMethod, VoucherStatus } from '@/types/expenses';

interface LedgerFiltersProps {
    filters: ExpenseVoucherFilters;
    onFiltersChange: (filters: ExpenseVoucherFilters) => void;
    onExportExcel?: () => void;
    onExportPdf?: () => void;
    categories?: { id: string; code: string; name: string }[];
    costCenters?: { id: string; code: string; name: string }[];
}

export function LedgerFilters({
    filters,
    onFiltersChange,
    onExportExcel,
    onExportPdf,
    categories = [],
    costCenters = [],
}: LedgerFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const updateFilter = <K extends keyof ExpenseVoucherFilters>(
        key: K,
        value: ExpenseVoucherFilters[K]
    ) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onFiltersChange({});
    };

    const hasActiveFilters = Object.values(filters).some(
        (v) => v !== undefined && v !== ''
    );

    // Preset date ranges
    const setDateRange = (range: 'today' | 'week' | 'month' | 'quarter' | 'year') => {
        const now = new Date();
        let from: Date;

        switch (range) {
            case 'today':
                from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                from = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                break;
            case 'year':
                from = new Date(now.getFullYear(), 0, 1);
                break;
        }

        onFiltersChange({
            ...filters,
            date_from: from.toISOString().split('T')[0],
            date_to: now.toISOString().split('T')[0],
        });
    };

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Main toolbar */}
            <div className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search
                        size={18}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                        type="text"
                        placeholder="بحث بالرقم أو الوصف..."
                        value={filters.search || ''}
                        onChange={(e) => updateFilter('search', e.target.value || undefined)}
                        className="w-full pr-10 pl-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>

                {/* Quick date presets */}
                <div className="flex items-center gap-2 flex-wrap">
                    {[
                        { label: 'اليوم', value: 'today' },
                        { label: 'الأسبوع', value: 'week' },
                        { label: 'الشهر', value: 'month' },
                        { label: 'الربع', value: 'quarter' },
                        { label: 'السنة', value: 'year' },
                    ].map((preset) => (
                        <button
                            key={preset.value}
                            onClick={() => setDateRange(preset.value as any)}
                            className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={cn(
                            'flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors',
                            isExpanded || hasActiveFilters
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border hover:bg-muted'
                        )}
                    >
                        <Filter size={16} />
                        فلاتر متقدمة
                        {hasActiveFilters && (
                            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                {Object.values(filters).filter((v) => v !== undefined && v !== '').length}
                            </span>
                        )}
                        <ChevronDown
                            size={14}
                            className={cn('transition-transform', isExpanded && 'rotate-180')}
                        />
                    </button>

                    {/* Export */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
                            <Download size={16} />
                            تصدير
                            <ChevronDown size={14} />
                        </button>
                        <div className="absolute left-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[120px]">
                            <button
                                onClick={onExportExcel}
                                className="w-full px-4 py-2 text-sm text-right hover:bg-muted transition-colors flex items-center gap-2"
                            >
                                <ArrowDownToLine size={14} />
                                Excel
                            </button>
                            <button
                                onClick={onExportPdf}
                                className="w-full px-4 py-2 text-sm text-right hover:bg-muted transition-colors flex items-center gap-2 border-t border-border"
                            >
                                <ArrowDownToLine size={14} />
                                PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded filters */}
            {isExpanded && (
                <div className="p-4 border-t border-border bg-muted/30">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Date from */}
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                من تاريخ
                            </label>
                            <div className="relative">
                                <Calendar
                                    size={16}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                />
                                <input
                                    type="date"
                                    value={filters.date_from || ''}
                                    onChange={(e) => updateFilter('date_from', e.target.value || undefined)}
                                    className="w-full pr-10 pl-3 py-2 bg-background border border-border rounded-lg text-sm"
                                />
                            </div>
                        </div>

                        {/* Date to */}
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                إلى تاريخ
                            </label>
                            <div className="relative">
                                <Calendar
                                    size={16}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                />
                                <input
                                    type="date"
                                    value={filters.date_to || ''}
                                    onChange={(e) => updateFilter('date_to', e.target.value || undefined)}
                                    className="w-full pr-10 pl-3 py-2 bg-background border border-border rounded-lg text-sm"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        {categories.length > 0 && (
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                    التصنيف
                                </label>
                                <select
                                    value={filters.category_id || ''}
                                    onChange={(e) => updateFilter('category_id', e.target.value || undefined)}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                                >
                                    <option value="">الكل</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.code} - {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Cost Center */}
                        {costCenters.length > 0 && (
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                    مركز التكلفة
                                </label>
                                <select
                                    value={filters.cost_center_id || ''}
                                    onChange={(e) => updateFilter('cost_center_id', e.target.value || undefined)}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                                >
                                    <option value="">الكل</option>
                                    {costCenters.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.code} - {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Payment Method */}
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                طريقة الدفع
                            </label>
                            <select
                                value={filters.payment_method || ''}
                                onChange={(e) =>
                                    updateFilter('payment_method', (e.target.value as PaymentMethod) || undefined)
                                }
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                            >
                                <option value="">الكل</option>
                                <option value="cash">نقدي</option>
                                <option value="bank">تحويل بنكي</option>
                                <option value="check">شيك</option>
                                <option value="card">بطاقة</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                الحالة
                            </label>
                            <select
                                value={filters.status || ''}
                                onChange={(e) =>
                                    updateFilter('status', (e.target.value as VoucherStatus) || undefined)
                                }
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                            >
                                <option value="">الكل</option>
                                <option value="draft">مسودة</option>
                                <option value="confirmed">مؤكد</option>
                                <option value="cancelled">ملغي</option>
                            </select>
                        </div>

                        {/* Amount min */}
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                المبلغ من
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={filters.amount_min || ''}
                                onChange={(e) =>
                                    updateFilter('amount_min', e.target.value ? parseFloat(e.target.value) : undefined)
                                }
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                                placeholder="0"
                            />
                        </div>

                        {/* Amount max */}
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                المبلغ إلى
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={filters.amount_max || ''}
                                onChange={(e) =>
                                    updateFilter('amount_max', e.target.value ? parseFloat(e.target.value) : undefined)
                                }
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                                placeholder="999999"
                            />
                        </div>
                    </div>

                    {/* Clear filters */}
                    {hasActiveFilters && (
                        <div className="mt-4 pt-4 border-t border-border">
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                                <X size={14} />
                                مسح الفلاتر
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
