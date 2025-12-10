-- =============================================
-- إضافة عمود is_system للعملاء والموردين
-- لتمييز الكيانات الافتراضية من التي أنشأها المستخدم
-- =============================================

-- إضافة عمود is_system لجدول العملاء
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- إضافة عمود is_system لجدول الموردين
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- تحديث عميل الكاش ليكون is_system = true (إذا كان موجوداً)
UPDATE customers SET is_system = true WHERE code = 'CASH-CUSTOMER';

-- تحديث مورد الكاش ليكون is_system = true (إذا كان موجوداً)
UPDATE suppliers SET is_system = true WHERE code = 'CASH-SUPPLIER';

-- إنشاء index لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_customers_is_system ON customers(is_system) WHERE is_system = true;
CREATE INDEX IF NOT EXISTS idx_suppliers_is_system ON suppliers(is_system) WHERE is_system = true;
