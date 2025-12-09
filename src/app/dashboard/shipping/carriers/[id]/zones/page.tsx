import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    ArrowRight,
    MapPin,
    Plus,
    Trash2,
    Edit,
    Save,
} from 'lucide-react';
import { getCarrierById, getZonesByCarrier } from '@/lib/actions/shipping';

export default async function CarrierZonesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const carrier = await getCarrierById(id);

    if (!carrier) {
        notFound();
    }

    const zones = await getZonesByCarrier(id);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/shipping/carriers/${id}`} className="p-2 hover:bg-muted rounded-lg">
                    <ArrowRight size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">مناطق {carrier.name}</h1>
                    <p className="text-muted-foreground">إدارة المناطق والمحافظات</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                    <Plus size={18} />
                    إضافة منطقة
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
                <Link href={`/dashboard/shipping/carriers/${id}`} className="px-4 py-2 text-muted-foreground hover:text-foreground">
                    الإعدادات
                </Link>
                <Link href={`/dashboard/shipping/carriers/${id}/pricing`} className="px-4 py-2 text-muted-foreground hover:text-foreground">
                    الأسعار
                </Link>
                <Link href={`/dashboard/shipping/carriers/${id}/zones`} className="px-4 py-2 border-b-2 border-primary text-primary font-medium">
                    المناطق
                </Link>
            </div>

            {/* Zones Grid */}
            {zones.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-12 text-center">
                    <MapPin size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">لا توجد مناطق</h3>
                    <p className="text-muted-foreground mb-4">أضف مناطق لتحديد أسعار الشحن</p>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                        <Plus size={18} />
                        إضافة منطقة
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {zones.map((zone) => (
                        <div key={zone.id} className="bg-card rounded-xl border border-border p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold">{zone.name}</h3>
                                    <span className="text-sm text-muted-foreground">{zone.code}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button className="p-1.5 hover:bg-muted rounded">
                                        <Edit size={14} />
                                    </button>
                                    <button className="p-1.5 hover:bg-red-100 text-red-600 rounded">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {zone.name_en && (
                                <p className="text-sm text-muted-foreground mb-3">{zone.name_en}</p>
                            )}

                            {zone.governorates && zone.governorates.length > 0 && (
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">المحافظات:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {zone.governorates.map((gov, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs">
                                                {gov}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {zone.cities && zone.cities.length > 0 && (
                                <div className="mt-2">
                                    <div className="text-xs text-muted-foreground mb-1">المدن:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {zone.cities.map((city, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                                                {city}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${zone.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {zone.is_active ? 'نشطة' : 'غير نشطة'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Egypt Governorates Reference */}
            <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="font-medium mb-3">محافظات مصر</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-sm">
                    {[
                        'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'الغربية',
                        'المنوفية', 'البحيرة', 'كفر الشيخ', 'دمياط', 'بورسعيد', 'الإسماعيلية',
                        'السويس', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج',
                        'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد', 'مطروح',
                        'شمال سيناء', 'جنوب سيناء', 'القليوبية'
                    ].map((gov) => (
                        <div key={gov} className="px-2 py-1 bg-muted/50 rounded text-center">
                            {gov}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
