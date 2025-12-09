import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    ArrowRight,
    Package,
    User,
    Truck,
    Printer,
    Edit,
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
} from 'lucide-react';
import { getSalesOrderById } from '@/lib/actions/sales';

interface OrderItem {
    id: string;
    product_name: string;
    sku?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const order = await getSalesOrderById(id);

    if (!order) {
        notFound();
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-700',
            confirmed: 'bg-blue-100 text-blue-700',
            processing: 'bg-indigo-100 text-indigo-700',
            shipped: 'bg-purple-100 text-purple-700',
            delivered: 'bg-emerald-100 text-emerald-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        const labels: Record<string, string> = {
            draft: 'مسودة',
            confirmed: 'مؤكد',
            processing: 'قيد التجهيز',
            shipped: 'تم الشحن',
            delivered: 'تم التسليم',
            cancelled: 'ملغي',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/sales/orders" className="p-2 hover:bg-muted rounded-lg">
                    <ArrowRight size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">طلب #{order.order_number}</h1>
                    <p className="text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                </div>
                {getStatusBadge(order.status)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="flex items-center gap-2 p-4 border-b border-border">
                            <Package size={18} className="text-primary" />
                            <h2 className="font-semibold">المنتجات</h2>
                        </div>
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-right py-3 px-4 text-sm font-medium">المنتج</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium">الكمية</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium">السعر</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(order.items || []).map((item: OrderItem) => (
                                    <tr key={item.id} className="border-t border-border">
                                        <td className="py-3 px-4">
                                            <div className="font-medium">{item.product_name}</div>
                                            {item.sku && <div className="text-xs text-muted-foreground">{item.sku}</div>}
                                        </td>
                                        <td className="py-3 px-4 text-center">{item.quantity}</td>
                                        <td className="py-3 px-4 text-left font-mono">{item.unit_price.toLocaleString('ar-EG')}</td>
                                        <td className="py-3 px-4 text-left font-mono font-medium">{item.total_price.toLocaleString('ar-EG')}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-muted/30">
                                <tr className="border-t border-border">
                                    <td colSpan={3} className="py-2 px-4 text-left text-sm">المجموع الفرعي</td>
                                    <td className="py-2 px-4 text-left font-mono">{(order.subtotal || 0).toLocaleString('ar-EG')}</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="py-2 px-4 text-left text-sm">الشحن</td>
                                    <td className="py-2 px-4 text-left font-mono">{(order.shipping_cost || 0).toLocaleString('ar-EG')}</td>
                                </tr>
                                <tr className="border-t border-border">
                                    <td colSpan={3} className="py-3 px-4 text-left font-semibold">الإجمالي</td>
                                    <td className="py-3 px-4 text-left font-mono font-bold text-primary text-lg">
                                        {(order.total || 0).toLocaleString('ar-EG')} ج.م
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Shipping */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Truck size={18} className="text-purple-600" />
                                <h2 className="font-semibold">الشحن</h2>
                            </div>
                        </div>

                        {order.shipment ? (
                            <div className="p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{order.shipment.tracking_number}</div>
                                        <div className="text-sm text-muted-foreground">{order.shipment.carrier?.name}</div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                                        {order.shipment.status}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-muted-foreground mb-3">لم يتم شحن الطلب بعد</p>
                                <Link
                                    href={`/dashboard/sales/orders/${id}/ship`}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                                >
                                    <Truck size={16} />
                                    إنشاء شحنة
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="bg-card rounded-xl border border-border p-4">
                            <h3 className="font-medium mb-2">ملاحظات</h3>
                            <p className="text-muted-foreground">{order.notes}</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Customer */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <User size={18} className="text-primary" />
                            <h3 className="font-medium">العميل</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="font-medium">{order.customer_name}</div>
                            <div className="text-sm text-muted-foreground">{order.customer_phone}</div>
                            {order.customer?.email && (
                                <div className="text-sm text-muted-foreground">{order.customer.email}</div>
                            )}
                        </div>
                        <Link
                            href={`/dashboard/sales/customers/${order.customer_id}`}
                            className="block mt-3 text-sm text-primary hover:underline"
                        >
                            عرض ملف العميل
                        </Link>
                    </div>

                    {/* Payment */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <DollarSign size={18} className="text-emerald-600" />
                            <h3 className="font-medium">الدفع</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">الطريقة</span>
                                <span className="font-medium">
                                    {order.payment_method === 'cod' ? 'دفع عند الاستلام' :
                                        order.payment_method === 'paid' ? 'مدفوع' : 'آجل'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">الحالة</span>
                                <span className={order.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}>
                                    {order.payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        {order.status !== 'shipped' && order.status !== 'delivered' && (
                            <Link
                                href={`/dashboard/sales/orders/${id}/ship`}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                                <Truck size={16} />
                                شحن الطلب
                            </Link>
                        )}
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted">
                            <Printer size={16} />
                            طباعة
                        </button>
                        <Link
                            href={`/dashboard/sales/orders/${id}/edit`}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted"
                        >
                            <Edit size={16} />
                            تعديل
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
