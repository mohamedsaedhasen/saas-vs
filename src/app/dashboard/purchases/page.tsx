import Link from 'next/link';
import {
    ShoppingCart,
    Truck,
    DollarSign,
    Clock,
    AlertCircle,
    Plus,
    FileText,
    BarChart3,
    Package,
} from 'lucide-react';
import { getPurchaseStats, getSuppliers } from '@/lib/actions/purchases';

export default async function PurchasesDashboardPage() {
    const [stats, suppliers] = await Promise.all([
        getPurchaseStats(),
        getSuppliers(5)
    ]);

    // Top suppliers by balance
    const topSuppliers = suppliers
        .sort((a, b) => (b.current_balance || 0) - (a.current_balance || 0))
        .slice(0, 5);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">لوحة المشتريات</h1>
                    <p className="text-muted-foreground mt-1">متابعة طلبات الشراء والموردين</p>
                </div>

                <Link
                    href="/dashboard/purchases/orders/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                >
                    <Plus size={18} />
                    طلب شراء جديد
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">المشتريات هذا الشهر</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <ShoppingCart size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.totalPurchases.toLocaleString('ar-EG')}</div>
                    <div className="text-xs text-muted-foreground mt-1">ج.م</div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">الموردين</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <Truck size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.suppliersCount}</div>
                    <div className="text-xs text-muted-foreground mt-1">مورد نشط</div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">الفواتير</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                            <FileText size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.invoicesCount}</div>
                    <div className="text-xs text-muted-foreground mt-1">فاتورة</div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">مستحقات للموردين</span>
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
                    href="/dashboard/purchases/orders"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <ShoppingCart size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary">طلبات الشراء</div>
                        <div className="text-xs text-muted-foreground">إدارة الطلبات</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/purchases/suppliers"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Truck size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary">الموردين</div>
                        <div className="text-xs text-muted-foreground">{stats.suppliersCount} مورد</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/purchases/invoices"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <FileText size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary">الفواتير</div>
                        <div className="text-xs text-muted-foreground">فواتير المشتريات</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/purchases/returns"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                        <Package size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary">المرتجعات</div>
                        <div className="text-xs text-muted-foreground">مرتجعات المشتريات</div>
                    </div>
                </Link>
            </div>

            {/* Suppliers List */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Truck size={18} className="text-purple-600" />
                        <h3 className="font-semibold">الموردين</h3>
                    </div>
                    <Link href="/dashboard/purchases/suppliers" className="text-sm text-primary hover:underline">
                        عرض الكل
                    </Link>
                </div>
                {suppliers.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">لا يوجد موردين</div>
                ) : (
                    <div className="divide-y divide-border">
                        {topSuppliers.map((supplier) => (
                            <div key={supplier.id} className="p-4 hover:bg-muted/30 flex items-center justify-between">
                                <div>
                                    <Link href={`/dashboard/purchases/suppliers/${supplier.id}`} className="font-medium hover:text-primary">
                                        {supplier.name}
                                    </Link>
                                    <div className="text-sm text-muted-foreground">{supplier.phone || 'لا يوجد رقم'}</div>
                                </div>
                                <div className="text-left">
                                    <div className={`font-semibold ${(supplier.current_balance || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {(supplier.current_balance || 0).toLocaleString('ar-EG')} ج.م
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {supplier.city || 'غير محدد'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
