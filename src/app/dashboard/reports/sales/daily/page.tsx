import Link from 'next/link';
import {
    ArrowRight,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Users,
    Package,
    Download,
    Calendar,
} from 'lucide-react';
import { getDailySalesReport } from '@/lib/actions/sales';

export default async function DailySalesReportPage() {
    const report = await getDailySalesReport();

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/reports" className="p-2 hover:bg-muted rounded-lg">
                    <ArrowRight size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">تقرير المبيعات اليومي</h1>
                    <p className="text-muted-foreground">
                        {new Date().toLocaleDateString('ar-EG', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-card">
                        <Calendar size={16} className="text-muted-foreground" />
                        <span className="text-sm">اليوم</span>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                        <Download size={16} />
                        تصدير
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                    <div className="text-sm opacity-80 mb-1">إجمالي المبيعات</div>
                    <div className="text-3xl font-bold">{(report.totalSales || 0).toLocaleString('ar-EG')}</div>
                    <div className="text-sm opacity-80">ج.م</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
                    <div className="text-sm opacity-80 mb-1">عدد الطلبات</div>
                    <div className="text-3xl font-bold">{report.totalOrders || 0}</div>
                    <div className="text-sm opacity-80">طلب</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                    <div className="text-sm opacity-80 mb-1">متوسط الطلب</div>
                    <div className="text-3xl font-bold">{(report.averageOrderValue || 0).toLocaleString('ar-EG')}</div>
                    <div className="text-sm opacity-80">ج.م</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                    <div className="text-sm opacity-80 mb-1">المنتجات المباعة</div>
                    <div className="text-3xl font-bold">{report.totalItems || 0}</div>
                    <div className="text-sm opacity-80">قطعة</div>
                </div>
            </div>

            {/* Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <h3 className="font-medium mb-4">مقارنة بالأمس</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">المبيعات</span>
                            <div className={`flex items-center gap-1 ${report.salesChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {report.salesChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                <span>{Math.abs(report.salesChange || 0)}%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">الطلبات</span>
                            <div className={`flex items-center gap-1 ${report.ordersChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {report.ordersChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                <span>{Math.abs(report.ordersChange || 0)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                    <h3 className="font-medium mb-4">توزيع طرق الدفع</h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">دفع عند الاستلام</span>
                            <span className="font-medium">{report.codOrders || 0} طلب</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">مدفوع مسبقاً</span>
                            <span className="font-medium">{report.paidOrders || 0} طلب</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">آجل</span>
                            <span className="font-medium">{report.creditOrders || 0} طلب</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Products */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Package size={18} className="text-primary" />
                        <h2 className="font-semibold">أفضل المنتجات اليوم</h2>
                    </div>
                </div>
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-right py-3 px-4 text-sm font-medium">#</th>
                            <th className="text-right py-3 px-4 text-sm font-medium">المنتج</th>
                            <th className="text-center py-3 px-4 text-sm font-medium">الكمية</th>
                            <th className="text-left py-3 px-4 text-sm font-medium">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(report.topProducts || []).map((product: { name: string; quantity: number; total: number }, index: number) => (
                            <tr key={index} className="border-t border-border">
                                <td className="py-3 px-4 text-muted-foreground">{index + 1}</td>
                                <td className="py-3 px-4 font-medium">{product.name}</td>
                                <td className="py-3 px-4 text-center">{product.quantity}</td>
                                <td className="py-3 px-4 text-left font-mono">{product.total.toLocaleString('ar-EG')} ج.م</td>
                            </tr>
                        ))}
                        {(report.topProducts || []).length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-muted-foreground">لا توجد مبيعات اليوم</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Top Customers */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Users size={18} className="text-emerald-600" />
                        <h2 className="font-semibold">أفضل العملاء اليوم</h2>
                    </div>
                </div>
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-right py-3 px-4 text-sm font-medium">#</th>
                            <th className="text-right py-3 px-4 text-sm font-medium">العميل</th>
                            <th className="text-center py-3 px-4 text-sm font-medium">الطلبات</th>
                            <th className="text-left py-3 px-4 text-sm font-medium">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(report.topCustomers || []).map((customer: { name: string; orders: number; total: number }, index: number) => (
                            <tr key={index} className="border-t border-border">
                                <td className="py-3 px-4 text-muted-foreground">{index + 1}</td>
                                <td className="py-3 px-4 font-medium">{customer.name}</td>
                                <td className="py-3 px-4 text-center">{customer.orders}</td>
                                <td className="py-3 px-4 text-left font-mono">{customer.total.toLocaleString('ar-EG')} ج.م</td>
                            </tr>
                        ))}
                        {(report.topCustomers || []).length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-muted-foreground">لا توجد بيانات</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
