'use client';

import React from 'react';
import {
    Package,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    DollarSign,
    BarChart3,
    PieChart,
    Layers,
    Boxes,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
    InventoryStats,
    TopProduct,
    CategorySales,
    StockMovementTrend,
    LowStockItem
} from '@/types/inventory';

// ==========================================
// Stats Cards
// ==========================================

interface StatsCardsProps {
    stats: InventoryStats;
}

export function InventoryStatsCards({ stats }: StatsCardsProps) {
    const cards = [
        {
            label: 'إجمالي المنتجات',
            value: stats.total_products,
            icon: Package,
            color: 'blue',
        },
        {
            label: 'قيمة المخزون',
            value: `${stats.total_stock_value.toLocaleString('ar-EG')} ج.م`,
            icon: DollarSign,
            color: 'emerald',
        },
        {
            label: 'مخزون منخفض',
            value: stats.low_stock_count,
            icon: AlertCircle,
            color: 'yellow',
            alert: stats.low_stock_count > 0,
        },
        {
            label: 'نفد المخزون',
            value: stats.out_of_stock_count,
            icon: Boxes,
            color: 'red',
            alert: stats.out_of_stock_count > 0,
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((card, i) => {
                const Icon = card.icon;
                return (
                    <div
                        key={i}
                        className={cn(
                            'bg-card rounded-xl border border-border p-4',
                            card.alert && 'border-red-200 bg-red-50/50'
                        )}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">{card.label}</span>
                            <div className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center',
                                card.color === 'blue' && 'bg-blue-100 text-blue-600',
                                card.color === 'emerald' && 'bg-emerald-100 text-emerald-600',
                                card.color === 'yellow' && 'bg-amber-100 text-amber-600',
                                card.color === 'red' && 'bg-red-100 text-red-600'
                            )}>
                                <Icon size={16} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold">{card.value}</div>
                    </div>
                );
            })}
        </div>
    );
}

// ==========================================
// Top Selling Products
// ==========================================

interface TopProductsProps {
    products: TopProduct[];
    title?: string;
}

export function TopProductsChart({ products, title = 'الأكثر مبيعاً' }: TopProductsProps) {
    const maxRevenue = Math.max(...products.map(p => p.revenue));

    return (
        <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-emerald-600" />
                <h3 className="font-semibold">{title}</h3>
            </div>

            <div className="space-y-3">
                {products.map((product, i) => {
                    const percentage = (product.revenue / maxRevenue) * 100;
                    return (
                        <div key={product.product_id}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-muted-foreground w-5">
                                        {i + 1}
                                    </span>
                                    <span className="text-sm font-medium truncate max-w-[180px]">
                                        {product.product_name}
                                    </span>
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-semibold">
                                        {product.revenue.toLocaleString('ar-EG')} ج.م
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {product.quantity_sold} قطعة
                                    </div>
                                </div>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ==========================================
// Category Distribution
// ==========================================

interface CategoryDistributionProps {
    categories: CategorySales[];
}

export function CategoryDistribution({ categories }: CategoryDistributionProps) {
    const colors = [
        'bg-blue-500',
        'bg-emerald-500',
        'bg-amber-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-cyan-500',
    ];

    return (
        <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-4">
                <PieChart size={18} className="text-primary" />
                <h3 className="font-semibold">توزيع المبيعات حسب الفئة</h3>
            </div>

            {/* Simple Bar Chart */}
            <div className="space-y-3">
                {categories.map((cat, i) => (
                    <div key={cat.category_id}>
                        <div className="flex items-center justify-between mb-1 text-sm">
                            <div className="flex items-center gap-2">
                                <div className={cn('w-3 h-3 rounded-sm', colors[i % colors.length])} />
                                <span>{cat.category_name}</span>
                            </div>
                            <span className="font-mono">{cat.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn('h-full rounded-full', colors[i % colors.length])}
                                style={{ width: `${cat.percentage}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==========================================
// Stock Movement Trend
// ==========================================

interface StockTrendProps {
    data: StockMovementTrend[];
}

export function StockMovementChart({ data }: StockTrendProps) {
    const maxValue = Math.max(...data.map(d => Math.max(d.in_quantity, d.out_quantity)));

    return (
        <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-primary" />
                <h3 className="font-semibold">حركة المخزون (آخر 7 أيام)</h3>
            </div>

            <div className="flex items-end gap-2 h-40">
                {data.map((day, i) => (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                        {/* Bars */}
                        <div className="w-full flex items-end justify-center gap-0.5 flex-1">
                            <div
                                className="w-2 bg-emerald-400 rounded-t"
                                style={{ height: `${(day.in_quantity / maxValue) * 100}%`, minHeight: '4px' }}
                                title={`وارد: ${day.in_quantity}`}
                            />
                            <div
                                className="w-2 bg-red-400 rounded-t"
                                style={{ height: `${(day.out_quantity / maxValue) * 100}%`, minHeight: '4px' }}
                                title={`صادر: ${day.out_quantity}`}
                            />
                        </div>
                        {/* Label */}
                        <div className="text-xs text-muted-foreground">
                            {new Date(day.date).toLocaleDateString('ar-EG', { weekday: 'short' })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-emerald-400 rounded" />
                    <span>وارد</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-red-400 rounded" />
                    <span>صادر</span>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// Low Stock Alerts
// ==========================================

interface LowStockAlertsProps {
    items: LowStockItem[];
}

export function LowStockAlerts({ items }: LowStockAlertsProps) {
    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-border">
                <AlertCircle size={18} className="text-amber-600" />
                <h3 className="font-semibold">تنبيهات المخزون</h3>
                <span className="mr-auto px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                    {items.length}
                </span>
            </div>

            <div className="max-h-64 overflow-y-auto">
                {items.length > 0 ? (
                    <div className="divide-y divide-border">
                        {items.map((item) => (
                            <div key={`${item.variant_id}-${item.warehouse_name}`} className="p-3 hover:bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-sm">{item.product_name}</div>
                                        {item.variant_title && (
                                            <div className="text-xs text-muted-foreground">{item.variant_title}</div>
                                        )}
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {item.warehouse_name}
                                        </div>
                                    </div>
                                    <div className={cn(
                                        'text-left',
                                        item.stock_status === 'out_of_stock' && 'text-red-600',
                                        item.stock_status === 'low_stock' && 'text-amber-600'
                                    )}>
                                        <div className="font-mono font-semibold">{item.quantity}</div>
                                        <div className="text-xs">
                                            {item.stock_status === 'out_of_stock' ? 'نفد' : 'منخفض'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-muted-foreground">
                        <Package size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">لا توجد تنبيهات</p>
                    </div>
                )}
            </div>
        </div>
    );
}
