-- إصلاح الأعمدة الناقصة في جدول companies
-- شغّل هذا الملف في Supabase SQL Editor

-- إضافة عمود is_default إذا لم يكن موجوداً
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;

-- إضافة عمود is_active إذا لم يكن موجوداً
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- إضافة عمود settings إذا لم يكن موجوداً (نوع JSONB)
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- إضافة الأعمدة الإضافية التي قد تكون ناقصة
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255);

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS tax_number VARCHAR(50);

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS commercial_register VARCHAR(100);

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS city VARCHAR(100);

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'مصر';

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS website VARCHAR(255);

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- التأكد من وجود جدول app_user_companies
CREATE TABLE IF NOT EXISTS app_user_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

-- إعطاء صلاحيات للـ anonymous users
GRANT ALL ON companies TO anon;
GRANT ALL ON companies TO authenticated;
GRANT ALL ON app_user_companies TO anon;
GRANT ALL ON app_user_companies TO authenticated;

-- تعطيل RLS مؤقتاً للاختبار (يمكنك تفعيله لاحقاً)
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_companies DISABLE ROW LEVEL SECURITY;

-- رسالة نجاح
DO $$
BEGIN
    RAISE NOTICE 'تم إصلاح الأعمدة الناقصة بنجاح!';
END $$;
