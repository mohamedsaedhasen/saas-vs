-- =============================================
-- سكربت ترحيل من V1 إلى V2
-- يجب تشغيله بعد v2_complete_schema.sql
-- =============================================

-- تنبيه: قم بعمل نسخة احتياطية قبل التشغيل!

-- =============================================
-- الخطوة 1: ترحيل بيانات الشركات
-- =============================================
INSERT INTO companies (id, name, name_ar, email, phone, address, tax_number, logo_url, currency, timezone, settings, is_active, created_at, updated_at)
SELECT id, name, name_ar, email, phone, address, tax_number, logo_url, currency, timezone, settings, is_active, created_at, updated_at
FROM public.companies_old -- افترض أن الجدول القديم تم تسميته
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- الخطوة 2: إنشاء فرع افتراضي لكل شركة
-- =============================================
INSERT INTO branches (company_id, code, name, name_ar, is_headquarters, is_active)
SELECT id, 'HQ', name || ' - الرئيسي', name_ar || ' - الرئيسي', true, true
FROM companies
WHERE NOT EXISTS (
    SELECT 1 FROM branches WHERE branches.company_id = companies.id
);

-- =============================================
-- الخطوة 3: ترحيل المستخدمين
-- =============================================
-- المستخدمين موجودين، نحتاج فقط إزالة role_id

-- نسخ role_id إلى app_user_companies قبل الحذف
UPDATE app_user_companies auc
SET role_id = au.role_id
FROM app_users au
WHERE auc.user_id = au.id
AND au.role_id IS NOT NULL
AND auc.role_id IS NULL;

-- حذف role_id من app_users (إذا كان موجوداً)
-- ALTER TABLE app_users DROP COLUMN IF EXISTS role_id;

-- =============================================
-- الخطوة 4: ربط المخازن بالفروع
-- =============================================
UPDATE warehouses w
SET branch_id = (
    SELECT b.id FROM branches b 
    WHERE b.company_id = w.company_id 
    AND b.is_headquarters = true
    LIMIT 1
)
WHERE w.branch_id IS NULL;

-- =============================================
-- الخطوة 5: ربط الخزائن بالفروع
-- =============================================
UPDATE vaults v
SET branch_id = (
    SELECT b.id FROM branches b 
    WHERE b.company_id = v.company_id 
    AND b.is_headquarters = true
    LIMIT 1
)
WHERE v.branch_id IS NULL;

-- =============================================
-- الخطوة 6: ربط الفواتير بالفروع
-- =============================================
UPDATE sales_invoices si
SET branch_id = (
    SELECT b.id FROM branches b 
    WHERE b.company_id = si.company_id 
    AND b.is_headquarters = true
    LIMIT 1
)
WHERE si.branch_id IS NULL;

UPDATE purchase_invoices pi
SET branch_id = (
    SELECT b.id FROM branches b 
    WHERE b.company_id = pi.company_id 
    AND b.is_headquarters = true
    LIMIT 1
)
WHERE pi.branch_id IS NULL;

-- =============================================
-- الخطوة 7: إعطاء المستخدمين وصول للفروع
-- =============================================
INSERT INTO user_branch_access (user_id, company_id, branch_id, can_view, can_edit, can_delete, is_default)
SELECT 
    auc.user_id,
    auc.company_id,
    b.id,
    true, -- can_view
    true, -- can_edit
    true, -- can_delete
    true  -- is_default
FROM app_user_companies auc
JOIN branches b ON b.company_id = auc.company_id AND b.is_headquarters = true
WHERE NOT EXISTS (
    SELECT 1 FROM user_branch_access uba 
    WHERE uba.user_id = auc.user_id AND uba.branch_id = b.id
);

-- =============================================
-- الخطوة 8: إنشاء أدوار افتراضية لكل شركة
-- =============================================
INSERT INTO roles (company_id, code, name, name_ar, is_system, is_super_admin, is_active)
SELECT 
    c.id,
    'admin',
    'Administrator',
    'مدير النظام',
    true,
    true,
    true
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM roles r WHERE r.company_id = c.id AND r.code = 'admin'
);

INSERT INTO roles (company_id, code, name, name_ar, is_system, is_active)
SELECT 
    c.id,
    'accountant',
    'Accountant',
    'محاسب',
    true,
    true
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM roles r WHERE r.company_id = c.id AND r.code = 'accountant'
);

INSERT INTO roles (company_id, code, name, name_ar, is_system, is_active)
SELECT 
    c.id,
    'sales',
    'Sales',
    'مبيعات',
    true,
    true
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM roles r WHERE r.company_id = c.id AND r.code = 'sales'
);

INSERT INTO roles (company_id, code, name, name_ar, is_system, is_active)
SELECT 
    c.id,
    'viewer',
    'Viewer',
    'مشاهد',
    true,
    true
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM roles r WHERE r.company_id = c.id AND r.code = 'viewer'
);

-- =============================================
-- الخطوة 9: إنشاء وحدات قياس افتراضية
-- =============================================
INSERT INTO units_of_measure (company_id, code, name, name_ar, is_base_unit)
SELECT c.id, 'pcs', 'Piece', 'قطعة', true
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM units_of_measure u WHERE u.company_id = c.id AND u.code = 'pcs'
);

INSERT INTO units_of_measure (company_id, code, name, name_ar, is_base_unit)
SELECT c.id, 'kg', 'Kilogram', 'كيلوجرام', true
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM units_of_measure u WHERE u.company_id = c.id AND u.code = 'kg'
);

INSERT INTO units_of_measure (company_id, code, name, name_ar, is_base_unit)
SELECT c.id, 'box', 'Box', 'صندوق', true
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM units_of_measure u WHERE u.company_id = c.id AND u.code = 'box'
);

-- =============================================
-- الخطوة 10: إنشاء تسلسلات الأرقام
-- =============================================
INSERT INTO number_sequences (company_id, document_type, prefix, next_number, padding)
SELECT c.id, 'sales_invoice', 'INV-', 1, 5
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM number_sequences n WHERE n.company_id = c.id AND n.document_type = 'sales_invoice'
);

INSERT INTO number_sequences (company_id, document_type, prefix, next_number, padding)
SELECT c.id, 'purchase_invoice', 'PUR-', 1, 5
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM number_sequences n WHERE n.company_id = c.id AND n.document_type = 'purchase_invoice'
);

INSERT INTO number_sequences (company_id, document_type, prefix, next_number, padding)
SELECT c.id, 'receipt', 'REC-', 1, 5
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM number_sequences n WHERE n.company_id = c.id AND n.document_type = 'receipt'
);

INSERT INTO number_sequences (company_id, document_type, prefix, next_number, padding)
SELECT c.id, 'payment', 'PAY-', 1, 5
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM number_sequences n WHERE n.company_id = c.id AND n.document_type = 'payment'
);

INSERT INTO number_sequences (company_id, document_type, prefix, next_number, padding)
SELECT c.id, 'shipment', 'SHP-', 1, 5
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM number_sequences n WHERE n.company_id = c.id AND n.document_type = 'shipment'
);

-- =============================================
-- الخطوة 11: تعيين المالكين
-- =============================================
-- تعيين أول مستخدم في كل شركة كمالك
UPDATE app_user_companies auc
SET is_owner = true
WHERE auc.id IN (
    SELECT DISTINCT ON (company_id) id
    FROM app_user_companies
    ORDER BY company_id, created_at ASC
)
AND is_owner = false;

-- =============================================
-- الخطوة 12: تعيين الأدوار للمستخدمين بدون دور
-- =============================================
UPDATE app_user_companies auc
SET role_id = (
    SELECT r.id FROM roles r 
    WHERE r.company_id = auc.company_id 
    AND r.code = 'admin'
    LIMIT 1
)
WHERE auc.role_id IS NULL AND auc.is_owner = true;

UPDATE app_user_companies auc
SET role_id = (
    SELECT r.id FROM roles r 
    WHERE r.company_id = auc.company_id 
    AND r.code = 'viewer'
    LIMIT 1
)
WHERE auc.role_id IS NULL;

-- =============================================
-- تقرير الترحيل
-- =============================================
DO $$
DECLARE
    v_companies INTEGER;
    v_branches INTEGER;
    v_users INTEGER;
    v_roles INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_companies FROM companies;
    SELECT COUNT(*) INTO v_branches FROM branches;
    SELECT COUNT(*) INTO v_users FROM app_users;
    SELECT COUNT(*) INTO v_roles FROM roles;
    
    RAISE NOTICE '=== تقرير الترحيل ===';
    RAISE NOTICE 'الشركات: %', v_companies;
    RAISE NOTICE 'الفروع: %', v_branches;
    RAISE NOTICE 'المستخدمين: %', v_users;
    RAISE NOTICE 'الأدوار: %', v_roles;
    RAISE NOTICE '=====================';
END $$;

-- =============================================
-- النهاية
-- =============================================
