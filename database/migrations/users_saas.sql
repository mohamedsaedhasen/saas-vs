-- =============================================
-- جدول المستخدمين للنظام SaaS
-- =============================================

-- حذف الجدول إذا كان موجوداً
-- DROP TABLE IF EXISTS users CASCADE;

-- إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    
    -- حالة الحساب
    status VARCHAR(50) DEFAULT 'trial', -- trial, active, pending, suspended
    plan VARCHAR(50) DEFAULT 'trial', -- trial, starter, professional, enterprise
    
    -- الفترة التجريبية
    trial_ends_at TIMESTAMPTZ,
    
    -- معلومات إضافية
    last_login_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    
    -- التواريخ
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهرسة
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- =============================================
-- جدول ربط المستخدمين بالشركات
-- =============================================

CREATE TABLE IF NOT EXISTS user_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'admin', -- admin, member, viewer
    is_primary BOOLEAN DEFAULT TRUE,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, company_id)
);

-- فهرسة
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);

-- =============================================
-- مستخدم تجريبي للاختبار
-- =============================================

-- كلمة المرور: Admin123!
-- الهاش تم إنشاؤه بـ bcrypt
INSERT INTO users (name, email, phone, password_hash, status, plan, trial_ends_at)
VALUES (
    'مدير النظام',
    'admin@test.com',
    '01000000000',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiLXCJzLSqMa', -- Admin123!
    'active',
    'enterprise',
    (NOW() + INTERVAL '365 days')
) ON CONFLICT (email) DO NOTHING;

-- ربط المستخدم بأول شركة
INSERT INTO user_companies (user_id, company_id, role, is_primary)
SELECT 
    u.id,
    c.id,
    'admin',
    true
FROM users u, companies c
WHERE u.email = 'admin@test.com'
AND c.is_default = true
LIMIT 1
ON CONFLICT (user_id, company_id) DO NOTHING;
