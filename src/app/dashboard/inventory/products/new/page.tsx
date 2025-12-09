'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    Plus,
    Trash2,
    Package,
    Upload,
    X,
    ChevronDown,
    ChevronUp,
    GripVertical,
    Image as ImageIcon,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface VariantInput {
    id: string;
    sku: string;
    option1: string;
    option2: string;
    option3: string;
    price: number;
    compare_at_price: number;
    cost_price: number;
    barcode: string;
}

interface OptionInput {
    id: string;
    name: string;
    values: string[];
}

interface Category {
    id: string;
    name: string;
}

interface Brand {
    id: string;
    name: string;
}

export default function NewProductPage() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<string | null>('basic');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data from API
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Form state
    const [name, setName] = useState('');
    const [nameEn, setNameEn] = useState('');
    const [description, setDescription] = useState('');
    const [sku, setSku] = useState('');
    const [barcode, setBarcode] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [status, setStatus] = useState('draft');

    // Pricing
    const [price, setPrice] = useState<number>(0);
    const [compareAtPrice, setCompareAtPrice] = useState<number>(0);
    const [costPrice, setCostPrice] = useState<number>(0);

    // Inventory
    const [trackInventory, setTrackInventory] = useState(true);
    const [initialStock, setInitialStock] = useState<number>(0);
    const [minStock, setMinStock] = useState<number>(10);

    // Variants
    const [hasVariants, setHasVariants] = useState(false);
    const [options, setOptions] = useState<OptionInput[]>([]);
    const [variants, setVariants] = useState<VariantInput[]>([]);

    // Fetch categories and brands
    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoadingData(true);
                const [catRes, brandRes] = await Promise.all([
                    fetch('/api/products/categories'),
                    fetch('/api/brands'),
                ]);

                const catData = await catRes.json();
                const brandData = await brandRes.json();

                setCategories(Array.isArray(catData) ? catData : catData.data || []);
                setBrands(Array.isArray(brandData) ? brandData : brandData.data || []);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoadingData(false);
            }
        }
        fetchData();
    }, []);

    // Sections
    const toggleSection = (section: string) => {
        setActiveSection(activeSection === section ? null : section);
    };

    // Tags
    const addTag = () => {
        if (tagInput && !tags.includes(tagInput)) {
            setTags([...tags, tagInput]);
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    // Options
    const addOption = () => {
        if (options.length < 3) {
            setOptions([...options, { id: Date.now().toString(), name: '', values: [] }]);
        }
    };

    const updateOption = (id: string, field: string, value: any) => {
        setOptions(options.map(o => o.id === id ? { ...o, [field]: value } : o));
    };

    const removeOption = (id: string) => {
        setOptions(options.filter(o => o.id !== id));
    };

    const addOptionValue = (optionId: string, value: string) => {
        if (value) {
            setOptions(options.map(o =>
                o.id === optionId && !o.values.includes(value)
                    ? { ...o, values: [...o.values, value] }
                    : o
            ));
        }
    };

    const removeOptionValue = (optionId: string, value: string) => {
        setOptions(options.map(o =>
            o.id === optionId ? { ...o, values: o.values.filter(v => v !== value) } : o
        ));
    };

    // Generate variants from options
    const generateVariants = () => {
        if (options.length === 0 || options.some(o => o.values.length === 0)) return;

        const newVariants: VariantInput[] = [];
        const opt1 = options[0]?.values || [''];
        const opt2 = options[1]?.values || [''];
        const opt3 = options[2]?.values || [''];

        for (const v1 of opt1) {
            for (const v2 of opt2) {
                for (const v3 of opt3) {
                    if (v1 || v2 || v3) {
                        const title = [v1, v2, v3].filter(Boolean).join(' / ');
                        newVariants.push({
                            id: Date.now().toString() + Math.random(),
                            sku: '',
                            option1: v1,
                            option2: v2,
                            option3: v3,
                            price: price,
                            compare_at_price: compareAtPrice,
                            cost_price: costPrice,
                            barcode: '',
                        });
                    }
                }
            }
        }
        setVariants(newVariants);
    };

    // Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const productData = {
                name,
                name_en: nameEn,
                description,
                sku,
                barcode,
                category_id: categoryId || null,
                brand_id: brandId || null,
                tags,
                status,
                selling_price: price,
                compare_at_price: compareAtPrice,
                cost_price: costPrice,
                track_inventory: trackInventory,
                initial_stock: initialStock,
                min_stock_level: minStock,
                has_variants: hasVariants,
                options: hasVariants ? options : [],
                variants: hasVariants ? variants : [],
            };

            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData),
            });

            if (res.ok) {
                router.push('/dashboard/inventory/products');
            } else {
                const error = await res.json();
                alert(error.message || 'حدث خطأ أثناء الحفظ');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('حدث خطأ أثناء الحفظ');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/inventory/products"
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                    >
                        <ArrowRight size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold">إضافة منتج جديد</h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                        إلغاء
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                        حفظ المنتج
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Basic Info */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleSection('basic')}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                        >
                            <h3 className="font-semibold">المعلومات الأساسية</h3>
                            {activeSection === 'basic' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        {activeSection === 'basic' && (
                            <div className="p-4 pt-0 space-y-4 border-t border-border">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-1">اسم المنتج *</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                                            placeholder="تيشيرت قطن"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-1">الاسم بالإنجليزية</label>
                                        <input
                                            type="text"
                                            value={nameEn}
                                            onChange={(e) => setNameEn(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                                            placeholder="Cotton T-Shirt"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-1">الوصف</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none resize-none"
                                            rows={3}
                                            placeholder="وصف المنتج..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pricing */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleSection('pricing')}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                        >
                            <h3 className="font-semibold">السعر والتكلفة</h3>
                            {activeSection === 'pricing' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        {activeSection === 'pricing' && (
                            <div className="p-4 pt-0 space-y-4 border-t border-border">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">سعر البيع *</label>
                                        <input
                                            type="number"
                                            value={price || ''}
                                            onChange={(e) => setPrice(Number(e.target.value))}
                                            className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                                            placeholder="0"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">السعر قبل الخصم</label>
                                        <input
                                            type="number"
                                            value={compareAtPrice || ''}
                                            onChange={(e) => setCompareAtPrice(Number(e.target.value))}
                                            className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                                            placeholder="0"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">التكلفة</label>
                                        <input
                                            type="number"
                                            value={costPrice || ''}
                                            onChange={(e) => setCostPrice(Number(e.target.value))}
                                            className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                                            placeholder="0"
                                            min="0"
                                        />
                                    </div>
                                </div>
                                {price > 0 && costPrice > 0 && (
                                    <div className="flex items-center gap-4 text-sm bg-muted/50 p-3 rounded-lg">
                                        <span className="text-muted-foreground">الربح:</span>
                                        <span className="font-semibold text-emerald-600">
                                            {(price - costPrice).toLocaleString('ar-EG')} ج.م
                                        </span>
                                        <span className="text-muted-foreground">|</span>
                                        <span className="text-muted-foreground">الهامش:</span>
                                        <span className="font-semibold text-emerald-600">
                                            {(((price - costPrice) / price) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Variants */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleSection('variants')}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                        >
                            <h3 className="font-semibold">التباينات</h3>
                            {activeSection === 'variants' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        {activeSection === 'variants' && (
                            <div className="p-4 pt-0 space-y-4 border-t border-border">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hasVariants}
                                        onChange={(e) => setHasVariants(e.target.checked)}
                                        className="w-4 h-4 rounded border-border"
                                    />
                                    <span className="text-sm">هذا المنتج له تباينات متعددة (مثل: مقاسات، ألوان)</span>
                                </label>

                                {hasVariants && (
                                    <>
                                        {/* Options */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-medium">الخيارات</h4>
                                                {options.length < 3 && (
                                                    <button
                                                        type="button"
                                                        onClick={addOption}
                                                        className="text-sm text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        <Plus size={14} />
                                                        إضافة خيار
                                                    </button>
                                                )}
                                            </div>

                                            {options.map((option, idx) => (
                                                <div key={option.id} className="border border-border rounded-lg p-3 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={option.name}
                                                            onChange={(e) => updateOption(option.id, 'name', e.target.value)}
                                                            placeholder={idx === 0 ? 'المقاس' : idx === 1 ? 'اللون' : 'الخيار'}
                                                            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:border-primary outline-none"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeOption(option.id)}
                                                            className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {option.values.map((v) => (
                                                            <span
                                                                key={v}
                                                                className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm"
                                                            >
                                                                {v}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeOptionValue(option.id, v)}
                                                                    className="hover:text-red-600"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </span>
                                                        ))}
                                                        <input
                                                            type="text"
                                                            placeholder="أضف قيمة..."
                                                            className="px-2 py-1 border border-dashed border-border rounded text-sm w-24 focus:border-primary outline-none"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    addOptionValue(option.id, (e.target as HTMLInputElement).value);
                                                                    (e.target as HTMLInputElement).value = '';
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {options.length > 0 && options.every(o => o.values.length > 0) && (
                                            <button
                                                type="button"
                                                onClick={generateVariants}
                                                className="w-full py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors"
                                            >
                                                توليد التباينات
                                            </button>
                                        )}

                                        {/* Variants Table */}
                                        {variants.length > 0 && (
                                            <div className="border border-border rounded-lg overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted/50">
                                                        <tr>
                                                            <th className="py-2 px-3 text-right">التباين</th>
                                                            <th className="py-2 px-3 text-right">SKU</th>
                                                            <th className="py-2 px-3 text-left">السعر</th>
                                                            <th className="py-2 px-3 text-left">التكلفة</th>
                                                            <th className="py-2 px-3 w-10"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {variants.map((variant) => (
                                                            <tr key={variant.id} className="border-t border-border">
                                                                <td className="py-2 px-3">
                                                                    {[variant.option1, variant.option2, variant.option3]
                                                                        .filter(Boolean)
                                                                        .join(' / ')}
                                                                </td>
                                                                <td className="py-2 px-3">
                                                                    <input
                                                                        type="text"
                                                                        value={variant.sku}
                                                                        onChange={(e) => {
                                                                            setVariants(variants.map(v =>
                                                                                v.id === variant.id ? { ...v, sku: e.target.value } : v
                                                                            ));
                                                                        }}
                                                                        className="w-full px-2 py-1 border border-border rounded text-sm font-mono"
                                                                        placeholder="SKU"
                                                                    />
                                                                </td>
                                                                <td className="py-2 px-3">
                                                                    <input
                                                                        type="number"
                                                                        value={variant.price || ''}
                                                                        onChange={(e) => {
                                                                            setVariants(variants.map(v =>
                                                                                v.id === variant.id ? { ...v, price: Number(e.target.value) } : v
                                                                            ));
                                                                        }}
                                                                        className="w-20 px-2 py-1 border border-border rounded text-sm"
                                                                    />
                                                                </td>
                                                                <td className="py-2 px-3">
                                                                    <input
                                                                        type="number"
                                                                        value={variant.cost_price || ''}
                                                                        onChange={(e) => {
                                                                            setVariants(variants.map(v =>
                                                                                v.id === variant.id ? { ...v, cost_price: Number(e.target.value) } : v
                                                                            ));
                                                                        }}
                                                                        className="w-20 px-2 py-1 border border-border rounded text-sm"
                                                                    />
                                                                </td>
                                                                <td className="py-2 px-3">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setVariants(variants.filter(v => v.id !== variant.id))}
                                                                        className="p-1 hover:bg-red-100 rounded text-red-600"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Inventory */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleSection('inventory')}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                        >
                            <h3 className="font-semibold">المخزون</h3>
                            {activeSection === 'inventory' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        {activeSection === 'inventory' && (
                            <div className="p-4 pt-0 space-y-4 border-t border-border">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={trackInventory}
                                        onChange={(e) => setTrackInventory(e.target.checked)}
                                        className="w-4 h-4 rounded border-border"
                                    />
                                    <span className="text-sm">تتبع المخزون</span>
                                </label>

                                {trackInventory && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">الكمية الابتدائية</label>
                                            <input
                                                type="number"
                                                value={initialStock || ''}
                                                onChange={(e) => setInitialStock(Number(e.target.value))}
                                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">الحد الأدنى</label>
                                            <input
                                                type="number"
                                                value={minStock || ''}
                                                onChange={(e) => setMinStock(Number(e.target.value))}
                                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Status */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <h3 className="font-semibold mb-3">الحالة</h3>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none bg-background"
                        >
                            <option value="draft">مسودة</option>
                            <option value="active">نشط</option>
                        </select>
                    </div>

                    {/* Category & Brand */}
                    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                        <h3 className="font-semibold">التصنيف والعلامة</h3>
                        <div>
                            <label className="block text-sm font-medium mb-1">الفئة</label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none bg-background"
                                disabled={isLoadingData}
                            >
                                <option value="">اختر الفئة</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">العلامة التجارية</label>
                            <select
                                value={brandId}
                                onChange={(e) => setBrandId(e.target.value)}
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none bg-background"
                                disabled={isLoadingData}
                            >
                                <option value="">اختر العلامة</option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* SKU & Barcode */}
                    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                        <h3 className="font-semibold">الترميز</h3>
                        <div>
                            <label className="block text-sm font-medium mb-1">SKU</label>
                            <input
                                type="text"
                                value={sku}
                                onChange={(e) => setSku(e.target.value)}
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none font-mono"
                                placeholder="TSH-001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Barcode</label>
                            <input
                                type="text"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none font-mono"
                                placeholder="123456789012"
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <h3 className="font-semibold mb-3">الوسوم</h3>
                        <div className="flex flex-wrap gap-1 mb-2">
                            {tags.map((tag) => (
                                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-sm">
                                    {tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-600">
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                placeholder="أضف وسم..."
                                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:border-primary outline-none"
                            />
                            <button
                                type="button"
                                onClick={addTag}
                                className="px-3 py-2 bg-muted rounded-lg hover:bg-muted/80"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Images */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <h3 className="font-semibold mb-3">الصور</h3>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                            <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">اسحب الصور هنا</p>
                            <p className="text-xs text-muted-foreground">أو</p>
                            <button
                                type="button"
                                className="mt-2 text-sm text-primary hover:underline"
                            >
                                اختر من جهازك
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
