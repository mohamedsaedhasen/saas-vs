-- =============================================
-- نظام ERP SaaS - البيانات الأولية
-- وحدات القياس، خطط الاشتراك، إلخ
-- =============================================

-- =============================================
-- 1. الوحدات (Modules)
-- =============================================
INSERT INTO modules (code, name, name_ar, icon, route, sort_order) VALUES
('dashboard', 'Dashboard', 'لوحة التحكم', 'LayoutDashboard', '/dashboard', 1),
('sales', 'Sales', 'المبيعات', 'ShoppingCart', '/dashboard/sales', 2),
('purchases', 'Purchases', 'المشتريات', 'Package', '/dashboard/purchases', 3),
('inventory', 'Inventory', 'المخزون', 'Warehouse', '/dashboard/inventory', 4),
('accounting', 'Accounting', 'المحاسبة', 'Calculator', '/dashboard/accounting', 5),
('expenses', 'Expenses', 'المصروفات', 'Receipt', '/dashboard/expenses', 6),
('customers', 'Customers', 'العملاء', 'Users', '/dashboard/customers', 7),
('suppliers', 'Suppliers', 'الموردين', 'Truck', '/dashboard/suppliers', 8),
('reports', 'Reports', 'التقارير', 'BarChart3', '/dashboard/reports', 9),
('settings', 'Settings', 'الإعدادات', 'Settings', '/dashboard/settings', 10)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 2. خطط الاشتراك
-- =============================================
INSERT INTO subscription_plans (code, name, name_ar, price_monthly, price_yearly, max_users, max_branches, max_invoices_monthly, max_products, max_storage_gb, features, is_active, sort_order)
VALUES
    ('free', 'Free', 'مجاني', 0, 0, 1, 1, 50, 50, 0.5, 
     '["basic_invoicing", "basic_reports"]'::jsonb, true, 1),
    ('starter', 'Starter', 'مبتدئ', 99, 990, 3, 1, 200, 500, 2, 
     '["basic_invoicing", "basic_reports", "inventory", "customers"]'::jsonb, true, 2),
    ('professional', 'Professional', 'احترافي', 299, 2990, 10, 3, 1000, 5000, 10, 
     '["full_invoicing", "advanced_reports", "inventory", "multi_warehouse", "accounting"]'::jsonb, true, 3),
    ('enterprise', 'Enterprise', 'مؤسسات', 599, 5990, 50, 10, -1, -1, 50, 
     '["full_invoicing", "advanced_reports", "inventory", "multi_warehouse", "accounting", "api_access", "custom_fields", "priority_support"]'::jsonb, true, 4)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 3. إنشاء مستخدم Super Admin
-- =============================================
INSERT INTO app_users (id, email, password_hash, name, name_en, is_super_admin, status)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@system.local',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4Bk.S7Uxl.mNVH66', -- password: admin123
    'مدير النظام',
    'System Admin',
    true,
    'active'
) ON CONFLICT (email) DO NOTHING;

-- ✅ تم إنشاء البيانات الأولية
