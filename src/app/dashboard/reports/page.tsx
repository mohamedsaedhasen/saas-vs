import Link from 'next/link';
import {
    BarChart3,
    TrendingUp,
    Package,
    Truck,
    Users,
    Download,
    Calendar,
    FileText,
} from 'lucide-react';

export default function ReportsPage() {
    const reports = [
        {
            category: 'المبيعات',
            icon: TrendingUp,
            color: 'text-blue-600 bg-blue-100',
            items: [
                { name: 'تقرير المبيعات اليومي', href: '/dashboard/reports/sales/daily' },
                { name: 'تقرير المبيعات الشهري', href: '/dashboard/reports/sales/monthly' },
                { name: 'تقرير أفضل المنتجات', href: '/dashboard/reports/sales/top-products' },
                { name: 'تقرير أفضل العملاء', href: '/dashboard/reports/sales/top-customers' },
            ],
        },
        {
            category: 'الشحن',
            icon: Truck,
            color: 'text-purple-600 bg-purple-100',
            items: [
                { name: 'تقرير الشحنات', href: '/dashboard/reports/shipping/shipments' },
                { name: 'تقرير COD', href: '/dashboard/reports/shipping/cod' },
                { name: 'تقرير المرتجعات', href: '/dashboard/reports/shipping/returns' },
                { name: 'تقرير تكاليف الشحن', href: '/dashboard/reports/shipping/costs' },
            ],
        },
        {
            category: 'المخزون',
            icon: Package,
            color: 'text-orange-600 bg-orange-100',
            items: [
                { name: 'تقرير حركة المخزون', href: '/dashboard/reports/inventory/movement' },
                { name: 'تقرير الجرد', href: '/dashboard/reports/inventory/stock' },
                { name: 'تقرير نفاد المخزون', href: '/dashboard/reports/inventory/low-stock' },
                { name: 'تقرير قيمة المخزون', href: '/dashboard/reports/inventory/valuation' },
            ],
        },
        {
            category: 'المالية',
            icon: BarChart3,
            color: 'text-emerald-600 bg-emerald-100',
            items: [
                { name: 'ميزان المراجعة', href: '/dashboard/reports/finance/trial-balance' },
                { name: 'قائمة الدخل', href: '/dashboard/reports/finance/income-statement' },
                { name: 'الميزانية العمومية', href: '/dashboard/reports/finance/balance-sheet' },
                { name: 'تقارير الذمم', href: '/dashboard/reports/finance/receivables' },
            ],
        },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">التقارير</h1>
                    <p className="text-muted-foreground mt-1">جميع التقارير والإحصائيات</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-card">
                        <Calendar size={16} className="text-muted-foreground" />
                        <span className="text-sm">هذا الشهر</span>
                    </div>
                </div>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reports.map((group) => (
                    <div key={group.category} className="bg-card rounded-xl border border-border overflow-hidden">
                        <div className="flex items-center gap-3 p-4 border-b border-border">
                            <div className={`w-10 h-10 rounded-lg ${group.color} flex items-center justify-center`}>
                                <group.icon size={20} />
                            </div>
                            <h2 className="font-semibold">{group.category}</h2>
                        </div>
                        <div className="divide-y divide-border">
                            {group.items.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText size={14} className="text-muted-foreground" />
                                        <span className="text-sm">{item.name}</span>
                                    </div>
                                    <Download size={14} className="text-muted-foreground" />
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Stats */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="font-semibold mb-4">تقارير سريعة</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/dashboard/reports/sales/daily" className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors">
                        <TrendingUp size={24} className="text-blue-600 mb-2" />
                        <div className="font-medium">مبيعات اليوم</div>
                        <div className="text-sm text-muted-foreground">تقرير مفصل</div>
                    </Link>
                    <Link href="/dashboard/reports/shipping/cod" className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-950/50 transition-colors">
                        <Truck size={24} className="text-purple-600 mb-2" />
                        <div className="font-medium">تقرير COD</div>
                        <div className="text-sm text-muted-foreground">تسويات الشحن</div>
                    </Link>
                    <Link href="/dashboard/reports/inventory/low-stock" className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors">
                        <Package size={24} className="text-orange-600 mb-2" />
                        <div className="font-medium">نفاد المخزون</div>
                        <div className="text-sm text-muted-foreground">منتجات تحتاج تجديد</div>
                    </Link>
                    <Link href="/dashboard/reports/sales/top-customers" className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors">
                        <Users size={24} className="text-emerald-600 mb-2" />
                        <div className="font-medium">أفضل العملاء</div>
                        <div className="text-sm text-muted-foreground">حسب المبيعات</div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
