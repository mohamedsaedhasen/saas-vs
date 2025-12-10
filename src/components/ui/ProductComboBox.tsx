'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Package, X } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock_quantity: number;
}

interface ProductComboBoxProps {
    onSelect: (product: Product) => void;
    onCreateNew?: (name: string) => void;
    placeholder?: string;
    disabled?: boolean;
    clearAfterSelect?: boolean;
}

export default function ProductComboBox({
    onSelect,
    onCreateNew,
    placeholder = 'بحث عن منتج...',
    disabled = false,
    clearAfterSelect = true,
}: ProductComboBoxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search products
    useEffect(() => {
        if (!query || query.length < 1) {
            setProducts([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                setProducts(data || []);
            } catch (error) {
                console.error('Error searching products:', error);
            } finally {
                setIsLoading(false);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (product: Product) => {
        onSelect(product);
        if (clearAfterSelect) {
            setQuery('');
        }
        setIsOpen(false);
    };

    const handleCreateNew = () => {
        if (onCreateNew && query.trim()) {
            onCreateNew(query.trim());
            setIsOpen(false);
            setQuery('');
        }
    };

    const noResults = query.length >= 1 && !isLoading && products.length === 0;

    return (
        <div ref={wrapperRef} className="relative">
            {/* Search Input */}
            <div className="relative">
                <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full pl-4 pr-10 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {isLoading && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (query.length >= 1 || products.length > 0) && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {products.map((product) => (
                        <button
                            key={product.id}
                            type="button"
                            onClick={() => handleSelect(product)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-muted text-right transition-colors"
                        >
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                <Package size={18} className="text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{product.name}</div>
                                <div className="text-sm text-muted-foreground">{product.sku}</div>
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-primary">{product.price.toLocaleString('ar-EG')}</div>
                                <div className="text-xs text-muted-foreground">
                                    متاح: {product.stock_quantity}
                                </div>
                            </div>
                        </button>
                    ))}

                    {/* Create New Option */}
                    {noResults && onCreateNew && (
                        <button
                            type="button"
                            onClick={handleCreateNew}
                            className="w-full flex items-center gap-3 p-3 hover:bg-primary/10 text-primary border-t border-border"
                        >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Plus size={18} />
                            </div>
                            <div className="flex-1 text-right">
                                <div className="font-medium">إنشاء منتج جديد</div>
                                <div className="text-sm opacity-70">&quot;{query}&quot;</div>
                            </div>
                        </button>
                    )}

                    {query.length >= 1 && !isLoading && products.length === 0 && !onCreateNew && (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            لا يوجد منتجات بهذا الاسم
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
