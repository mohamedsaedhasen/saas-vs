import Link from 'next/link';
import {
    DollarSign,
    Plus,
    Search,
    Filter,
    CheckCircle,
    Clock,
    Download,
    Truck,
} from 'lucide-react';
import { getCODSettlements, getPendingCOD, getCarriers } from '@/lib/actions/shipping';

export default async function CODSettlementsPage() {
    const [settlements, pendingCOD, carriers] = await Promise.all([
        getCODSettlements(),
        getPendingCOD(),
        getCarriers()
    ]);

    // Calculate stats
    const totalPendingAmount = pendingCOD.reduce((sum, s) => sum + (s.cod_amount || 0), 0);
    const totalSettled = settlements
        .filter(s => s.status === 'received')
        .reduce((sum, s) => sum + (s.net_amount || 0), 0);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">تسويات COD</h1>
                    <p className="text-muted-foreground mt-1">إدارة تحصيلات الدفع عند الاستلام</p>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium">
                    <Plus size={18} />
                    تسوية جديدة
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <Clock size={14} />
                        <span className="text-sm">معلق التحصيل</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">{totalPendingAmount.toLocaleString('ar-EG')}</div>
                    <div className="text-xs text-muted-foreground">ج.م</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <DollarSign size={14} />
                        <span className="text-sm">شحنات معلقة</span>
                    </div>
                    <div className="text-2xl font-bold">{pendingCOD.length}</div>
                    <div className="text-xs text-muted-foreground">شحنة</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                        <CheckCircle size={14} />
                        <span className="text-sm">تم تحصيله</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">{totalSettled.toLocaleString('ar-EG')}</div>
                    <div className="text-xs text-muted-foreground">ج.م</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Truck size={14} />
                        <span className="text-sm">تسويات</span>
                    </div>
                    <div className="text-2xl font-bold">{settlements.length}</div>
                    <div className="text-xs text-muted-foreground">تسوية</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending COD */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-amber-50 dark:bg-amber-950/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-amber-600" />
                                <h2 className="font-semibold">COD معلق التحصيل</h2>
                            </div>
                            <span className="text-sm text-amber-600">{pendingCOD.length} شحنة</span>
                        </div>
                    </div>

                    {pendingCOD.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            لا توجد مبالغ معلقة
                        </div>
                    ) : (
                        <div className="divide-y divide-border max-h-80 overflow-y-auto">
                            {pendingCOD.map((shipment) => (
                                <div key={shipment.id} className="p-3 hover:bg-muted/30 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-sm">{shipment.tracking_number}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {shipment.order?.customer_name || 'غير محدد'}
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold">{(shipment.cod_amount || 0).toLocaleString('ar-EG')}</div>
                                        <div className="text-xs text-muted-foreground">{shipment.carrier?.name}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* By Carrier */}
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Truck size={18} className="text-purple-600" />
                            <h2 className="font-semibold">ملخص حسب شركة الشحن</h2>
                        </div>
                    </div>

                    <div className="divide-y divide-border">
                        {carriers.map((carrier) => {
                            const carrierPending = pendingCOD.filter(p => p.carrier?.id === carrier.id);
                            const carrierAmount = carrierPending.reduce((sum, p) => sum + (p.cod_amount || 0), 0);

                            return (
                                <div key={carrier.id} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                                            {carrier.code?.slice(0, 2)}
                                        </div>
                                        <div>
                                            <div className="font-medium">{carrier.name}</div>
                                            <div className="text-xs text-muted-foreground">{carrierPending.length} شحنة</div>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-semibold">{carrierAmount.toLocaleString('ar-EG')}</div>
                                        <div className="text-xs text-muted-foreground">ج.م</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Settlements History */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle size={18} className="text-emerald-600" />
                        <h2 className="font-semibold">سجل التسويات</h2>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg hover:bg-muted text-sm">
                        <Download size={14} />
                        تصدير
                    </button>
                </div>

                {settlements.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        لا توجد تسويات سابقة
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-right py-3 px-4 text-sm font-medium">رقم التسوية</th>
                                <th className="text-right py-3 px-4 text-sm font-medium">شركة الشحن</th>
                                <th className="text-right py-3 px-4 text-sm font-medium">التاريخ</th>
                                <th className="text-left py-3 px-4 text-sm font-medium">إجمالي COD</th>
                                <th className="text-left py-3 px-4 text-sm font-medium">الرسوم</th>
                                <th className="text-left py-3 px-4 text-sm font-medium">الصافي</th>
                                <th className="text-center py-3 px-4 text-sm font-medium">الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {settlements.map((settlement) => (
                                <tr key={settlement.id} className="border-t border-border hover:bg-muted/30">
                                    <td className="py-3 px-4 font-medium">{settlement.settlement_number || '-'}</td>
                                    <td className="py-3 px-4">{settlement.carrier?.name || '-'}</td>
                                    <td className="py-3 px-4 text-sm">
                                        {new Date(settlement.settlement_date).toLocaleDateString('ar-EG')}
                                    </td>
                                    <td className="py-3 px-4 text-left font-mono">
                                        {(settlement.total_cod_amount || 0).toLocaleString('ar-EG')}
                                    </td>
                                    <td className="py-3 px-4 text-left font-mono text-red-600">
                                        -{(settlement.carrier_fees || 0).toLocaleString('ar-EG')}
                                    </td>
                                    <td className="py-3 px-4 text-left font-mono font-semibold">
                                        {(settlement.net_amount || 0).toLocaleString('ar-EG')}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${settlement.status === 'received' ? 'bg-emerald-100 text-emerald-700' :
                                                settlement.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-amber-100 text-amber-700'
                                            }`}>
                                            {settlement.status === 'received' ? 'تم الاستلام' :
                                                settlement.status === 'confirmed' ? 'مؤكد' : 'معلق'}
                                        </span>
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
