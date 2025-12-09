'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    ArrowRight,
    Edit,
    FileText,
    Phone,
    Mail,
    MapPin,
    DollarSign,
    ShoppingCart,
    CreditCard,
    TrendingUp,
    Calendar,
    Star,
    Truck,
    Clock,
    Plus,
    Download,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Customer, SalesOrder } from '@/types/sales';

const groupConfig: Record<string, { label: string; color: string }> = {
    retail: { label: 'تجزئة', color: 'gray' },
    wholesale: { label: 'جملة', color: 'blue' },
    vip: { label: 'VIP', color: 'amber' },
    corporate: { label: 'شركات', color: 'purple' },
};

export default function CustomerDetailsPage() {
    const params = useParams();
    const customerId = params.id as string;

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [orders, setOrders] = useState<Partial<SalesOrder>[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'orders' | 'payments' | 'info'>('orders');

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);

                // Fetch customer
                const customerRes = await fetch(`/api/customers/${customerId}`);
                const customerData = await customerRes.json();
                if (customerData && !customerData.error) {
                    setCustomer(customerData);
                }

                // Fetch customer orders
                const ordersRes = await fetch(`/api/sales/orders?customer_id=${customerId}`);
                const ordersData = await ordersRes.json();
                if (Array.isArray(ordersData)) {
                    setOrders(ordersData.slice(0, 10));
                } else if (ordersData && Array.isArray(ordersData.data)) {
                    setOrders(ordersData.data.slice(0, 10));
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : 'حدث خطأ');
            } finally {
                setIsLoading(false);
            }
        }
        if (customerId) {
            fetchData();
        }
    }, [customerId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">خطأ في تحميل البيانات</h2>
                <p className="text-muted-foreground">{error || 'العميل غير موجود'}</p>
                <Link href="/dashboard/sales/customers" className="mt-4 text-primary hover:underline">
                    العودة للعملاء
                </Link>
            </div>
        );
    }

    const customerGroup = customer.customer_group || 'retail';
    const groupInfo = groupConfig[customerGroup] || groupConfig.retail;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/sales/customers"
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
                    >
                        <ArrowRight size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold">{customer.name}</h1>
                            <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                `bg-${groupInfo.color}-100 text-${groupInfo.color}-700`
                            )}>
                                {groupInfo.label}
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground">{customer.code}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={`/dashboard/sales/customers/${customer.id}/statement`}
                        className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted"
                    >
                        <FileText size={16} />
                        كشف حساب
                    </Link>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                        <Edit size={16} />
                        تعديل
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-card rounded-xl border border-border p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <ShoppingCart size={14} />
                                <span className="text-xs">الطلبات</span>
                            </div>
                            <div className="text-xl font-bold">{customer.total_orders || 0}</div>
                        </div>
                        <div className="bg-card rounded-xl border border-border p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <TrendingUp size={14} />
                                <span className="text-xs">إجمالي المشتريات</span>
                            </div>
                            <div className="text-xl font-bold">{(customer.total_spent || 0).toLocaleString('ar-EG')}</div>
                        </div>
                        <div className="bg-card rounded-xl border border-border p-4">
                            <div className="flex items-center gap-2 text-red-600 mb-1">
                                <DollarSign size={14} />
                                <span className="text-xs">مستحقات</span>
                            </div>
                            <div className="text-xl font-bold text-red-600">{(customer.balance || 0).toLocaleString('ar-EG')}</div>
                        </div>
                        <div className="bg-card rounded-xl border border-border p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <CreditCard size={14} />
                                <span className="text-xs">حد الائتمان</span>
                            </div>
                            <div className="text-xl font-bold">{(customer.credit_limit || 0).toLocaleString('ar-EG')}</div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="flex border-b border-border">
                            {(['orders', 'payments', 'info'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        'flex-1 py-3 px-4 text-sm font-medium transition-colors',
                                        activeTab === tab
                                            ? 'border-b-2 border-primary text-primary bg-muted/30'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                    )}
                                >
                                    {tab === 'orders' && 'الطلبات'}
                                    {tab === 'payments' && 'المدفوعات'}
                                    {tab === 'info' && 'معلومات إضافية'}
                                </button>
                            ))}
                        </div>

                        <div className="p-4">
                            {activeTab === 'orders' && (
                                <div className="space-y-3">
                                    {orders.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            لا توجد طلبات
                                        </div>
                                    ) : (
                                        orders.map((order) => (
                                            <Link
                                                key={order.id}
                                                href={`/dashboard/sales/orders/${order.id}`}
                                                className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary"
                                            >
                                                <div>
                                                    <div className="font-medium">{order.order_number}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {order.order_date ? new Date(order.order_date).toLocaleDateString('ar-EG') : '-'}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={cn(
                                                        'px-2 py-0.5 rounded-full text-xs font-medium',
                                                        order.status === 'pending' && 'bg-amber-100 text-amber-700',
                                                        order.status === 'shipped' && 'bg-indigo-100 text-indigo-700',
                                                        order.status === 'delivered' && 'bg-emerald-100 text-emerald-700',
                                                        order.status === 'completed' && 'bg-green-100 text-green-700'
                                                    )}>
                                                        {order.status === 'pending' ? 'قيد الانتظار' :
                                                            order.status === 'shipped' ? 'تم الشحن' :
                                                                order.status === 'delivered' ? 'تم التسليم' : 'مكتمل'}
                                                    </span>
                                                    <span className="font-semibold">
                                                        {(order.total || 0).toLocaleString('ar-EG')} ج.م
                                                    </span>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'payments' && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CreditCard size={40} className="mx-auto mb-2 opacity-50" />
                                    <p>سجل المدفوعات</p>
                                </div>
                            )}

                            {activeTab === 'info' && (
                                <div className="space-y-4">
                                    {customer.tax_number && (
                                        <div>
                                            <span className="text-sm text-muted-foreground">الرقم الضريبي:</span>
                                            <span className="mr-2 font-mono">{customer.tax_number}</span>
                                        </div>
                                    )}
                                    {(customer.payment_terms_days || 0) > 0 && (
                                        <div>
                                            <span className="text-sm text-muted-foreground">شروط الدفع:</span>
                                            <span className="mr-2">{customer.payment_terms_days} يوم</span>
                                        </div>
                                    )}
                                    {customer.notes && (
                                        <div>
                                            <span className="text-sm text-muted-foreground">ملاحظات:</span>
                                            <p className="mt-1">{customer.notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Contact Info */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <h3 className="font-semibold mb-3">معلومات التواصل</h3>
                        <div className="space-y-3 text-sm">
                            {customer.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-muted-foreground" />
                                    <span>{customer.phone}</span>
                                </div>
                            )}
                            {customer.mobile && (
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-muted-foreground" />
                                    <span>{customer.mobile}</span>
                                </div>
                            )}
                            {customer.email && (
                                <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-muted-foreground" />
                                    <span>{customer.email}</span>
                                </div>
                            )}
                            {customer.address && (
                                <div className="flex items-start gap-2">
                                    <MapPin size={14} className="text-muted-foreground mt-0.5" />
                                    <span>{customer.address}، {customer.city}، {customer.country}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    {customer.tags && customer.tags.length > 0 && (
                        <div className="bg-card rounded-xl border border-border p-4">
                            <h3 className="font-semibold mb-3">الوسوم</h3>
                            <div className="flex flex-wrap gap-1">
                                {customer.tags.map((tag) => (
                                    <span key={tag} className="px-2 py-0.5 bg-muted rounded text-sm">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-card rounded-xl border border-border p-4">
                        <h3 className="font-semibold mb-3">إجراءات سريعة</h3>
                        <div className="space-y-2">
                            <Link
                                href={`/dashboard/sales/orders/new?customer=${customer.id}`}
                                className="w-full flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted text-sm"
                            >
                                <Plus size={16} />
                                إنشاء طلب
                            </Link>
                            <button className="w-full flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted text-sm">
                                <CreditCard size={16} />
                                تسجيل دفعة
                            </button>
                            <Link
                                href={`/dashboard/sales/customers/${customer.id}/statement`}
                                className="w-full flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted text-sm"
                            >
                                <Download size={16} />
                                تصدير كشف الحساب
                            </Link>
                        </div>
                    </div>

                    {/* Shopify Sync */}
                    {customer.shopify_customer_id && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-emerald-700 font-medium mb-1">
                                <Truck size={16} />
                                Shopify Connected
                            </div>
                            <div className="text-xs text-emerald-600">
                                آخر مزامنة: {customer.shopify_synced_at ? new Date(customer.shopify_synced_at).toLocaleDateString('ar-EG') : '-'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
