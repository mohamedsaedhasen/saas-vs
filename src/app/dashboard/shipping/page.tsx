import Link from 'next/link';
import {
    Truck,
    Package,
    DollarSign,
    Clock,
    CheckCircle,
    AlertCircle,
    Plus,
    Settings,
    MapPin,
    RotateCcw,
} from 'lucide-react';
import { getShippingStats, getCarriers, getShipments } from '@/lib/actions/shipping';

export default async function ShippingDashboardPage() {
    const [stats, carriers, shipments] = await Promise.all([
        getShippingStats(),
        getCarriers(),
        getShipments(5)
    ]);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-amber-100 text-amber-700',
            picked_up: 'bg-blue-100 text-blue-700',
            in_transit: 'bg-indigo-100 text-indigo-700',
            out_for_delivery: 'bg-purple-100 text-purple-700',
            delivered: 'bg-emerald-100 text-emerald-700',
            returned: 'bg-orange-100 text-orange-700',
            rts: 'bg-red-100 text-red-700',
            rejected: 'bg-red-100 text-red-700',
            cancelled: 'bg-gray-100 text-gray-700',
        };
        const labels: Record<string, string> = {
            pending: 'في الانتظار',
            picked_up: 'تم الاستلام',
            in_transit: 'في الطريق',
            out_for_delivery: 'خارج للتوصيل',
            delivered: 'تم التسليم',
            returned: 'مرتجع',
            rts: 'إعادة للمصدر',
            rejected: 'مرفوض',
            cancelled: 'ملغي',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">إدارة الشحن</h1>
                    <p className="text-muted-foreground mt-1">متابعة الشحنات وشركات الشحن</p>
                </div>

                <Link
                    href="/dashboard/shipping/shipments/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                >
                    <Plus size={18} />
                    شحنة جديدة
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">إجمالي الشحنات</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Package size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.totalShipments}</div>
                    <div className="text-xs text-muted-foreground mt-1">شحنة</div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">في الطريق</span>
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <Truck size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-indigo-600">{stats.inTransitShipments}</div>
                    <div className="text-xs text-muted-foreground mt-1">شحنة</div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">تم التسليم</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <CheckCircle size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">{stats.deliveredShipments}</div>
                    <div className="text-xs text-muted-foreground mt-1">شحنة</div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">COD معلق</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                            <DollarSign size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">{stats.pendingCOD.toLocaleString('ar-EG')}</div>
                    <div className="text-xs text-muted-foreground mt-1">ج.م</div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                    href="/dashboard/shipping/shipments"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Package size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary">الشحنات</div>
                        <div className="text-xs text-muted-foreground">{stats.totalShipments} شحنة</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/shipping/carriers"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Truck size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary">شركات الشحن</div>
                        <div className="text-xs text-muted-foreground">{stats.totalCarriers} شركة</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/shipping/cod"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary">تسويات COD</div>
                        <div className="text-xs text-muted-foreground">المبالغ المحصلة</div>
                    </div>
                </Link>

                <Link
                    href="/dashboard/shipping/returns"
                    className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                        <RotateCcw size={20} />
                    </div>
                    <div>
                        <div className="font-medium group-hover:text-primary">المرتجعات</div>
                        <div className="text-xs text-muted-foreground">{stats.returnedShipments} مرتجع</div>
                    </div>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Carriers */}
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Truck size={18} className="text-purple-600" />
                            <h3 className="font-semibold">شركات الشحن</h3>
                        </div>
                        <Link href="/dashboard/shipping/carriers" className="text-sm text-primary hover:underline">
                            عرض الكل
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {carriers.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">لا توجد شركات شحن</div>
                        ) : (
                            carriers.map((carrier) => (
                                <div key={carrier.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                                            {carrier.code?.slice(0, 2) || carrier.name.slice(0, 2)}
                                        </div>
                                        <div>
                                            <div className="font-medium">{carrier.name}</div>
                                            <div className="text-xs text-muted-foreground">{carrier.code}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {carrier.is_active ? (
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">نشط</span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">غير نشط</span>
                                        )}
                                        <Link href={`/dashboard/shipping/carriers/${carrier.id}`} className="p-1.5 hover:bg-muted rounded">
                                            <Settings size={14} />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Shipments */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Clock size={18} className="text-blue-600" />
                            <h3 className="font-semibold">أحدث الشحنات</h3>
                        </div>
                        <Link href="/dashboard/shipping/shipments" className="text-sm text-primary hover:underline">
                            عرض الكل
                        </Link>
                    </div>
                    {shipments.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">لا توجد شحنات</div>
                    ) : (
                        <div className="divide-y divide-border">
                            {shipments.map((shipment) => (
                                <div key={shipment.id} className="p-4 hover:bg-muted/30 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{shipment.tracking_number || shipment.awb_number || 'بدون رقم'}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {shipment.order?.customer_name || 'غير محدد'}
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold">{(shipment.cod_amount || 0).toLocaleString('ar-EG')} ج.م</div>
                                        {getStatusBadge(shipment.status)}
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
