'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    ArrowRight,
    Edit,
    Trash2,
    Copy,
    Package,
    Boxes,
    Tag,
    DollarSign,
    Barcode,
    Image as ImageIcon,
    Plus,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    ShoppingCart,
    TrendingUp,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product, ProductVariant, ProductOption, ProductImage, VariantInventory } from '@/types/inventory';

type ProductWithDetails = Product & {
    variants: (ProductVariant & { inventory: VariantInventory[] })[];
    options: ProductOption[];
    images: ProductImage[];
    category_name?: string;
    brand_name?: string;
};

export default function ProductDetailsPage() {
    const params = useParams();
    const productId = params.id as string;

    const [product, setProduct] = useState<ProductWithDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'variants' | 'inventory' | 'sales'>('variants');
    const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());

    useEffect(() => {
        async function fetchProduct() {
            try {
                setIsLoading(true);
                const res = await fetch(`/api/products/${productId}`);
                const data = await res.json();

                if (data && !data.error) {
                    // Ensure arrays exist
                    setProduct({
                        ...data,
                        variants: data.variants || [],
                        options: data.options || [],
                        images: data.images || [],
                    });
                } else {
                    setError('المنتج غير موجود');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
            } finally {
                setIsLoading(false);
            }
        }
        if (productId) {
            fetchProduct();
        }
    }, [productId]);

    const toggleVariant = (id: string) => {
        setExpandedVariants(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">خطأ في تحميل البيانات</h2>
                <p className="text-muted-foreground">{error || 'المنتج غير موجود'}</p>
                <Link href="/dashboard/inventory/products" className="mt-4 text-primary hover:underline">
                    العودة للمنتجات
                </Link>
            </div>
        );
    }

    // Calculate totals
    const totalStock = product.variants.reduce((sum, v) =>
        sum + (v.inventory?.reduce((s, i) => s + (i.quantity || 0), 0) || 0), 0
    );
    const totalValue = product.variants.reduce((sum, v) =>
        sum + (v.inventory?.reduce((s, i) => s + ((i.quantity || 0) * (v.cost_price || 0)), 0) || 0), 0
    );
    const minStock = product.min_stock_level || 10;
    const lowStockVariants = product.variants.filter(v => {
        const stock = v.inventory?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;
        return stock <= minStock && stock > 0;
    });
    const outOfStockVariants = product.variants.filter(v =>
        (v.inventory?.reduce((s, i) => s + (i.quantity || 0), 0) || 0) === 0
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/inventory/products"
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                    >
                        <ArrowRight size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Link href="/dashboard/inventory" className="hover:text-primary">المخازن</Link>
                            <span>/</span>
                            <Link href="/dashboard/inventory/products" className="hover:text-primary">المنتجات</Link>
                            <span>/</span>
                            <span className="text-foreground">{product.name}</span>
                        </div>
                        <h1 className="text-2xl font-bold">{product.name}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                        <Copy size={16} />
                        نسخ
                    </button>
                    <Link
                        href={`/dashboard/inventory/products/${product.id}/edit`}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Edit size={16} />
                        تعديل
                    </Link>
                    <button className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Product Info Card */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <div className="flex gap-6">
                            {/* Image */}
                            <div className="w-32 h-32 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <Package size={40} className="text-muted-foreground/40" />
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        'px-2 py-0.5 rounded-full text-xs font-medium',
                                        product.status === 'active' && 'bg-emerald-100 text-emerald-700',
                                        product.status === 'draft' && 'bg-amber-100 text-amber-700',
                                        product.status === 'archived' && 'bg-gray-100 text-gray-600'
                                    )}>
                                        {product.status === 'active' ? 'نشط' : product.status === 'draft' ? 'مسودة' : 'مؤرشف'}
                                    </span>
                                    {product.has_variants && (
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                            {product.variants.length} تباين
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">SKU:</span>
                                        <span className="font-mono mr-2">{product.sku}</span>
                                    </div>
                                    {product.barcode && (
                                        <div>
                                            <span className="text-muted-foreground">Barcode:</span>
                                            <span className="font-mono mr-2">{product.barcode}</span>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-muted-foreground">الفئة:</span>
                                        <span className="mr-2">{product.category_name || '-'}</span>
                                    </div>
                                    {product.brand_name && (
                                        <div>
                                            <span className="text-muted-foreground">العلامة التجارية:</span>
                                            <span className="mr-2">{product.brand_name}</span>
                                        </div>
                                    )}
                                </div>

                                {product.description && (
                                    <p className="text-sm text-muted-foreground">{product.description}</p>
                                )}

                                {product.tags && product.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {product.tags.map((tag, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Options */}
                    {product.options.length > 0 && (
                        <div className="bg-card rounded-xl border border-border p-4">
                            <h3 className="font-semibold mb-3">خيارات المنتج</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {product.options.map(option => (
                                    <div key={option.id} className="text-sm">
                                        <span className="text-muted-foreground">{option.name}:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {option.values.map((v, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs">{v}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="flex border-b border-border">
                            {(['variants', 'inventory', 'sales'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        'flex-1 py-3 px-4 text-sm font-medium transition-colors',
                                        activeTab === tab
                                            ? 'border-b-2 border-primary text-primary bg-muted/30'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                    )}
                                >
                                    {tab === 'variants' && 'التباينات'}
                                    {tab === 'inventory' && 'المخزون'}
                                    {tab === 'sales' && 'المبيعات'}
                                </button>
                            ))}
                        </div>

                        <div className="p-4">
                            {activeTab === 'variants' && (
                                <div className="space-y-2">
                                    {product.variants.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            لا توجد تباينات
                                        </div>
                                    ) : (
                                        product.variants.map(variant => {
                                            const stock = variant.inventory?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;
                                            const isLow = stock <= minStock && stock > 0;
                                            const isOut = stock === 0;
                                            const isExpanded = expandedVariants.has(variant.id);

                                            return (
                                                <div key={variant.id} className="border border-border rounded-lg overflow-hidden">
                                                    <div
                                                        className="flex items-center justify-between p-3 hover:bg-muted/30 cursor-pointer"
                                                        onClick={() => toggleVariant(variant.id)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                            <div>
                                                                <div className="font-medium">{variant.title}</div>
                                                                <div className="text-xs text-muted-foreground font-mono">{variant.sku}</div>
                                                            </div>
                                                            {variant.is_default && (
                                                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">افتراضي</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <div className="text-left">
                                                                <div className="font-semibold">{(variant.price || 0).toLocaleString('ar-EG')} ج.م</div>
                                                                {variant.compare_at_price && (
                                                                    <div className="text-xs text-muted-foreground line-through">
                                                                        {variant.compare_at_price.toLocaleString('ar-EG')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={cn(
                                                                'font-mono',
                                                                isOut && 'text-red-600',
                                                                isLow && 'text-amber-600'
                                                            )}>
                                                                {stock}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isExpanded && variant.inventory && variant.inventory.length > 0 && (
                                                        <div className="border-t border-border p-3 bg-muted/20">
                                                            <table className="w-full text-sm">
                                                                <thead>
                                                                    <tr className="text-muted-foreground">
                                                                        <th className="text-right py-1">المخزن</th>
                                                                        <th className="text-left py-1">الكمية</th>
                                                                        <th className="text-left py-1">محجوز</th>
                                                                        <th className="text-left py-1">متاح</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {variant.inventory.map(inv => (
                                                                        <tr key={inv.id}>
                                                                            <td className="py-1">{inv.warehouse?.name || '-'}</td>
                                                                            <td className="py-1 font-mono">{inv.quantity || 0}</td>
                                                                            <td className="py-1 font-mono text-amber-600">{inv.reserved_quantity || 0}</td>
                                                                            <td className="py-1 font-mono text-emerald-600">{inv.available_quantity || 0}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {activeTab === 'inventory' && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Boxes size={40} className="mx-auto mb-2 opacity-50" />
                                    <p>سجل حركات المخزون</p>
                                </div>
                            )}

                            {activeTab === 'sales' && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <TrendingUp size={40} className="mx-auto mb-2 opacity-50" />
                                    <p>إحصائيات المبيعات</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Stats */}
                <div className="space-y-4">
                    {/* Price Card */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <DollarSign size={16} className="text-emerald-600" />
                            السعر والتكلفة
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">سعر البيع:</span>
                                <span className="font-semibold text-lg">{(product.selling_price || 0).toLocaleString('ar-EG')} ج.م</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">التكلفة:</span>
                                <span className="font-mono">{(product.cost_price || 0).toLocaleString('ar-EG')} ج.م</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-border pt-2">
                                <span className="text-muted-foreground">هامش الربح:</span>
                                <span className="text-emerald-600 font-semibold">
                                    {product.selling_price && product.cost_price
                                        ? (((product.selling_price - product.cost_price) / product.selling_price) * 100).toFixed(0)
                                        : 0}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stock Card */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Boxes size={16} className="text-blue-600" />
                            المخزون
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">إجمالي المخزون:</span>
                                <span className="font-semibold text-lg">{totalStock}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">قيمة المخزون:</span>
                                <span className="font-mono">{totalValue.toLocaleString('ar-EG')} ج.م</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">الحد الأدنى:</span>
                                <span>{minStock}</span>
                            </div>
                        </div>
                    </div>

                    {/* Alerts */}
                    {(lowStockVariants.length > 0 || outOfStockVariants.length > 0) && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-800">
                                <AlertCircle size={16} />
                                تنبيهات المخزون
                            </h3>
                            <div className="space-y-1 text-sm">
                                {outOfStockVariants.length > 0 && (
                                    <p className="text-red-700">
                                        {outOfStockVariants.length} تباين نفد من المخزون
                                    </p>
                                )}
                                {lowStockVariants.length > 0 && (
                                    <p className="text-amber-700">
                                        {lowStockVariants.length} تباين مخزونه منخفض
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <h3 className="font-semibold mb-3">إجراءات سريعة</h3>
                        <div className="space-y-2">
                            <button className="w-full flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm">
                                <Plus size={16} />
                                إضافة تباين
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm">
                                <ImageIcon size={16} />
                                إدارة الصور
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm">
                                <Boxes size={16} />
                                تعديل المخزون
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
