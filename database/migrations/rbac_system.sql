-- =============================================
-- نظام الأدوار والصلاحيات (RBAC)
-- =============================================

-- جدول الأدوار
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- أدوار النظام لا يمكن حذفها
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(company_id, name)
);

-- جدول الوحدات (Modules)
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    icon VARCHAR(50),
    route VARCHAR(100),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- جدول الصلاحيات
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- read, write, delete, export, import
    description TEXT,
    
    UNIQUE(module_id, action)
);

-- ربط الأدوار بالصلاحيات
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(role_id, permission_id)
);

-- تحديث جدول المستخدمين لإضافة الدور
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);

-- جدول دعوات المستخدمين
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    invited_by UUID REFERENCES app_users(id),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, expired, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول سجل الأنشطة (Activity Logs)
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    user_name VARCHAR(255), -- حفظ الاسم حتى لو حُذف المستخدم
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- create, update, delete, login, logout, view
    module VARCHAR(100), -- sales, purchases, inventory, etc.
    resource_type VARCHAR(100), -- invoice, product, customer, etc.
    resource_id UUID,
    resource_name VARCHAR(255),
    details JSONB, -- تفاصيل إضافية
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهرسة لسجل الأنشطة
CREATE INDEX IF NOT EXISTS idx_activity_logs_company ON user_activity_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON user_activity_logs(action);

-- =============================================
-- إدخال الوحدات الافتراضية
-- =============================================

INSERT INTO modules (code, name, name_ar, icon, route, sort_order) VALUES
('dashboard', 'Dashboard', 'لوحة التحكم', 'LayoutDashboard', '/dashboard', 1),
('sales', 'Sales', 'المبيعات', 'ShoppingCart', '/dashboard/sales', 2),
('purchases', 'Purchases', 'المشتريات', 'Package', '/dashboard/purchases', 3),
('inventory', 'Inventory', 'المخزون', 'Warehouse', '/dashboard/inventory', 4),
('products', 'Products', 'المنتجات', 'Box', '/dashboard/products', 5),
('customers', 'Customers', 'العملاء', 'Users', '/dashboard/customers', 6),
('suppliers', 'Suppliers', 'الموردين', 'Truck', '/dashboard/suppliers', 7),
('accounting', 'Accounting', 'المحاسبة', 'Calculator', '/dashboard/accounting', 8),
('shipping', 'Shipping', 'الشحن', 'Ship', '/dashboard/shipping', 9),
('reports', 'Reports', 'التقارير', 'BarChart', '/dashboard/reports', 10),
('settings', 'Settings', 'الإعدادات', 'Settings', '/dashboard/settings', 11),
('users', 'Users', 'المستخدمين', 'UserCog', '/dashboard/settings/users', 12)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- إدخال الصلاحيات الافتراضية
-- =============================================

INSERT INTO permissions (module_id, action, description)
SELECT m.id, a.action, a.description
FROM modules m
CROSS JOIN (VALUES 
    ('read', 'عرض'),
    ('write', 'إضافة وتعديل'),
    ('delete', 'حذف'),
    ('export', 'تصدير'),
    ('import', 'استيراد')
) AS a(action, description)
ON CONFLICT (module_id, action) DO NOTHING;

-- =============================================
-- إدخال الأدوار الافتراضية (للشركات الموجودة)
-- =============================================

-- مدير النظام
INSERT INTO roles (company_id, name, name_ar, description, is_system)
SELECT c.id, 'admin', 'مدير النظام', 'صلاحيات كاملة على النظام', true
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM roles r WHERE r.company_id = c.id AND r.name = 'admin'
);

-- محاسب
INSERT INTO roles (company_id, name, name_ar, description, is_system)
SELECT c.id, 'accountant', 'محاسب', 'صلاحيات المحاسبة والتقارير', true
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM roles r WHERE r.company_id = c.id AND r.name = 'accountant'
);

-- مندوب مبيعات
INSERT INTO roles (company_id, name, name_ar, description, is_system)
SELECT c.id, 'sales', 'مندوب مبيعات', 'صلاحيات المبيعات والعملاء', true
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM roles r WHERE r.company_id = c.id AND r.name = 'sales'
);

-- أمين مخزن
INSERT INTO roles (company_id, name, name_ar, description, is_system)
SELECT c.id, 'inventory', 'أمين مخزن', 'صلاحيات المخزون والمنتجات', true
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM roles r WHERE r.company_id = c.id AND r.name = 'inventory'
);

-- مشاهد
INSERT INTO roles (company_id, name, name_ar, description, is_system)
SELECT c.id, 'viewer', 'مشاهد', 'صلاحيات القراءة فقط', true
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM roles r WHERE r.company_id = c.id AND r.name = 'viewer'
);

-- =============================================
-- تعيين صلاحيات الأدوار الافتراضية
-- =============================================

-- مدير النظام: كل الصلاحيات
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- محاسب: المحاسبة + التقارير + القراءة
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON true
JOIN modules m ON p.module_id = m.id
WHERE r.name = 'accountant' AND (
    m.code IN ('dashboard', 'accounting', 'reports')
    OR (m.code IN ('sales', 'purchases', 'customers', 'suppliers') AND p.action = 'read')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- مندوب مبيعات: المبيعات + العملاء
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON true
JOIN modules m ON p.module_id = m.id
WHERE r.name = 'sales' AND (
    m.code IN ('dashboard', 'sales', 'customers', 'products')
    OR (m.code = 'inventory' AND p.action = 'read')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- أمين مخزن: المخزون + المنتجات
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON true
JOIN modules m ON p.module_id = m.id
WHERE r.name = 'inventory' AND (
    m.code IN ('dashboard', 'inventory', 'products')
    OR (m.code = 'purchases' AND p.action = 'read')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- مشاهد: قراءة فقط
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.action = 'read'
JOIN modules m ON p.module_id = m.id
WHERE r.name = 'viewer'
ON CONFLICT (role_id, permission_id) DO NOTHING;
