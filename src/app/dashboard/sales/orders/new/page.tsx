'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    Package,
    Trash2,
    Save,
    Send,
    FileText,
} from 'lucide-react';
import CustomerComboBox from '@/components/ui/CustomerComboBox';
import ProductComboBox from '@/components/ui/ProductComboBox';
import QuickCreateCustomerModal from '@/components/modals/QuickCreateCustomerModal';
import QuickCreateProductModal from '@/components/modals/QuickCreateProductModal';

interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock_quantity: number;
}

interface OrderItem {
    id: string;
    product_id: string;
    name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    total: number;
}

export default function NewOrderPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [items, setItems] = useState<OrderItem[]>([]);
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [shippingCost, setShippingCost] = useState(0);

    // Modals
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newProductName, setNewProductName] = useState('');

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal + shippingCost;

    const handleAddProduct = (product: Product) => {
        const existingIndex = items.findIndex(i => i.product_id === product.id);

        if (existingIndex >= 0) {
            // Increase quantity
            const newItems = [...items];
            newItems[existingIndex].quantity++;
            newItems[existingIndex].total = newItems[existingIndex].quantity * newItems[existingIndex].unit_price;
            setItems(newItems);
        } else {
            // Add new item
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
            item.id === id
                ? { ...item, quantity, total: quantity * item.unit_price }
                : item
        ));
    };

    const updateItemPrice = (id: string, price: number) => {
        setItems(items.map(item =>
            item.id === id
                ? { ...item, unit_price: price, total: item.quantity * price }
                : item
        ));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleSubmit = async (status: 'draft' | 'confirmed') => {
        if (!customer) {
            alert('يرجى اختيار العميل');
            return;
        }
        if (items.length === 0) {
            alert('يرجى إضافة منتج واحد على الأقل');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/sales/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id: customer.id,
                    customer_name: customer.name,
                    customer_phone: customer.phone,
                    status,
                    payment_method: paymentMethod,
                    subtotal,
                    shipping_cost: shippingCost,
                    total,
                    items,
                    notes,
                }),
            });

            if (response.ok) {
                const order = await response.json();
                router.push(`/dashboard/sales/orders/${order.id}`);
            }
        } catch (error) {
            console.error('Error creating order:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/sales/orders" className="p-2 hover:bg-muted rounded-lg">
                    <ArrowRight size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">طلب مبيعات جديد</h1>
                    <p className="text-muted-foreground">إنشاء طلب جديد</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Selection */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <h2 className="font-semibold mb-4">العميل</h2>
                        <CustomerComboBox
                            value={customer}
                            onChange={setCustomer}
                            onCreateNew={(name) => {
                                setNewCustomerName(name);
                                setShowCustomerModal(true);
                            }}
                        />
                    </div>

                    {/* Products */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div className="flex items-center gap-2">
                                <Package size={18} className="text-primary" />
                                <h2 className="font-semibold">المنتجات</h2>
                            </div>
                            <span className="text-sm text-muted-foreground">{items.length} منتج</span>
                        </div>

                        {/* Product Search */}
                        <div className="p-4 border-b border-border">
                            <ProductComboBox
                                onSelect={handleAddProduct}
                                onCreateNew={(name) => {
                                    setNewProductName(name);
                                    setShowProductModal(true);
                                }}
                                placeholder="بحث وإضافة منتج..."
                            />
                        </div>

                        {/* Items Table */}
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
                                                <button
                                                    type="button"
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
                        <label className="block font-medium mb-2">ملاحظات</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            placeholder="ملاحظات على الطلب..."
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Payment Method */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <h3 className="font-medium mb-3">طريقة الدفع</h3>
                        <div className="space-y-2">
                            {[
                                { value: 'cod', label: 'دفع عند الاستلام' },
                                { value: 'paid', label: 'مدفوع مسبقاً' },
                                { value: 'credit', label: 'آجل' },
                            ].map((method) => (
                                <label
                                    key={method.value}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === method.value
                                            ? 'bg-primary/10 border-primary'
                                            : 'border-border hover:bg-muted'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment"
                                        value={method.value}
                                        checked={paymentMethod === method.value}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="sr-only"
                                    />
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.value ? 'border-primary' : 'border-border'
                                        }`}>
                                        {paymentMethod === method.value && (
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                        )}
                                    </div>
                                    <span className="text-sm">{method.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Shipping */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <label className="block font-medium mb-2">تكلفة الشحن</label>
                        <input
                            type="number"
                            value={shippingCost}
                            onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                            min="0"
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                        />
                    </div>

                    {/* Summary */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <h3 className="font-medium mb-3">الملخص</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">المجموع الفرعي</span>
                                <span className="font-mono">{subtotal.toLocaleString('ar-EG')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">الشحن</span>
                                <span className="font-mono">{shippingCost.toLocaleString('ar-EG')}</span>
                            </div>
                            <div className="border-t border-border pt-2 mt-2">
                                <div className="flex justify-between font-bold">
                                    <span>الإجمالي</span>
                                    <span className="text-primary text-lg">{total.toLocaleString('ar-EG')} ج.م</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        <button
                            onClick={() => handleSubmit('confirmed')}
                            disabled={isLoading || !customer || items.length === 0}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium disabled:opacity-50"
                        >
                            <Send size={18} />
                            {isLoading ? 'جاري الحفظ...' : 'تأكيد الطلب'}
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

            {/* Modals */}
            <QuickCreateCustomerModal
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                onCreate={(newCustomer) => setCustomer(newCustomer)}
                initialName={newCustomerName}
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
