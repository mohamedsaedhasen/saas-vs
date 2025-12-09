'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, AlertCircle, Check, Loader2 } from 'lucide-react';
import type {
    ExpenseCategory,
    CreateExpenseCategoryInput,
    UpdateExpenseCategoryInput,
    ExpenseType,
    RecurringFrequency,
} from '@/types/expenses';

interface ExpenseNodeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateExpenseCategoryInput | UpdateExpenseCategoryInput) => Promise<void>;
    parentCategory?: ExpenseCategory | null;
    editCategory?: ExpenseCategory | null;
    existingAccounts?: { id: string; code: string; name: string }[];
    employees?: { id: string; name: string }[];
    suppliers?: { id: string; name: string }[];
    costCenters?: { id: string; code: string; name: string }[];
}

export function ExpenseNodeDialog({
    isOpen,
    onClose,
    onSubmit,
    parentCategory,
    editCategory,
    existingAccounts = [],
    employees = [],
    suppliers = [],
    costCenters = [],
}: ExpenseNodeDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [nameAr, setNameAr] = useState('');
    const [nameEn, setNameEn] = useState('');
    const [description, setDescription] = useState('');
    const [budgetAmount, setBudgetAmount] = useState<string>('');
    const [expenseType, setExpenseType] = useState<ExpenseType>('general');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('monthly');
    const [recurringDay, setRecurringDay] = useState<string>('1');
    const [defaultSupplierId, setDefaultSupplierId] = useState<string>('');
    const [defaultCostCenterId, setDefaultCostCenterId] = useState<string>('');
    const [createAccountAutomatically, setCreateAccountAutomatically] = useState(true);
    const [existingAccountId, setExistingAccountId] = useState<string>('');

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (isOpen) {
            if (editCategory) {
                setNameAr(editCategory.name_ar);
                setNameEn(editCategory.name_en || '');
                setDescription(editCategory.description || '');
                setBudgetAmount(editCategory.budget_amount?.toString() || '');
                setExpenseType(editCategory.expense_type);
                setIsRecurring(editCategory.is_recurring);
                setRecurringFrequency(editCategory.recurring_frequency || 'monthly');
                setRecurringDay(editCategory.recurring_day?.toString() || '1');
                setDefaultSupplierId(editCategory.default_supplier_id || '');
                setDefaultCostCenterId(editCategory.default_cost_center_id || '');
                setCreateAccountAutomatically(false);
                setExistingAccountId(editCategory.account_id || '');
            } else {
                setNameAr('');
                setNameEn('');
                setDescription('');
                setBudgetAmount('');
                setExpenseType('general');
                setIsRecurring(false);
                setRecurringFrequency('monthly');
                setRecurringDay('1');
                setDefaultSupplierId('');
                setDefaultCostCenterId(parentCategory?.default_cost_center_id || '');
                setCreateAccountAutomatically(true);
                setExistingAccountId('');
            }
            setError(null);
        }
    }, [isOpen, editCategory, parentCategory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Validation
            if (!nameAr.trim()) {
                throw new Error('الاسم بالعربية مطلوب');
            }

            const data: CreateExpenseCategoryInput | UpdateExpenseCategoryInput = {
                name_ar: nameAr.trim(),
                name_en: nameEn.trim() || undefined,
                description: description.trim() || undefined,
                budget_amount: budgetAmount ? parseFloat(budgetAmount) : undefined,
                expense_type: expenseType,
                is_recurring: isRecurring,
                recurring_frequency: isRecurring ? recurringFrequency : undefined,
                recurring_day: isRecurring ? parseInt(recurringDay) : undefined,
                default_supplier_id: defaultSupplierId || undefined,
                default_cost_center_id: defaultCostCenterId || undefined,
                create_account_automatically: createAccountAutomatically,
                existing_account_id: !createAccountAutomatically ? existingAccountId : undefined,
                ...(editCategory ? { id: editCategory.id } : { parent_id: parentCategory?.id || null }),
            };

            await onSubmit(data);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold">
                        {editCategory ? 'تعديل بند مصاريف' : 'إضافة بند مصاريف'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[calc(90vh-8rem)] overflow-y-auto">
                    {/* Error message */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Parent category info */}
                    {parentCategory && (
                        <div className="p-3 bg-muted/50 rounded-lg text-sm">
                            <span className="text-muted-foreground">البند الأب: </span>
                            <span className="font-medium">
                                {parentCategory.code} - {parentCategory.name_ar}
                            </span>
                        </div>
                    )}

                    {/* Auto-generated code info */}
                    {!editCategory && (
                        <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center gap-2">
                            <Check size={16} />
                            سيتم توليد الكود تلقائياً
                        </div>
                    )}

                    {/* Name Arabic */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            الاسم بالعربية <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            value={nameAr}
                            onChange={(e) => setNameAr(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="مثال: إيجار المكتب"
                            required
                        />
                    </div>

                    {/* Name English */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            الاسم بالإنجليزية
                        </label>
                        <input
                            type="text"
                            value={nameEn}
                            onChange={(e) => setNameEn(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Example: Office Rent"
                            dir="ltr"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">الوصف</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                            rows={2}
                            placeholder="وصف اختياري للبند..."
                        />
                    </div>

                    {/* Expense Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2">نوع المصروف</label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: 'general', label: 'بند عادي' },
                                { value: 'recurring', label: 'مصروف متكرر' },
                                { value: 'supplier_related', label: 'مرتبط بمورد' },
                            ].map((option) => (
                                <label
                                    key={option.value}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors',
                                        expenseType === option.value
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-border hover:bg-muted/50'
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="expenseType"
                                        value={option.value}
                                        checked={expenseType === option.value}
                                        onChange={(e) => {
                                            setExpenseType(e.target.value as ExpenseType);
                                            if (e.target.value === 'recurring') {
                                                setIsRecurring(true);
                                            }
                                        }}
                                        className="sr-only"
                                    />
                                    <span className="text-sm">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Recurring options */}
                    {(expenseType === 'recurring' || isRecurring) && (
                        <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                    className="w-4 h-4 rounded accent-primary"
                                />
                                <span className="text-sm font-medium">مصروف متكرر</span>
                            </label>

                            {isRecurring && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1">
                                            التكرار
                                        </label>
                                        <select
                                            value={recurringFrequency}
                                            onChange={(e) =>
                                                setRecurringFrequency(e.target.value as RecurringFrequency)
                                            }
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                                        >
                                            <option value="daily">يومي</option>
                                            <option value="weekly">أسبوعي</option>
                                            <option value="monthly">شهري</option>
                                            <option value="quarterly">ربع سنوي</option>
                                            <option value="yearly">سنوي</option>
                                        </select>
                                    </div>
                                    {recurringFrequency === 'monthly' && (
                                        <div>
                                            <label className="block text-xs text-muted-foreground mb-1">
                                                يوم الشهر
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="28"
                                                value={recurringDay}
                                                onChange={(e) => setRecurringDay(e.target.value)}
                                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Budget */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            الموازنة الشهرية (اختياري)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={budgetAmount}
                                onChange={(e) => setBudgetAmount(e.target.value)}
                                className="w-full px-3 py-2 pl-12 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="0.00"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                ج.م
                            </span>
                        </div>
                    </div>

                    {/* Default Supplier */}
                    {suppliers.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium mb-1.5">
                                المورد الافتراضي (اختياري)
                            </label>
                            <select
                                value={defaultSupplierId}
                                onChange={(e) => setDefaultSupplierId(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                            >
                                <option value="">-- اختر المورد --</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Cost Center */}
                    {costCenters.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium mb-1.5">
                                مركز التكلفة الافتراضي
                            </label>
                            <select
                                value={defaultCostCenterId}
                                onChange={(e) => setDefaultCostCenterId(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                            >
                                <option value="">-- اختر مركز التكلفة --</option>
                                {costCenters.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.code} - {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Account */}
                    <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                        <div className="font-medium text-sm">الحساب المحاسبي</div>

                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="accountOption"
                                checked={createAccountAutomatically}
                                onChange={() => setCreateAccountAutomatically(true)}
                                className="w-4 h-4 accent-primary"
                            />
                            <span className="text-sm">إنشاء حساب تلقائياً</span>
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="accountOption"
                                checked={!createAccountAutomatically}
                                onChange={() => setCreateAccountAutomatically(false)}
                                className="w-4 h-4 accent-primary"
                            />
                            <span className="text-sm">اختيار حساب موجود</span>
                        </label>

                        {!createAccountAutomatically && (
                            <select
                                value={existingAccountId}
                                onChange={(e) => setExistingAccountId(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                            >
                                <option value="">-- اختر الحساب --</option>
                                {existingAccounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} - {acc.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        {createAccountAutomatically && (
                            <div className="text-xs text-muted-foreground bg-background p-2 rounded">
                                سيتم إنشاء حساب جديد في شجرة الحسابات تحت المصروفات
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                        disabled={isLoading}
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <Check size={16} />
                                حفظ
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
