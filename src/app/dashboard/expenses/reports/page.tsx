'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    BarChart3,
    PieChart,
    TrendingUp,
    Calendar,
    Building2,
    Users,
    FileText,
    Download,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
    MonthlyComparison,
    CostCenterReport,
    ExpenseHeatmapData
} from '@/types/expenses';

export default function ReportsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'monthly' | 'cost_center' | 'heatmap'>('monthly');

    const [monthlyData, setMonthlyData] = useState<MonthlyComparison[]>([]);
    const [costCenterData, setCostCenterData] = useState<CostCenterReport[]>([]);
    const [heatmapData, setHeatmapData] = useState<ExpenseHeatmapData[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);

                // Fetch monthly data
                const monthlyRes = await fetch('/api/expenses/reports/monthly');
                const monthlyJson = await monthlyRes.json();
                if (Array.isArray(monthlyJson)) {
                    setMonthlyData(monthlyJson);
                } else if (monthlyJson && Array.isArray(monthlyJson.data)) {
                    setMonthlyData(monthlyJson.data);
                }

                // Fetch cost center data
                const costCenterRes = await fetch('/api/expenses/reports/cost-centers');
                const costCenterJson = await costCenterRes.json();
                if (Array.isArray(costCenterJson)) {
                    setCostCenterData(costCenterJson);
                } else if (costCenterJson && Array.isArray(costCenterJson.data)) {
                    setCostCenterData(costCenterJson.data);
                }

                // Fetch heatmap data
                const heatmapRes = await fetch('/api/expenses/reports/heatmap');
                const heatmapJson = await heatmapRes.json();
                if (Array.isArray(heatmapJson)) {
                    setHeatmapData(heatmapJson);
                } else if (heatmapJson && Array.isArray(heatmapJson.data)) {
                    setHeatmapData(heatmapJson.data);
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const tabs = [
        { id: 'monthly', label: 'مقارنة شهرية', icon: BarChart3 },
        { id: 'cost_center', label: 'مراكز التكلفة', icon: Building2 },
        { id: 'heatmap', label: 'خريطة الصرف', icon: Calendar },
    ];

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
                        <h1 className="text-2xl font-bold">التقارير المتقدمة</h1>
                        <p className="text-muted-foreground mt-1">
                            تحليلات ومقارنات شاملة للمصاريف
                        </p>
                    </div>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm">
                    <Download size={16} />
                    تصدير التقرير
                </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-border">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
                                activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Monthly Comparison */}
            {activeTab === 'monthly' && (
                <div className="space-y-6">
                    {monthlyData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-card rounded-2xl border border-border">
                            <span className="text-6xl mb-4">📊</span>
                            <h3 className="text-lg font-semibold mb-2">لا توجد بيانات</h3>
                            <p className="text-muted-foreground">لم يتم تسجيل مصاريف بعد</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-card rounded-xl border border-border p-6">
                                <h3 className="font-semibold mb-4">مقارنة المصاريف الشهرية</h3>

                                {/* Chart */}
                                <div className="h-64 flex items-end gap-4">
                                    {monthlyData.map((month, i) => {
                                        const maxTotal = Math.max(...monthlyData.map((m) => m.total));
                                        const height = maxTotal > 0 ? (month.total / maxTotal) * 100 : 0;

                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                                <div className="w-full flex flex-col items-center justify-end h-48">
                                                    <div
                                                        className={cn(
                                                            'w-full max-w-12 rounded-t transition-all relative group',
                                                            month.change_percentage >= 0 ? 'bg-red-400' : 'bg-emerald-400'
                                                        )}
                                                        style={{ height: `${height}%` }}
                                                    >
                                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {month.total.toLocaleString('ar-EG')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground">{month.month}</div>
                                                <div
                                                    className={cn(
                                                        'text-xs font-medium',
                                                        month.change_percentage >= 0 ? 'text-red-500' : 'text-emerald-500'
                                                    )}
                                                >
                                                    {month.change_percentage >= 0 ? '+' : ''}
                                                    {month.change_percentage}%
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Summary Table */}
                            <div className="bg-card rounded-xl border border-border overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/50">
                                            <th className="text-right py-3 px-4 font-medium text-sm">الشهر</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm">الإجمالي</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm">التغير</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm">النسبة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthlyData.map((month, i) => (
                                            <tr key={i} className="border-b border-border/50">
                                                <td className="py-3 px-4">{month.month} {month.year}</td>
                                                <td className="py-3 px-4 text-left font-mono">
                                                    {month.total.toLocaleString('ar-EG')}
                                                </td>
                                                <td className="py-3 px-4 text-left">
                                                    <span
                                                        className={cn(
                                                            'font-mono',
                                                            month.change_from_previous >= 0 ? 'text-red-500' : 'text-emerald-500'
                                                        )}
                                                    >
                                                        {month.change_from_previous >= 0 ? '+' : ''}
                                                        {month.change_from_previous.toLocaleString('ar-EG')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-left">
                                                    <span
                                                        className={cn(
                                                            'font-mono',
                                                            month.change_percentage >= 0 ? 'text-red-500' : 'text-emerald-500'
                                                        )}
                                                    >
                                                        {month.change_percentage >= 0 ? '+' : ''}
                                                        {month.change_percentage}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Cost Center Report */}
            {activeTab === 'cost_center' && (
                <div className="space-y-6">
                    {costCenterData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-card rounded-2xl border border-border">
                            <span className="text-6xl mb-4">🏢</span>
                            <h3 className="text-lg font-semibold mb-2">لا توجد بيانات</h3>
                            <p className="text-muted-foreground">لم يتم تسجيل مصاريف لمراكز التكلفة</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {costCenterData.map((cc) => {
                                    const total = costCenterData.reduce((sum, c) => sum + c.total_amount, 0);
                                    const percentage = total > 0 ? (cc.total_amount / total) * 100 : 0;

                                    return (
                                        <div
                                            key={cc.cost_center_id}
                                            className="bg-card rounded-xl border border-border p-4"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={18} className="text-muted-foreground" />
                                                    <span className="font-medium">{cc.cost_center_name}</span>
                                                </div>
                                                <span className="text-xs font-mono text-muted-foreground">
                                                    {cc.cost_center_code}
                                                </span>
                                            </div>

                                            <div className="text-2xl font-bold mb-2">
                                                {cc.total_amount.toLocaleString('ar-EG')} ج.م
                                            </div>

                                            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                                                <span>{cc.voucher_count} سند</span>
                                                <span>{percentage.toFixed(1)}%</span>
                                            </div>

                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Detailed Table */}
                            <div className="bg-card rounded-xl border border-border overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/50">
                                            <th className="text-right py-3 px-4 font-medium text-sm">مركز التكلفة</th>
                                            <th className="text-right py-3 px-4 font-medium text-sm">الكود</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm">الإجمالي</th>
                                            <th className="text-center py-3 px-4 font-medium text-sm">السندات</th>
                                            <th className="text-left py-3 px-4 font-medium text-sm">النسبة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {costCenterData.map((cc) => {
                                            const total = costCenterData.reduce((sum, c) => sum + c.total_amount, 0);
                                            const percentage = total > 0 ? (cc.total_amount / total) * 100 : 0;

                                            return (
                                                <tr key={cc.cost_center_id} className="border-b border-border/50">
                                                    <td className="py-3 px-4 font-medium">{cc.cost_center_name}</td>
                                                    <td className="py-3 px-4 font-mono text-sm">{cc.cost_center_code}</td>
                                                    <td className="py-3 px-4 text-left font-mono">
                                                        {cc.total_amount.toLocaleString('ar-EG')}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">{cc.voucher_count}</td>
                                                    <td className="py-3 px-4 text-left">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary rounded-full"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm">{percentage.toFixed(1)}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Heatmap */}
            {activeTab === 'heatmap' && (
                <div className="bg-card rounded-xl border border-border p-6">
                    <h3 className="font-semibold mb-4">خريطة الصرف اليومية (آخر 90 يوم)</h3>

                    {heatmapData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <span className="text-6xl mb-4">📅</span>
                            <h3 className="text-lg font-semibold mb-2">لا توجد بيانات</h3>
                            <p className="text-muted-foreground">لم يتم تسجيل مصاريف يومية</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-start gap-2">
                                {/* Days labels */}
                                <div className="flex flex-col gap-1 text-xs text-muted-foreground pt-5">
                                    <span>أحد</span>
                                    <span>إثنين</span>
                                    <span>ثلاثاء</span>
                                    <span>أربعاء</span>
                                    <span>خميس</span>
                                    <span>جمعة</span>
                                    <span>سبت</span>
                                </div>

                                {/* Heatmap grid */}
                                <div className="flex-1 overflow-x-auto">
                                    <div className="flex gap-1">
                                        {Array.from({ length: 13 }).map((_, weekIndex) => {
                                            const weekData = heatmapData.filter(
                                                (d) => d.week_of_year === weekIndex
                                            );

                                            return (
                                                <div key={weekIndex} className="flex flex-col gap-1">
                                                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                                                        const dayData = weekData.find((d) => d.day_of_week === dayIndex);
                                                        const intensity = dayData?.intensity || 0;

                                                        return (
                                                            <div
                                                                key={dayIndex}
                                                                className="w-4 h-4 rounded-sm cursor-pointer group relative"
                                                                style={{
                                                                    backgroundColor: intensity > 0
                                                                        ? `rgba(59, 130, 246, ${0.2 + intensity * 0.8})`
                                                                        : 'hsl(var(--muted))',
                                                                }}
                                                            >
                                                                {dayData && (
                                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-foreground text-background px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                                        {dayData.date}: {dayData.amount.toFixed(0)} ج.م
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                                <span>أقل</span>
                                <div className="flex gap-1">
                                    {[0.2, 0.4, 0.6, 0.8, 1].map((level) => (
                                        <div
                                            key={level}
                                            className="w-4 h-4 rounded-sm"
                                            style={{
                                                backgroundColor: `rgba(59, 130, 246, ${level})`,
                                            }}
                                        />
                                    ))}
                                </div>
                                <span>أكثر</span>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
