import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    ArrowRight,
    DollarSign,
    Save,
    Download,
    Upload,
} from 'lucide-react';
import { getCarrierById, getZonesByCarrier, getCarrierPricing, getServiceTypes } from '@/lib/actions/shipping';

export default async function CarrierPricingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const carrier = await getCarrierById(id);

    if (!carrier) {
        notFound();
    }

    const [zones, pricing, serviceTypes] = await Promise.all([
        getZonesByCarrier(id),
        getCarrierPricing(id),
        getServiceTypes()
    ]);

    // Build pricing matrix
    const priceMap: Record<string, Record<string, number>> = {};
    pricing.forEach((p: { zone?: { code?: string }; service_type?: { code?: string }; price: number }) => {
        const zoneCode = p.zone?.code || '';
        const serviceCode = p.service_type?.code || '';
        if (!priceMap[zoneCode]) priceMap[zoneCode] = {};
        priceMap[zoneCode][serviceCode] = p.price;
    });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/shipping/carriers/${id}`} className="p-2 hover:bg-muted rounded-lg">
                    <ArrowRight size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">أسعار {carrier.name}</h1>
                    <p className="text-muted-foreground">مصفوفة الأسعار حسب المنطقة ونوع الخدمة</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted text-sm">
                        <Download size={16} />
                        تصدير
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted text-sm">
                        <Upload size={16} />
                        استيراد
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
                <Link href={`/dashboard/shipping/carriers/${id}`} className="px-4 py-2 text-muted-foreground hover:text-foreground">
                    الإعدادات
                </Link>
                <Link href={`/dashboard/shipping/carriers/${id}/pricing`} className="px-4 py-2 border-b-2 border-primary text-primary font-medium">
                    الأسعار
                </Link>
                <Link href={`/dashboard/shipping/carriers/${id}/zones`} className="px-4 py-2 text-muted-foreground hover:text-foreground">
                    المناطق
                </Link>
            </div>

            {/* Pricing Matrix */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                        <DollarSign size={18} className="text-primary" />
                        <h2 className="font-semibold">مصفوفة الأسعار (بالجنيه المصري)</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">الأسعار غير شاملة ضريبة القيمة المضافة</p>
                </div>

                {zones.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-muted-foreground">لا توجد مناطق - أضف مناطق أولاً</p>
                        <Link
                            href={`/dashboard/shipping/carriers/${id}/zones`}
                            className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
                        >
                            إضافة مناطق
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-muted/50">
                                    <th className="text-right py-3 px-4 font-medium border-l border-border">الخدمة</th>
                                    {zones.map((zone) => (
                                        <th key={zone.id} className="text-center py-3 px-4 font-medium border-l border-border min-w-[100px]">
                                            <div>{zone.name}</div>
                                            <div className="text-xs text-muted-foreground font-normal">{zone.code}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {serviceTypes.map((st, i) => (
                                    <tr key={st.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                        <td className="py-3 px-4 border-l border-border">
                                            <div className="font-medium">{st.name}</div>
                                            <div className="text-xs text-muted-foreground">{st.code}</div>
                                        </td>
                                        {zones.map((zone) => (
                                            <td key={zone.id} className="text-center py-3 px-4 border-l border-border">
                                                <input
                                                    type="number"
                                                    defaultValue={priceMap[zone.code]?.[st.code] || 0}
                                                    className="w-20 px-2 py-1 text-center border border-border rounded bg-background font-mono"
                                                    min="0"
                                                    step="1"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg">
                        <Save size={16} />
                        حفظ الأسعار
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="font-medium mb-3">دليل أنواع الخدمات</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="font-medium">DELIVERY:</span>
                        <span className="text-muted-foreground"> رسوم التوصيل العادي</span>
                    </div>
                    <div>
                        <span className="font-medium">RTS:</span>
                        <span className="text-muted-foreground"> الإعادة للمصدر</span>
                    </div>
                    <div>
                        <span className="font-medium">CUSTOMER_RETURN:</span>
                        <span className="text-muted-foreground"> مرتجعات العملاء</span>
                    </div>
                    <div>
                        <span className="font-medium">EXCHANGE:</span>
                        <span className="text-muted-foreground"> استبدال المنتج</span>
                    </div>
                    <div>
                        <span className="font-medium">REJECTED:</span>
                        <span className="text-muted-foreground"> رفض الاستلام</span>
                    </div>
                    <div>
                        <span className="font-medium">PARTIAL_DELIVERY:</span>
                        <span className="text-muted-foreground"> توصيل جزئي</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
