'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Building2, X } from 'lucide-react';

interface Supplier {
    id: string;
    name: string;
    phone: string;
    email?: string;
    city?: string;
}

interface SupplierComboBoxProps {
    value: Supplier | null;
    onChange: (supplier: Supplier | null) => void;
    onCreateNew?: (name: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export default function SupplierComboBox({
    value,
    onChange,
    onCreateNew,
    placeholder = 'بحث عن مورد...',
    disabled = false,
}: SupplierComboBoxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!query || query.length < 2) {
            setSuppliers([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/suppliers/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                setSuppliers(data || []);
            } catch (error) {
                console.error('Error searching suppliers:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (supplier: Supplier) => {
        onChange(supplier);
        setQuery('');
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange(null);
        setQuery('');
        inputRef.current?.focus();
    };

    const handleCreateNew = () => {
        if (onCreateNew && query.trim()) {
            onCreateNew(query.trim());
            setIsOpen(false);
        }
    };

    const noResults = query.length >= 2 && !isLoading && suppliers.length === 0;

    return (
        <div ref={wrapperRef} className="relative">
            {value ? (
                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 flex items-center justify-center">
                            <Building2 size={18} />
                        </div>
                        <div>
                            <div className="font-medium">{value.name}</div>
                            <div className="text-sm text-muted-foreground">{value.phone}</div>
                        </div>
                    </div>
                    {!disabled && (
                        <button type="button" onClick={handleClear} className="p-1 hover:bg-muted rounded">
                            <X size={16} />
                        </button>
                    )}
                </div>
            ) : (
                <>
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
                            className="w-full pl-4 pr-10 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                        {isLoading && (
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>

                    {isOpen && (query.length >= 2 || suppliers.length > 0) && (
                        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                            {suppliers.map((supplier) => (
                                <button
                                    key={supplier.id}
                                    type="button"
                                    onClick={() => handleSelect(supplier)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-muted text-right transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-sm text-orange-600">
                                        {supplier.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{supplier.name}</div>
                                        <div className="text-sm text-muted-foreground">{supplier.phone}</div>
                                    </div>
                                </button>
                            ))}

                            {noResults && onCreateNew && (
                                <button
                                    type="button"
                                    onClick={handleCreateNew}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-orange-600 border-t border-border"
                                >
                                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                                        <Plus size={16} />
                                    </div>
                                    <div className="flex-1 text-right">
                                        <div className="font-medium">إنشاء مورد جديد</div>
                                        <div className="text-sm opacity-70">"{query}"</div>
                                    </div>
                                </button>
                            )}

                            {query.length >= 2 && !isLoading && suppliers.length === 0 && !onCreateNew && (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                    لا يوجد موردين بهذا الاسم
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
