-- =============================================
-- نظام الأجهزة الموثوقة (Trusted Devices)
-- =============================================

-- إضافة حقل تقييد الجهاز للمستخدمين
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS device_restriction_enabled BOOLEAN DEFAULT FALSE;

-- جدول الأجهزة الموثوقة
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(255), -- اسم الجهاز (يحدده المستخدم أو تلقائي)
    device_info JSONB, -- معلومات إضافية عن الجهاز
    ip_address VARCHAR(50),
    is_trusted BOOLEAN DEFAULT FALSE, -- هل تم الموافقة عليه من المدير
    is_current BOOLEAN DEFAULT FALSE, -- الجهاز الحالي
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, device_fingerprint)
);

-- جدول طلبات الأجهزة الجديدة (تحتاج موافقة المدير)
CREATE TABLE IF NOT EXISTS device_approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    reviewed_by UUID REFERENCES app_users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهرسة
CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint ON user_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_device_requests_status ON device_approval_requests(status);
