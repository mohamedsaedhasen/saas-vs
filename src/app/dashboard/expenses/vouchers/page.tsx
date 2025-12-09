'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowRight,
    Plus,
    Search,
    Filter,
    FileText,
    Check,
    X,
    Eye,
    Edit,
    Trash2,
    Download,
    RefreshCw,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LedgerFilters, VoucherForm } from '@/components/expenses';
import type { ExpenseVoucher, ExpenseVoucherFilters, ExpenseCategory } from '@/types/expenses';

export default function VouchersListPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [vouchers, setVouchers] = useState<ExpenseVoucher[]>([]);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<ExpenseVoucherFilters>({});
    const [showVoucherForm, setShowVoucherForm] = useState(false);
    const [preselectedCategoryId, setPreselectedCategoryId] = useState<string | undefined>();

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);

                // Fetch vouchers
                const vouchersRes = await fetch('/api/expenses/vouchers');
                const vouchersData = await vouchersRes.json();
                if (Array.isArray(vouchersData)) {
                    setVouchers(vouchersData);
                } else if (vouchersData && Array.isArray(vouchersData.data)) {
                    setVouchers(vouchersData.data);
                } else {
                    setVouchers([]);
                }

                // Fetch categories
                const categoriesRes = await fetch('/api/expenses/categories');
                const categoriesData = await categoriesRes.json();
                if (Array.isArray(categoriesData)) {
                    setCategories(categoriesData);
                } else if (categoriesData && Array.isArray(categoriesData.data)) {
                    setCategories(categoriesData.data);
                } else {
                    setCategories([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
                setVouchers([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // Check for category param
    useEffect(() => {
        const categoryId = searchParams?.get('category');
        if (categoryId) {
            setPreselectedCategoryId(categoryId);
            setShowVoucherForm(true);
        }
    }, [searchParams]);

    const handleRefresh = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/expenses/vouchers');
            const data = await res.json();
            if (Array.isArray(data)) {
                setVouchers(data);
            } else if (data && Array.isArray(data.data)) {
                setVouchers(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateVoucher = async (data: any, status: 'draft' | 'confirmed') => {
        console.log('Creating voucher:', data, status);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setShowVoucherForm(false);
        handleRefresh();
    };

    const handleConfirmVoucher = async (id: string) => {
        console.log('Confirming voucher:', id);
        // TODO: Call API
    };

    const handleCancelVoucher = async (id: string) => {
        if (!confirm('هل أنت متأكد من إلغاء هذا السند؟')) return;
        console.log('Cancelling voucher:', id);
        // TODO: Call API
    };

    const handleDeleteVoucher = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا السند؟')) return;
        console.log('Deleting voucher:', id);
        // TODO: Call API
    };

    // Filter vouchers
    const filteredVouchers = vouchers.filter((v) => {
        if (filters.search) {
            const search = filters.search.toLowerCase();
            if (
                !v.voucher_number?.toLowerCase().includes(search) &&
                !v.description?.toLowerCase().includes(search)
            ) {
                return false;
            }
        }
        if (filters.status && v.status !== filters.status) return false;
        if (filters.category_id && v.category_id !== filters.category_id) return false;
        if (filters.payment_method && v.payment_method !== filters.payment_method) return false;
        if (filters.date_from && v.date < filters.date_from) return false;
        if (filters.date_to && v.date > filters.date_to) return false;
        return true;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        <Check size={12} /> مؤكد
                    </span>
                );
            case 'draft':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <Edit size={12} /> مسودة
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <X size={12} /> ملغي
                    </span>
                );
            default:
                return null;
        }
    };

    const getPaymentMethodBadge = (method: string) => {
        const methods: Record<string, string> = {
            cash: 'نقدي',
            bank: 'تحويل',
            check: 'شيك',
            card: 'بطاقة',
        };
        return (
            <span className="px-2 py-0.5 rounded text-xs bg-muted">
                {methods[method] || method}
            </span>
        );
    };

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
                        <h1 className="text-2xl font-bold">سندات صرف المصاريف</h1>
                        <p className="text-muted-foreground mt-1">
                            إدارة ومتابعة سندات الصرف
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
                        onClick={() => {
                            setPreselectedCategoryId(undefined);
                            setShowVoucherForm(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                        <Plus size={18} />
                        سند صرف جديد
                    </button>
                </div>
            </div>

            {/* Filters */}
            <LedgerFilters
                filters={filters}
                onFiltersChange={setFilters}
                onExportExcel={() => console.log('Export Excel')}
                onExportPdf={() => console.log('Export PDF')}
                categories={categories.map((c) => ({ id: c.id, code: c.code, name: c.name_ar }))}
            />

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground">إجمالي السندات</div>
                    <div className="text-2xl font-bold mt-1">{filteredVouchers.length}</div>
                </div>
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground">إجمالي المبلغ</div>
                    <div className="text-2xl font-bold mt-1">
                        {filteredVouchers.reduce((sum, v) => sum + (v.amount || 0), 0).toLocaleString('ar-EG')}
                    </div>
                </div>
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground">مؤكدة</div>
                    <div className="text-2xl font-bold mt-1 text-emerald-600">
                        {filteredVouchers.filter((v) => v.status === 'confirmed').length}
                    </div>
                </div>
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground">مسودات</div>
                    <div className="text-2xl font-bold mt-1 text-amber-600">
                        {filteredVouchers.filter((v) => v.status === 'draft').length}
                    </div>
                </div>
            </div>

            {/* Vouchers Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-right py-3 px-4 font-medium text-sm">رقم السند</th>
                                <th className="text-right py-3 px-4 font-medium text-sm">التاريخ</th>
                                <th className="text-right py-3 px-4 font-medium text-sm">التصنيف</th>
                                <th className="text-right py-3 px-4 font-medium text-sm">الوصف</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">المبلغ</th>
                                <th className="text-center py-3 px-4 font-medium text-sm">الدفع</th>
                                <th className="text-center py-3 px-4 font-medium text-sm">الحالة</th>
                                <th className="text-center py-3 px-4 font-medium text-sm">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVouchers.map((voucher) => (
                                <tr
                                    key={voucher.id}
                                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                                >
                                    <td className="py-3 px-4">
                                        <div className="font-mono text-sm font-medium">{voucher.voucher_number}</div>
                                        {voucher.previous_voucher_number && (
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                السابق: {voucher.previous_voucher_number}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-sm">{voucher.date}</td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm font-medium">{voucher.category_name}</div>
                                        <div className="text-xs text-muted-foreground font-mono">
                                            {voucher.category_code}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm max-w-[200px] truncate">{voucher.description}</div>
                                        {voucher.supplier_name && (
                                            <div className="text-xs text-muted-foreground">{voucher.supplier_name}</div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-left">
                                        <div className="font-semibold">{(voucher.amount || 0).toLocaleString('ar-EG')}</div>
                                        <div className="text-xs text-muted-foreground">ج.م</div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {getPaymentMethodBadge(voucher.payment_method)}
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {voucher.vault_name || voucher.bank_name}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {getStatusBadge(voucher.status)}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <Link
                                                href={`/dashboard/expenses/vouchers/${voucher.id}`}
                                                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"
                                                title="عرض"
                                            >
                                                <Eye size={16} />
                                            </Link>

                                            {voucher.status === 'draft' && (
                                                <>
                                                    <button
                                                        onClick={() => handleConfirmVoucher(voucher.id)}
                                                        className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-600"
                                                        title="تأكيد"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/dashboard/expenses/vouchers/${voucher.id}/edit`)}
                                                        className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"
                                                        title="تعديل"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteVoucher(voucher.id)}
                                                        className="p-1.5 hover:bg-red-100 rounded-lg text-red-600"
                                                        title="حذف"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}

                                            {voucher.status === 'confirmed' && (
                                                <button
                                                    onClick={() => handleCancelVoucher(voucher.id)}
                                                    className="p-1.5 hover:bg-red-100 rounded-lg text-red-600"
                                                    title="إلغاء"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty state */}
                {filteredVouchers.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground">
                        لا توجد سندات تطابق البحث
                    </div>
                )}
            </div>

            {/* Voucher Form Modal */}
            <VoucherForm
                isOpen={showVoucherForm}
                onClose={() => setShowVoucherForm(false)}
                onSubmit={handleCreateVoucher}
                categories={categories}
                preselectedCategoryId={preselectedCategoryId}
                vaults={[
                    { id: '1', name: 'الخزنة الرئيسية', balance: 50000 },
                    { id: '2', name: 'خزنة المبيعات', balance: 12000 },
                ]}
                banks={[
                    { id: '1', name: 'البنك الأهلي المصري', balance: 150000 },
                    { id: '2', name: 'بنك مصر', balance: 75000 },
                ]}
                suppliers={[
                    { id: '1', name: 'شركة الكهرباء' },
                    { id: '2', name: 'شركة المياه' },
                ]}
                costCenters={[
                    { id: '1', code: 'CC-01', name: 'الفرع الرئيسي' },
                    { id: '2', code: 'CC-02', name: 'فرع المعادي' },
                ]}
            />
        </div>
    );
}
