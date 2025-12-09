'use client';

import React, { useState } from 'react';
import {
    X,
    Download,
    FileSpreadsheet,
    FileText as FilePdf,
    FileText,
    Check,
    Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExportReportType, ExpenseVoucherFilters } from '@/types/expenses';

interface ExportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: ExportOptions) => void;
    defaultFilters?: ExpenseVoucherFilters;
}

interface ExportOptions {
    report_type: ExportReportType;
    format: 'excel' | 'pdf' | 'csv';
    filters: ExpenseVoucherFilters;
    include_summary: boolean;
    include_charts: boolean;
    grouping?: 'category' | 'date' | 'cost_center' | 'supplier';
    language: 'ar' | 'en';
}

const reportTypes: { id: ExportReportType; label: string; description: string }[] = [
    { id: 'vouchers_list', label: 'قائمة السندات', description: 'جميع سندات الصرف مع التفاصيل' },
    { id: 'expense_tree', label: 'شجرة المصاريف', description: 'تصنيفات المصاريف مع الإجماليات' },
    { id: 'budget_comparison', label: 'مقارنة الموازنة', description: 'الموازنة مقابل الفعلي' },
    { id: 'cost_center_report', label: 'تقرير مراكز التكلفة', description: 'توزيع المصاريف على المراكز' },
    { id: 'supplier_report', label: 'تقرير الموردين', description: 'المصاريف حسب المورد' },
    { id: 'monthly_comparison', label: 'مقارنة شهرية', description: 'مقارنة بين الأشهر' },
    { id: 'category_ledger', label: 'كشف حساب تصنيف', description: 'حركات تصنيف محدد' },
];

const formatOptions = [
    { id: 'excel', label: 'Excel', icon: FileSpreadsheet, ext: '.xlsx' },
    { id: 'pdf', label: 'PDF', icon: FilePdf, ext: '.pdf' },
    { id: 'csv', label: 'CSV', icon: FileText, ext: '.csv' },
];

const groupingOptions = [
    { id: undefined, label: 'بدون تجميع' },
    { id: 'category', label: 'حسب التصنيف' },
    { id: 'date', label: 'حسب التاريخ' },
    { id: 'cost_center', label: 'حسب مركز التكلفة' },
    { id: 'supplier', label: 'حسب المورد' },
];

export function ExportDialog({ isOpen, onClose, onExport, defaultFilters = {} }: ExportDialogProps) {
    const [options, setOptions] = useState<ExportOptions>({
        report_type: 'vouchers_list',
        format: 'excel',
        filters: defaultFilters,
        include_summary: true,
        include_charts: false,
        grouping: undefined,
        language: 'ar',
    });
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        await onExport(options);
        setIsExporting(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Dialog */}
            <div className="relative bg-card rounded-xl border border-border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Download size={20} />
                        تصدير التقرير
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Report Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2">نوع التقرير</label>
                        <div className="grid grid-cols-2 gap-2">
                            {reportTypes.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setOptions((prev) => ({ ...prev, report_type: type.id }))}
                                    className={cn(
                                        'p-3 border rounded-lg text-right hover:bg-muted transition-colors',
                                        options.report_type === type.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border'
                                    )}
                                >
                                    <div className="font-medium text-sm">{type.label}</div>
                                    <div className="text-xs text-muted-foreground">{type.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Format */}
                    <div>
                        <label className="block text-sm font-medium mb-2">صيغة الملف</label>
                        <div className="flex gap-2">
                            {formatOptions.map((format) => {
                                const Icon = format.icon;
                                return (
                                    <button
                                        key={format.id}
                                        onClick={() => setOptions((prev) => ({ ...prev, format: format.id as any }))}
                                        className={cn(
                                            'flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg hover:bg-muted transition-colors',
                                            options.format === format.id
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-border'
                                        )}
                                    >
                                        <Icon size={18} />
                                        <span className="font-medium">{format.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium mb-2">الفترة</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">من</label>
                                <input
                                    type="date"
                                    value={options.filters.date_from || ''}
                                    onChange={(e) =>
                                        setOptions((prev) => ({
                                            ...prev,
                                            filters: { ...prev.filters, date_from: e.target.value || undefined },
                                        }))
                                    }
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">إلى</label>
                                <input
                                    type="date"
                                    value={options.filters.date_to || ''}
                                    onChange={(e) =>
                                        setOptions((prev) => ({
                                            ...prev,
                                            filters: { ...prev.filters, date_to: e.target.value || undefined },
                                        }))
                                    }
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Grouping */}
                    <div>
                        <label className="block text-sm font-medium mb-2">التجميع</label>
                        <select
                            value={options.grouping || ''}
                            onChange={(e) =>
                                setOptions((prev) => ({
                                    ...prev,
                                    grouping: (e.target.value as any) || undefined,
                                }))
                            }
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                        >
                            {groupingOptions.map((opt) => (
                                <option key={opt.id || 'none'} value={opt.id || ''}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Options */}
                    <div>
                        <label className="block text-sm font-medium mb-2">خيارات إضافية</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={options.include_summary}
                                    onChange={(e) =>
                                        setOptions((prev) => ({ ...prev, include_summary: e.target.checked }))
                                    }
                                    className="w-4 h-4 rounded border-border"
                                />
                                <span className="text-sm">تضمين ملخص التقرير</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={options.include_charts}
                                    onChange={(e) =>
                                        setOptions((prev) => ({ ...prev, include_charts: e.target.checked }))
                                    }
                                    className="w-4 h-4 rounded border-border"
                                    disabled={options.format === 'csv'}
                                />
                                <span className={cn('text-sm', options.format === 'csv' && 'text-muted-foreground')}>
                                    تضمين الرسوم البيانية (PDF/Excel فقط)
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Language */}
                    <div>
                        <label className="block text-sm font-medium mb-2">اللغة</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setOptions((prev) => ({ ...prev, language: 'ar' }))}
                                className={cn(
                                    'flex-1 py-2 border rounded-lg text-sm transition-colors',
                                    options.language === 'ar'
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-border hover:bg-muted'
                                )}
                            >
                                العربية
                            </button>
                            <button
                                onClick={() => setOptions((prev) => ({ ...prev, language: 'en' }))}
                                className={cn(
                                    'flex-1 py-2 border rounded-lg text-sm transition-colors',
                                    options.language === 'en'
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-border hover:bg-muted'
                                )}
                            >
                                English
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/30">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {isExporting ? (
                            <>جاري التصدير...</>
                        ) : (
                            <>
                                <Download size={16} />
                                تصدير
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
