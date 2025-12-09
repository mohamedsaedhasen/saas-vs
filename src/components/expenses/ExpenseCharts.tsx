'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    DollarSign,
    FileText,
    BarChart3,
    PieChart,
} from 'lucide-react';
import type { ExpenseStats, ExpenseDistribution, ExpenseTrend, BudgetComparison } from '@/types/expenses';

// ==========================================
// Stats Cards
// ==========================================

interface StatsCardsProps {
    stats: ExpenseStats;
    previousTotal?: number;
}

export function StatsCards({ stats, previousTotal }: StatsCardsProps) {
    const change = previousTotal
        ? ((stats.total_amount - previousTotal) / previousTotal) * 100
        : 0;
    const isUp = change > 0;
    const isDown = change < 0;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total */}
            <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <DollarSign size={20} className="text-primary" />
                    </div>
                    {previousTotal !== undefined && (
                        <div
                            className={cn(
                                'flex items-center gap-1 text-sm font-medium',
                                isUp && 'text-red-500',
                                isDown && 'text-emerald-500',
                                !isUp && !isDown && 'text-muted-foreground'
                            )}
                        >
                            {isUp && <TrendingUp size={16} />}
                            {isDown && <TrendingDown size={16} />}
                            {!isUp && !isDown && <Minus size={16} />}
                            {Math.abs(change).toFixed(1)}%
                        </div>
                    )}
                </div>
                <div className="text-2xl font-bold">{stats.total_amount.toLocaleString('ar-EG')}</div>
                <div className="text-sm text-muted-foreground">إجمالي المصاريف</div>
            </div>

            {/* Voucher Count */}
            <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText size={20} className="text-blue-600" />
                    </div>
                </div>
                <div className="text-2xl font-bold">{stats.voucher_count}</div>
                <div className="text-sm text-muted-foreground">عدد السندات</div>
            </div>

            {/* Average */}
            <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <BarChart3 size={20} className="text-amber-600" />
                    </div>
                </div>
                <div className="text-2xl font-bold">{stats.average_amount.toLocaleString('ar-EG')}</div>
                <div className="text-sm text-muted-foreground">متوسط السند</div>
            </div>

            {/* Max */}
            <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <TrendingUp size={20} className="text-emerald-600" />
                    </div>
                </div>
                <div className="text-2xl font-bold">{stats.max_amount.toLocaleString('ar-EG')}</div>
                <div className="text-sm text-muted-foreground">أعلى سند</div>
            </div>
        </div>
    );
}

// ==========================================
// Distribution Chart (Pie)
// ==========================================

interface DistributionChartProps {
    data: ExpenseDistribution[];
}

const COLORS = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#84CC16', // lime
];

export function DistributionChart({ data }: DistributionChartProps) {
    const total = data.reduce((sum, d) => sum + d.amount, 0);
    let currentAngle = 0;

    // Calculate pie slices
    const slices = data.map((item, i) => {
        const percentage = total > 0 ? (item.amount / total) * 100 : 0;
        const angle = (percentage / 100) * 360;
        const startAngle = currentAngle;
        currentAngle += angle;

        // Calculate path for SVG arc
        const startRad = (startAngle - 90) * (Math.PI / 180);
        const endRad = (currentAngle - 90) * (Math.PI / 180);
        const x1 = 50 + 40 * Math.cos(startRad);
        const y1 = 50 + 40 * Math.sin(startRad);
        const x2 = 50 + 40 * Math.cos(endRad);
        const y2 = 50 + 40 * Math.sin(endRad);
        const largeArc = angle > 180 ? 1 : 0;

        return {
            ...item,
            percentage,
            color: COLORS[i % COLORS.length],
            path: angle >= 360
                ? `M 50 10 A 40 40 0 1 1 49.99 10`
                : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`,
        };
    });

    return (
        <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
                <PieChart size={18} className="text-primary" />
                توزيع المصاريف
            </h3>

            <div className="flex items-center gap-6">
                {/* Pie Chart */}
                <div className="relative w-32 h-32 flex-shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {slices.map((slice, i) => (
                            <path
                                key={i}
                                d={slice.path}
                                fill={slice.color}
                                className="transition-opacity hover:opacity-80"
                            />
                        ))}
                        {/* Center hole */}
                        <circle cx="50" cy="50" r="25" fill="hsl(var(--card))" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-xs text-muted-foreground">الإجمالي</div>
                            <div className="text-sm font-bold">{(total / 1000).toFixed(0)}K</div>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2">
                    {slices.map((slice, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: slice.color }}
                                />
                                <span className="truncate max-w-[120px]">{slice.category_name}</span>
                            </div>
                            <div className="text-muted-foreground font-mono">
                                {slice.percentage.toFixed(0)}%
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ==========================================
// Trend Chart (Line/Bar)
// ==========================================

interface TrendChartProps {
    data: ExpenseTrend[];
}

export function TrendChart({ data }: TrendChartProps) {
    const maxAmount = Math.max(...data.map((d) => d.amount), 1);

    return (
        <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-primary" />
                اتجاه المصاريف الشهرية
            </h3>

            <div className="h-48 flex items-end gap-2">
                {data.map((item, i) => {
                    const height = (item.amount / maxAmount) * 100;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            {/* Bar */}
                            <div className="w-full flex flex-col items-center justify-end h-36">
                                <div
                                    className="w-full max-w-8 bg-primary/80 hover:bg-primary rounded-t transition-all relative group"
                                    style={{ height: `${height}%` }}
                                >
                                    {/* Tooltip */}
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        {item.amount.toLocaleString('ar-EG')} ج.م
                                    </div>
                                </div>
                            </div>
                            {/* Label */}
                            <div className="text-xs text-muted-foreground truncate w-full text-center">
                                {item.period}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ==========================================
// Budget Comparison
// ==========================================

interface BudgetComparisonChartProps {
    data: BudgetComparison[];
}

export function BudgetComparisonChart({ data }: BudgetComparisonChartProps) {
    return (
        <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold mb-4">مقارنة الموازنة بالفعلي</h3>

            <div className="space-y-4">
                {data.map((item, i) => {
                    const percentUsed = item.budget > 0 ? (item.actual / item.budget) * 100 : 0;
                    const isOver = item.status === 'over';
                    const isUnder = item.status === 'under';

                    return (
                        <div key={i} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium truncate max-w-[200px]">
                                    {item.category_name}
                                </span>
                                <div className="flex items-center gap-4">
                                    <span className="text-muted-foreground">
                                        {item.actual.toLocaleString('ar-EG')} / {item.budget.toLocaleString('ar-EG')}
                                    </span>
                                    <span
                                        className={cn(
                                            'font-mono text-sm',
                                            isOver && 'text-red-500',
                                            isUnder && 'text-emerald-500'
                                        )}
                                    >
                                        {item.variance >= 0 ? '+' : ''}
                                        {item.variance_percentage}%
                                    </span>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all',
                                        isOver ? 'bg-red-500' : isUnder ? 'bg-emerald-500' : 'bg-primary'
                                    )}
                                    style={{ width: `${Math.min(percentUsed, 100)}%` }}
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
// Top Categories Table
// ==========================================

interface TopCategoriesProps {
    data: ExpenseDistribution[];
    limit?: number;
}

export function TopCategories({ data, limit = 5 }: TopCategoriesProps) {
    const sorted = [...data].sort((a, b) => b.amount - a.amount).slice(0, limit);
    const total = data.reduce((sum, d) => sum + d.amount, 0);

    return (
        <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="font-semibold mb-4">أعلى التصنيفات إنفاقاً</h3>

            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border">
                        <th className="text-right py-2 font-medium text-muted-foreground">#</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">التصنيف</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">المبلغ</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">النسبة</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((item, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0">
                            <td className="py-2.5">{i + 1}</td>
                            <td className="py-2.5">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                    />
                                    {item.category_name}
                                </div>
                            </td>
                            <td className="py-2.5 text-left font-mono">
                                {item.amount.toLocaleString('ar-EG')}
                            </td>
                            <td className="py-2.5 text-left">
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${(item.amount / total) * 100}%`,
                                                backgroundColor: COLORS[i % COLORS.length],
                                            }}
                                        />
                                    </div>
                                    <span className="text-muted-foreground">
                                        {((item.amount / total) * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
