'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    Package,
    Trash2,
    Save,
    RotateCcw,
    Calendar,
} from 'lucide-react';
import SupplierComboBox from '@/components/ui/SupplierComboBox';
import ProductComboBox from '@/components/ui/ProductComboBox';
import QuickCreateSupplierModal from '@/components/modals/QuickCreateSupplierModal';

interface Supplier {
    id: string;
    name: string;
    phone: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock_quantity: number;
}

interface ReturnItem {
    id: string;
    product_id: string;
    name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    total: number;
    reason: string;
}

export default function NewPurchaseReturnPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [items, setItems] = useState<ReturnItem[]>([]);
    const [notes, setNotes] = useState('');
    const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
    const [originalInvoice, setOriginalInvoice] = useState('');

    // Modals
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState('');

    const total = items.reduce((sum, item) => sum + item.total, 0);

    const handleAddProduct = (product: Product) => {
        const existingIndex = items.findIndex(i => i.product_id === product.id);

        if (existingIndex >= 0) {
            const newItems = [...items];
            newItems[existingIndex].quantity++;
            newItems[existingIndex].total = newItems[existingIndex].quantity * newItems[existingIndex].unit_price;
            setItems(newItems);
        } else {
            setItems([...items, {
                id: Date.now().toString(),
                product_id: product.id,
                name: product.name,
                sku: product.sku,
                quantity: 1,
                unit_price: product.price,
                total: product.price,
                reason: '',
            }]);
        }
    };

    const updateItem = (id: string, field: string, value: string | number) => {
        setItems(items.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: value };
            if (field === 'quantity' || field === 'unit_price') {
                updated.total = updated.quantity * updated.unit_price;
            }
            return updated;
        }));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleSubmit = async () => {
        if (!supplier) {
            alert('يرجى اختيار المورد');
            return;
        }
        if (items.length === 0) {
            alert('يرجى إضافة منتج واحد على الأقل');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/purchases/returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplier_id: supplier.id,
                    supplier_name: supplier.name,
                    return_date: returnDate,
                    original_invoice: originalInvoice,
                    total,
                    items,
                    notes,
                }),
            });

            if (response.ok) {
                router.push('/dashboard/purchases/returns');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/purchases/returns" className="p-2 hover:bg-muted rounded-lg">
                    <ArrowRight size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">مرتجع مشتريات جديد</h1>
                    <p className="text-muted-foreground">تسجيل مرتجع للمورد</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Supplier */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <h2 className="font-semibold mb-4">المورد</h2>
                        <SupplierComboBox
                            value={supplier}
                            onChange={setSupplier}
                            onCreateNew={(name) => {
                                setNewSupplierName(name);
                                setShowSupplierModal(true);
                            }}
                        />
                    </div>

                    {/* Reference */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                                    <Calendar size={14} />
                                    تاريخ المرتجع
                                </label>
                                <input
                                    type="date"
                                    value={returnDate}
                                    onChange={(e) => setReturnDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">رقم الفاتورة الأصلية</label>
                                <input
                                    type="text"
                                    value={originalInvoice}
                                    onChange={(e) => setOriginalInvoice(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                    placeholder="اختياري"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Products */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div className="flex items-center gap-2">
                                <RotateCcw size={18} className="text-orange-600" />
                                <h2 className="font-semibold">المنتجات المرتجعة</h2>
                            </div>
                        </div>

                        <div className="p-4 border-b border-border">
                            <ProductComboBox onSelect={handleAddProduct} />
                        </div>

                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-right py-2 px-4 text-sm font-medium">المنتج</th>
                                    <th className="text-center py-2 px-4 text-sm font-medium w-20">الكمية</th>
                                    <th className="text-center py-2 px-4 text-sm font-medium w-24">السعر</th>
                                    <th className="text-right py-2 px-4 text-sm font-medium">السبب</th>
                                    <th className="text-left py-2 px-4 text-sm font-medium w-24">الإجمالي</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                            ابحث عن منتج لإضافته
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <tr key={item.id} className="border-t border-border">
                                            <td className="py-2 px-4">
                                                <div className="font-medium text-sm">{item.name}</div>
                                                <div className="text-xs text-muted-foreground">{item.sku}</div>
                                            </td>
                                            <td className="py-2 px-4">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                    min="1"
                                                    className="w-full px-2 py-1 border border-border rounded text-center text-sm"
                                                />
                                            </td>
                                            <td className="py-2 px-4">
                                                <input
                                                    type="number"
                                                    value={item.unit_price}
                                                    onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    min="0"
                                                    className="w-full px-2 py-1 border border-border rounded text-center text-sm"
                                                />
                                            </td>
                                            <td className="py-2 px-4">
                                                <select
                                                    value={item.reason}
                                                    onChange={(e) => updateItem(item.id, 'reason', e.target.value)}
                                                    className="w-full px-2 py-1 border border-border rounded text-sm"
                                                >
                                                    <option value="">اختر السبب</option>
                                                    <option value="defective">تالف</option>
                                                    <option value="wrong_item">منتج خاطئ</option>
                                                    <option value="quality">عيوب جودة</option>
                                                    <option value="other">أخرى</option>
                                                </select>
                                            </td>
                                            <td className="py-2 px-4 text-left font-mono font-medium text-sm">
                                                {item.total.toLocaleString('ar-EG')}
                                            </td>
                                            <td className="py-2 px-4">
                                                <button onClick={() => removeItem(item.id)} className="p-1 text-red-600 hover:bg-red-100 rounded">
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
                        <label className="block font-medium mb-2">ملاحظات</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-800 p-4">
                        <h3 className="font-medium mb-3 text-orange-700">ملخص المرتجع</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-orange-600/70">عدد البنود</span>
                                <span className="text-orange-700">{items.length}</span>
                            </div>
                            <div className="border-t border-orange-200 dark:border-orange-800 pt-2 mt-2">
                                <div className="flex justify-between font-bold">
                                    <span className="text-orange-700">إجمالي المرتجع</span>
                                    <span className="text-orange-600 text-lg">{total.toLocaleString('ar-EG')} ج.م</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !supplier || items.length === 0}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50"
                    >
                        <Save size={18} />
                        {isLoading ? 'جاري الحفظ...' : 'حفظ المرتجع'}
                    </button>
                </div>
            </div>

            <QuickCreateSupplierModal
                isOpen={showSupplierModal}
                onClose={() => setShowSupplierModal(false)}
                onCreate={(newSupplier) => setSupplier(newSupplier)}
                initialName={newSupplierName}
            />
        </div>
    );
}
