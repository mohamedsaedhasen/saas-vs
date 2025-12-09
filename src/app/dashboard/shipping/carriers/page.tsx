import Link from 'next/link';
import {
    Truck,
    Plus,
    Settings,
    MapPin,
    DollarSign,
    Search,
    Grid,
    List,
} from 'lucide-react';
import { getCarriers } from '@/lib/actions/shipping';

export default async function CarriersPage() {
    const carriers = await getCarriers();

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">شركات الشحن</h1>
                    <p className="text-muted-foreground mt-1">إدارة شركات الشحن والأسعار</p>
                </div>

                <Link
                    href="/dashboard/shipping/carriers/new"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                >
                    <Plus size={18} />
                    إضافة شركة
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="text-sm text-muted-foreground">إجمالي الشركات</div>
                    <div className="text-2xl font-bold mt-1">{carriers.length}</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="text-sm text-muted-foreground">نشطة</div>
                    <div className="text-2xl font-bold mt-1 text-emerald-600">
                        {carriers.filter(c => c.is_active).length}
                    </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="text-sm text-muted-foreground">تدعم COD</div>
                    <div className="text-2xl font-bold mt-1 text-blue-600">
                        {carriers.filter(c => c.cod_enabled).length}
                    </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="text-sm text-muted-foreground">مربوطة بـ API</div>
                    <div className="text-2xl font-bold mt-1 text-purple-600">
                        {carriers.filter(c => c.api_key).length}
                    </div>
                </div>
            </div>

            {/* Carriers Grid */}
            {carriers.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-12 text-center">
                    <Truck size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">لا توجد شركات شحن</h3>
                    <p className="text-muted-foreground mb-4">ابدأ بإضافة شركة شحن جديدة</p>
                    <Link
                        href="/dashboard/shipping/carriers/new"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                    >
                        <Plus size={18} />
                        إضافة شركة
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {carriers.map((carrier) => (
                        <div key={carrier.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-bold text-lg">
                                        {carrier.code?.slice(0, 2) || carrier.name.slice(0, 2)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{carrier.name}</h3>
                                        <div className="text-sm text-muted-foreground">{carrier.code}</div>
                                    </div>
                                </div>
                                {carrier.is_active ? (
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">نشط</span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">غير نشط</span>
                                )}
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <DollarSign size={14} className="text-muted-foreground" />
                                    <span>COD: {carrier.cod_enabled ? 'مفعّل' : 'معطّل'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Settings size={14} className="text-muted-foreground" />
                                    <span>API: {carrier.api_key ? 'مربوط' : 'غير مربوط'}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Link
                                    href={`/dashboard/shipping/carriers/${carrier.id}`}
                                    className="flex-1 text-center py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium"
                                >
                                    الإعدادات
                                </Link>
                                <Link
                                    href={`/dashboard/shipping/carriers/${carrier.id}/pricing`}
                                    className="flex-1 text-center py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium"
                                >
                                    الأسعار
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
