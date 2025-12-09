'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from './AppShell';
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    Package,
    Settings,
    X,
    ChevronLeft,
    ChevronRight,
    FileText,
    CreditCard,
    BarChart3,
    Truck,
    Landmark,
    ScrollText,
    Wallet,
    ArrowLeftRight,
    Factory,
    TreeDeciduous,
    Receipt,
    PieChart,
    Clock,
    CheckCircle,
    FolderTree,
    TrendingUp,
    TrendingDown,
} from 'lucide-react';
import { BranchSelector } from '@/components/BranchSelector';

export function Sidebar() {
    const pathname = usePathname();
    const { isOpen, setIsOpen, isCollapsed, setIsCollapsed } = useSidebar();

    const menuGroups = [
        {
            group: 'الرئيسية',
            items: [
                { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
            ],
        },
        {
            group: 'المحاسبة',
            items: [
                { href: '/dashboard/accounting/chart-of-accounts', label: 'شجرة الحسابات', icon: ScrollText },
                { href: '/dashboard/accounting/journal-entries', label: 'قيود اليومية', icon: FileText },
                { href: '/dashboard/accounting/vaults', label: 'الخزن', icon: Wallet },
                { href: '/dashboard/accounting/banks', label: 'البنوك', icon: Landmark },
            ],
        },
        {
            group: 'المخازن',
            items: [
                { href: '/dashboard/inventory', label: 'لوحة التحكم', icon: LayoutDashboard },
                { href: '/dashboard/inventory/products', label: 'المنتجات', icon: Package },
                { href: '/dashboard/inventory/categories', label: 'التصنيفات', icon: FolderTree },
                { href: '/dashboard/inventory/warehouses', label: 'المخازن', icon: Factory },
                { href: '/dashboard/inventory/transfers', label: 'التحويلات', icon: ArrowLeftRight },
            ],
        },
        {
            group: 'المبيعات',
            items: [
                { href: '/dashboard/sales', label: 'لوحة التحكم', icon: LayoutDashboard },
                { href: '/dashboard/sales/orders', label: 'الطلبات', icon: ShoppingCart },
                { href: '/dashboard/sales/customers', label: 'العملاء', icon: Users },
                { href: '/dashboard/sales/invoices', label: 'الفواتير', icon: FileText },
                { href: '/dashboard/sales/returns', label: 'المرتجعات', icon: ArrowLeftRight },
            ],
        },
        {
            group: 'المشتريات',
            items: [
                { href: '/dashboard/purchases', label: 'لوحة التحكم', icon: LayoutDashboard },
                { href: '/dashboard/purchases/orders', label: 'طلبات الشراء', icon: ShoppingCart },
                { href: '/dashboard/purchases/suppliers', label: 'الموردين', icon: Truck },
                { href: '/dashboard/purchases/invoices', label: 'الفواتير', icon: FileText },
                { href: '/dashboard/purchases/returns', label: 'المرتجعات', icon: ArrowLeftRight },
            ],
        },
        {
            group: 'الشحن',
            items: [
                { href: '/dashboard/shipping', label: 'لوحة التحكم', icon: LayoutDashboard },
                { href: '/dashboard/shipping/shipments', label: 'الشحنات', icon: Package },
                { href: '/dashboard/shipping/carriers', label: 'شركات الشحن', icon: Truck },
                { href: '/dashboard/shipping/cod', label: 'تسويات COD', icon: CreditCard },
            ],
        },
        {
            group: 'المدفوعات',
            items: [
                { href: '/dashboard/payments/receipts', label: 'سندات القبض', icon: TrendingUp },
                { href: '/dashboard/payments/payments', label: 'سندات الصرف', icon: TrendingDown },
            ],
        },
        {
            group: 'المصاريف',
            items: [
                { href: '/dashboard/expenses', label: 'لوحة التحكم', icon: PieChart },
                { href: '/dashboard/expenses/tree', label: 'شجرة المصاريف', icon: TreeDeciduous },
                { href: '/dashboard/expenses/vouchers', label: 'سندات الصرف', icon: Receipt },
            ],
        },
        {
            group: 'التقارير',
            items: [
                { href: '/dashboard/reports', label: 'التقارير', icon: BarChart3 },
            ],
        },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 right-0 z-50 h-screen bg-card border-l border-border flex flex-col",
                    "transition-all duration-300 ease-in-out",
                    // Mobile: slide in/out
                    isOpen ? "translate-x-0" : "translate-x-full",
                    // Desktop: always visible, width based on collapsed
                    "lg:translate-x-0",
                    isCollapsed ? "lg:w-20" : "lg:w-64",
                    // Mobile width
                    "w-72"
                )}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
                    <Link href="/dashboard" className={cn("flex items-center gap-3", isCollapsed && "lg:justify-center lg:w-full")}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg">
                            E
                        </div>
                        <span className={cn(
                            "font-bold text-lg whitespace-nowrap transition-all duration-300",
                            isCollapsed ? "lg:hidden" : "block"
                        )}>
                            ERP SaaS
                        </span>
                    </Link>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Branch Selector */}
                {!isCollapsed && <BranchSelector />}

                {/* Navigation */}
                <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden scrollbar-thin">
                    {menuGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="mb-4">
                            {!isCollapsed && (
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-4">
                                    {group.group}
                                </h3>
                            )}
                            {isCollapsed && groupIndex > 0 && (
                                <div className="h-px bg-border/50 my-3 mx-3" />
                            )}
                            <div className="space-y-1 px-2">
                                {group.items.map((item, itemIndex) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href ||
                                        (item.href !== '/dashboard' && pathname.startsWith(item.href));

                                    return (
                                        <Link
                                            key={itemIndex}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium group",
                                                isActive
                                                    ? "bg-primary text-primary-foreground shadow-md"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                                isCollapsed && "lg:justify-center lg:px-0"
                                            )}
                                            title={isCollapsed ? item.label : undefined}
                                        >
                                            <Icon size={20} className={cn(
                                                "flex-shrink-0 transition-transform duration-200",
                                                !isActive && "group-hover:scale-110"
                                            )} />
                                            <span className={cn(
                                                "whitespace-nowrap transition-all duration-300",
                                                isCollapsed ? "lg:hidden" : "block"
                                            )}>
                                                {item.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Settings */}
                    <div className="mt-4 pt-4 border-t border-border px-2">
                        <Link
                            href="/dashboard/settings"
                            onClick={() => setIsOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                                isCollapsed && "lg:justify-center lg:px-0"
                            )}
                            title={isCollapsed ? "الإعدادات" : undefined}
                        >
                            <Settings size={20} />
                            <span className={cn("whitespace-nowrap", isCollapsed ? "lg:hidden" : "block")}>
                                الإعدادات
                            </span>
                        </Link>
                    </div>
                </nav>

                {/* Collapse Toggle (Desktop only) */}
                <div className="hidden lg:block p-3 border-t border-border">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-full flex items-center justify-center gap-2 p-2.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                    >
                        {isCollapsed ? (
                            <ChevronLeft size={20} />
                        ) : (
                            <>
                                <ChevronRight size={20} />
                                <span className="text-sm">طي القائمة</span>
                            </>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}
