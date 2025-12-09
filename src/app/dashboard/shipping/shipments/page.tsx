import Link from 'next/link';
import {
    Package,
    Search,
    Filter,
    Truck,
    Clock,
    CheckCircle,
    XCircle,
    RotateCcw,
} from 'lucide-react';
import { getShipments } from '@/lib/actions/shipping';

export default async function ShipmentsPage() {
    const shipments = await getShipments(100);

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

    // Stats
    const stats = {
        total: shipments.length,
        pending: shipments.filter(s => s.status === 'pending').length,
        inTransit: shipments.filter(s => ['picked_up', 'in_transit', 'out_for_delivery'].includes(s.status)).length,
        delivered: shipments.filter(s => s.status === 'delivered').length,
        returned: shipments.filter(s => ['returned', 'rts', 'rejected'].includes(s.status)).length,
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">الشحنات</h1>
                    <p className="text-muted-foreground mt-1">متابعة جميع الشحنات</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Package size={14} />
                        <span className="text-sm">الإجمالي</span>
                    </div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <Clock size={14} />
                        <span className="text-sm">في الانتظار</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-indigo-600 mb-1">
                        <Truck size={14} />
                        <span className="text-sm">في الطريق</span>
                    </div>
                    <div className="text-2xl font-bold text-indigo-600">{stats.inTransit}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                        <CheckCircle size={14} />
                        <span className="text-sm">تم التسليم</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">{stats.delivered}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-red-600 mb-1">
                        <RotateCcw size={14} />
                        <span className="text-sm">مرتجع</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">{stats.returned}</div>
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="بحث برقم التتبع أو اسم العميل..."
                        className="w-full pl-4 pr-10 py-2 border border-border rounded-lg bg-background"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted">
                    <Filter size={18} />
                    تصفية
                </button>
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                {shipments.length === 0 ? (
                    <div className="text-center py-12">
                        <Package size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">لا توجد شحنات</h3>
                        <p className="text-muted-foreground">ستظهر الشحنات هنا عند إنشائها</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-right py-3 px-4 text-sm font-medium">رقم التتبع</th>
                                <th className="text-right py-3 px-4 text-sm font-medium">الطلب</th>
                                <th className="text-right py-3 px-4 text-sm font-medium">العميل</th>
                                <th className="text-right py-3 px-4 text-sm font-medium">شركة الشحن</th>
                                <th className="text-left py-3 px-4 text-sm font-medium">COD</th>
                                <th className="text-center py-3 px-4 text-sm font-medium">الحالة</th>
                                <th className="text-right py-3 px-4 text-sm font-medium">التاريخ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shipments.map((shipment) => (
                                <tr key={shipment.id} className="border-t border-border hover:bg-muted/30">
                                    <td className="py-3 px-4">
                                        <Link href={`/dashboard/shipping/shipments/${shipment.id}`} className="font-medium hover:text-primary">
                                            {shipment.tracking_number || shipment.awb_number || '-'}
                                        </Link>
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        {shipment.order?.order_number || '-'}
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        {shipment.order?.customer_name || '-'}
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        {shipment.carrier?.name || '-'}
                                    </td>
                                    <td className="py-3 px-4 text-left font-mono">
                                        {(shipment.cod_amount || 0).toLocaleString('ar-EG')}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {getStatusBadge(shipment.status)}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                        {new Date(shipment.created_at).toLocaleDateString('ar-EG')}
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
