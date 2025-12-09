-- ============================================
-- Notifications & Activity Log System
-- Similar to Odoo Chatter/Log
-- ============================================

-- النظام يشمل:
-- 1. الإشعارات (notifications) - للتنبيهات المباشرة
-- 2. سجل النشاط (activity_log) - لتتبع كل التغييرات
-- 3. التعليقات (comments) - للنقاشات على المستندات

-- ============================================
-- Notifications Table
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- المستخدم المستهدف
    user_id UUID, -- NULL = لكل المستخدمين
    
    -- نوع الإشعار
    type VARCHAR(50) NOT NULL DEFAULT 'info', -- info, success, warning, error, action
    category VARCHAR(50), -- order, payment, inventory, shipping, system
    
    -- المحتوى
    title VARCHAR(255) NOT NULL,
    message TEXT,
    icon VARCHAR(50), -- اسم الأيقونة
    
    -- الرابط (اختياري)
    link_type VARCHAR(50), -- order, invoice, customer, product, etc
    link_id UUID,
    link_url VARCHAR(500),
    
    -- الحالة
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    -- أولوية
    priority INTEGER DEFAULT 0, -- 0=normal, 1=high, 2=urgent
    
    -- انتهاء الصلاحية
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Activity Log Table (Odoo-style Chatter)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- المستخدم الذي قام بالإجراء
    user_id UUID,
    user_name VARCHAR(255),
    
    -- المستند المرتبط
    model_type VARCHAR(100) NOT NULL, -- sales_order, customer, product, etc
    model_id UUID NOT NULL,
    model_name VARCHAR(255), -- اسم المستند (مثل رقم الطلب)
    
    -- نوع النشاط
    action_type VARCHAR(50) NOT NULL, -- create, update, delete, status_change, comment, email, call, note
    
    -- تفاصيل النشاط
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- التغييرات (JSON)
    changes JSONB, -- { field: { old: x, new: y } }
    
    -- بيانات إضافية
    metadata JSONB,
    
    -- الأهمية
    importance VARCHAR(20) DEFAULT 'normal', -- low, normal, high
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Comments Table (النقاشات على المستندات)
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- المستخدم
    user_id UUID,
    user_name VARCHAR(255) NOT NULL,
    user_avatar VARCHAR(500),
    
    -- المستند المرتبط
    model_type VARCHAR(100) NOT NULL,
    model_id UUID NOT NULL,
    
    -- نوع التعليق
    comment_type VARCHAR(30) DEFAULT 'comment', -- comment, note, email, call, meeting
    
    -- المحتوى
    content TEXT NOT NULL,
    
    -- المرفقات
    attachments JSONB, -- [{ name, url, type, size }]
    
    -- الإشارات
    mentions JSONB, -- [{ user_id, name }]
    
    -- رد على تعليق آخر
    parent_id UUID REFERENCES comments(id),
    
    -- التفاعلات
    reactions JSONB DEFAULT '{}', -- { "👍": [user_ids], "❤️": [user_ids] }
    
    is_internal BOOLEAN DEFAULT false, -- ملاحظة داخلية (لا يراها العميل)
    is_pinned BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Scheduled Activities (المهام المجدولة)
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- المستند المرتبط
    model_type VARCHAR(100) NOT NULL,
    model_id UUID NOT NULL,
    
    -- نوع النشاط
    activity_type VARCHAR(50) NOT NULL, -- call, meeting, email, todo, deadline
    
    -- التفاصيل
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- التوقيت
    due_date DATE NOT NULL,
    due_time TIME,
    
    -- المسؤول
    assigned_to UUID,
    assigned_name VARCHAR(255),
    created_by UUID,
    
    -- الحالة
    status VARCHAR(20) DEFAULT 'pending', -- pending, done, cancelled, overdue
    completed_at TIMESTAMPTZ,
    
    -- التذكير
    reminder_minutes INTEGER, -- reminded before X minutes
    reminder_sent BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_company ON notifications(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_model ON activity_logs(model_type, model_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_company ON activity_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_model ON comments(model_type, model_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_activities_due ON scheduled_activities(due_date, status);

-- ============================================
-- Helper Function: Log Activity
-- ============================================
CREATE OR REPLACE FUNCTION log_activity(
    p_company_id UUID,
    p_user_id UUID,
    p_user_name VARCHAR,
    p_model_type VARCHAR,
    p_model_id UUID,
    p_model_name VARCHAR,
    p_action_type VARCHAR,
    p_title VARCHAR,
    p_description TEXT DEFAULT NULL,
    p_changes JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO activity_logs (
        company_id, user_id, user_name, model_type, model_id, model_name,
        action_type, title, description, changes, metadata
    ) VALUES (
        p_company_id, p_user_id, p_user_name, p_model_type, p_model_id, p_model_name,
        p_action_type, p_title, p_description, p_changes, p_metadata
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Helper Function: Create Notification
-- ============================================
CREATE OR REPLACE FUNCTION create_notification(
    p_company_id UUID,
    p_user_id UUID,
    p_type VARCHAR,
    p_title VARCHAR,
    p_message TEXT DEFAULT NULL,
    p_category VARCHAR DEFAULT NULL,
    p_link_type VARCHAR DEFAULT NULL,
    p_link_id UUID DEFAULT NULL,
    p_priority INTEGER DEFAULT 0
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        company_id, user_id, type, title, message, category,
        link_type, link_id, priority
    ) VALUES (
        p_company_id, p_user_id, p_type, p_title, p_message, p_category,
        p_link_type, p_link_id, p_priority
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;
