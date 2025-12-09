'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    Package,
    Trash2,
    Save,
    FileText,
    Calendar,
} from 'lucide-react';
import SupplierComboBox from '@/components/ui/SupplierComboBox';
import ProductComboBox from '@/components/ui/ProductComboBox';
import QuickCreateSupplierModal from '@/components/modals/QuickCreateSupplierModal';
import QuickCreateProductModal from '@/components/modals/QuickCreateProductModal';

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

interface InvoiceItem {
    id: string;
    product_id: string;
    name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    total: number;
}

export default function NewPurchaseInvoicePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [notes, setNotes] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
    const [discount, setDiscount] = useState(0);

    // Modals
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [newSupplierName, setNewSupplierName] = useState('');
    const [newProductName, setNewProductName] = useState('');

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal - discount;

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
            }]);
        }
    };

    const updateItemQuantity = (id: string, quantity: number) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, quantity, total: quantity * item.unit_price } : item
        ));
    };

    const updateItemPrice = (id: string, price: number) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, unit_price: price, total: item.quantity * price } : item
        ));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleSubmit = async (status: 'draft' | 'posted') => {
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
            const response = await fetch('/api/purchases/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplier_id: supplier.id,
                    supplier_name: supplier.name,
                    status,
                    invoice_date: invoiceDate,
                    due_date: dueDate || null,
                    supplier_invoice_number: supplierInvoiceNumber,
                    subtotal,
                    discount,
                    total,
                    items,
                    notes,
                }),
            });

            if (response.ok) {
                const invoice = await response.json();
                router.push(`/dashboard/purchases/invoices/${invoice.id}`);
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/purchases/invoices" className="p-2 hover:bg-muted rounded-lg">
                    <ArrowRight size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">فاتورة مشتريات جديدة</h1>
                    <p className="text-muted-foreground">إنشاء فاتورة شراء</p>
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

                    {/* Dates & Reference */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                                    <Calendar size={14} />
                                    تاريخ الفاتورة
                                </label>
                                <input
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                                    <Calendar size={14} />
                                    تاريخ الاستحقاق
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">رقم فاتورة المورد</label>
                                <input
                                    type="text"
                                    value={supplierInvoiceNumber}
                                    onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
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
                                <Package size={18} className="text-orange-600" />
                                <h2 className="font-semibold">البنود</h2>
                            </div>
                        </div>

                        <div className="p-4 border-b border-border">
                            <ProductComboBox
                                onSelect={handleAddProduct}
                                onCreateNew={(name) => {
                                    setNewProductName(name);
                                    setShowProductModal(true);
                                }}
                            />
                        </div>

                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-right py-2 px-4 text-sm font-medium">المنتج</th>
                                    <th className="text-center py-2 px-4 text-sm font-medium w-24">الكمية</th>
                                    <th className="text-center py-2 px-4 text-sm font-medium w-28">السعر</th>
                                    <th className="text-left py-2 px-4 text-sm font-medium w-28">الإجمالي</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
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
                                                    onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                                    min="1"
                                                    className="w-full px-2 py-1 border border-border rounded text-center text-sm"
                                                />
                                            </td>
                                            <td className="py-2 px-4">
                                                <input
                                                    type="number"
                                                    value={item.unit_price}
                                                    onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                                                    min="0"
                                                    className="w-full px-2 py-1 border border-border rounded text-center text-sm"
                                                />
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
                    <div className="bg-card rounded-xl border border-border p-4">
                        <h3 className="font-medium mb-3">الملخص</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">المجموع الفرعي</span>
                                <span className="font-mono">{subtotal.toLocaleString('ar-EG')}</span>
                            </div>
                            <div>
                                <label className="text-sm text-muted-foreground">الخصم</label>
                                <input
                                    type="number"
                                    value={discount}
                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                    min="0"
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background mt-1"
                                />
                            </div>
                            <div className="border-t border-border pt-3">
                                <div className="flex justify-between font-bold">
                                    <span>الإجمالي</span>
                                    <span className="text-orange-600 text-lg">{total.toLocaleString('ar-EG')} ج.م</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={() => handleSubmit('posted')}
                            disabled={isLoading || !supplier || items.length === 0}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50"
                        >
                            <Save size={18} />
                            {isLoading ? 'جاري الحفظ...' : 'حفظ وترحيل'}
                        </button>
                        <button
                            onClick={() => handleSubmit('draft')}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted"
                        >
                            <FileText size={18} />
                            حفظ كمسودة
                        </button>
                    </div>
                </div>
            </div>

            <QuickCreateSupplierModal
                isOpen={showSupplierModal}
                onClose={() => setShowSupplierModal(false)}
                onCreate={(newSupplier) => setSupplier(newSupplier)}
                initialName={newSupplierName}
            />

            <QuickCreateProductModal
                isOpen={showProductModal}
                onClose={() => setShowProductModal(false)}
                onCreate={handleAddProduct}
                initialName={newProductName}
            />
        </div>
    );
}
