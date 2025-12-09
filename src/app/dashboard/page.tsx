import Link from 'next/link';
import {
    TrendingUp,
    TrendingDown,
    Package,
    Truck,
    Users,
    DollarSign,
    ShoppingCart,
    AlertTriangle,
    Clock,
    CheckCircle,
    ArrowRight,
} from 'lucide-react';
import { getSalesStats } from '@/lib/actions/sales';
import { getShippingStats } from '@/lib/actions/shipping';
import { getInventoryStats, getLowStockProducts } from '@/lib/actions/inventory';

export default async function DashboardPage() {
    const [salesStats, shippingStats, inventoryStats, lowStockProducts] = await Promise.all([
        getSalesStats(),
        getShippingStats(),
        getInventoryStats(),
        getLowStockProducts()
    ]);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">لوحة التحكم</h1>
                <p className="text-muted-foreground">نظرة عامة على النظام</p>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm opacity-80">مبيعات اليوم</span>
                        <TrendingUp size={20} />
                    </div>
                    <div className="text-2xl font-bold">{(salesStats.todaySales || 0).toLocaleString('ar-EG')}</div>
                    <div className="text-sm opacity-80">ج.م</div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm opacity-80">طلبات جديدة</span>
                        <ShoppingCart size={20} />
                    </div>
                    <div className="text-2xl font-bold">{salesStats.pendingOrders || 0}</div>
                    <div className="text-sm opacity-80">طلب</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm opacity-80">شحنات نشطة</span>
                        <Truck size={20} />
                    </div>
                    <div className="text-2xl font-bold">{shippingStats.inTransitShipments}</div>
                    <div className="text-sm opacity-80">شحنة</div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm opacity-80">COD معلق</span>
                        <DollarSign size={20} />
                    </div>
                    <div className="text-2xl font-bold">{(shippingStats.pendingCOD || 0).toLocaleString('ar-EG')}</div>
                    <div className="text-sm opacity-80">ج.م</div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                    href="/dashboard/sales/orders/new"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <ShoppingCart size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary">طلب جديد</div>
                        <div className="text-xs text-muted-foreground">إنشاء طلب مبيعات</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/shipping/shipments"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Truck size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary">الشحنات</div>
                        <div className="text-xs text-muted-foreground">{shippingStats.totalShipments} شحنة</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/sales/customers"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Users size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary">العملاء</div>
                        <div className="text-xs text-muted-foreground">{salesStats.totalCustomers} عميل</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/inventory/products"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                        <Package size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary">المنتجات</div>
                        <div className="text-xs text-muted-foreground">{inventoryStats.totalProducts} منتج</div>
                    </div>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Alerts */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center gap-2 p-4 border-b border-border bg-red-50 dark:bg-red-950/20">
                        <AlertTriangle size={18} className="text-red-600" />
                        <h2 className="font-semibold text-red-700 dark:text-red-400">تنبيهات</h2>
                    </div>
                    <div className="divide-y divide-border">
                        {lowStockProducts.length === 0 && shippingStats.pendingShipments === 0 ? (
                            <div className="p-4 text-center text-muted-foreground">
                                <CheckCircle size={24} className="mx-auto mb-2 text-emerald-500" />
                                لا توجد تنبيهات
                            </div>
                        ) : (
                            <>
                                {lowStockProducts.slice(0, 3).map((product) => (
                                    <div key={product.id} className="p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                            <span className="text-sm">نفاد مخزون: {product.name}</span>
                                        </div>
                                        <span className="text-xs text-red-600">{product.stock_quantity} قطعة</span>
                                    </div>
                                ))}
                                {shippingStats.pendingShipments > 0 && (
                                    <div className="p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                            <span className="text-sm">شحنات في الانتظار</span>
                                        </div>
                                        <span className="text-xs text-amber-600">{shippingStats.pendingShipments} شحنة</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Shipping Summary */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Truck size={18} className="text-purple-600" />
                            <h2 className="font-semibold">ملخص الشحن</h2>
                        </div>
                        <Link href="/dashboard/shipping" className="text-sm text-primary hover:underline">عرض</Link>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-amber-600" />
                                <span className="text-sm">في الانتظار</span>
                            </div>
                            <span className="font-medium">{shippingStats.pendingShipments}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Truck size={14} className="text-blue-600" />
                                <span className="text-sm">في الطريق</span>
                            </div>
                            <span className="font-medium">{shippingStats.inTransitShipments}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-emerald-600" />
                                <span className="text-sm">تم التسليم</span>
                            </div>
                            <span className="font-medium">{shippingStats.deliveredShipments}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingDown size={14} className="text-red-600" />
                                <span className="text-sm">مرتجع</span>
                            </div>
                            <span className="font-medium">{shippingStats.returnedShipments}</span>
                        </div>
                    </div>
                </div>

                {/* Inventory Summary */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Package size={18} className="text-orange-600" />
                            <h2 className="font-semibold">ملخص المخزون</h2>
                        </div>
                        <Link href="/dashboard/inventory" className="text-sm text-primary hover:underline">عرض</Link>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">إجمالي المنتجات</span>
                            <span className="font-medium">{inventoryStats.totalProducts}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">قيمة المخزون</span>
                            <span className="font-medium">{inventoryStats.totalValue.toLocaleString('ar-EG')} ج.م</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">المخازن</span>
                            <span className="font-medium">{inventoryStats.warehouseCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-red-600">نفاد مخزون</span>
                            <span className="font-medium text-red-600">{inventoryStats.lowStockCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
