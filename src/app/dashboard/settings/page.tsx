'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Building2,
    Users,
    Shield,
    Monitor,
    Activity,
    Calculator,
    FileText,
    Link2,
    Bell,
    ChevronLeft,
    LucideIcon
} from 'lucide-react';

interface SettingsItem {
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
    color: string;
    isTab?: boolean;
}

interface SettingsGroup {
    title: string;
    items: SettingsItem[];
}

export default function SettingsPage() {
    const settingsGroups: SettingsGroup[] = [
        {
            title: 'إدارة المستخدمين والصلاحيات',
            items: [
                {
                    title: 'المستخدمين',
                    description: 'إدارة المستخدمين ودعوة مستخدمين جدد',
                    icon: Users,
                    href: '/dashboard/settings/users',
                    color: 'bg-blue-100 text-blue-600',
                },
                {
                    title: 'الأدوار والصلاحيات',
                    description: 'تحديد صلاحيات كل دور في النظام',
                    icon: Shield,
                    href: '/dashboard/settings/roles',
                    color: 'bg-purple-100 text-purple-600',
                },
                {
                    title: 'الأجهزة الموثوقة',
                    description: 'إدارة طلبات الأجهزة والموافقة عليها',
                    icon: Monitor,
                    href: '/dashboard/settings/devices',
                    color: 'bg-green-100 text-green-600',
                },
                {
                    title: 'سجل الأنشطة',
                    description: 'تتبع جميع الأنشطة والتغييرات',
                    icon: Activity,
                    href: '/dashboard/settings/activity-logs',
                    color: 'bg-orange-100 text-orange-600',
                },
            ],
        },
        {
            title: 'إعدادات الشركة',
            items: [
                {
                    title: 'معلومات الشركة',
                    description: 'اسم الشركة والعنوان والرقم الضريبي',
                    icon: Building2,
                    href: '#company',
                    color: 'bg-indigo-100 text-indigo-600',
                    isTab: true,
                },
                {
                    title: 'إعدادات المحاسبة',
                    description: 'العملة والضريبة والسنة المالية',
                    icon: Calculator,
                    href: '#accounting',
                    color: 'bg-emerald-100 text-emerald-600',
                    isTab: true,
                },
                {
                    title: 'إعدادات الفواتير',
                    description: 'قوالب الفواتير وشروط الدفع',
                    icon: FileText,
                    href: '#invoices',
                    color: 'bg-yellow-100 text-yellow-600',
                    isTab: true,
                },
            ],
        },
        {
            title: 'التكاملات والإشعارات',
            items: [
                {
                    title: 'التكاملات',
                    description: 'Shopify وشركات الشحن وبوابات الدفع',
                    icon: Link2,
                    href: '#integrations',
                    color: 'bg-pink-100 text-pink-600',
                    isTab: true,
                },
                {
                    title: 'الإشعارات',
                    description: 'إعداد التنبيهات والإشعارات',
                    icon: Bell,
                    href: '#notifications',
                    color: 'bg-red-100 text-red-600',
                    isTab: true,
                },
            ],
        },
    ];

    const [activeTab, setActiveTab] = useState<string | null>(null);

    const handleItemClick = (href: string, isTab?: boolean) => {
        if (isTab) {
            setActiveTab(href.replace('#', ''));
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Link href="/dashboard" className="hover:text-indigo-600">لوحة التحكم</Link>
                    <span>/</span>
                    <span className="text-gray-900">الإعدادات</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
            </div>

            {activeTab ? (
                <div className="space-y-6">
                    <button
                        onClick={() => setActiveTab(null)}
                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        العودة للإعدادات
                    </button>

                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        {activeTab === 'company' && <CompanySettings />}
                        {activeTab === 'accounting' && <AccountingSettings />}
                        {activeTab === 'invoices' && <InvoiceSettings />}
                        {activeTab === 'integrations' && <IntegrationsSettings />}
                        {activeTab === 'notifications' && <NotificationsSettings />}
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {settingsGroups.map((group) => (
                        <div key={group.title}>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">{group.title}</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {group.items.map((item) => {
                                    const Icon = item.icon;

                                    if (item.isTab) {
                                        return (
                                            <button
                                                key={item.title}
                                                onClick={() => handleItemClick(item.href, item.isTab)}
                                                className="text-right bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all group"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-3 rounded-xl ${item.color}`}>
                                                        <Icon className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                            {item.title}
                                                        </h3>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                    <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                                </div>
                                            </button>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={item.title}
                                            href={item.href}
                                            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-xl ${item.color}`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                        {item.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {item.description}
                                                    </p>
                                                </div>
                                                <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Company Settings Component
function CompanySettings() {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">إعدادات الشركة</h2>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اسم الشركة</label>
                    <input type="text" defaultValue="شركة النجاح للتجارة" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الرقم الضريبي</label>
                    <input type="text" defaultValue="123456789" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                    <input type="email" defaultValue="info@success-co.com" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                    <input type="tel" defaultValue="+20 123 456 7890" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                    <textarea rows={3} defaultValue="القاهرة، مصر" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none" />
                </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
                <button className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">
                    حفظ التغييرات
                </button>
            </div>
        </div>
    );
}

// Accounting Settings Component  
function AccountingSettings() {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">إعدادات المحاسبة</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">السنة المالية</label>
                    <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-indigo-500 outline-none">
                        <option>يناير - ديسمبر</option>
                        <option>أبريل - مارس</option>
                        <option>يوليو - يونيو</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">العملة الافتراضية</label>
                    <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-indigo-500 outline-none">
                        <option>جنيه مصري (EGP)</option>
                        <option>دولار أمريكي (USD)</option>
                        <option>ريال سعودي (SAR)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نسبة ضريبة القيمة المضافة</label>
                    <div className="flex items-center gap-2">
                        <input type="number" defaultValue="15" className="w-32 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" />
                        <span className="text-gray-500">%</span>
                    </div>
                </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
                <button className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">
                    حفظ التغييرات
                </button>
            </div>
        </div>
    );
}

// Invoice Settings Component
function InvoiceSettings() {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">إعدادات الفواتير</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">بادئة رقم الفاتورة</label>
                    <input type="text" defaultValue="INV-" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">شروط الدفع الافتراضية</label>
                    <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-indigo-500 outline-none">
                        <option>صافي 30 يوم</option>
                        <option>صافي 15 يوم</option>
                        <option>الدفع عند الاستلام</option>
                    </select>
                </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
                <button className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">
                    حفظ التغييرات
                </button>
            </div>
        </div>
    );
}

// Integrations Settings Component
function IntegrationsSettings() {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">التكاملات</h2>
            <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl">🛒</div>
                        <div>
                            <div className="font-medium text-gray-900">Shopify</div>
                            <div className="text-sm text-gray-500">مزامنة المنتجات والطلبات</div>
                        </div>
                    </div>
                    <button className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">ربط</button>
                </div>
                <div className="p-4 border border-gray-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">🚚</div>
                        <div>
                            <div className="font-medium text-gray-900">شركات الشحن</div>
                            <div className="text-sm text-gray-500">تتبع الشحنات والمرتجعات</div>
                        </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700 font-medium">متصل</span>
                </div>
            </div>
        </div>
    );
}

// Notifications Settings Component
function NotificationsSettings() {
    const notifications = [
        { title: 'تنبيه المخزون المنخفض', desc: 'إشعار عند وصول المنتج للحد الأدنى' },
        { title: 'الفواتير المستحقة', desc: 'تذكير قبل موعد استحقاق الفاتورة' },
        { title: 'طلبات Shopify الجديدة', desc: 'إشعار عند استلام طلب جديد' },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">الإشعارات</h2>
            <div className="space-y-4">
                {notifications.map((n, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <div className="font-medium text-gray-900">{n.title}</div>
                            <div className="text-sm text-gray-500">{n.desc}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:-translate-x-full"></div>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
}
