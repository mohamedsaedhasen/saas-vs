'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    Download,
    Upload,
    LayoutGrid,
    List,
    Users,
    DollarSign,
    Star,
    TrendingUp,
    Eye,
    Edit,
    FileText,
    Phone,
    Mail,
    MapPin,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Customer, CustomerGroup } from '@/types/sales';

// Group config
const groupConfig: Record<CustomerGroup, { label: string; color: string }> = {
    retail: { label: 'تجزئة', color: 'gray' },
    wholesale: { label: 'جملة', color: 'blue' },
    vip: { label: 'VIP', color: 'amber' },
    corporate: { label: 'شركات', color: 'purple' },
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [groupFilter, setGroupFilter] = useState<CustomerGroup | 'all'>('all');

    // Fetch customers from API
    useEffect(() => {
        async function fetchCustomers() {
            try {
                setIsLoading(true);
                const res = await fetch('/api/customers');
                const data = await res.json();

                // Handle different response formats
                if (Array.isArray(data)) {
                    setCustomers(data);
                } else if (data && Array.isArray(data.data)) {
                    setCustomers(data.data);
                } else if (!res.ok) {
                    throw new Error(data.error || 'فشل في جلب العملاء');
                } else {
                    setCustomers([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
                setCustomers([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchCustomers();
    }, []);

    // Filter customers
    const filteredCustomers = customers.filter((customer) => {
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            if (!customer.name.toLowerCase().includes(search) &&
                !customer.email?.toLowerCase().includes(search) &&
                !customer.phone?.includes(search)) {
                return false;
            }
        }
        if (groupFilter !== 'all' && customer.customer_group !== groupFilter) return false;
        return true;
    });

    // Stats
    const stats = {
        total: customers.length,
        vip: customers.filter(c => c.customer_group === 'vip').length,
        totalBalance: customers.reduce((sum, c) => sum + (c.balance || 0), 0),
        totalSpent: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
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
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Link href="/dashboard/sales" className="hover:text-primary">المبيعات</Link>
                        <span>/</span>
                        <span className="text-foreground">العملاء</span>
                    </div>
                    <h1 className="text-2xl font-bold">العملاء</h1>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted">
                        <Upload size={16} />
                        استيراد
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted">
                        <Download size={16} />
                        تصدير
                    </button>
                    <Link
                        href="/dashboard/sales/customers/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                    >
                        <Plus size={18} />
                        عميل جديد
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">إجمالي العملاء</span>
                        <Users size={16} className="text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">عملاء VIP</span>
                        <Star size={16} className="text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold text-amber-600">{stats.vip}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">إجمالي المستحقات</span>
                        <DollarSign size={16} className="text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">{stats.totalBalance.toLocaleString('ar-EG')}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">إجمالي المبيعات</span>
                        <TrendingUp size={16} className="text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">{stats.totalSpent.toLocaleString('ar-EG')}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[250px] relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="بحث بالاسم أو الإيميل أو الهاتف..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2.5 bg-card border border-border rounded-lg focus:border-primary outline-none"
                    />
                </div>

                <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value as CustomerGroup | 'all')}
                    className="px-4 py-2.5 bg-card border border-border rounded-lg focus:border-primary outline-none"
                >
                    <option value="all">كل المجموعات</option>
                    {Object.entries(groupConfig).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                    ))}
                </select>

                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                            'p-2.5 transition-colors',
                            viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        )}
                    >
                        <List size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            'p-2.5 transition-colors',
                            viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        )}
                    >
                        <LayoutGrid size={18} />
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {filteredCustomers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا يوجد عملاء</h3>
                    <p className="text-muted-foreground mb-4">ابدأ بإضافة عميل جديد</p>
                    <Link
                        href="/dashboard/sales/customers/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                        <Plus size={18} />
                        إضافة عميل
                    </Link>
                </div>
            )}

            {/* Content */}
            {filteredCustomers.length > 0 && viewMode === 'list' && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="text-right py-3 px-4 font-medium text-sm">العميل</th>
                                <th className="text-right py-3 px-4 font-medium text-sm">المجموعة</th>
                                <th className="text-right py-3 px-4 font-medium text-sm">التواصل</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">الرصيد</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">الطلبات</th>
                                <th className="text-left py-3 px-4 font-medium text-sm">إجمالي المشتريات</th>
                                <th className="text-center py-3 px-4 font-medium text-sm">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="border-b border-border/50 hover:bg-muted/30">
                                    <td className="py-3 px-4">
                                        <Link href={`/dashboard/sales/customers/${customer.id}`} className="block hover:text-primary">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                                                    {customer.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{customer.name}</div>
                                                    <div className="text-xs text-muted-foreground font-mono">{customer.code}</div>
                                                </div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={cn(
                                            'px-2 py-0.5 rounded-full text-xs font-medium',
                                            `bg-${groupConfig[customer.customer_group || 'retail'].color}-100 text-${groupConfig[customer.customer_group || 'retail'].color}-700`
                                        )}>
                                            {groupConfig[customer.customer_group || 'retail'].label}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm">{customer.phone}</div>
                                        <div className="text-xs text-muted-foreground">{customer.email}</div>
                                    </td>
                                    <td className="py-3 px-4 text-left">
                                        <span className={cn(
                                            'font-mono font-semibold',
                                            (customer.balance || 0) > 0 ? 'text-red-600' : (customer.credit_balance || 0) > 0 ? 'text-emerald-600' : ''
                                        )}>
                                            {(customer.balance || 0) > 0
                                                ? `${(customer.balance || 0).toLocaleString('ar-EG')} مدين`
                                                : (customer.credit_balance || 0) > 0
                                                    ? `${(customer.credit_balance || 0).toLocaleString('ar-EG')} دائن`
                                                    : '0'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-left">{customer.total_orders || 0}</td>
                                    <td className="py-3 px-4 text-left font-mono">
                                        {(customer.total_spent || 0).toLocaleString('ar-EG')} ج.م
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <Link
                                                href={`/dashboard/sales/customers/${customer.id}`}
                                                className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary"
                                            >
                                                <Eye size={16} />
                                            </Link>
                                            <Link
                                                href={`/dashboard/sales/customers/${customer.id}/statement`}
                                                className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary"
                                                title="كشف حساب"
                                            >
                                                <FileText size={16} />
                                            </Link>
                                            <button className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary">
                                                <Edit size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredCustomers.length > 0 && viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCustomers.map((customer) => (
                        <Link
                            key={customer.id}
                            href={`/dashboard/sales/customers/${customer.id}`}
                            className="bg-card rounded-xl border border-border p-4 hover:border-primary hover:shadow-sm transition-all"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                                        {customer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-semibold">{customer.name}</div>
                                        <div className="text-xs text-muted-foreground">{customer.code}</div>
                                    </div>
                                </div>
                                <span className={cn(
                                    'px-2 py-0.5 rounded-full text-xs font-medium',
                                    `bg-${groupConfig[customer.customer_group || 'retail'].color}-100 text-${groupConfig[customer.customer_group || 'retail'].color}-700`
                                )}>
                                    {groupConfig[customer.customer_group || 'retail'].label}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm text-muted-foreground mb-3">
                                {customer.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={14} />
                                        {customer.phone}
                                    </div>
                                )}
                                {customer.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail size={14} />
                                        {customer.email}
                                    </div>
                                )}
                                {customer.city && (
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} />
                                        {customer.city}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-border">
                                <div>
                                    <div className="text-xs text-muted-foreground">الطلبات</div>
                                    <div className="font-semibold">{customer.total_orders || 0}</div>
                                </div>
                                <div className="text-left">
                                    <div className="text-xs text-muted-foreground">إجمالي المشتريات</div>
                                    <div className="font-semibold">{(customer.total_spent || 0).toLocaleString('ar-EG')}</div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
