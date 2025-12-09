'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    Truck,
    MapPin,
    DollarSign,
    Send,
    Package,
} from 'lucide-react';

interface Carrier {
    id: string;
    name: string;
    code: string;
    is_active: boolean;
}

interface Zone {
    id: string;
    name: string;
    code: string;
}

export default function ShipOrderPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [orderId, setOrderId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [selectedCarrier, setSelectedCarrier] = useState<string>('');
    const [selectedZone, setSelectedZone] = useState<string>('');
    const [shippingFee, setShippingFee] = useState(0);
    const [order, setOrder] = useState<{
        order_number: string;
        customer_name: string;
        customer_phone: string;
        total: number;
        payment_method: string;
    } | null>(null);

    useEffect(() => {
        const init = async () => {
            const { id } = await params;
            setOrderId(id);

            // Fetch carriers
            const carriersRes = await fetch('/api/shipping/carriers');
            const carriersData = await carriersRes.json();
            setCarriers(carriersData);

            // Fetch order
            const orderRes = await fetch(`/api/sales/orders/${id}`);
            const orderData = await orderRes.json();
            setOrder(orderData);
        };
        init();
    }, [params]);

    useEffect(() => {
        if (selectedCarrier) {
            // Fetch zones for carrier
            fetch(`/api/shipping/carriers/${selectedCarrier}/zones`)
                .then(res => res.json())
                .then(data => setZones(data));
        }
    }, [selectedCarrier]);

    useEffect(() => {
        if (selectedCarrier && selectedZone) {
            // Fetch price
            fetch(`/api/shipping/pricing?carrier=${selectedCarrier}&zone=${selectedZone}&service=DELIVERY`)
                .then(res => res.json())
                .then(data => setShippingFee(data.price || 0));
        }
    }, [selectedCarrier, selectedZone]);

    const handleSubmit = async () => {
        if (!selectedCarrier || !selectedZone) {
            alert('يرجى اختيار شركة الشحن والمنطقة');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/shipping/shipments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: orderId,
                    carrier_id: selectedCarrier,
                    zone_id: selectedZone,
                    cod_amount: order?.payment_method === 'cod' ? order.total : 0,
                    shipping_fee: shippingFee,
                }),
            });

            if (response.ok) {
                router.push(`/dashboard/sales/orders/${orderId}`);
            }
        } catch (error) {
            console.error('Error creating shipment:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!order) {
        return <div className="p-6">جاري التحميل...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/sales/orders/${orderId}`} className="p-2 hover:bg-muted rounded-lg">
                    <ArrowRight size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">شحن طلب #{order.order_number}</h1>
                    <p className="text-muted-foreground">إنشاء شحنة جديدة</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Shipping Form */}
                <div className="space-y-6">
                    {/* Carrier Selection */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Truck size={18} className="text-primary" />
                            <h2 className="font-semibold">شركة الشحن</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {carriers.map((carrier) => (
                                <button
                                    key={carrier.id}
                                    onClick={() => setSelectedCarrier(carrier.id)}
                                    className={`p-3 rounded-lg border-2 transition-all ${selectedCarrier === carrier.id
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <div className="font-medium">{carrier.name}</div>
                                    <div className="text-xs text-muted-foreground">{carrier.code}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Zone Selection */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin size={18} className="text-purple-600" />
                            <h2 className="font-semibold">المنطقة</h2>
                        </div>

                        {selectedCarrier ? (
                            <select
                                value={selectedZone}
                                onChange={(e) => setSelectedZone(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            >
                                <option value="">اختر المنطقة...</option>
                                {zones.map((zone) => (
                                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-muted-foreground text-sm">اختر شركة الشحن أولاً</p>
                        )}
                    </div>

                    {/* Shipping Cost */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign size={18} className="text-emerald-600" />
                            <h2 className="font-semibold">تكلفة الشحن</h2>
                        </div>

                        <div className="text-3xl font-bold text-primary">
                            {shippingFee.toLocaleString('ar-EG')} ج.م
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="space-y-4">
                    <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Package size={18} className="text-primary" />
                            <h2 className="font-semibold">ملخص الطلب</h2>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">العميل</span>
                                <span className="font-medium">{order.customer_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">الهاتف</span>
                                <span className="font-mono">{order.customer_phone}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">إجمالي الطلب</span>
                                <span className="font-bold">{order.total.toLocaleString('ar-EG')} ج.م</span>
                            </div>
                            <div className="border-t border-border pt-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">COD</span>
                                    <span className="font-bold text-primary">
                                        {order.payment_method === 'cod' ? order.total.toLocaleString('ar-EG') : '0'} ج.م
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !selectedCarrier || !selectedZone}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium disabled:opacity-50"
                    >
                        <Send size={18} />
                        {isLoading ? 'جاري الإنشاء...' : 'إنشاء الشحنة'}
                    </button>
                </div>
            </div>
        </div>
    );
}
