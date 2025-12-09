// نظام تسجيل المديولات
// كل مديول يتم تسجيله هنا مع الصلاحيات والإعدادات

export interface ModulePermission {
    key: string;
    name: string;
    name_en: string;
    description?: string;
}

export interface ModuleMenuItem {
    key: string;
    label: string;
    label_en: string;
    icon: string;
    href: string;
    children?: ModuleMenuItem[];
}

export interface ModuleConfig {
    id: string;
    name: string;
    name_en: string;
    description: string;
    description_en: string;
    icon: string;
    version: string;
    isCore: boolean;  // المديولات الأساسية لا يمكن تعطيلها
    dependencies: string[];  // المديولات المطلوبة
    permissions: ModulePermission[];
    menuItems: ModuleMenuItem[];
    settings?: Record<string, unknown>;
}

// تسجيل المديولات
const moduleRegistry = new Map<string, ModuleConfig>();

export function registerModule(config: ModuleConfig) {
    moduleRegistry.set(config.id, config);
}

export function getModule(id: string): ModuleConfig | undefined {
    return moduleRegistry.get(id);
}

export function getAllModules(): ModuleConfig[] {
    return Array.from(moduleRegistry.values());
}

export function getCoreModules(): ModuleConfig[] {
    return getAllModules().filter(m => m.isCore);
}

export function getOptionalModules(): ModuleConfig[] {
    return getAllModules().filter(m => !m.isCore);
}

// التحقق من صلاحية الوصول للمديول
export function canAccessModule(moduleId: string, enabledModules: string[]): boolean {
    const module = getModule(moduleId);
    if (!module) return false;
    if (module.isCore) return true;
    return enabledModules.includes(moduleId);
}

// ============================================
// تسجيل المديولات الافتراضية
// ============================================

// 1. المديول الأساسي (Core)
registerModule({
    id: 'core',
    name: 'النظام الأساسي',
    name_en: 'Core System',
    description: 'إدارة المستخدمين والشركات والفروع',
    description_en: 'Users, companies and branches management',
    icon: 'Settings',
    version: '1.0.0',
    isCore: true,
    dependencies: [],
    permissions: [
        { key: 'users.view', name: 'عرض المستخدمين', name_en: 'View Users' },
        { key: 'users.create', name: 'إضافة مستخدم', name_en: 'Create User' },
        { key: 'users.edit', name: 'تعديل مستخدم', name_en: 'Edit User' },
        { key: 'users.delete', name: 'حذف مستخدم', name_en: 'Delete User' },
        { key: 'roles.manage', name: 'إدارة الأدوار', name_en: 'Manage Roles' },
        { key: 'companies.view', name: 'عرض الشركات', name_en: 'View Companies' },
        { key: 'companies.manage', name: 'إدارة الشركات', name_en: 'Manage Companies' },
        { key: 'branches.view', name: 'عرض الفروع', name_en: 'View Branches' },
        { key: 'branches.manage', name: 'إدارة الفروع', name_en: 'Manage Branches' },
        { key: 'settings.manage', name: 'إدارة الإعدادات', name_en: 'Manage Settings' },
    ],
    menuItems: [
        {
            key: 'users',
            label: 'المستخدمين',
            label_en: 'Users',
            icon: 'Users',
            href: '/users',
        },
        {
            key: 'companies',
            label: 'الشركات',
            label_en: 'Companies',
            icon: 'Building',
            href: '/companies',
        },
        {
            key: 'branches',
            label: 'الفروع',
            label_en: 'Branches',
            icon: 'GitBranch',
            href: '/branches',
        },
        {
            key: 'settings',
            label: 'الإعدادات',
            label_en: 'Settings',
            icon: 'Settings',
            href: '/settings',
        },
    ],
});

// 2. مديول المحاسبة (Accounting)
registerModule({
    id: 'accounting',
    name: 'الحسابات',
    name_en: 'Accounting',
    description: 'شجرة الحسابات وقيود اليومية والتقارير المالية',
    description_en: 'Chart of accounts, journal entries and financial reports',
    icon: 'Calculator',
    version: '1.0.0',
    isCore: true,
    dependencies: ['core'],
    permissions: [
        { key: 'accounts.view', name: 'عرض الحسابات', name_en: 'View Accounts' },
        { key: 'accounts.create', name: 'إضافة حساب', name_en: 'Create Account' },
        { key: 'accounts.edit', name: 'تعديل حساب', name_en: 'Edit Account' },
        { key: 'accounts.delete', name: 'حذف حساب', name_en: 'Delete Account' },
        { key: 'journal.view', name: 'عرض القيود', name_en: 'View Journal' },
        { key: 'journal.create', name: 'إنشاء قيد', name_en: 'Create Entry' },
        { key: 'journal.post', name: 'ترحيل القيود', name_en: 'Post Entries' },
        { key: 'vaults.view', name: 'عرض الخزن', name_en: 'View Vaults' },
        { key: 'vaults.manage', name: 'إدارة الخزن', name_en: 'Manage Vaults' },
        { key: 'banks.view', name: 'عرض البنوك', name_en: 'View Banks' },
        { key: 'banks.manage', name: 'إدارة البنوك', name_en: 'Manage Banks' },
        { key: 'reports.financial', name: 'التقارير المالية', name_en: 'Financial Reports' },
    ],
    menuItems: [
        {
            key: 'chart-of-accounts',
            label: 'شجرة الحسابات',
            label_en: 'Chart of Accounts',
            icon: 'TreeDeciduous',
            href: '/accounting/chart-of-accounts',
        },
        {
            key: 'journal-entries',
            label: 'قيود اليومية',
            label_en: 'Journal Entries',
            icon: 'FileText',
            href: '/accounting/journal-entries',
        },
        {
            key: 'vaults',
            label: 'الخزن',
            label_en: 'Vaults',
            icon: 'Vault',
            href: '/accounting/vaults',
        },
        {
            key: 'banks',
            label: 'البنوك',
            label_en: 'Banks',
            icon: 'Landmark',
            href: '/accounting/banks',
        },
        {
            key: 'cost-centers',
            label: 'مراكز التكلفة',
            label_en: 'Cost Centers',
            icon: 'Target',
            href: '/accounting/cost-centers',
        },
    ],
});

// 3. مديول المخازن (Inventory)
registerModule({
    id: 'inventory',
    name: 'المخازن',
    name_en: 'Inventory',
    description: 'إدارة المخازن والمنتجات وحركات المخزون',
    description_en: 'Warehouses, products and inventory movements',
    icon: 'Warehouse',
    version: '1.0.0',
    isCore: true,
    dependencies: ['core', 'accounting'],
    permissions: [
        { key: 'warehouses.view', name: 'عرض المخازن', name_en: 'View Warehouses' },
        { key: 'warehouses.manage', name: 'إدارة المخازن', name_en: 'Manage Warehouses' },
        { key: 'products.view', name: 'عرض المنتجات', name_en: 'View Products' },
        { key: 'products.create', name: 'إضافة منتج', name_en: 'Create Product' },
        { key: 'products.edit', name: 'تعديل منتج', name_en: 'Edit Product' },
        { key: 'products.delete', name: 'حذف منتج', name_en: 'Delete Product' },
        { key: 'transfers.view', name: 'عرض التحويلات', name_en: 'View Transfers' },
        { key: 'transfers.create', name: 'إنشاء تحويل', name_en: 'Create Transfer' },
        { key: 'adjustments.manage', name: 'تسويات المخزون', name_en: 'Stock Adjustments' },
    ],
    menuItems: [
        {
            key: 'products',
            label: 'المنتجات',
            label_en: 'Products',
            icon: 'Package',
            href: '/inventory/products',
        },
        {
            key: 'categories',
            label: 'الفئات',
            label_en: 'Categories',
            icon: 'FolderTree',
            href: '/inventory/categories',
        },
        {
            key: 'warehouses',
            label: 'المخازن',
            label_en: 'Warehouses',
            icon: 'Warehouse',
            href: '/inventory/warehouses',
        },
        {
            key: 'transfers',
            label: 'تحويلات المخزون',
            label_en: 'Stock Transfers',
            icon: 'ArrowLeftRight',
            href: '/inventory/transfers',
        },
        {
            key: 'units',
            label: 'وحدات القياس',
            label_en: 'Units',
            icon: 'Ruler',
            href: '/inventory/units',
        },
    ],
});

// 4. مديول جهات الاتصال (Contacts)
registerModule({
    id: 'contacts',
    name: 'جهات الاتصال',
    name_en: 'Contacts',
    description: 'إدارة العملاء والموردين',
    description_en: 'Customers and suppliers management',
    icon: 'Users',
    version: '1.0.0',
    isCore: true,
    dependencies: ['core', 'accounting'],
    permissions: [
        { key: 'customers.view', name: 'عرض العملاء', name_en: 'View Customers' },
        { key: 'customers.create', name: 'إضافة عميل', name_en: 'Create Customer' },
        { key: 'customers.edit', name: 'تعديل عميل', name_en: 'Edit Customer' },
        { key: 'customers.delete', name: 'حذف عميل', name_en: 'Delete Customer' },
        { key: 'suppliers.view', name: 'عرض الموردين', name_en: 'View Suppliers' },
        { key: 'suppliers.create', name: 'إضافة مورد', name_en: 'Create Supplier' },
        { key: 'suppliers.edit', name: 'تعديل مورد', name_en: 'Edit Supplier' },
        { key: 'suppliers.delete', name: 'حذف مورد', name_en: 'Delete Supplier' },
    ],
    menuItems: [
        {
            key: 'customers',
            label: 'العملاء',
            label_en: 'Customers',
            icon: 'UserCheck',
            href: '/contacts/customers',
        },
        {
            key: 'suppliers',
            label: 'الموردين',
            label_en: 'Suppliers',
            icon: 'Truck',
            href: '/contacts/suppliers',
        },
    ],
});

// 5. مديول الفواتير (Invoices)
registerModule({
    id: 'invoices',
    name: 'الفواتير',
    name_en: 'Invoices',
    description: 'فواتير المبيعات والمشتريات والمرتجعات',
    description_en: 'Sales, purchases and returns invoices',
    icon: 'Receipt',
    version: '1.0.0',
    isCore: true,
    dependencies: ['core', 'accounting', 'inventory', 'contacts'],
    permissions: [
        { key: 'sales.view', name: 'عرض المبيعات', name_en: 'View Sales' },
        { key: 'sales.create', name: 'إنشاء فاتورة بيع', name_en: 'Create Sale' },
        { key: 'sales.edit', name: 'تعديل فاتورة بيع', name_en: 'Edit Sale' },
        { key: 'sales.delete', name: 'حذف فاتورة بيع', name_en: 'Delete Sale' },
        { key: 'purchases.view', name: 'عرض المشتريات', name_en: 'View Purchases' },
        { key: 'purchases.create', name: 'إنشاء فاتورة شراء', name_en: 'Create Purchase' },
        { key: 'purchases.edit', name: 'تعديل فاتورة شراء', name_en: 'Edit Purchase' },
        { key: 'purchases.delete', name: 'حذف فاتورة شراء', name_en: 'Delete Purchase' },
        { key: 'returns.manage', name: 'إدارة المرتجعات', name_en: 'Manage Returns' },
    ],
    menuItems: [
        {
            key: 'sales',
            label: 'فواتير المبيعات',
            label_en: 'Sales Invoices',
            icon: 'TrendingUp',
            href: '/invoices/sales',
        },
        {
            key: 'purchases',
            label: 'فواتير المشتريات',
            label_en: 'Purchase Invoices',
            icon: 'TrendingDown',
            href: '/invoices/purchases',
        },
        {
            key: 'sales-returns',
            label: 'مرتجعات المبيعات',
            label_en: 'Sales Returns',
            icon: 'RotateCcw',
            href: '/invoices/sales-returns',
        },
        {
            key: 'purchase-returns',
            label: 'مرتجعات المشتريات',
            label_en: 'Purchase Returns',
            icon: 'RotateCw',
            href: '/invoices/purchase-returns',
        },
    ],
});

// 6. مديول المدفوعات (Payments)
registerModule({
    id: 'payments',
    name: 'المدفوعات',
    name_en: 'Payments',
    description: 'سندات القبض والصرف',
    description_en: 'Receipts and payments vouchers',
    icon: 'CreditCard',
    version: '1.0.0',
    isCore: true,
    dependencies: ['core', 'accounting', 'contacts'],
    permissions: [
        { key: 'receipts.view', name: 'عرض سندات القبض', name_en: 'View Receipts' },
        { key: 'receipts.create', name: 'إنشاء سند قبض', name_en: 'Create Receipt' },
        { key: 'payments.view', name: 'عرض سندات الصرف', name_en: 'View Payments' },
        { key: 'payments.create', name: 'إنشاء سند صرف', name_en: 'Create Payment' },
    ],
    menuItems: [
        {
            key: 'receipts',
            label: 'سندات القبض',
            label_en: 'Receipts',
            icon: 'ArrowDownCircle',
            href: '/payments/receipts',
        },
        {
            key: 'payments',
            label: 'سندات الصرف',
            label_en: 'Payments',
            icon: 'ArrowUpCircle',
            href: '/payments/payments',
        },
    ],
});

// 7. مديول Shopify (اختياري)
registerModule({
    id: 'shopify',
    name: 'شوبيفاي',
    name_en: 'Shopify',
    description: 'التكامل مع متاجر شوبيفاي',
    description_en: 'Shopify store integration',
    icon: 'ShoppingBag',
    version: '1.0.0',
    isCore: false,
    dependencies: ['core', 'inventory', 'contacts', 'invoices'],
    permissions: [
        { key: 'shopify.connect', name: 'ربط المتجر', name_en: 'Connect Store' },
        { key: 'shopify.sync_products', name: 'مزامنة المنتجات', name_en: 'Sync Products' },
        { key: 'shopify.sync_customers', name: 'مزامنة العملاء', name_en: 'Sync Customers' },
        { key: 'shopify.sync_orders', name: 'مزامنة الطلبات', name_en: 'Sync Orders' },
        { key: 'shopify.settings', name: 'إعدادات شوبيفاي', name_en: 'Shopify Settings' },
    ],
    menuItems: [
        {
            key: 'shopify-dashboard',
            label: 'لوحة التحكم',
            label_en: 'Dashboard',
            icon: 'LayoutDashboard',
            href: '/shopify',
        },
        {
            key: 'shopify-products',
            label: 'المنتجات',
            label_en: 'Products',
            icon: 'Package',
            href: '/shopify/products',
        },
        {
            key: 'shopify-orders',
            label: 'الطلبات',
            label_en: 'Orders',
            icon: 'ShoppingCart',
            href: '/shopify/orders',
        },
        {
            key: 'shopify-settings',
            label: 'الإعدادات',
            label_en: 'Settings',
            icon: 'Settings',
            href: '/shopify/settings',
        },
    ],
});

// 8. مديول شركات الشحن (اختياري)
registerModule({
    id: 'shipping',
    name: 'شركات الشحن',
    name_en: 'Shipping',
    description: 'إدارة شركات الشحن والتحصيل',
    description_en: 'Shipping companies and COD management',
    icon: 'Truck',
    version: '1.0.0',
    isCore: false,
    dependencies: ['core', 'accounting', 'invoices'],
    permissions: [
        { key: 'shipping_companies.view', name: 'عرض شركات الشحن', name_en: 'View Shipping Companies' },
        { key: 'shipping_companies.manage', name: 'إدارة شركات الشحن', name_en: 'Manage Shipping Companies' },
        { key: 'shipments.view', name: 'عرض الشحنات', name_en: 'View Shipments' },
        { key: 'shipments.create', name: 'إنشاء شحنة', name_en: 'Create Shipment' },
        { key: 'shipments.update', name: 'تحديث الشحنات', name_en: 'Update Shipments' },
        { key: 'collections.view', name: 'عرض التحصيلات', name_en: 'View Collections' },
        { key: 'collections.create', name: 'تسجيل تحصيل', name_en: 'Create Collection' },
        { key: 'returns.view', name: 'عرض المرتجعات', name_en: 'View Returns' },
        { key: 'returns.manage', name: 'إدارة المرتجعات', name_en: 'Manage Returns' },
    ],
    menuItems: [
        {
            key: 'shipping-companies',
            label: 'شركات الشحن',
            label_en: 'Shipping Companies',
            icon: 'Building2',
            href: '/shipping/companies',
        },
        {
            key: 'shipments',
            label: 'الشحنات',
            label_en: 'Shipments',
            icon: 'Package',
            href: '/shipping/shipments',
        },
        {
            key: 'collections',
            label: 'التحصيلات',
            label_en: 'Collections',
            icon: 'Banknote',
            href: '/shipping/collections',
        },
        {
            key: 'returns-inventory',
            label: 'مخزون المرتجعات',
            label_en: 'Returns Inventory',
            icon: 'PackageX',
            href: '/shipping/returns',
        },
    ],
});

// 9. مديول التقارير
registerModule({
    id: 'reports',
    name: 'التقارير',
    name_en: 'Reports',
    description: 'التقارير المالية والتحليلات',
    description_en: 'Financial reports and analytics',
    icon: 'BarChart3',
    version: '1.0.0',
    isCore: true,
    dependencies: ['core', 'accounting'],
    permissions: [
        { key: 'reports.trial_balance', name: 'ميزان المراجعة', name_en: 'Trial Balance' },
        { key: 'reports.income_statement', name: 'قائمة الدخل', name_en: 'Income Statement' },
        { key: 'reports.balance_sheet', name: 'الميزانية العمومية', name_en: 'Balance Sheet' },
        { key: 'reports.inventory', name: 'تقارير المخزون', name_en: 'Inventory Reports' },
        { key: 'reports.sales', name: 'تقارير المبيعات', name_en: 'Sales Reports' },
        { key: 'reports.purchases', name: 'تقارير المشتريات', name_en: 'Purchase Reports' },
    ],
    menuItems: [
        {
            key: 'trial-balance',
            label: 'ميزان المراجعة',
            label_en: 'Trial Balance',
            icon: 'Scale',
            href: '/reports/trial-balance',
        },
        {
            key: 'income-statement',
            label: 'قائمة الدخل',
            label_en: 'Income Statement',
            icon: 'TrendingUp',
            href: '/reports/income-statement',
        },
        {
            key: 'balance-sheet',
            label: 'الميزانية العمومية',
            label_en: 'Balance Sheet',
            icon: 'PieChart',
            href: '/reports/balance-sheet',
        },
        {
            key: 'inventory-reports',
            label: 'تقارير المخزون',
            label_en: 'Inventory Reports',
            icon: 'ClipboardList',
            href: '/reports/inventory',
        },
    ],
});

export { moduleRegistry };
