-- =============================================
-- نظام ERP SaaS - بيانات تجريبية
-- 2 مستخدمين، 2 شركات، كل شركة بها 2 فروع
-- =============================================

-- =============================================
-- الشركة الأولى: شركة الأمل للتجارة
-- =============================================
INSERT INTO companies (id, code, name, name_en, email, phone, city, country, currency)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'AMAL-001',
    'شركة الأمل للتجارة',
    'Al-Amal Trading Company',
    'info@alamal.com',
    '01012345678',
    'القاهرة',
    'مصر',
    'EGP'
);

-- فروع الشركة الأولى
INSERT INTO branches (id, company_id, code, name, name_en, city, is_headquarters) VALUES
('11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111111', 'HQ', 'الفرع الرئيسي', 'Headquarters', 'القاهرة', true),
('11111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111111', 'ALEX', 'فرع الإسكندرية', 'Alexandria Branch', 'الإسكندرية', false);

-- =============================================
-- الشركة الثانية: مؤسسة النور
-- =============================================
INSERT INTO companies (id, code, name, name_en, email, phone, city, country, currency)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'NOUR-001',
    'مؤسسة النور للتوريدات',
    'Al-Nour Supplies Est.',
    'info@alnour.com',
    '01098765432',
    'الجيزة',
    'مصر',
    'EGP'
);

-- فروع الشركة الثانية
INSERT INTO branches (id, company_id, code, name, name_en, city, is_headquarters) VALUES
('22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222222', 'HQ', 'المقر الرئيسي', 'Main Office', 'الجيزة', true),
('22222222-2222-2222-2222-222222222202', '22222222-2222-2222-2222-222222222222', 'MANS', 'فرع المنصورة', 'Mansoura Branch', 'المنصورة', false);

-- =============================================
-- المستخدم الأول: أحمد (مالك شركة الأمل)
-- =============================================
INSERT INTO app_users (id, email, password_hash, name, name_en, phone, status)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'ahmed@alamal.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4Bk.S7Uxl.mNVH66', -- password: admin123
    'أحمد محمد',
    'Ahmed Mohamed',
    '01012345678',
    'active'
);

-- ربط أحمد بشركة الأمل كمالك
INSERT INTO app_user_companies (user_id, company_id, is_owner, is_primary, status)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    true,
    true,
    'active'
);

-- صلاحيات أحمد على جميع فروع شركة الأمل
INSERT INTO user_branch_access (user_id, company_id, branch_id, can_view, can_edit, can_delete, is_default) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111101', true, true, true, true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111102', true, true, true, false);

-- =============================================
-- المستخدم الثاني: محمود (مالك مؤسسة النور)
-- =============================================
INSERT INTO app_users (id, email, password_hash, name, name_en, phone, status)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'mahmoud@alnour.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4Bk.S7Uxl.mNVH66', -- password: admin123
    'محمود علي',
    'Mahmoud Ali',
    '01098765432',
    'active'
);

-- ربط محمود بمؤسسة النور كمالك
INSERT INTO app_user_companies (user_id, company_id, is_owner, is_primary, status)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    true,
    true,
    'active'
);

-- صلاحيات محمود على جميع فروع مؤسسة النور
INSERT INTO user_branch_access (user_id, company_id, branch_id, can_view, can_edit, can_delete, is_default) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222201', true, true, true, true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222202', true, true, true, false);

-- =============================================
-- البيانات الأساسية لكل شركة
-- =============================================

-- وحدات القياس للشركتين
INSERT INTO units_of_measure (company_id, code, name, name_ar, is_base_unit) VALUES
('11111111-1111-1111-1111-111111111111', 'PCS', 'Piece', 'قطعة', true),
('11111111-1111-1111-1111-111111111111', 'KG', 'Kilogram', 'كيلو جرام', true),
('11111111-1111-1111-1111-111111111111', 'BOX', 'Box', 'صندوق', true),
('22222222-2222-2222-2222-222222222222', 'PCS', 'Piece', 'قطعة', true),
('22222222-2222-2222-2222-222222222222', 'KG', 'Kilogram', 'كيلو جرام', true),
('22222222-2222-2222-2222-222222222222', 'MTR', 'Meter', 'متر', true);

-- مخازن لكل شركة
INSERT INTO warehouses (id, company_id, branch_id, code, name, name_ar, is_default) VALUES
-- مخازن شركة الأمل
('11111111-1111-1111-1111-111111111201', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111101', 'WH-MAIN', 'Main Warehouse', 'المخزن الرئيسي', true),
('11111111-1111-1111-1111-111111111202', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111102', 'WH-ALEX', 'Alexandria Warehouse', 'مخزن الإسكندرية', false),
-- مخازن مؤسسة النور
('22222222-2222-2222-2222-222222222301', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222201', 'WH-MAIN', 'Main Warehouse', 'المخزن الرئيسي', true),
('22222222-2222-2222-2222-222222222302', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222202', 'WH-MANS', 'Mansoura Warehouse', 'مخزن المنصورة', false);

-- خزائن لكل شركة
INSERT INTO vaults (id, company_id, branch_id, code, name, name_ar, vault_type, is_default) VALUES
-- خزائن شركة الأمل
('11111111-1111-1111-1111-111111111301', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111101', 'CASH-MAIN', 'Main Cash', 'الخزينة الرئيسية', 'cash', true),
('11111111-1111-1111-1111-111111111302', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111101', 'BANK-CIB', 'CIB Bank', 'بنك CIB', 'bank', false),
-- خزائن مؤسسة النور
('22222222-2222-2222-2222-222222222401', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222201', 'CASH-MAIN', 'Main Cash', 'الخزينة الرئيسية', 'cash', true),
('22222222-2222-2222-2222-222222222402', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222201', 'BANK-NBE', 'NBE Bank', 'البنك الأهلي', 'bank', false);

-- عميل كاش ومورد كاش لكل شركة
INSERT INTO customers (company_id, code, name, name_ar, is_system) VALUES
('11111111-1111-1111-1111-111111111111', 'CASH', 'Cash Customer', 'عميل نقدي', true),
('22222222-2222-2222-2222-222222222222', 'CASH', 'Cash Customer', 'عميل نقدي', true);

INSERT INTO suppliers (company_id, code, name, name_ar, is_system) VALUES
('11111111-1111-1111-1111-111111111111', 'CASH', 'Cash Supplier', 'مورد نقدي', true),
('22222222-2222-2222-2222-222222222222', 'CASH', 'Cash Supplier', 'مورد نقدي', true);

-- =============================================
-- ملخص البيانات
-- =============================================
-- 
-- المستخدم 1: ahmed@alamal.com / admin123
--   - الشركة: شركة الأمل للتجارة
--   - الفروع: الرئيسي + الإسكندرية
--
-- المستخدم 2: mahmoud@alnour.com / admin123
--   - الشركة: مؤسسة النور للتوريدات
--   - الفروع: الرئيسي + المنصورة
--
-- ✅ تم إنشاء البيانات التجريبية

