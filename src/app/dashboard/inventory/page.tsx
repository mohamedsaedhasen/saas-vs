'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Package,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    Boxes,
    FolderTree,
    TrendingUp,
    AlertCircle,
    RefreshCw,
    BarChart3,
    Loader2,
} from 'lucide-react';
import {
    InventoryStatsCards,
    TopProductsChart,
    CategoryDistribution,
    StockMovementChart,
    LowStockAlerts,
} from '@/components/inventory';
import type {
    InventoryStats,
    TopProduct,
    CategorySales,
    StockMovementTrend,
    LowStockItem,
} from '@/types/inventory';

export default function InventoryDashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [stats, setStats] = useState<InventoryStats>({
        total_products: 0,
        total_variants: 0,
        active_products: 0,
        draft_products: 0,
        total_stock_value: 0,
        low_stock_count: 0,
        out_of_stock_count: 0,
        categories_count: 0,
        warehouses_count: 0,
    });
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [categories, setCategories] = useState<CategorySales[]>([]);
    const [stockTrend, setStockTrend] = useState<StockMovementTrend[]>([]);
    const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
    const [todayIn, setTodayIn] = useState(0);
    const [todayOut, setTodayOut] = useState(0);

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);

                // Fetch stats
                const statsRes = await fetch('/api/inventory/stats');
                const statsData = await statsRes.json();
                if (statsData && !statsData.error) {
                    setStats(statsData);
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

                // Fetch low stock
                const lowRes = await fetch('/api/inventory/low-stock');
                const lowData = await lowRes.json();
                if (Array.isArray(lowData)) {
                    setLowStockItems(lowData);
                } else if (lowData && Array.isArray(lowData.data)) {
                    setLowStockItems(lowData.data);
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleRefresh = async () => {
        setIsLoading(true);
        try {
            const statsRes = await fetch('/api/inventory/stats');
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

    const netChange = todayIn - todayOut;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">المخازن والمنتجات</h1>
                    <p className="text-muted-foreground mt-1">
                        إدارة المنتجات والمخزون والتباينات
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <Link
                        href="/dashboard/inventory/products/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                        <Plus size={18} />
                        إضافة منتج
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <InventoryStatsCards stats={stats} />

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                    href="/dashboard/inventory/products"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Package size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary transition-colors">المنتجات</div>
                        <div className="text-xs text-muted-foreground">{stats.total_products} منتج</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/inventory/categories"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                        <FolderTree size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary transition-colors">التصنيفات</div>
                        <div className="text-xs text-muted-foreground">{stats.categories_count} تصنيف</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/inventory/warehouses"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                        <Boxes size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary transition-colors">المخازن</div>
                        <div className="text-xs text-muted-foreground">{stats.warehouses_count} مخزن</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/inventory/analytics"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <BarChart3 size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary transition-colors">التحليلات</div>
                        <div className="text-xs text-muted-foreground">رؤى وتقارير</div>
                    </div>
                </Link>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <TopProductsChart products={topProducts} />

                {/* Low Stock Alerts */}
                <LowStockAlerts items={lowStockItems} />

                {/* Category Distribution */}
                <CategoryDistribution categories={categories} />

                {/* Stock Movement */}
                <StockMovementChart data={stockTrend} />
            </div>

            {/* Recent Activity Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-emerald-600 mb-2">
                        <ArrowUpRight size={18} />
                        <span className="font-medium">وارد اليوم</span>
                    </div>
                    <div className="text-2xl font-bold">+{todayIn}</div>
                    <div className="text-sm text-muted-foreground">قطعة</div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                        <ArrowDownRight size={18} />
                        <span className="font-medium">صادر اليوم</span>
                    </div>
                    <div className="text-2xl font-bold">-{todayOut}</div>
                    <div className="text-sm text-muted-foreground">قطعة</div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <TrendingUp size={18} />
                        <span className="font-medium">صافي التغير</span>
                    </div>
                    <div className={`text-2xl font-bold ${netChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {netChange >= 0 ? '+' : ''}{netChange}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {netChange >= 0 ? 'زيادة في المخزون' : 'نقص في المخزون'}
                    </div>
                </div>
            </div>
        </div>
    );
}
