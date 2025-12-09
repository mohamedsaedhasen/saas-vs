-- =============================================
-- بيانات اختبار عزل المستأجرين (Multi-Tenancy Test Data)
-- =============================================
-- الهدف: التأكد من عدم تداخل بيانات الشركات
-- =============================================

-- =============================================
-- شركة أخرى للاختبار
-- =============================================
INSERT INTO companies (id, code, name, name_ar, email, phone, industry, is_active)
VALUES 
    ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'COMP-002', 'Test Company B', 'الشركة التجريبية ب', 'info@companyb.com', '01155555555', 'retail', true);

-- =============================================
-- فرع للشركة الثانية
-- =============================================
INSERT INTO branches (id, company_id, code, name, name_ar, city, is_headquarters, is_active)
VALUES 
    ('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'BR-B-01', 'Main Office B', 'المكتب الرئيسي ب', 'الجيزة', true, true);

-- =============================================
-- أدوار للشركة الثانية
-- =============================================
INSERT INTO roles (id, company_id, code, name, name_ar, is_system, is_super_admin)
VALUES 
    ('r5r5r5r5-r5r5-r5r5-r5r5-r5r5r5r5r5r5', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'ADMIN-B', 'Admin', 'مدير النظام', true, true);

-- =============================================
-- مستخدم للشركة الثانية
-- =============================================
INSERT INTO app_users (id, email, password_hash, name, phone, is_active)
VALUES 
    ('u2u2u2u2-u2u2-u2u2-u2u2-u2u2u2u2u2u2', 'admin@companyb.com', '$2a$10$demo123hashedpasswordexample', 'Admin B', '01199999999', true);

-- ربط المستخدم بالشركة الثانية
INSERT INTO app_user_companies (user_id, company_id, role_id, is_owner, status)
VALUES 
    ('u2u2u2u2-u2u2-u2u2-u2u2-u2u2u2u2u2u2', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'r5r5r5r5-r5r5-r5r5-r5r5-r5r5r5r5r5r5', true, 'active');

-- ربط المستخدم بالفرع
INSERT INTO user_branch_access (user_id, branch_id, can_view, can_edit)
VALUES 
    ('u2u2u2u2-u2u2-u2u2-u2u2-u2u2u2u2u2u2', 'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', true, true);

-- =============================================
-- عملاء للشركة الثانية
-- =============================================
INSERT INTO customers (id, company_id, code, name, name_ar, phone, email, city, is_active)
VALUES 
    ('d5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'CUST-B-001', 'Company B Customer 1', 'عميل شركة ب 1', '01266666666', 'customer.b1@test.com', 'الجيزة', true),
    ('d6d6d6d6-d6d6-d6d6-d6d6-d6d6d6d6d6d6', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'CUST-B-002', 'Company B Customer 2', 'عميل شركة ب 2', '01277777777', 'customer.b2@test.com', '6 أكتوبر', true);

-- =============================================
-- منتجات للشركة الثانية
-- =============================================
INSERT INTO product_categories (id, company_id, code, name, name_ar)
VALUES 
    ('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'FURN', 'Furniture', 'أثاث');

INSERT INTO products (id, company_id, category_id, sku, barcode, name, name_ar, selling_price, cost_price, is_active)
VALUES 
    ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'DESK-001', '6282000001001', 'Office Desk', 'مكتب مكتبي', 1500, 900, true),
    ('f7f7f7f7-f7f7-f7f7-f7f7-f7f7f7f7f7f7', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4', 'CHAIR-002', '6282000001002', 'Office Chair', 'كرسي مكتبي', 800, 500, true);

-- =============================================
-- مخزن للشركة الثانية
-- =============================================
INSERT INTO warehouses (id, company_id, branch_id, code, name, name_ar, is_active)
VALUES 
    ('w2w2w2w2-w2w2-w2w2-w2w2-w2w2w2w2w2w2', 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'WH-B-01', 'Main Warehouse B', 'المخزن الرئيسي ب', true);

-- مخزون للشركة الثانية
INSERT INTO product_inventory (product_id, warehouse_id, quantity, available_quantity)
VALUES 
    ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6', 'w2w2w2w2-w2w2-w2w2-w2w2-w2w2w2w2w2w2', 50, 50),
    ('f7f7f7f7-f7f7-f7f7-f7f7-f7f7f7f7f7f7', 'w2w2w2w2-w2w2-w2w2-w2w2-w2w2w2w2w2w2', 100, 100);

-- =============================================
-- تسلسلات أرقام للشركة الثانية
-- =============================================
INSERT INTO number_sequences (company_id, document_type, prefix, next_number, padding)
VALUES 
    ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'sales_invoice', 'INV-B-', 1, 5),
    ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'purchase_invoice', 'PUR-B-', 1, 5);

-- =============================================
-- اختبارات يدوية
-- ==============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ تم إنشاء بيانات الاختبار بنجاح!';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 بيانات تسجيل الدخول للاختبار:';
    RAISE NOTICE '';
    RAISE NOTICE '📌 الشركة الأولى (Company A):';
    RAISE NOTICE '   البريد: admin@demo.com';
    RAISE NOTICE '   كلمة المرور: demo123';
    RAISE NOTICE '   العملاء: 4';
    RAISE NOTICE '   المنتجات: 5';
    RAISE NOTICE '';
    RAISE NOTICE '📌 الشركة الثانية (Company B):';
    RAISE NOTICE '   البريد: admin@companyb.com';
    RAISE NOTICE '   كلمة المرور: demo123';
    RAISE NOTICE '   العملاء: 2';
    RAISE NOTICE '   المنتجات: 2';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 اختبارات يدوية:';
    RAISE NOTICE '   1. سجل دخول كـ admin@demo.com';
    RAISE NOTICE '   2. تحقق أنك ترى 4 عملاء فقط';
    RAISE NOTICE '   3. سجل خروج ثم دخول كـ admin@companyb.com';
    RAISE NOTICE '   4. تحقق أنك ترى 2 عملاء فقط';
    RAISE NOTICE '   5. تحقق أن البحث عن المنتجات يعرض منتجات شركتك فقط';
END $$;
