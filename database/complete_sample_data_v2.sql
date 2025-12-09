-- =========================================================
-- نظام ERP SaaS - البيانات الأولية والتجريبية
-- الإصدار: 2.0
-- شغّل هذا الملف بعد complete_rls_policies_v2.sql
-- =========================================================

-- =========================================================
-- الجزء 1: الوحدات والصلاحيات (عامة للنظام)
-- =========================================================

INSERT INTO modules (code, name, name_ar, icon, route, sort_order) VALUES
    ('dashboard', 'Dashboard', 'لوحة التحكم', 'LayoutDashboard', '/dashboard', 1),
    ('sales', 'Sales', 'المبيعات', 'ShoppingCart', '/dashboard/sales', 2),
    ('purchases', 'Purchases', 'المشتريات', 'Package', '/dashboard/purchases', 3),
    ('inventory', 'Inventory', 'المخزون', 'Warehouse', '/dashboard/inventory', 4),
    ('products', 'Products', 'المنتجات', 'Box', '/dashboard/products', 5),
    ('customers', 'Customers', 'العملاء', 'Users', '/dashboard/customers', 6),
    ('suppliers', 'Suppliers', 'الموردين', 'Truck', '/dashboard/suppliers', 7),
    ('accounting', 'Accounting', 'المحاسبة', 'Calculator', '/dashboard/accounting', 8),
    ('shipping', 'Shipping', 'الشحن', 'Package', '/dashboard/shipping', 9),
    ('reports', 'Reports', 'التقارير', 'BarChart', '/dashboard/reports', 10),
    ('settings', 'Settings', 'الإعدادات', 'Settings', '/dashboard/settings', 11),
    ('users', 'Users', 'المستخدمين', 'UserCog', '/dashboard/settings/users', 12),
    ('roles', 'Roles', 'الأدوار', 'Shield', '/dashboard/settings/roles', 13),
    ('branches', 'Branches', 'الفروع', 'Building', '/dashboard/settings/branches', 14)
ON CONFLICT (code) DO NOTHING;

-- الصلاحيات لكل وحدة
INSERT INTO permissions (module_id, code, action, name, name_ar)
SELECT m.id, m.code || '_' || a.action, a.action, a.name, a.name_ar
FROM modules m
CROSS JOIN (
    VALUES 
        ('read', 'Read', 'عرض'),
        ('write', 'Write', 'إضافة/تعديل'),
        ('delete', 'Delete', 'حذف'),
        ('export', 'Export', 'تصدير'),
        ('import', 'Import', 'استيراد'),
        ('approve', 'Approve', 'اعتماد')
) AS a(action, name, name_ar)
ON CONFLICT (module_id, action) DO NOTHING;

-- =========================================================
-- الجزء 2: بيانات الشركة التجريبية
-- =========================================================

-- الشركة الرئيسية (UUID صالح: أرقام 0-9 وحروف a-f فقط)
INSERT INTO companies (id, code, slug, name, name_ar, email, phone, city, country, currency, is_active)
VALUES 
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'DEMO-001', 'demo-company', 'Demo Company', 'الشركة التجريبية', 'info@demo.com', '01000000000', 'القاهرة', 'مصر', 'EGP', true)
ON CONFLICT (id) DO NOTHING;

-- الفروع
INSERT INTO branches (id, company_id, code, name, name_ar, city, is_headquarters, is_active)
VALUES 
    ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'HQ', 'Headquarters', 'المقر الرئيسي', 'القاهرة', true, true),
    ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'BR-02', 'Branch Cairo', 'فرع القاهرة', 'القاهرة', false, true)
ON CONFLICT (id) DO NOTHING;

-- الأدوار (استخدام أحرف صالحة فقط: 0-9, a-f)
INSERT INTO roles (id, company_id, code, name, name_ar, is_system, is_super_admin)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'SUPER_ADMIN', 'Super Admin', 'مدير النظام', true, true),
    ('22222222-2222-2222-2222-222222222222', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'SALES', 'Sales Manager', 'مدير المبيعات', false, false),
    ('33333333-3333-3333-3333-333333333333', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ACCOUNTANT', 'Accountant', 'محاسب', false, false)
ON CONFLICT (id) DO NOTHING;

-- المستخدم الرئيسي (كلمة السر: demo123)
INSERT INTO app_users (id, email, password_hash, name, name_ar, phone, status, is_active)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@demo.com', '$2a$10$demo123hashedpasswordexample', 'Admin User', 'المدير', '01111111111', 'active', true)
ON CONFLICT (id) DO NOTHING;

-- ربط المستخدم بالشركة
INSERT INTO app_user_companies (user_id, company_id, role_id, is_owner, is_primary, status)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '11111111-1111-1111-1111-111111111111', true, true, 'active')
ON CONFLICT (user_id, company_id) DO NOTHING;

-- صلاحيات الفروع للمستخدم
INSERT INTO user_branch_access (user_id, company_id, branch_id, can_view, can_edit, can_delete, is_default)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', true, true, true, true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', true, true, true, false)
ON CONFLICT (user_id, branch_id) DO NOTHING;

-- =========================================================
-- الجزء 3: المخازن والخزائن
-- =========================================================

INSERT INTO warehouses (id, company_id, branch_id, code, name, name_ar, is_default, is_active)
VALUES 
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'WH-01', 'Main Warehouse', 'المخزن الرئيسي', true, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO vaults (id, company_id, branch_id, code, name, name_ar, vault_type, balance, is_default)
VALUES 
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'CASH-01', 'Main Cash', 'الخزينة الرئيسية', 'cash', 0, true)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- الجزء 4: العملاء
-- =========================================================

INSERT INTO customers (id, company_id, code, name, name_ar, phone, email, city, is_active)
VALUES 
    ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'CUST-001', 'Mohamed Ahmed', 'محمد أحمد', '01011111111', 'mohamed@email.com', 'القاهرة', true),
    ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'CUST-002', 'Sara Ali', 'سارة علي', '01022222222', 'sara@email.com', 'الإسكندرية', true),
    ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'CUST-003', 'Ahmed Hassan', 'أحمد حسن', '01033333333', 'ahmed@email.com', 'الجيزة', true),
    ('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'CUST-004', 'Fatma Mahmoud', 'فاطمة محمود', '01044444444', 'fatma@email.com', 'القاهرة', true)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- الجزء 5: الموردين
-- =========================================================

INSERT INTO suppliers (id, company_id, code, name, name_ar, phone, email, city, is_active)
VALUES 
    ('55555555-5555-5555-5555-555555555555', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'SUP-001', 'Tech Supplies Co', 'شركة التقنية للتوريدات', '01055555555', 'info@techsupplies.com', 'القاهرة', true),
    ('66666666-6666-6666-6666-666666666666', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'SUP-002', 'Fashion World', 'عالم الموضة', '01066666666', 'fashion@world.com', 'الإسكندرية', true)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- الجزء 6: فئات ومنتجات
-- =========================================================

INSERT INTO product_categories (id, company_id, code, name, name_ar)
VALUES 
    ('ca11ca11-ca11-ca11-ca11-ca11ca11ca11', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ELEC', 'Electronics', 'إلكترونيات'),
    ('ca22ca22-ca22-ca22-ca22-ca22ca22ca22', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'CLTH', 'Clothing', 'ملابس'),
    ('ca33ca33-ca33-ca33-ca33-ca33ca33ca33', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ACCS', 'Accessories', 'إكسسوارات')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, company_id, category_id, sku, barcode, name, name_ar, selling_price, cost_price, is_active)
VALUES 
    ('00110011-0011-0011-0011-001100110011', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ca22ca22-ca22-ca22-ca22-ca22ca22ca22', 'TSH-001', '6281000001001', 'T-Shirt Cotton', 'تيشيرت قطن', 150, 80, true),
    ('00220022-0022-0022-0022-002200220022', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ca22ca22-ca22-ca22-ca22-ca22ca22ca22', 'JNS-001', '6281000001002', 'Jeans Classic', 'جينز كلاسيك', 350, 200, true),
    ('00330033-0033-0033-0033-003300330033', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ca33ca33-ca33-ca33-ca33-ca33ca33ca33', 'CAP-001', '6281000001003', 'Baseball Cap', 'قبعة بيسبول', 75, 35, true),
    ('00440044-0044-0044-0044-004400440044', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ca11ca11-ca11-ca11-ca11-ca11ca11ca11', 'CBL-001', '6281000001004', 'USB Cable', 'كابل USB', 50, 20, true),
    ('00550055-0055-0055-0055-005500550055', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ca11ca11-ca11-ca11-ca11-ca11ca11ca11', 'CAS-001', '6281000001005', 'Phone Case', 'جراب موبايل', 100, 45, true)
ON CONFLICT (id) DO NOTHING;

-- مخزون المنتجات
INSERT INTO product_inventory (company_id, product_id, warehouse_id, quantity, avg_cost)
VALUES 
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '00110011-0011-0011-0011-001100110011', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 100, 80),
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '00220022-0022-0022-0022-002200220022', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 50, 200),
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '00330033-0033-0033-0033-003300330033', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 200, 35),
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '00440044-0044-0044-0044-004400440044', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 500, 20),
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '00550055-0055-0055-0055-005500550055', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 150, 45)
ON CONFLICT (product_id, warehouse_id) DO NOTHING;

-- =========================================================
-- الجزء 7: تسلسلات الأرقام
-- =========================================================

INSERT INTO number_sequences (company_id, document_type, prefix, next_number, padding)
VALUES 
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'sales_invoice', 'INV-', 1, 5),
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'purchase_invoice', 'PUR-', 1, 5),
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'receipt', 'REC-', 1, 5),
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'payment', 'PAY-', 1, 5),
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'shipment', 'SHP-', 1, 5)
ON CONFLICT (company_id, branch_id, document_type) DO NOTHING;

-- =========================================================
-- رسالة النجاح
-- =========================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ تم إعداد البيانات بنجاح!';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 بيانات تسجيل الدخول:';
    RAISE NOTICE '   البريد: admin@demo.com';
    RAISE NOTICE '   كلمة المرور: demo123';
    RAISE NOTICE '';
    RAISE NOTICE '📊 البيانات المُنشأة:';
    RAISE NOTICE '   - شركة واحدة مع فرعين';
    RAISE NOTICE '   - 4 عملاء';
    RAISE NOTICE '   - 2 موردين';
    RAISE NOTICE '   - 5 منتجات مع مخزون';
    RAISE NOTICE '   - مخزن وخزينة';
    RAISE NOTICE '';
END $$;
