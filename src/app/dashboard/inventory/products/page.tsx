'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus,
    Download,
    Upload,
    Grid3X3,
    List,
    Loader2,
    Package,
    AlertCircle,
} from 'lucide-react';
import { ProductCard, ProductTable, ProductFilters } from '@/components/inventory';
import { cn } from '@/lib/utils';
import type { Product, ProductVariant, ProductFilters as ProductFiltersType } from '@/types/inventory';

type ProductWithExtras = Product & { variants?: ProductVariant[]; total_stock?: number; category_name?: string };

export default function ProductsListPage() {
    const [products, setProducts] = useState<ProductWithExtras[]>([]);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [filters, setFilters] = useState<ProductFiltersType>({});
    const [sortBy, setSortBy] = useState<string>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                const [productsRes, categoriesRes] = await Promise.all([
                    fetch('/api/products'),
                    fetch('/api/products/categories'),
                ]);

                const productsData = await productsRes.json();
                const categoriesData = await categoriesRes.json();

                setProducts(Array.isArray(productsData) ? productsData : productsData?.data || []);
                setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData?.data || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
                setProducts([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // Filter products
    const filteredProducts = products.filter((product) => {
        if (filters.search) {
            const search = filters.search.toLowerCase();
            if (!product.name.toLowerCase().includes(search) &&
                !(product.sku?.toLowerCase().includes(search))) {
                return false;
            }
        }
        if (filters.category_id && product.category_id !== filters.category_id) return false;
        if (filters.status && product.status !== filters.status) return false;
        if (filters.stock_status) {
            const stock = product.total_stock || 0;
            if (filters.stock_status === 'out_of_stock' && stock > 0) return false;
            if (filters.stock_status === 'low_stock' && (stock <= 0 || stock > (product.min_stock_level || 0))) return false;
            if (filters.stock_status === 'in_stock' && stock <= (product.min_stock_level || 0)) return false;
        }
        if (filters.has_variants !== undefined && product.has_variants !== filters.has_variants) return false;
        return true;
    });

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const summary = {
        total: filteredProducts.length,
        active: filteredProducts.filter(p => p.status === 'active').length,
        lowStock: filteredProducts.filter(p => (p.total_stock || 0) <= (p.min_stock_level || 0) && (p.total_stock || 0) > 0).length,
        outOfStock: filteredProducts.filter(p => (p.total_stock || 0) <= 0).length,
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Link href="/dashboard" className="hover:text-primary">لوحة التحكم</Link>
                        <span>/</span>
                        <Link href="/dashboard/inventory" className="hover:text-primary">المخازن</Link>
                        <span>/</span>
                        <span className="text-foreground">المنتجات</span>
                    </div>
                    <h1 className="text-2xl font-bold">المنتجات</h1>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm">
                        <Download size={16} />
                        تصدير
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm">
                        <Upload size={16} />
                        استيراد
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

            {/* Filters */}
            <ProductFilters
                filters={filters}
                onChange={setFilters}
                categories={categories}
            />

            {/* Summary + View Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                    <span>{summary.total} منتج</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-emerald-600">{summary.active} نشط</span>
                    {summary.lowStock > 0 && (
                        <>
                            <span className="text-muted-foreground">|</span>
                            <span className="text-amber-600">{summary.lowStock} مخزون منخفض</span>
                        </>
                    )}
                    {summary.outOfStock > 0 && (
                        <>
                            <span className="text-muted-foreground">|</span>
                            <span className="text-red-600">{summary.outOfStock} نفد</span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1 border border-border rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('table')}
                        className={cn(
                            'p-2 rounded-lg transition-colors',
                            viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        )}
                    >
                        <List size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            'p-2 rounded-lg transition-colors',
                            viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        )}
                    >
                        <Grid3X3 size={16} />
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {filteredProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="w-16 h-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لا توجد منتجات</h3>
                    <p className="text-muted-foreground mb-4">ابدأ بإضافة منتج جديد</p>
                    <Link
                        href="/dashboard/inventory/products/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                        <Plus size={18} />
                        إضافة منتج
                    </Link>
                </div>
            )}

            {/* Products */}
            {filteredProducts.length > 0 && viewMode === 'table' && (
                <ProductTable
                    products={filteredProducts}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                />
            )}

            {filteredProducts.length > 0 && viewMode === 'grid' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}
