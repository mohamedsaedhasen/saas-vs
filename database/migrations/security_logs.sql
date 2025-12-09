-- ============================================
-- Login & Security Logs
-- ============================================

-- جدول تسجيل الدخول
CREATE TABLE IF NOT EXISTS login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- بيانات المستخدم
    user_id UUID,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    
    -- نوع الحدث
    event_type VARCHAR(50) NOT NULL, -- login, logout, login_failed, password_reset, token_refresh
    
    -- نتيجة المحاولة
    status VARCHAR(20) DEFAULT 'success', -- success, failed
    failure_reason VARCHAR(255), -- invalid_password, user_not_found, account_locked, etc
    
    -- معلومات الجهاز
    ip_address VARCHAR(45), -- IPv4 or IPv6
    user_agent TEXT,
    device_type VARCHAR(50), -- desktop, mobile, tablet
    browser VARCHAR(100),
    os VARCHAR(100),
    
    -- الموقع الجغرافي (اختياري)
    country VARCHAR(100),
    city VARCHAR(100),
    
    -- معلومات الجلسة
    session_id VARCHAR(255),
    
    -- بيانات إضافية
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الجلسات النشطة
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- معلومات الجلسة
    session_token VARCHAR(500),
    
    -- معلومات الجهاز
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    
    -- الموقع
    country VARCHAR(100),
    city VARCHAR(100),
    
    -- الحالة
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    
    -- انتهاء الصلاحية
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول محاولات تسجيل الدخول الفاشلة (للحماية)
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- المعرف (email أو IP)
    identifier VARCHAR(255) NOT NULL, -- email or IP
    identifier_type VARCHAR(20) NOT NULL, -- email, ip
    
    -- عدد المحاولات
    attempt_count INTEGER DEFAULT 1,
    
    -- آخر محاولة
    last_attempt TIMESTAMPTZ DEFAULT NOW(),
    
    -- حالة الحظر
    is_locked BOOLEAN DEFAULT false,
    locked_until TIMESTAMPTZ,
    
    -- معلومات إضافية
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول سجل الأمان (Security Audit Log)
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID,
    user_name VARCHAR(255),
    
    -- نوع الحدث الأمني
    event_type VARCHAR(100) NOT NULL,
    -- أمثلة: password_change, email_change, 2fa_enabled, 2fa_disabled,
    -- role_change, permission_change, data_export, bulk_delete, etc
    
    -- التفاصيل
    description TEXT,
    
    -- المورد المتأثر
    resource_type VARCHAR(100),
    resource_id UUID,
    
    -- معلومات الطلب
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- البيانات قبل وبعد
    old_value JSONB,
    new_value JSONB,
    
    -- الأهمية
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_ip ON login_logs(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_email ON login_logs(user_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON active_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_failed_attempts_identifier ON failed_login_attempts(identifier, identifier_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_logs(user_id, created_at DESC);

-- ============================================
-- Helper Functions
-- ============================================

-- دالة تسجيل الدخول
CREATE OR REPLACE FUNCTION log_login(
    p_company_id UUID,
    p_user_id UUID,
    p_user_email VARCHAR,
    p_user_name VARCHAR,
    p_event_type VARCHAR,
    p_status VARCHAR,
    p_ip_address VARCHAR,
    p_user_agent TEXT DEFAULT NULL,
    p_failure_reason VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO login_logs (
        company_id, user_id, user_email, user_name, event_type,
        status, ip_address, user_agent, failure_reason
    ) VALUES (
        p_company_id, p_user_id, p_user_email, p_user_name, p_event_type,
        p_status, p_ip_address, p_user_agent, p_failure_reason
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- دالة تسجيل حدث أمني
CREATE OR REPLACE FUNCTION log_security_event(
    p_company_id UUID,
    p_user_id UUID,
    p_user_name VARCHAR,
    p_event_type VARCHAR,
    p_description TEXT,
    p_ip_address VARCHAR,
    p_severity VARCHAR DEFAULT 'medium'
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO security_logs (
        company_id, user_id, user_name, event_type,
        description, ip_address, severity
    ) VALUES (
        p_company_id, p_user_id, p_user_name, p_event_type,
        p_description, p_ip_address, p_severity
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;
