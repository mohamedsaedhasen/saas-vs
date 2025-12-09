'use client';

import { useState } from 'react';
import { X, Package, Save } from 'lucide-react';

interface QuickCreateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (product: { id: string; name: string; sku: string; price: number; stock_quantity: number }) => void;
    initialName?: string;
}

export default function QuickCreateProductModal({
    isOpen,
    onClose,
    onCreate,
    initialName = '',
}: QuickCreateProductModalProps) {
    const [name, setName] = useState(initialName);
    const [sku, setSku] = useState('');
    const [price, setPrice] = useState(0);
    const [costPrice, setCostPrice] = useState(0);
    const [stockQuantity, setStockQuantity] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
                    selling_price: price,
                    cost_price: costPrice,
                    stock_quantity: stockQuantity,
                }),
            });

            if (response.ok) {
                const product = await response.json();
                onCreate({
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    price: product.selling_price || price,
                    stock_quantity: product.stock_quantity || stockQuantity,
                });
                onClose();
            }
        } catch (error) {
            console.error('Error creating product:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-card rounded-xl border border-border shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Package size={18} className="text-primary" />
                        <h2 className="font-semibold">إنشاء منتج جديد</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded">
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            اسم المنتج <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">SKU</label>
                        <input
                            type="text"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            placeholder="سيتم التوليد تلقائياً"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">سعر البيع</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">سعر التكلفة</label>
                            <input
                                type="number"
                                value={costPrice}
                                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                min="0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">الكمية المتاحة</label>
                        <input
                            type="number"
                            value={stockQuantity}
                            onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            min="0"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                        >
                            <Save size={16} />
                            {isLoading ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
