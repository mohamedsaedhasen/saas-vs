'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, User, X, Check } from 'lucide-react';

interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    city?: string;
}

interface CustomerComboBoxProps {
    value: Customer | null;
    onChange: (customer: Customer | null) => void;
    onCreateNew?: (name: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export default function CustomerComboBox({
    value,
    onChange,
    onCreateNew,
    placeholder = 'بحث عن عميل...',
    disabled = false,
}: CustomerComboBoxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
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

    // Search customers
    useEffect(() => {
        if (!query || query.length < 2) {
            setCustomers([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                setCustomers(data || []);
            } catch (error) {
                console.error('Error searching customers:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (customer: Customer) => {
        onChange(customer);
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

    const noResults = query.length >= 2 && !isLoading && customers.length === 0;

    return (
        <div ref={wrapperRef} className="relative">
            {/* Selected Customer Display */}
            {value ? (
                <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <User size={18} />
                        </div>
                        <div>
                            <div className="font-medium">{value.name}</div>
                            <div className="text-sm text-muted-foreground">{value.phone}</div>
                        </div>
                    </div>
                    {!disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 hover:bg-muted rounded"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            ) : (
                <>
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
                    {isOpen && (query.length >= 2 || customers.length > 0) && (
                        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                            {customers.map((customer) => (
                                <button
                                    key={customer.id}
                                    type="button"
                                    onClick={() => handleSelect(customer)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-muted text-right transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                                        {customer.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{customer.name}</div>
                                        <div className="text-sm text-muted-foreground">{customer.phone}</div>
                                    </div>
                                    {customer.city && (
                                        <span className="text-xs bg-muted px-2 py-0.5 rounded">{customer.city}</span>
                                    )}
                                </button>
                            ))}

                            {/* Create New Option */}
                            {noResults && onCreateNew && (
                                <button
                                    type="button"
                                    onClick={handleCreateNew}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-primary/10 text-primary border-t border-border"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Plus size={16} />
                                    </div>
                                    <div className="flex-1 text-right">
                                        <div className="font-medium">إنشاء عميل جديد</div>
                                        <div className="text-sm opacity-70">&quot;{query}&quot;</div>
                                    </div>
                                </button>
                            )}

                            {query.length >= 2 && !isLoading && customers.length === 0 && !onCreateNew && (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                    لا يوجد عملاء بهذا الاسم
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
