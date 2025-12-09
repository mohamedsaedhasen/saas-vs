'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    ArrowLeftRight,
    Plus,
    Trash2,
    Package,
    Warehouse,
    Save,
    Search,
} from 'lucide-react';

interface TransferItem {
    id: string;
    product_id: string;
    product_name: string;
    sku: string;
    quantity: number;
    available_quantity: number;
}

interface WarehouseType {
    id: string;
    name: string;
}

interface ProductType {
    id: string;
    name: string;
    sku: string;
    stock_quantity: number;
}

export default function NewTransferPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
    const [products, setProducts] = useState<ProductType[]>([]);
    const [fromWarehouse, setFromWarehouse] = useState('');
    const [toWarehouse, setToWarehouse] = useState('');
    const [items, setItems] = useState<TransferItem[]>([]);
    const [notes, setNotes] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Fetch warehouses
        fetch('/api/inventory/warehouses')
            .then(res => res.json())
            .then(data => setWarehouses(data || []));

        // Fetch products
        fetch('/api/inventory/products')
            .then(res => res.json())
            .then(data => setProducts(data || []));
    }, []);

    const addItem = (product: ProductType) => {
        if (items.find(i => i.product_id === product.id)) {
            return; // Already added
        }
        setItems([...items, {
            id: Date.now().toString(),
            product_id: product.id,
            product_name: product.name,
            sku: product.sku,
            quantity: 1,
            available_quantity: product.stock_quantity,
        }]);
        setSearchQuery('');
    };

    const updateQuantity = (id: string, quantity: number) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, quantity: Math.max(1, Math.min(quantity, item.available_quantity)) } : item
        ));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleSubmit = async () => {
        if (!fromWarehouse || !toWarehouse) {
            alert('يرجى اختيار المخزنين');
            return;
        }
        if (fromWarehouse === toWarehouse) {
            alert('لا يمكن التحويل لنفس المخزن');
            return;
        }
        if (items.length === 0) {
            alert('يرجى إضافة منتج واحد على الأقل');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/inventory/transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from_warehouse_id: fromWarehouse,
                    to_warehouse_id: toWarehouse,
                    items: items.map(item => ({
                        product_id: item.product_id,
                        quantity: item.quantity,
                    })),
                    notes,
                }),
            });

            if (response.ok) {
                router.push('/dashboard/inventory/transfers');
            }
        } catch (error) {
            console.error('Error creating transfer:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.includes(searchQuery) || p.sku.includes(searchQuery)
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/inventory/transfers" className="p-2 hover:bg-muted rounded-lg">
                    <ArrowRight size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">تحويل مخزون جديد</h1>
                    <p className="text-muted-foreground">نقل منتجات بين المخازن</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Warehouses Selection */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Warehouse size={18} className="text-primary" />
                            <h2 className="font-semibold">المخازن</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <div>
                                <label className="block text-sm font-medium mb-1">من مخزن</label>
                                <select
                                    value={fromWarehouse}
                                    onChange={(e) => setFromWarehouse(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                >
                                    <option value="">اختر المخزن...</option>
                                    {warehouses.map((wh) => (
                                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-center">
                                <ArrowLeftRight size={24} className="text-muted-foreground" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">إلى مخزن</label>
                                <select
                                    value={toWarehouse}
                                    onChange={(e) => setToWarehouse(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                >
                                    <option value="">اختر المخزن...</option>
                                    {warehouses.filter(w => w.id !== fromWarehouse).map((wh) => (
                                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Products */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div className="flex items-center gap-2">
                                <Package size={18} className="text-primary" />
                                <h2 className="font-semibold">المنتجات</h2>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b border-border">
                            <div className="relative">
                                <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="بحث عن منتج..."
                                    className="w-full pl-4 pr-10 py-2 border border-border rounded-lg bg-background"
                                />
                            </div>
                            {searchQuery && (
                                <div className="mt-2 max-h-40 overflow-y-auto border border-border rounded-lg">
                                    {filteredProducts.slice(0, 5).map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => addItem(product)}
                                            className="w-full flex items-center justify-between p-2 hover:bg-muted text-right"
                                        >
                                            <div>
                                                <div className="font-medium text-sm">{product.name}</div>
                                                <div className="text-xs text-muted-foreground">{product.sku}</div>
                                            </div>
                                            <span className="text-xs bg-muted px-2 py-0.5 rounded">{product.stock_quantity}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-right py-2 px-4 text-sm font-medium">المنتج</th>
                                    <th className="text-center py-2 px-4 text-sm font-medium">المتاح</th>
                                    <th className="text-center py-2 px-4 text-sm font-medium w-32">الكمية</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                                            ابحث عن منتج لإضافته
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <tr key={item.id} className="border-t border-border">
                                            <td className="py-2 px-4">
                                                <div className="font-medium text-sm">{item.product_name}</div>
                                                <div className="text-xs text-muted-foreground">{item.sku}</div>
                                            </td>
                                            <td className="py-2 px-4 text-center text-muted-foreground">
                                                {item.available_quantity}
                                            </td>
                                            <td className="py-2 px-4">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                    min="1"
                                                    max={item.available_quantity}
                                                    className="w-full px-2 py-1 border border-border rounded text-center"
                                                />
                                            </td>
                                            <td className="py-2 px-4">
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Notes */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <label className="block text-sm font-medium mb-2">ملاحظات</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            placeholder="ملاحظات على التحويل..."
                        />
                    </div>
                </div>

                {/* Summary */}
                <div className="space-y-4">
                    <div className="bg-card rounded-xl border border-border p-4">
                        <h3 className="font-medium mb-3">ملخص التحويل</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">من</span>
                                <span>{warehouses.find(w => w.id === fromWarehouse)?.name || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">إلى</span>
                                <span>{warehouses.find(w => w.id === toWarehouse)?.name || '-'}</span>
                            </div>
                            <div className="border-t border-border pt-2 mt-2">
                                <div className="flex justify-between font-medium">
                                    <span>عدد المنتجات</span>
                                    <span>{items.length}</span>
                                </div>
                                <div className="flex justify-between font-medium">
                                    <span>إجمالي الكميات</span>
                                    <span>{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !fromWarehouse || !toWarehouse || items.length === 0}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium disabled:opacity-50"
                    >
                        <Save size={18} />
                        {isLoading ? 'جاري الحفظ...' : 'إنشاء التحويل'}
                    </button>
                </div>
            </div>
        </div>
    );
}
