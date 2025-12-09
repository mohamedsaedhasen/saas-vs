'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    TrendingUp,
    TrendingDown,
    Package,
    DollarSign,
    BarChart3,
    PieChart,
    Calendar,
    Download,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import {
    TopProductsChart,
    CategoryDistribution,
    StockMovementChart,
} from '@/components/inventory';
import { cn } from '@/lib/utils';

interface Overview {
    total_revenue: number;
    revenue_change: number;
    total_profit: number;
    profit_margin: number;
    items_sold: number;
    average_order_value: number;
}

interface MonthlyRevenue {
    month: string;
    revenue: number;
    profit: number;
}

export default function InventoryAnalyticsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

    const [overview, setOverview] = useState<Overview>({
        total_revenue: 0,
        revenue_change: 0,
        total_profit: 0,
        profit_margin: 0,
        items_sold: 0,
        average_order_value: 0,
    });
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [stockTrend, setStockTrend] = useState<any[]>([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);

                // Fetch overview
                const overviewRes = await fetch('/api/inventory/analytics/overview');
                const overviewData = await overviewRes.json();
                if (overviewData && !overviewData.error) {
                    setOverview(overviewData);
                }

                // Fetch top products
                const topRes = await fetch('/api/inventory/top-products');
                const topData = await topRes.json();
                if (Array.isArray(topData)) {
                    setTopProducts(topData);
                } else if (topData && Array.isArray(topData.data)) {
                    setTopProducts(topData.data);
                }

                // Fetch categories
                const catRes = await fetch('/api/products/categories');
                const catData = await catRes.json();
                if (Array.isArray(catData)) {
                    setCategories(catData);
                } else if (catData && Array.isArray(catData.data)) {
                    setCategories(catData.data);
                }

                // Fetch monthly revenue
                const monthlyRes = await fetch('/api/inventory/analytics/monthly-revenue');
                const monthlyData = await monthlyRes.json();
                if (Array.isArray(monthlyData)) {
                    setMonthlyRevenue(monthlyData);
                } else if (monthlyData && Array.isArray(monthlyData.data)) {
                    setMonthlyRevenue(monthlyData.data);
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [period]);

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
                        href="/dashboard/inventory"
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                    >
                        <ArrowRight size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">تحليلات المنتجات</h1>
                        <p className="text-muted-foreground mt-1">
                            إحصائيات وتقارير المبيعات والمخزون
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Period Selector */}
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                        {(['week', 'month', 'quarter', 'year'] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={cn(
                                    'px-3 py-2 text-sm transition-colors',
                                    period === p
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted'
                                )}
                            >
                                {p === 'week' && 'أسبوع'}
                                {p === 'month' && 'شهر'}
                                {p === 'quarter' && 'ربع سنة'}
                                {p === 'year' && 'سنة'}
                            </button>
                        ))}
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                        <Download size={16} />
                        تصدير
                    </button>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">الإيرادات</span>
                        <div className={cn(
                            'flex items-center gap-1 text-xs font-medium',
                            overview.revenue_change >= 0 ? 'text-emerald-600' : 'text-red-600'
                        )}>
                            {overview.revenue_change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {overview.revenue_change}%
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{overview.total_revenue.toLocaleString('ar-EG')} ج.م</div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">صافي الربح</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <DollarSign size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{overview.total_profit.toLocaleString('ar-EG')} ج.م</div>
                    <div className="text-xs text-muted-foreground mt-1">هامش {overview.profit_margin}%</div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">المنتجات المباعة</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Package size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{overview.items_sold.toLocaleString('ar-EG')}</div>
                    <div className="text-xs text-muted-foreground mt-1">قطعة</div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">متوسط الطلب</span>
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                            <BarChart3 size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{overview.average_order_value.toLocaleString('ar-EG')} ج.م</div>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 size={18} className="text-primary" />
                    <h3 className="font-semibold">الإيرادات الشهرية</h3>
                </div>

                {monthlyRevenue.length > 0 ? (
                    <>
                        <div className="h-64 flex items-end gap-4">
                            {monthlyRevenue.map((month, i) => {
                                const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));
                                const revenueHeight = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
                                const profitHeight = maxRevenue > 0 ? (month.profit / maxRevenue) * 100 : 0;

                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                        <div className="w-full flex flex-col items-center justify-end h-48 relative group">
                                            {/* Revenue Bar */}
                                            <div
                                                className="w-full max-w-12 bg-primary/20 rounded-t relative"
                                                style={{ height: `${revenueHeight}%` }}
                                            >
                                                {/* Profit overlay */}
                                                <div
                                                    className="absolute bottom-0 w-full bg-primary rounded-t"
                                                    style={{ height: revenueHeight > 0 ? `${(profitHeight / revenueHeight) * 100}%` : '0%' }}
                                                />
                                            </div>

                                            {/* Tooltip */}
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <div>الإيراد: {month.revenue.toLocaleString('ar-EG')}</div>
                                                <div>الربح: {month.profit.toLocaleString('ar-EG')}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">{month.month}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 bg-primary/20 rounded" />
                                <span>الإيرادات</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 bg-primary rounded" />
                                <span>الربح</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                        لا توجد بيانات للعرض
                    </div>
                )}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopProductsChart products={topProducts} />
                <CategoryDistribution categories={categories} />
            </div>

            {/* Stock Movement */}
            <StockMovementChart data={stockTrend} />
        </div>
    );
}
