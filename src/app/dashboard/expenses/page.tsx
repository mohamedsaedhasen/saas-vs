'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus,
    TreeDeciduous,
    FileText,
    BarChart3,
    RefreshCw,
    Download,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import {
    StatsCards,
    DistributionChart,
    TrendChart,
    BudgetComparisonChart,
    TopCategories,
} from '@/components/expenses';
import { VoucherForm } from '@/components/expenses/VoucherForm';
import type {
    ExpenseStats,
    ExpenseDistribution,
    ExpenseTrend,
    BudgetComparison,
    ExpenseCategory,
} from '@/types/expenses';

export default function ExpensesDashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showVoucherForm, setShowVoucherForm] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');

    // Data states
    const [stats, setStats] = useState<ExpenseStats>({
        total_amount: 0,
        voucher_count: 0,
        average_amount: 0,
        max_amount: 0,
        min_amount: 0,
    });
    const [distribution, setDistribution] = useState<ExpenseDistribution[]>([]);
    const [trend, setTrend] = useState<ExpenseTrend[]>([]);
    const [budgetComparison, setBudgetComparison] = useState<BudgetComparison[]>([]);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [previousTotal, setPreviousTotal] = useState(0);

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);

                // Fetch stats
                const statsRes = await fetch('/api/expenses/stats');
                const statsData = await statsRes.json();
                if (statsData && !statsData.error) {
                    setStats(statsData);
                }

                // Fetch distribution
                const distRes = await fetch('/api/expenses/distribution');
                const distData = await distRes.json();
                if (Array.isArray(distData)) {
                    setDistribution(distData);
                } else if (distData && Array.isArray(distData.data)) {
                    setDistribution(distData.data);
                }

                // Fetch trend
                const trendRes = await fetch('/api/expenses/trend');
                const trendData = await trendRes.json();
                if (Array.isArray(trendData)) {
                    setTrend(trendData);
                } else if (trendData && Array.isArray(trendData.data)) {
                    setTrend(trendData.data);
                }

                // Fetch categories
                const catRes = await fetch('/api/expenses/categories');
                const catData = await catRes.json();
                if (Array.isArray(catData)) {
                    setCategories(catData);
                } else if (catData && Array.isArray(catData.data)) {
                    setCategories(catData.data);
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [selectedPeriod]);

    const handleRefresh = async () => {
        setIsLoading(true);
        try {
            const statsRes = await fetch('/api/expenses/stats');
            const statsData = await statsRes.json();
            if (statsData && !statsData.error) {
                setStats(statsData);
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
                <div>
                    <h1 className="text-2xl font-bold">وحدة المصاريف</h1>
                    <p className="text-muted-foreground mt-1">
                        إدارة ومتابعة المصاريف والتحليلات المالية
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Period selector */}
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                        {[
                            { value: 'month', label: 'الشهر' },
                            { value: 'quarter', label: 'الربع' },
                            { value: 'year', label: 'السنة' },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setSelectedPeriod(option.value as any)}
                                className={`px-3 py-1.5 text-sm font-medium transition-colors ${selectedPeriod === option.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleRefresh}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                        disabled={isLoading}
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>

                    <button
                        onClick={() => setShowVoucherForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                        <Plus size={18} />
                        سند صرف جديد
                    </button>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                    href="/dashboard/expenses/tree"
                    className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <TreeDeciduous size={20} className="text-emerald-600" />
                    </div>
                    <div>
                        <div className="font-medium">شجرة المصاريف</div>
                        <div className="text-sm text-muted-foreground">إدارة التصنيفات</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/expenses/vouchers"
                    className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <div className="font-medium">سندات الصرف</div>
                        <div className="text-sm text-muted-foreground">{stats.voucher_count} سند</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/expenses/reports"
                    className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <BarChart3 size={20} className="text-amber-600" />
                    </div>
                    <div>
                        <div className="font-medium">التقارير</div>
                        <div className="text-sm text-muted-foreground">تحليلات مفصلة</div>
                    </div>
                </Link>

                <button
                    onClick={() => {/* TODO: Export */ }}
                    className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-colors text-right"
                >
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                        <Download size={20} className="text-violet-600" />
                    </div>
                    <div>
                        <div className="font-medium">تصدير البيانات</div>
                        <div className="text-sm text-muted-foreground">Excel / PDF</div>
                    </div>
                </button>
            </div>

            {/* Stats Cards */}
            <StatsCards stats={stats} previousTotal={previousTotal} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribution */}
                <DistributionChart data={distribution} />

                {/* Trend */}
                <TrendChart data={trend} />
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Budget Comparison */}
                <BudgetComparisonChart data={budgetComparison} />

                {/* Top Categories */}
                <TopCategories data={distribution} />
            </div>

            {/* Voucher Form Modal */}
            <VoucherForm
                isOpen={showVoucherForm}
                onClose={() => setShowVoucherForm(false)}
                onSubmit={handleCreateVoucher}
                categories={categories}
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
