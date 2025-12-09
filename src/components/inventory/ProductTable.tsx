'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Package,
    Edit,
    Eye,
    Trash2,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Copy,
    MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product, ProductVariant } from '@/types/inventory';

interface ProductTableProps {
    products: (Product & {
        variants?: ProductVariant[];
        total_stock?: number;
        category_name?: string;
    })[];
    onEdit?: (product: Product) => void;
    onDelete?: (product: Product) => void;
    onDuplicate?: (product: Product) => void;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onSort?: (field: string) => void;
}

export function ProductTable({
    products,
    onEdit,
    onDelete,
    onDuplicate,
    sortBy,
    sortOrder,
    onSort,
}: ProductTableProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (id: string) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const SortHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
        <button
            onClick={() => onSort?.(field)}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
            {children}
            {sortBy === field && (
                sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
            )}
        </button>
    );

    const getStockStatus = (product: Product & { total_stock?: number }) => {
        const stock = product.total_stock || 0;
        if (stock <= 0) return { label: 'نفد', color: 'red' };
        if (stock <= product.min_stock_level) return { label: 'منخفض', color: 'yellow' };
        return { label: 'متوفر', color: 'green' };
    };

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-border bg-muted/50">
                        <th className="w-10 py-3 px-4"></th>
                        <th className="text-right py-3 px-4 font-medium text-sm">
                            <SortHeader field="name">المنتج</SortHeader>
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-sm">الفئة</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">
                            <SortHeader field="price">السعر</SortHeader>
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-sm">التكلفة</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">
                            <SortHeader field="stock">المخزون</SortHeader>
                        </th>
                        <th className="text-center py-3 px-4 font-medium text-sm">الحالة</th>
                        <th className="text-center py-3 px-4 font-medium text-sm">الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => {
                        const stockStatus = getStockStatus(product);
                        const variantCount = product.variants?.length || 0;
                        const isExpanded = expandedRows.has(product.id);

                        return (
                            <React.Fragment key={product.id}>
                                <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                    {/* Expand */}
                                    <td className="py-3 px-4">
                                        {variantCount > 0 && (
                                            <button
                                                onClick={() => toggleRow(product.id)}
                                                className="p-1 hover:bg-muted rounded"
                                            >
                                                {isExpanded ? (
                                                    <ChevronUp size={16} />
                                                ) : (
                                                    <ChevronDown size={16} />
                                                )}
                                            </button>
                                        )}
                                    </td>

                                    {/* Product */}
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                                {product.image_url ? (
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Package size={16} className="text-muted-foreground" />
                                                )}
                                            </div>
                                            <div>
                                                <Link
                                                    href={`/dashboard/inventory/products/${product.id}`}
                                                    className="font-medium hover:text-primary transition-colors"
                                                >
                                                    {product.name}
                                                </Link>
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    {product.sku || '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Category */}
                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                        {product.category_name || '-'}
                                    </td>

                                    {/* Price */}
                                    <td className="py-3 px-4 text-left">
                                        {variantCount > 0 ? (
                                            <div className="text-sm">
                                                <span className="font-mono">
                                                    {Math.min(...product.variants!.map(v => v.price)).toLocaleString('ar-EG')}
                                                </span>
                                                {product.variants!.length > 1 && (
                                                    <span className="text-muted-foreground"> - </span>
                                                )}
                                                {product.variants!.length > 1 && (
                                                    <span className="font-mono">
                                                        {Math.max(...product.variants!.map(v => v.price)).toLocaleString('ar-EG')}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="font-mono">
                                                {product.selling_price.toLocaleString('ar-EG')}
                                            </span>
                                        )}
                                    </td>

                                    {/* Cost */}
                                    <td className="py-3 px-4 text-left text-sm text-muted-foreground font-mono">
                                        {product.cost_price.toLocaleString('ar-EG')}
                                    </td>

                                    {/* Stock */}
                                    <td className="py-3 px-4 text-left">
                                        <div className={cn(
                                            'inline-flex items-center gap-1 font-mono text-sm',
                                            stockStatus.color === 'red' && 'text-red-600',
                                            stockStatus.color === 'yellow' && 'text-amber-600',
                                            stockStatus.color === 'green' && 'text-emerald-600'
                                        )}>
                                            {stockStatus.color !== 'green' && (
                                                <AlertCircle size={14} />
                                            )}
                                            {product.total_stock || 0}
                                        </div>
                                        {variantCount > 0 && (
                                            <div className="text-xs text-muted-foreground">
                                                {variantCount} تباين
                                            </div>
                                        )}
                                    </td>

                                    {/* Status */}
                                    <td className="py-3 px-4 text-center">
                                        <span className={cn(
                                            'px-2 py-0.5 rounded-full text-xs font-medium',
                                            product.status === 'active' && 'bg-emerald-100 text-emerald-700',
                                            product.status === 'draft' && 'bg-amber-100 text-amber-700',
                                            product.status === 'archived' && 'bg-gray-100 text-gray-600'
                                        )}>
                                            {product.status === 'active' ? 'نشط' : product.status === 'draft' ? 'مسودة' : 'مؤرشف'}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <Link
                                                href={`/dashboard/inventory/products/${product.id}`}
                                                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
                                            >
                                                <Eye size={16} />
                                            </Link>
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(product)}
                                                    className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            )}
                                            {onDuplicate && (
                                                <button
                                                    onClick={() => onDuplicate(product)}
                                                    className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(product)}
                                                    className="p-1.5 hover:bg-red-100 rounded-lg text-muted-foreground hover:text-red-600"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>

                                {/* Variants Row (Expanded) */}
                                {isExpanded && product.variants && (
                                    <tr className="bg-muted/20">
                                        <td colSpan={8} className="py-2 px-4">
                                            <div className="mr-10 border border-border rounded-lg overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-muted/50 border-b border-border">
                                                            <th className="py-2 px-3 text-right font-medium">التباين</th>
                                                            <th className="py-2 px-3 text-right font-medium">SKU</th>
                                                            <th className="py-2 px-3 text-left font-medium">السعر</th>
                                                            <th className="py-2 px-3 text-left font-medium">التكلفة</th>
                                                            <th className="py-2 px-3 text-left font-medium">المخزون</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {product.variants.map((variant) => (
                                                            <tr key={variant.id} className="border-b border-border/50 last:border-0">
                                                                <td className="py-2 px-3">
                                                                    {variant.title || 'افتراضي'}
                                                                    {variant.is_default && (
                                                                        <span className="mr-2 text-xs text-muted-foreground">(افتراضي)</span>
                                                                    )}
                                                                </td>
                                                                <td className="py-2 px-3 font-mono text-muted-foreground">
                                                                    {variant.sku || '-'}
                                                                </td>
                                                                <td className="py-2 px-3 text-left font-mono">
                                                                    {variant.price.toLocaleString('ar-EG')}
                                                                </td>
                                                                <td className="py-2 px-3 text-left font-mono text-muted-foreground">
                                                                    {variant.cost_price.toLocaleString('ar-EG')}
                                                                </td>
                                                                <td className="py-2 px-3 text-left font-mono">
                                                                    {variant.total_stock || 0}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>

            {products.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                    <Package size={48} className="mx-auto mb-4 opacity-50" />
                    <p>لا توجد منتجات</p>
                </div>
            )}
        </div>
    );
}
