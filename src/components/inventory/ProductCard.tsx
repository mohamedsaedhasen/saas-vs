'use client';

import React from 'react';
import Link from 'next/link';
import { Package, Edit, Eye, Trash2, AlertCircle, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product, ProductVariant } from '@/types/inventory';

interface ProductCardProps {
    product: Product & {
        variants?: ProductVariant[];
        total_stock?: number;
        category_name?: string;
    };
    onEdit?: (product: Product) => void;
    onDelete?: (product: Product) => void;
    onDuplicate?: (product: Product) => void;
}

export function ProductCard({ product, onEdit, onDelete, onDuplicate }: ProductCardProps) {
    const getStockStatus = () => {
        const stock = product.total_stock || 0;
        if (stock <= 0) return { label: 'نفد', color: 'red' };
        if (stock <= product.min_stock_level) return { label: 'منخفض', color: 'yellow' };
        return { label: 'متوفر', color: 'green' };
    };

    const stockStatus = getStockStatus();
    const variantCount = product.variants?.length || 0;
    const priceRange = product.variants && product.variants.length > 1
        ? {
            min: Math.min(...product.variants.map(v => v.price)),
            max: Math.max(...product.variants.map(v => v.price))
        }
        : null;

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow group">
            {/* Image */}
            <div className="relative aspect-square bg-muted">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package size={48} className="text-muted-foreground/30" />
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                    <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        product.status === 'active' && 'bg-emerald-100 text-emerald-700',
                        product.status === 'draft' && 'bg-amber-100 text-amber-700',
                        product.status === 'archived' && 'bg-gray-100 text-gray-600'
                    )}>
                        {product.status === 'active' ? 'نشط' : product.status === 'draft' ? 'مسودة' : 'مؤرشف'}
                    </span>
                </div>

                {/* Stock Warning */}
                {stockStatus.color === 'red' && (
                    <div className="absolute top-2 left-2">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <AlertCircle size={12} />
                            {stockStatus.label}
                        </span>
                    </div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Link
                        href={`/dashboard/inventory/products/${product.id}`}
                        className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <Eye size={18} className="text-gray-700" />
                    </Link>
                    {onEdit && (
                        <button
                            onClick={() => onEdit(product)}
                            className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <Edit size={18} className="text-gray-700" />
                        </button>
                    )}
                    {onDuplicate && (
                        <button
                            onClick={() => onDuplicate(product)}
                            className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <Copy size={18} className="text-gray-700" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(product)}
                            className="p-2 bg-white rounded-lg hover:bg-red-100 transition-colors"
                        >
                            <Trash2 size={18} className="text-red-600" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Category */}
                {product.category_name && (
                    <div className="text-xs text-muted-foreground mb-1">
                        {product.category_name}
                    </div>
                )}

                {/* Name */}
                <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
                    {product.name}
                </h3>

                {/* SKU */}
                {product.sku && (
                    <div className="text-xs font-mono text-muted-foreground mb-2">
                        {product.sku}
                    </div>
                )}

                {/* Price */}
                <div className="flex items-center justify-between">
                    <div>
                        {priceRange ? (
                            <div className="font-bold text-primary">
                                {priceRange.min === priceRange.max
                                    ? `${priceRange.min.toLocaleString('ar-EG')} ج.م`
                                    : `${priceRange.min.toLocaleString('ar-EG')} - ${priceRange.max.toLocaleString('ar-EG')} ج.م`
                                }
                            </div>
                        ) : (
                            <div className="font-bold text-primary">
                                {product.selling_price.toLocaleString('ar-EG')} ج.م
                            </div>
                        )}
                        {variantCount > 0 && (
                            <div className="text-xs text-muted-foreground">
                                {variantCount} تباين
                            </div>
                        )}
                    </div>

                    {/* Stock */}
                    <div className="text-left">
                        <div className={cn(
                            'font-mono font-semibold',
                            stockStatus.color === 'red' && 'text-red-600',
                            stockStatus.color === 'yellow' && 'text-amber-600',
                            stockStatus.color === 'green' && 'text-emerald-600'
                        )}>
                            {product.total_stock || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            في المخزون
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
