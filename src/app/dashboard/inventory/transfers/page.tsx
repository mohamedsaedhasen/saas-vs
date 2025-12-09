import Link from 'next/link';
import {
    ArrowLeftRight,
    Plus,
    Package,
    Warehouse,
    CheckCircle,
    Clock,
} from 'lucide-react';
import { getStockTransfers, getWarehouses } from '@/lib/actions/inventory';

export default async function StockTransfersPage() {
    const [transfers, warehouses] = await Promise.all([
        getStockTransfers(),
        getWarehouses()
    ]);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-amber-100 text-amber-700',
            in_transit: 'bg-blue-100 text-blue-700',
            completed: 'bg-emerald-100 text-emerald-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        const labels: Record<string, string> = {
            pending: 'معلق',
            in_transit: 'في الطريق',
            completed: 'مكتمل',
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
                    <h1 className="text-2xl font-bold">تحويلات المخزون</h1>
                    <p className="text-muted-foreground mt-1">نقل المخزون بين المخازن</p>
                </div>

                <Link
                    href="/dashboard/inventory/transfers/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                >
                    <Plus size={18} />
                    تحويل جديد
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <ArrowLeftRight size={14} />
                        <span className="text-sm">إجمالي التحويلات</span>
                    </div>
                    <div className="text-2xl font-bold">{transfers.length}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <Clock size={14} />
                        <span className="text-sm">معلقة</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">
                        {transfers.filter(t => t.status === 'pending').length}
                    </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                        <CheckCircle size={14} />
                        <span className="text-sm">مكتملة</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">
                        {transfers.filter(t => t.status === 'completed').length}
                    </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Warehouse size={14} />
                        <span className="text-sm">المخازن</span>
                    </div>
                    <div className="text-2xl font-bold">{warehouses.length}</div>
                </div>
            </div>

            {/* Transfers Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                {transfers.length === 0 ? (
                    <div className="p-12 text-center">
                        <ArrowLeftRight size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium mb-2">لا توجد تحويلات</h3>
                        <p className="text-muted-foreground mb-4">ابدأ بإنشاء تحويل جديد</p>
                        <Link
                            href="/dashboard/inventory/transfers/new"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                        >
                            <Plus size={18} />
                            تحويل جديد
                        </Link>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-right py-3 px-4 text-sm font-medium">رقم التحويل</th>
                                <th className="text-right py-3 px-4 text-sm font-medium">من</th>
                                <th className="text-right py-3 px-4 text-sm font-medium">إلى</th>
                                <th className="text-center py-3 px-4 text-sm font-medium">المنتجات</th>
                                <th className="text-center py-3 px-4 text-sm font-medium">الحالة</th>
                                <th className="text-right py-3 px-4 text-sm font-medium">التاريخ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transfers.map((transfer) => (
                                <tr key={transfer.id} className="border-t border-border hover:bg-muted/30">
                                    <td className="py-3 px-4 font-medium">{transfer.transfer_number}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <Warehouse size={14} className="text-muted-foreground" />
                                            {transfer.from_warehouse?.name || '-'}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <Warehouse size={14} className="text-muted-foreground" />
                                            {transfer.to_warehouse?.name || '-'}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Package size={14} className="text-muted-foreground" />
                                            {transfer.items?.length || 0}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {getStatusBadge(transfer.status)}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                        {new Date(transfer.created_at).toLocaleDateString('ar-EG')}
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
