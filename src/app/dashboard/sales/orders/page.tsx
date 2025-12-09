import Link from 'next/link';
import {
    Plus,
    Search,
    Filter,
    ShoppingCart,
    Clock,
    Truck,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import { getSalesOrders, getSalesStats } from '@/lib/actions/sales';

interface Order {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    payment_method: string;
    total: number;
    created_at: string;
}

export default async function SalesOrdersPage() {
    const [orders, stats] = await Promise.all([
        getSalesOrders(50),
        getSalesStats()
    ]);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; icon: typeof Clock }> = {
            draft: { bg: 'bg-gray-100 text-gray-700', icon: Clock },
            confirmed: { bg: 'bg-blue-100 text-blue-700', icon: CheckCircle },
            processing: { bg: 'bg-indigo-100 text-indigo-700', icon: Clock },
            shipped: { bg: 'bg-purple-100 text-purple-700', icon: Truck },
            delivered: { bg: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
            cancelled: { bg: 'bg-red-100 text-red-700', icon: XCircle },
        };
        const labels: Record<string, string> = {
            draft: 'مسودة',
            confirmed: 'مؤكد',
            processing: 'قيد التجهيز',
            shipped: 'تم الشحن',
            delivered: 'تم التسليم',
            cancelled: 'ملغي',
        };
        const style = styles[status] || styles.draft;
        return (
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">طلبات المبيعات</h1>
                    <p className="text-muted-foreground mt-1">إدارة جميع الطلبات</p>
                </div>

                <Link
                    href="/dashboard/sales/orders/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                >
                    <Plus size={18} />
                    طلب جديد
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <ShoppingCart size={14} />
                        <span className="text-sm">إجمالي الطلبات</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.totalOrders}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <Clock size={14} />
                        <span className="text-sm">معلقة</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">{stats.pendingOrders}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-purple-600 mb-1">
                        <Truck size={14} />
                        <span className="text-sm">في الشحن</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{stats.shippedOrders || 0}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                        <CheckCircle size={14} />
                        <span className="text-sm">مكتملة</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">{stats.completedOrders || 0}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <span className="text-sm">مبيعات اليوم</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{(stats.todaySales || 0).toLocaleString('ar-EG')}</div>
                    <div className="text-xs text-muted-foreground">ج.م</div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="بحث برقم الطلب أو اسم العميل..."
                        className="w-full pl-4 pr-10 py-2 border border-border rounded-lg bg-card"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card hover:bg-muted">
                    <Filter size={18} />
                    تصفية
                </button>
            </div>

            {/* Orders Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                {(orders as Order[]).length === 0 ? (
                    <div className="p-12 text-center">
                        <ShoppingCart size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">لا توجد طلبات</h3>
                        <p className="text-muted-foreground mb-4">ابدأ بإنشاء طلب جديد</p>
                        <Link
                            href="/dashboard/sales/orders/new"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                        >
                            <Plus size={18} />
                            طلب جديد
                        </Link>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-right py-3 px-4 text-sm font-medium">رقم الطلب</th>
                                <th className="text-right py-3 px-4 text-sm font-medium">العميل</th>
                                <th className="text-right py-3 px-4 text-sm font-medium">الهاتف</th>
                                <th className="text-left py-3 px-4 text-sm font-medium">الإجمالي</th>
                                <th className="text-center py-3 px-4 text-sm font-medium">الدفع</th>
                                <th className="text-center py-3 px-4 text-sm font-medium">الحالة</th>
                                <th className="text-right py-3 px-4 text-sm font-medium">التاريخ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(orders as Order[]).map((order) => (
                                <tr key={order.id} className="border-t border-border hover:bg-muted/30">
                                    <td className="py-3 px-4">
                                        <Link href={`/dashboard/sales/orders/${order.id}`} className="font-medium text-primary hover:underline">
                                            {order.order_number}
                                        </Link>
                                    </td>
                                    <td className="py-3 px-4 font-medium">{order.customer_name}</td>
                                    <td className="py-3 px-4 text-muted-foreground font-mono text-sm">{order.customer_phone}</td>
                                    <td className="py-3 px-4 text-left font-mono font-medium">
                                        {(order.total || 0).toLocaleString('ar-EG')} ج.م
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`px-2 py-0.5 rounded text-xs ${order.payment_method === 'cod' ? 'bg-amber-100 text-amber-700' :
                                                order.payment_method === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {order.payment_method === 'cod' ? 'COD' :
                                                order.payment_method === 'paid' ? 'مدفوع' : 'آجل'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {getStatusBadge(order.status)}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString('ar-EG')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
