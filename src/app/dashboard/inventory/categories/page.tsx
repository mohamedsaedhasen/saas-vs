'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus,
    Edit,
    Trash2,
    ChevronDown,
    ChevronLeft,
    Folder,
    FolderOpen,
    Package,
    Search,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductCategory } from '@/types/inventory';

interface CategoryNodeProps {
    category: ProductCategory & { children?: ProductCategory[] };
    level: number;
    onEdit: (cat: ProductCategory) => void;
    onDelete: (cat: ProductCategory) => void;
    onAdd: (parentId: string) => void;
}

function CategoryNode({ category, level, onEdit, onDelete, onAdd }: CategoryNodeProps) {
    const [isExpanded, setIsExpanded] = useState(level === 1);
    const hasChildren = category.children && category.children.length > 0;

    return (
        <div>
            <div
                className={cn(
                    'group flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors',
                    level > 1 && 'mr-6'
                )}
            >
                {/* Expand/Collapse */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        'p-1 rounded hover:bg-muted transition-colors',
                        !hasChildren && 'invisible'
                    )}
                >
                    {isExpanded ? (
                        <ChevronDown size={14} className="text-muted-foreground" />
                    ) : (
                        <ChevronLeft size={14} className="text-muted-foreground" />
                    )}
                </button>

                {/* Icon */}
                {isExpanded && hasChildren ? (
                    <FolderOpen size={18} className="text-amber-500" />
                ) : hasChildren ? (
                    <Folder size={18} className="text-amber-500" />
                ) : (
                    <Package size={18} className="text-muted-foreground" />
                )}

                {/* Name & Code */}
                <div className="flex-1">
                    <span className="font-medium">{category.name}</span>
                    {category.code && (
                        <span className="text-xs text-muted-foreground font-mono mr-2">
                            ({category.code})
                        </span>
                    )}
                </div>

                {/* Product Count */}
                <span className="text-sm text-muted-foreground">
                    {category.product_count || 0} منتج
                </span>

                {/* Actions */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                        onClick={() => onAdd(category.id)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary"
                        title="إضافة فرعي"
                    >
                        <Plus size={14} />
                    </button>
                    <button
                        onClick={() => onEdit(category)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary"
                        title="تعديل"
                    >
                        <Edit size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(category)}
                        className="p-1 hover:bg-red-100 rounded text-muted-foreground hover:text-red-600"
                        title="حذف"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Children */}
            {isExpanded && hasChildren && (
                <div className="border-r border-border mr-5">
                    {category.children?.map((child) => (
                        <CategoryNode
                            key={child.id}
                            category={child as any}
                            level={level + 1}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAdd={onAdd}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<(ProductCategory & { children?: ProductCategory[] })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
    const [parentId, setParentId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCategories() {
            try {
                setIsLoading(true);
                const res = await fetch('/api/products/categories');
                const data = await res.json();

                if (Array.isArray(data)) {
                    setCategories(data);
                } else if (data && Array.isArray(data.data)) {
                    setCategories(data.data);
                } else {
                    setCategories([]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
                setCategories([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchCategories();
    }, []);

    const handleAdd = (parentId: string | null = null) => {
        setParentId(parentId);
        setEditingCategory(null);
        setShowAddDialog(true);
    };

    const handleEdit = (category: ProductCategory) => {
        setEditingCategory(category);
        setParentId(category.parent_id);
        setShowAddDialog(true);
    };

    const handleDelete = (category: ProductCategory) => {
        if (confirm(`هل أنت متأكد من حذف "${category.name}"؟`)) {
            console.log('Delete:', category.id);
        }
    };

    // Stats
    const totalCategories = categories.reduce((sum, cat) => {
        let count = 1;
        if (cat.children) {
            count += cat.children.reduce((s, c: any) => {
                let cc = 1;
                if (c.children) cc += c.children.length;
                return s + cc;
            }, 0);
        }
        return sum + count;
    }, 0);

    const totalProducts = categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0);

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
                        <Link href="/dashboard/inventory" className="hover:text-primary">المخازن</Link>
                        <span>/</span>
                        <span className="text-foreground">التصنيفات</span>
                    </div>
                    <h1 className="text-2xl font-bold">تصنيفات المنتجات</h1>
                </div>

                <button
                    onClick={() => handleAdd(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                    <Plus size={18} />
                    إضافة تصنيف
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="text-sm text-muted-foreground">إجمالي التصنيفات</div>
                    <div className="text-2xl font-bold">{totalCategories}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="text-sm text-muted-foreground">التصنيفات الرئيسية</div>
                    <div className="text-2xl font-bold text-primary">{categories.length}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="text-sm text-muted-foreground">إجمالي المنتجات</div>
                    <div className="text-2xl font-bold text-emerald-600">{totalProducts}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="text-sm text-muted-foreground">أعمق مستوى</div>
                    <div className="text-2xl font-bold">3</div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-card rounded-xl border border-border p-4">
                <div className="relative max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="بحث في التصنيفات..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2.5 bg-background border border-border rounded-lg focus:border-primary outline-none"
                    />
                </div>
            </div>

            {/* Empty State */}
            {categories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-card rounded-2xl border border-border">
                    <span className="text-6xl mb-4">📁</span>
                    <h3 className="text-lg font-semibold mb-2">لا توجد تصنيفات</h3>
                    <p className="text-muted-foreground mb-4">ابدأ بإضافة تصنيف جديد</p>
                    <button
                        onClick={() => handleAdd(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                        <Plus size={18} />
                        إضافة تصنيف
                    </button>
                </div>
            )}

            {/* Categories Tree */}
            {categories.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="space-y-1">
                        {categories.map((category) => (
                            <CategoryNode
                                key={category.id}
                                category={category}
                                level={1}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onAdd={handleAdd}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Add/Edit Dialog */}
            {showAddDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-card rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
                        <h2 className="text-xl font-bold mb-4">
                            {editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">الاسم</label>
                                <input
                                    type="text"
                                    defaultValue={editingCategory?.name || ''}
                                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                                    placeholder="اسم التصنيف"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">الكود</label>
                                <input
                                    type="text"
                                    defaultValue={editingCategory?.code || ''}
                                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none font-mono"
                                    placeholder="CLT"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">التصنيف الأب</label>
                                <select
                                    defaultValue={parentId || ''}
                                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none bg-background"
                                >
                                    <option value="">بدون (تصنيف رئيسي)</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddDialog(false)}
                                className="flex-1 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors"
                            >
                                إلغاء
                            </button>
                            <button className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                                {editingCategory ? 'حفظ' : 'إضافة'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
