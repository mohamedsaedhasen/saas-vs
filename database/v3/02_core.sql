-- =============================================
-- نظام ERP SaaS - الجداول الأساسية
-- الشركات، الفروع، المستخدمين، الصلاحيات
-- =============================================

-- =============================================
-- 1. جدول الشركات (Tenants)
-- =============================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    legal_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'مصر',
    tax_number VARCHAR(100),
    commercial_register VARCHAR(100),
    logo_url TEXT,
    currency VARCHAR(10) DEFAULT 'EGP',
    timezone VARCHAR(50) DEFAULT 'Africa/Cairo',
    fiscal_year_start INTEGER DEFAULT 1, -- الشهر (1-12)
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_code ON companies(code);
CREATE INDEX idx_companies_active ON companies(is_active);

-- =============================================
-- 2. جدول الفروع (Branches)
-- =============================================
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    is_headquarters BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

CREATE INDEX idx_branches_company ON branches(company_id);
CREATE INDEX idx_branches_active ON branches(company_id, is_active);

-- =============================================
-- 3. جدول المستخدمين
-- =============================================
CREATE TABLE app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, pending
    email_verified_at TIMESTAMPTZ,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(50),
    password_changed_at TIMESTAMPTZ,
    is_super_admin BOOLEAN DEFAULT FALSE, -- مدير النظام الكلي
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON app_users(email);
CREATE INDEX idx_users_status ON app_users(status);

-- =============================================
-- 4. جدول الوحدات (Modules)
-- =============================================
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    description TEXT,
    icon VARCHAR(50),
    route VARCHAR(255),
    parent_id UUID REFERENCES modules(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. جدول الأدوار (خاص بكل شركة)
-- =============================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(50),
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    is_super_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

CREATE INDEX idx_roles_company ON roles(company_id);

-- =============================================
-- 6. جدول الصلاحيات
-- =============================================
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- read, write, delete, export, import, approve
    name VARCHAR(100),
    name_ar VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(module_id, action)
);

-- =============================================
-- 7. ربط الأدوار بالصلاحيات
-- =============================================
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- =============================================
-- 8. ربط المستخدمين بالشركات
-- =============================================
CREATE TABLE app_user_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id),
    is_owner BOOLEAN DEFAULT FALSE,
    is_primary BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

CREATE INDEX idx_user_companies_user ON app_user_companies(user_id);
CREATE INDEX idx_user_companies_company ON app_user_companies(company_id);

-- =============================================
-- 9. صلاحيات الفروع للمستخدمين
-- =============================================
CREATE TABLE user_branch_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    can_view BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, branch_id)
);

-- =============================================
-- 10. الأجهزة الموثوقة
-- =============================================
CREATE TABLE user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_info JSONB,
    ip_address VARCHAR(50),
    is_trusted BOOLEAN DEFAULT FALSE,
    is_current BOOLEAN DEFAULT FALSE,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 11. دعوات المستخدمين
-- =============================================
CREATE TABLE user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES roles(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    invited_by UUID REFERENCES app_users(id),
    status VARCHAR(50) DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Triggers
-- =============================================
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER branches_updated_at BEFORE UPDATE ON branches
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER app_users_updated_at BEFORE UPDATE ON app_users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER roles_updated_at BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER app_user_companies_updated_at BEFORE UPDATE ON app_user_companies
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ✅ تم إنشاء الجداول الأساسية
