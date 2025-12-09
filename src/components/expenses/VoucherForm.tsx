'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
    X,
    AlertCircle,
    Check,
    Loader2,
    Calendar,
    Wallet,
    Building2,
    FileText,
    Receipt,
    Upload,
    AlertTriangle,
} from 'lucide-react';
import type {
    CreateExpenseVoucherInput,
    ExpenseCategory,
    PaymentMethod,
} from '@/types/expenses';

interface VoucherFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateExpenseVoucherInput, status: 'draft' | 'confirmed') => Promise<void>;
    categories: ExpenseCategory[];
    vaults?: { id: string; name: string; balance?: number }[];
    banks?: { id: string; name: string; balance?: number }[];
    suppliers?: { id: string; name: string }[];
    costCenters?: { id: string; code: string; name: string }[];
    preselectedCategoryId?: string;
}

export function VoucherForm({
    isOpen,
    onClose,
    onSubmit,
    categories,
    vaults = [],
    banks = [],
    suppliers = [],
    costCenters = [],
    preselectedCategoryId,
}: VoucherFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    // Form state
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [vaultId, setVaultId] = useState('');
    const [bankId, setBankId] = useState('');
    const [checkNumber, setCheckNumber] = useState('');
    const [checkDate, setCheckDate] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [costCenterId, setCostCenterId] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [notes, setNotes] = useState('');

    // Selected category details
    const selectedCategory = categories.find((c) => c.id === categoryId);
    const previousVoucher = selectedCategory?.previous_voucher;
    const budget = selectedCategory?.budget_amount;
    const totalSpent = (selectedCategory?.total_spent || 0) + (parseFloat(amount) || 0);
    const isOverBudget = budget && totalSpent > budget;

    // Reset form
    useEffect(() => {
        if (isOpen) {
            setDate(new Date().toISOString().split('T')[0]);
            setCategoryId(preselectedCategoryId || '');
            setDescription('');
            setAmount('');
            setPaymentMethod('cash');
            setVaultId(vaults[0]?.id || '');
            setBankId('');
            setCheckNumber('');
            setCheckDate('');
            setSupplierId('');
            setCostCenterId('');
            setReferenceNumber('');
            setNotes('');
            setError(null);
            setShowPreview(false);

            // Auto-fill from category
            if (preselectedCategoryId) {
                const cat = categories.find((c) => c.id === preselectedCategoryId);
                if (cat) {
                    if (cat.default_supplier_id) setSupplierId(cat.default_supplier_id);
                    if (cat.default_cost_center_id) setCostCenterId(cat.default_cost_center_id);
                    if (cat.budget_amount) setAmount(cat.budget_amount.toString());
                }
            }
        }
    }, [isOpen, preselectedCategoryId, categories, vaults]);

    // Auto-fill description when category changes
    useEffect(() => {
        if (selectedCategory && !description) {
            const monthNames = [
                'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
            ];
            const currentMonth = monthNames[new Date().getMonth()];
            const currentYear = new Date().getFullYear();
            setDescription(`${selectedCategory.name_ar} - شهر ${currentMonth} ${currentYear}`);
        }
    }, [categoryId, selectedCategory]);

    const handleSubmit = async (status: 'draft' | 'confirmed') => {
        setError(null);
        setIsLoading(true);

        try {
            // Validation
            if (!categoryId) throw new Error('يجب اختيار التصنيف');
            if (!description.trim()) throw new Error('الوصف مطلوب');
            if (!amount || parseFloat(amount) <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');
            if (paymentMethod === 'cash' && !vaultId) throw new Error('يجب اختيار الخزنة');
            if (paymentMethod === 'bank' && !bankId) throw new Error('يجب اختيار البنك');
            if (paymentMethod === 'check' && (!bankId || !checkNumber)) {
                throw new Error('يجب اختيار البنك ورقم الشيك');
            }

            await onSubmit(
                {
                    date,
                    category_id: categoryId,
                    description: description.trim(),
                    amount: parseFloat(amount),
                    payment_method: paymentMethod,
                    vault_id: paymentMethod === 'cash' ? vaultId : undefined,
                    bank_id: ['bank', 'check', 'card'].includes(paymentMethod) ? bankId : undefined,
                    check_number: paymentMethod === 'check' ? checkNumber : undefined,
                    check_date: paymentMethod === 'check' ? checkDate || undefined : undefined,
                    supplier_id: supplierId || undefined,
                    cost_center_id: costCenterId || undefined,
                    reference_number: referenceNumber || undefined,
                    notes: notes || undefined,
                },
                status
            );

            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
        } finally {
            setIsLoading(false);
            setShowPreview(false);
        }
    };

    if (!isOpen) return null;

    // Get flat list of leaf categories only
    const leafCategories = categories.filter((c) => !c.has_children);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Dialog */}
            <div className="relative bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Receipt size={20} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">سند صرف مصاريف جديد</h2>
                            <p className="text-sm text-muted-foreground">رقم السند سيتولد تلقائياً</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-6 max-h-[calc(90vh-10rem)] overflow-y-auto">
                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Section 1: Basic Info */}
                    <div className="space-y-4">
                        <h3 className="font-medium flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                1
                            </span>
                            معلومات المصروف
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    التاريخ <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    المبلغ <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full px-3 py-2 pl-12 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-lg font-semibold"
                                        placeholder="0.00"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                        ج.م
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5">
                                التصنيف <span className="text-destructive">*</span>
                            </label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="">-- اختر التصنيف --</option>
                                {leafCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.code} - {cat.name_ar}
                                    </option>
                                ))}
                            </select>

                            {/* Category info */}
                            {selectedCategory && (
                                <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                                    {previousVoucher && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">آخر سند:</span>
                                            <span className="font-mono">
                                                {previousVoucher.number} ({previousVoucher.amount.toLocaleString('ar-EG')} ج.م)
                                            </span>
                                        </div>
                                    )}
                                    {budget && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">الموازنة الشهرية:</span>
                                            <span>{budget.toLocaleString('ar-EG')} ج.م</span>
                                        </div>
                                    )}
                                    {budget && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">المصروف بعد هذا السند:</span>
                                            <span className={cn(isOverBudget && 'text-destructive font-semibold')}>
                                                {totalSpent.toLocaleString('ar-EG')} ج.م
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Budget warning */}
                            {isOverBudget && (
                                <div className="mt-2 flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg text-sm">
                                    <AlertTriangle size={16} />
                                    <span>
                                        تحذير: تجاوز الموازنة بـ {(totalSpent - budget!).toLocaleString('ar-EG')} ج.م
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5">
                                الوصف <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="وصف المصروف..."
                            />
                        </div>
                    </div>

                    {/* Section 2: Payment Method */}
                    <div className="space-y-4">
                        <h3 className="font-medium flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                2
                            </span>
                            طريقة الدفع
                        </h3>

                        {/* Payment method selector */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: 'cash', label: 'نقدي', icon: Wallet },
                                { value: 'bank', label: 'تحويل بنكي', icon: Building2 },
                                { value: 'check', label: 'شيك', icon: FileText },
                            ].map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setPaymentMethod(value as PaymentMethod)}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors',
                                        paymentMethod === value
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-border hover:bg-muted/50'
                                    )}
                                >
                                    <Icon size={18} />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Cash - Vault */}
                        {paymentMethod === 'cash' && (
                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    الخزنة <span className="text-destructive">*</span>
                                </label>
                                <select
                                    value={vaultId}
                                    onChange={(e) => setVaultId(e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                                >
                                    <option value="">-- اختر الخزنة --</option>
                                    {vaults.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.name} {v.balance !== undefined && `(${v.balance.toLocaleString('ar-EG')} ج.م)`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Bank */}
                        {['bank', 'check', 'card'].includes(paymentMethod) && (
                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    البنك <span className="text-destructive">*</span>
                                </label>
                                <select
                                    value={bankId}
                                    onChange={(e) => setBankId(e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                                >
                                    <option value="">-- اختر البنك --</option>
                                    {banks.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} {b.balance !== undefined && `(${b.balance.toLocaleString('ar-EG')} ج.م)`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Check details */}
                        {paymentMethod === 'check' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">
                                        رقم الشيك <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={checkNumber}
                                        onChange={(e) => setCheckNumber(e.target.value)}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                                        placeholder="رقم الشيك"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">تاريخ الشيك</label>
                                    <input
                                        type="date"
                                        value={checkDate}
                                        onChange={(e) => setCheckDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 3: Additional Info */}
                    <div className="space-y-4">
                        <h3 className="font-medium flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                3
                            </span>
                            معلومات إضافية
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Supplier */}
                            {suppliers.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">المورد</label>
                                    <select
                                        value={supplierId}
                                        onChange={(e) => setSupplierId(e.target.value)}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                                    >
                                        <option value="">-- اختياري --</option>
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
                                    <label className="block text-sm font-medium mb-1.5">مركز التكلفة</label>
                                    <select
                                        value={costCenterId}
                                        onChange={(e) => setCostCenterId(e.target.value)}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                                    >
                                        <option value="">-- اختياري --</option>
                                        {costCenters.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.code} - {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Reference Number */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5">رقم الفاتورة الخارجية</label>
                                <input
                                    type="text"
                                    value={referenceNumber}
                                    onChange={(e) => setReferenceNumber(e.target.value)}
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                                    placeholder="رقم مرجعي..."
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5">ملاحظات</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg resize-none"
                                rows={2}
                                placeholder="ملاحظات إضافية..."
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 p-4 border-t border-border bg-muted/30">
                    <button
                        type="button"
                        onClick={() => setShowPreview(true)}
                        className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        disabled={isLoading}
                    >
                        معاينة القيد المحاسبي
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                            disabled={isLoading}
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={() => handleSubmit('draft')}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium border border-border hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                        >
                            حفظ كمسودة
                        </button>
                        <button
                            onClick={() => handleSubmit('confirmed')}
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
                                    تأكيد وحفظ
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Preview Modal */}
                {showPreview && selectedCategory && (
                    <div className="absolute inset-0 bg-card/95 flex items-center justify-center p-8">
                        <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-lg">
                            <h3 className="font-semibold mb-4">معاينة القيد المحاسبي</h3>

                            <table className="w-full text-sm mb-4">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-right py-2">الحساب</th>
                                        <th className="text-left py-2">مدين</th>
                                        <th className="text-left py-2">دائن</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-border">
                                        <td className="py-2">{selectedCategory.name_ar}</td>
                                        <td className="py-2 text-left font-mono">{parseFloat(amount || '0').toLocaleString('ar-EG')}</td>
                                        <td className="py-2 text-left">-</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2">
                                            {paymentMethod === 'cash'
                                                ? vaults.find((v) => v.id === vaultId)?.name || 'الخزنة'
                                                : banks.find((b) => b.id === bankId)?.name || 'البنك'}
                                        </td>
                                        <td className="py-2 text-left">-</td>
                                        <td className="py-2 text-left font-mono">{parseFloat(amount || '0').toLocaleString('ar-EG')}</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-border font-semibold">
                                        <td className="py-2">الإجمالي</td>
                                        <td className="py-2 text-left">{parseFloat(amount || '0').toLocaleString('ar-EG')}</td>
                                        <td className="py-2 text-left">{parseFloat(amount || '0').toLocaleString('ar-EG')}</td>
                                    </tr>
                                </tfoot>
                            </table>

                            <div className="flex items-center gap-2 text-sm text-emerald-600 mb-4">
                                <Check size={16} />
                                القيد متوازن
                            </div>

                            <button
                                onClick={() => setShowPreview(false)}
                                className="w-full px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
