-- =============================================
-- نظام ERP SaaS - جداول الاشتراكات
-- خطط الاشتراك، اشتراكات الشركات، تتبع الاستخدام
-- =============================================

-- =============================================
-- 1. خطط الاشتراك
-- =============================================
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    description TEXT,
    price_monthly DECIMAL(10,2) DEFAULT 0,
    price_yearly DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'EGP',
    max_users INTEGER DEFAULT 1,
    max_branches INTEGER DEFAULT 1,
    max_invoices_monthly INTEGER DEFAULT 100,
    max_products INTEGER DEFAULT 100,
    max_storage_gb DECIMAL(10,2) DEFAULT 1,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. اشتراكات الشركات
-- =============================================
CREATE TABLE company_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled, expired
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id)
);

CREATE INDEX idx_subscriptions_company ON company_subscriptions(company_id);
CREATE INDEX idx_subscriptions_plan ON company_subscriptions(plan_id);

-- =============================================
-- 3. تتبع الاستخدام
-- =============================================
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL, -- invoices, users, storage, api_calls
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    usage_limit INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, metric_type, period_start)
);

CREATE INDEX idx_usage_company ON usage_tracking(company_id);

-- =============================================
-- RLS
-- =============================================
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- خطط الاشتراك متاحة للجميع للقراءة
CREATE POLICY subscription_plans_select ON subscription_plans FOR SELECT
USING (true);

CREATE POLICY company_subscriptions_all ON company_subscriptions FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY usage_tracking_all ON usage_tracking FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- =============================================
-- Triggers
-- =============================================
CREATE TRIGGER subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER company_subscriptions_updated_at BEFORE UPDATE ON company_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER usage_tracking_updated_at BEFORE UPDATE ON usage_tracking
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ✅ تم إنشاء جداول الاشتراكات
