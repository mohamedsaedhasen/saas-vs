-- =============================================
-- نظام ERP SaaS - الإضافات والدوال الأساسية
-- =============================================

-- تفعيل UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- دالة تحديث updated_at تلقائياً
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- دوال سياق المستأجر (Multi-Tenancy)
-- =============================================

-- دالة تعيين سياق المستأجر
CREATE OR REPLACE FUNCTION public.set_tenant_context(
    p_user_id UUID DEFAULT NULL,
    p_company_id UUID DEFAULT NULL,
    p_branch_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- تعيين معرف المستخدم
    IF p_user_id IS NOT NULL THEN
        PERFORM set_config('app.current_user_id', p_user_id::text, true);
    ELSE
        PERFORM set_config('app.current_user_id', '', true);
    END IF;
    
    -- تعيين معرف الشركة
    IF p_company_id IS NOT NULL THEN
        PERFORM set_config('app.current_company_id', p_company_id::text, true);
    ELSE
        PERFORM set_config('app.current_company_id', '', true);
    END IF;
    
    -- تعيين معرف الفرع
    IF p_branch_id IS NOT NULL THEN
        PERFORM set_config('app.current_branch_id', p_branch_id::text, true);
    ELSE
        PERFORM set_config('app.current_branch_id', '', true);
    END IF;
END;
$$;

-- دالة الحصول على معرف الشركة الحالي
CREATE OR REPLACE FUNCTION current_company_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_company_id TEXT;
BEGIN
    v_company_id := current_setting('app.current_company_id', true);
    IF v_company_id IS NULL OR v_company_id = '' THEN
        RETURN NULL;
    END IF;
    RETURN v_company_id::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- دالة الحصول على معرف المستخدم الحالي
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_user_id TEXT;
BEGIN
    v_user_id := current_setting('app.current_user_id', true);
    IF v_user_id IS NULL OR v_user_id = '' THEN
        RETURN NULL;
    END IF;
    RETURN v_user_id::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- دالة الحصول على معرف الفرع الحالي
CREATE OR REPLACE FUNCTION current_branch_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_branch_id TEXT;
BEGIN
    v_branch_id := current_setting('app.current_branch_id', true);
    IF v_branch_id IS NULL OR v_branch_id = '' THEN
        RETURN NULL;
    END IF;
    RETURN v_branch_id::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- السماح للجميع باستخدام الدوال
GRANT EXECUTE ON FUNCTION public.set_tenant_context(UUID, UUID, UUID) TO authenticated, anon, public;
GRANT EXECUTE ON FUNCTION current_company_id() TO authenticated, anon, public;
GRANT EXECUTE ON FUNCTION current_user_id() TO authenticated, anon, public;
GRANT EXECUTE ON FUNCTION current_branch_id() TO authenticated, anon, public;

-- ✅ تم إنشاء الإضافات والدوال الأساسية
