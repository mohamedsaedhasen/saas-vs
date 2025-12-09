-- =============================================
-- بيانات تجريبية لنظام ERP SaaS V2
-- =============================================

-- =============================================
-- 1. إنشاء شركة تجريبية
-- =============================================
INSERT INTO companies (id, code, name, name_ar, email, phone, currency, is_active)
VALUES (
    'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
    'DEMO',
    'Demo Company',
    'شركة تجريبية',
    'demo@company.com',
    '+20 123 456 7890',
    'EGP',
    true
);

-- =============================================
-- 2. إنشاء الفرع الرئيسي
-- =============================================
INSERT INTO branches (id, company_id, code, name, name_ar, is_headquarters, is_active)
VALUES (
    'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1',
    'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
    'HQ',
    'Headquarters',
    'الفرع الرئيسي',
    true,
    true
);

-- فرع إضافي
INSERT INTO branches (id, company_id, code, name, name_ar, is_headquarters, is_active)
VALUES (
    'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
    'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
    'ALEX',
    'Alexandria Branch',
    'فرع الإسكندرية',
    false,
    true
);

-- =============================================
-- 3. إنشاء الأدوار
-- =============================================
INSERT INTO roles (id, company_id, code, name, name_ar, is_system, is_super_admin)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'admin', 'Administrator', 'مدير النظام', true, true),
    ('22222222-2222-2222-2222-222222222222', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'accountant', 'Accountant', 'محاسب', true, false),
    ('33333333-3333-3333-3333-333333333333', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'sales', 'Sales', 'مبيعات', true, false),
    ('44444444-4444-4444-4444-444444444444', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'viewer', 'Viewer', 'مشاهد', true, false);

-- =============================================
-- 4. إنشاء مستخدم تجريبي
-- كلمة المرور: demo123
-- =============================================
INSERT INTO app_users (id, email, password_hash, name, name_ar, phone, status)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'admin@demo.com',
    'demo123',
    'Admin User',
    'المستخدم المدير',
    '+20 100 000 0001',
    'active'
);

-- مستخدم إضافي
INSERT INTO app_users (id, email, password_hash, name, name_ar, phone, status)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'sales@demo.com',
    'demo123',
    'Sales User',
    'مستخدم المبيعات',
    '+20 100 000 0002',
    'active'
);

-- =============================================
-- 5. ربط المستخدمين بالشركة
-- =============================================
INSERT INTO app_user_companies (user_id, company_id, role_id, is_owner, is_primary)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '11111111-1111-1111-1111-111111111111', true, true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '33333333-3333-3333-3333-333333333333', false, true);

-- =============================================
-- 6. صلاحيات الفروع للمستخدمين
-- =============================================
INSERT INTO user_branch_access (user_id, company_id, branch_id, can_view, can_edit, can_delete, is_default)
VALUES 
    -- Admin له صلاحية على كل الفروع
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', true, true, true, true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', true, true, true, false),
    -- Sales له صلاحية على الفرع الرئيسي فقط
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', true, true, false, true);

-- =============================================
-- 7. منح صلاحيات للأدوار
-- =============================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM permissions; -- Admin له كل الصلاحيات

-- صلاحيات المحاسب
INSERT INTO role_permissions (role_id, permission_id)
SELECT '22222222-2222-2222-2222-222222222222', p.id 
FROM permissions p
JOIN modules m ON m.id = p.module_id
WHERE m.code IN ('dashboard', 'accounting', 'customers', 'suppliers', 'reports')
AND p.action IN ('read', 'write');

-- صلاحيات المبيعات
INSERT INTO role_permissions (role_id, permission_id)
SELECT '33333333-3333-3333-3333-333333333333', p.id 
FROM permissions p
JOIN modules m ON m.id = p.module_id
WHERE m.code IN ('dashboard', 'sales', 'customers', 'products', 'inventory', 'shipping')
AND p.action IN ('read', 'write');

-- صلاحيات المشاهد
INSERT INTO role_permissions (role_id, permission_id)
SELECT '44444444-4444-4444-4444-444444444444', p.id 
FROM permissions p
WHERE p.action = 'read';

-- =============================================
-- 8. وحدات القياس
-- =============================================
INSERT INTO units_of_measure (company_id, code, name, name_ar, is_base_unit)
VALUES 
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'pcs', 'Piece', 'قطعة', true),
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'kg', 'Kilogram', 'كيلوجرام', true),
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'box', 'Box', 'صندوق', true),
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ltr', 'Liter', 'لتر', true);

-- =============================================
-- 9. المخازن
-- =============================================
INSERT INTO warehouses (id, company_id, branch_id, code, name, name_ar, is_default)
VALUES 
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'WH-01', 'Main Warehouse', 'المخزن الرئيسي', true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'WH-02', 'Alexandria Warehouse', 'مخزن الإسكندرية', false);

-- =============================================
-- 10. الخزائن
-- =============================================
INSERT INTO vaults (id, company_id, branch_id, code, name, name_ar, vault_type, balance, is_default)
VALUES 
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'CASH-01', 'Main Cash', 'الخزينة الرئيسية', 'cash', 10000, true),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'BANK-01', 'Bank Account', 'الحساب البنكي', 'bank', 50000, false);

-- =============================================
-- 11. فئات المنتجات
-- =============================================
INSERT INTO product_categories (id, company_id, code, name, name_ar)
VALUES 
    ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'ELEC', 'Electronics', 'إلكترونيات'),
    ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'FOOD', 'Food', 'أغذية'),
    ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'CLTH', 'Clothing', 'ملابس');

-- =============================================
-- 12. تسلسلات الأرقام
-- =============================================
INSERT INTO number_sequences (company_id, document_type, prefix, next_number, padding)
VALUES 
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'sales_invoice', 'INV-', 1, 5),
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'purchase_invoice', 'PUR-', 1, 5),
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'receipt', 'REC-', 1, 5),
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'payment', 'PAY-', 1, 5),
    ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'shipment', 'SHP-', 1, 5);

-- =============================================
-- 13. العملاء
-- =============================================
INSERT INTO customers (id, company_id, code, name, name_ar, phone, email, city, is_active)
VALUES 
    ('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'CUST-001', 'Al-Noor Trading', 'شركة النور للتجارة', '01012345678', 'info@noor.com', 'القاهرة', true),
    ('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'CUST-002', 'Al-Amal Foundation', 'مؤسسة الأمل', '01123456789', 'contact@alamal.com', 'الإسكندرية', true),
    ('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'CUST-003', 'Gulf Commerce', 'تجارة الخليج', '01234567890', 'sales@gulf.com', 'الجيزة', true),
    ('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'CUST-004', 'Ahmed Mohamed', 'أحمد محمد', '01098765432', 'ahmed@email.com', 'المنصورة', true);

-- =============================================
-- 14. الموردين
-- =============================================
INSERT INTO suppliers (id, company_id, code, name, name_ar, phone, email, city, is_active)
VALUES 
    ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'SUP-001', 'Egyptian Textiles', 'النسيج المصري', '02234567890', 'supply@textiles.com', 'المحلة', true),
    ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'SUP-002', 'Tech Import', 'استيراد التقنية', '02345678901', 'info@techimport.com', 'القاهرة', true);

-- =============================================
-- 15. المنتجات
-- =============================================
INSERT INTO products (id, company_id, category_id, sku, barcode, name, name_ar, selling_price, cost_price, is_active)
VALUES 
    ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'TSH-001', '6281000001001', 'Cotton T-Shirt White', 'تيشيرت قطن أبيض', 150, 80, true),
    ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'JNS-002', '6281000001002', 'Blue Jeans', 'بنطلون جينز أزرق', 450, 250, true),
    ('f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'CAP-003', '6281000001003', 'Sports Cap Black', 'قبعة رياضية سوداء', 80, 40, true),
    ('f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'PHN-004', '6281000001004', 'Smartphone Case', 'جراب هاتف ذكي', 120, 60, true),
    ('f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f5', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'CBL-005', '6281000001005', 'USB Cable', 'كابل USB', 50, 25, true);

-- =============================================
-- 16. مخزون المنتجات
-- =============================================
INSERT INTO product_inventory (product_id, warehouse_id, quantity, available_quantity)
VALUES 
    ('f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 100, 100),
    ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 50, 50),
    ('f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 200, 200),
    ('f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 150, 150),
    ('f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f5', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 300, 300);

-- =============================================
-- تأكيد
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '✅ تم إنشاء البيانات التجريبية بنجاح!';
    RAISE NOTICE '';
    RAISE NOTICE '📧 بيانات تسجيل الدخول:';
    RAISE NOTICE '   البريد: admin@demo.com';
    RAISE NOTICE '   كلمة المرور: demo123';
    RAISE NOTICE '';
    RAISE NOTICE '🏢 الشركة: شركة تجريبية';
    RAISE NOTICE '🏪 الفروع: الفرع الرئيسي، فرع الإسكندرية';
END $$;
