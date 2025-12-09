'use client';

import React, { useState } from 'react';
import { Search, X, Filter, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductFilters as ProductFiltersType, ProductStatus } from '@/types/inventory';

interface ProductFiltersProps {
    filters: ProductFiltersType;
    onChange: (filters: ProductFiltersType) => void;
    categories?: { id: string; name: string }[];
    brands?: { id: string; name: string }[];
    warehouses?: { id: string; name: string }[];
}

const statusOptions: { value: ProductStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'كل الحالات' },
    { value: 'active', label: 'نشط' },
    { value: 'draft', label: 'مسودة' },
    { value: 'archived', label: 'مؤرشف' },
];

const stockOptions = [
    { value: 'all', label: 'كل المخزون' },
    { value: 'in_stock', label: 'متوفر' },
    { value: 'low_stock', label: 'مخزون منخفض' },
    { value: 'out_of_stock', label: 'نفد المخزون' },
];

export function ProductFilters({
    filters,
    onChange,
    categories = [],
    brands = [],
    warehouses = [],
}: ProductFiltersProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const updateFilter = (key: keyof ProductFiltersType, value: any) => {
        onChange({ ...filters, [key]: value || undefined });
    };

    const clearFilters = () => {
        onChange({});
    };

    const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

    return (
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
            {/* Main Row */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="flex-1 min-w-[200px] relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="بحث بالاسم أو الكود..."
                        value={filters.search || ''}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        className="w-full pr-10 pl-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                </div>

                {/* Category */}
                <select
                    value={filters.category_id || ''}
                    onChange={(e) => updateFilter('category_id', e.target.value)}
                    className="px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary outline-none min-w-[150px]"
                >
                    <option value="">كل الفئات</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>

                {/* Status */}
                <select
                    value={filters.status || 'all'}
                    onChange={(e) => updateFilter('status', e.target.value === 'all' ? undefined : e.target.value)}
                    className="px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary outline-none min-w-[130px]"
                >
                    {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                {/* Stock */}
                <select
                    value={filters.stock_status || 'all'}
                    onChange={(e) => updateFilter('stock_status', e.target.value === 'all' ? undefined : e.target.value)}
                    className="px-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary outline-none min-w-[140px]"
                >
                    {stockOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                {/* Advanced Toggle */}
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors',
                        showAdvanced ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground hover:bg-muted'
                    )}
                >
                    <Filter size={16} />
                    المزيد
                    <ChevronDown size={14} className={cn('transition-transform', showAdvanced && 'rotate-180')} />
                </button>

                {/* Clear */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <X size={14} />
                        مسح الفلاتر
                    </button>
                )}
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
                <div className="pt-4 border-t border-border space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Brand */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5">العلامة التجارية</label>
                            <select
                                value={filters.brand_id || ''}
                                onChange={(e) => updateFilter('brand_id', e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary outline-none text-sm"
                            >
                                <option value="">الكل</option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Warehouse */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5">المخزن</label>
                            <select
                                value={filters.warehouse_id || ''}
                                onChange={(e) => updateFilter('warehouse_id', e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary outline-none text-sm"
                            >
                                <option value="">كل المخازن</option>
                                {warehouses.map((wh) => (
                                    <option key={wh.id} value={wh.id}>
                                        {wh.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Price Min */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5">السعر من</label>
                            <input
                                type="number"
                                value={filters.price_min || ''}
                                onChange={(e) => updateFilter('price_min', e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="0"
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary outline-none text-sm"
                            />
                        </div>

                        {/* Price Max */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5">السعر إلى</label>
                            <input
                                type="number"
                                value={filters.price_max || ''}
                                onChange={(e) => updateFilter('price_max', e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="999999"
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:border-primary outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Variants Toggle */}
                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.has_variants === true}
                                onChange={(e) => updateFilter('has_variants', e.target.checked ? true : undefined)}
                                className="w-4 h-4 rounded border-border"
                            />
                            <span className="text-sm">منتجات لها تباينات فقط</span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}
