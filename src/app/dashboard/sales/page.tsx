import Link from 'next/link';
import {
    ShoppingCart,
    Users,
    DollarSign,
    Clock,
    AlertCircle,
    ArrowUpRight,
    Plus,
    FileText,
    BarChart3,
} from 'lucide-react';
import { getSalesStats, getSalesOrders, getCustomers } from '@/lib/actions/sales';

export default async function SalesDashboardPage() {
    const [stats, orders, customers] = await Promise.all([
        getSalesStats(),
        getSalesOrders(5),
        getCustomers(5)
    ]);

    // Top customers by total spent
    const topCustomers = customers
        .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
        .slice(0, 5);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">لوحة المبيعات</h1>
                    <p className="text-muted-foreground mt-1">متابعة الطلبات والعملاء والإيرادات</p>
                </div>

                <Link
                    href="/dashboard/sales/orders/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                >
                    <Plus size={18} />
                    طلب جديد
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">الطلبات هذا الشهر</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <ShoppingCart size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                        <ArrowUpRight size={12} />
                        طلب
                    </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">إجمالي المبيعات</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <DollarSign size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.totalSales.toLocaleString('ar-EG')}</div>
                    <div className="text-xs text-muted-foreground mt-1">ج.م</div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">قيد التنفيذ</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                            <Clock size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">{stats.pendingOrders}</div>
                    <div className="text-xs text-muted-foreground mt-1">طلب</div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">مستحقات غير مدفوعة</span>
                        <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                            <AlertCircle size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-red-600">{stats.unpaidAmount.toLocaleString('ar-EG')}</div>
                    <div className="text-xs text-muted-foreground mt-1">ج.م</div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                    href="/dashboard/sales/orders"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <ShoppingCart size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary">الطلبات</div>
                        <div className="text-xs text-muted-foreground">{stats.totalOrders} طلب</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/sales/customers"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Users size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary">العملاء</div>
                        <div className="text-xs text-muted-foreground">{customers.length} عميل</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/sales/invoices"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <FileText size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary">الفواتير</div>
                        <div className="text-xs text-muted-foreground">فواتير المبيعات</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/sales/analytics"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                        <BarChart3 size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary">التحليلات</div>
                        <div className="text-xs text-muted-foreground">التقارير</div>
                    </div>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Customers */}
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Users size={18} className="text-purple-600" />
                            <h3 className="font-semibold">أفضل العملاء</h3>
                        </div>
                        <Link href="/dashboard/sales/customers" className="text-sm text-primary hover:underline">
                            عرض الكل
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {topCustomers.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">لا يوجد عملاء</div>
                        ) : (
                            topCustomers.map((customer, i) => (
                                <div key={customer.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{customer.name}</div>
                                            <div className="text-xs text-muted-foreground">{customer.total_orders || 0} طلب</div>
                                        </div>
                                    </div>
                                    <div className="font-semibold text-sm">
                                        {(customer.total_spent || 0).toLocaleString('ar-EG')} ج.م
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Clock size={18} className="text-blue-600" />
                            <h3 className="font-semibold">أحدث الطلبات</h3>
                        </div>
                        <Link href="/dashboard/sales/orders" className="text-sm text-primary hover:underline">
                            عرض الكل
                        </Link>
                    </div>
                    {orders.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">لا توجد طلبات</div>
                    ) : (
                        <div className="divide-y divide-border">
                            {orders.map((order) => (
                                <div key={order.id} className="p-4 hover:bg-muted/30 flex items-center justify-between">
                                    <div>
                                        <Link href={`/dashboard/sales/orders/${order.id}`} className="font-medium hover:text-primary">
                                            {order.order_number}
                                        </Link>
                                        <div className="text-sm text-muted-foreground">{order.customer_name}</div>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold">{(order.total || 0).toLocaleString('ar-EG')} ج.م</div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                    order.status === 'shipped' ? 'bg-indigo-100 text-indigo-700' :
                                                        order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {order.status === 'draft' ? 'مسودة' :
                                                order.status === 'confirmed' ? 'مؤكد' :
                                                    order.status === 'shipped' ? 'تم الشحن' :
                                                        order.status === 'completed' ? 'مكتمل' :
                                                            order.status === 'cancelled' ? 'ملغي' : order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
