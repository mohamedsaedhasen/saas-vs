import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    ArrowRight,
    Settings,
    MapPin,
    DollarSign,
    Key,
    Globe,
    CheckCircle,
    XCircle,
    Save,
} from 'lucide-react';
import { getCarrierById, getZonesByCarrier, getCarrierPricing, getServiceTypes } from '@/lib/actions/shipping';

export default async function CarrierSettingsPage({ params }: { params: Promise<{ id: string }> }) {
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
                <Link href="/dashboard/shipping/carriers" className="p-2 hover:bg-muted rounded-lg">
                    <ArrowRight size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">{carrier.name}</h1>
                    <p className="text-muted-foreground">{carrier.code}</p>
                </div>
                <div className="flex items-center gap-2">
                    {carrier.is_active ? (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-700">
                            <CheckCircle size={14} />
                            نشط
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600">
                            <XCircle size={14} />
                            غير نشط
                        </span>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
                <Link href={`/dashboard/shipping/carriers/${id}`} className="px-4 py-2 border-b-2 border-primary text-primary font-medium">
                    الإعدادات
                </Link>
                <Link href={`/dashboard/shipping/carriers/${id}/pricing`} className="px-4 py-2 text-muted-foreground hover:text-foreground">
                    الأسعار
                </Link>
                <Link href={`/dashboard/shipping/carriers/${id}/zones`} className="px-4 py-2 text-muted-foreground hover:text-foreground">
                    المناطق
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* API Settings */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Key size={18} className="text-primary" />
                        <h2 className="font-semibold">إعدادات API</h2>
                    </div>

                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">رابط API</label>
                            <input
                                type="url"
                                defaultValue={carrier.api_url || ''}
                                placeholder="https://api.example.com"
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">API Key</label>
                            <input
                                type="password"
                                defaultValue={carrier.api_key || ''}
                                placeholder="••••••••••••••••"
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">API Secret</label>
                            <input
                                type="password"
                                defaultValue={carrier.api_secret || ''}
                                placeholder="••••••••••••••••"
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm"
                            >
                                اختبار الاتصال
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm"
                            >
                                <Save size={16} />
                                حفظ
                            </button>
                        </div>
                    </form>
                </div>

                {/* COD Settings */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <DollarSign size={18} className="text-emerald-600" />
                        <h2 className="font-semibold">إعدادات COD</h2>
                    </div>

                    <form className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <span>تفعيل COD</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    defaultChecked={carrier.cod_enabled}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">رسوم COD</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    defaultValue={carrier.cod_fee_amount || 0}
                                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background"
                                />
                                <span className="text-muted-foreground">ج.م</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm"
                        >
                            <Save size={16} />
                            حفظ
                        </button>
                    </form>
                </div>

                {/* Zones Summary */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <MapPin size={18} className="text-purple-600" />
                            <h2 className="font-semibold">المناطق ({zones.length})</h2>
                        </div>
                        <Link href={`/dashboard/shipping/carriers/${id}/zones`} className="text-sm text-primary hover:underline">
                            إدارة
                        </Link>
                    </div>

                    <div className="space-y-2">
                        {zones.length === 0 ? (
                            <p className="text-muted-foreground text-sm">لا توجد مناطق</p>
                        ) : (
                            zones.map((zone) => (
                                <div key={zone.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                    <span className="font-medium text-sm">{zone.name}</span>
                                    <span className="text-xs text-muted-foreground">{zone.code}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Pricing Summary */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <DollarSign size={18} className="text-blue-600" />
                            <h2 className="font-semibold">ملخص الأسعار</h2>
                        </div>
                        <Link href={`/dashboard/shipping/carriers/${id}/pricing`} className="text-sm text-primary hover:underline">
                            تعديل
                        </Link>
                    </div>

                    {zones.length > 0 && serviceTypes.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-right py-2 px-2">الخدمة</th>
                                        {zones.slice(0, 4).map((zone) => (
                                            <th key={zone.id} className="text-center py-2 px-2">{zone.code}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {serviceTypes.slice(0, 4).map((st) => (
                                        <tr key={st.id} className="border-b border-border/50">
                                            <td className="py-2 px-2">{st.name}</td>
                                            {zones.slice(0, 4).map((zone) => (
                                                <td key={zone.id} className="text-center py-2 px-2 font-mono">
                                                    {priceMap[zone.code]?.[st.code] || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">لا توجد أسعار</p>
                    )}
                </div>
            </div>
        </div>
    );
}
