-- =============================================
-- نظام ERP SaaS V2 - السكيمة المحسّنة
-- تاريخ الإنشاء: 2024-12-07
-- التحسينات:
--   - نظام الفروع (Multi-Branch)
--   - RBAC على مستوى الشركة
--   - Consistency Constraints
--   - دعم RLS الكامل
-- =============================================

-- تفعيل UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- الجزء 1: الجداول الأساسية
-- =============================================

-- 1.1 جدول الشركات (Tenants)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
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
    subscription_plan VARCHAR(50) DEFAULT 'trial',
    subscription_ends_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 جدول الفروع (Branches)
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    manager_id UUID, -- سيتم ربطه لاحقاً بـ app_users
    is_headquarters BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- =============================================
-- الجزء 2: نظام المستخدمين والصلاحيات
-- =============================================

-- 2.1 جدول الوحدات (Modules) - عام لكل النظام
CREATE TABLE IF NOT EXISTS modules (
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

-- 2.2 جدول الأدوار (خاص بكل شركة)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(50),
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- أدوار النظام لا يمكن حذفها
    is_super_admin BOOLEAN DEFAULT FALSE, -- صلاحيات كاملة
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- 2.3 جدول الصلاحيات (تعريف الصلاحيات المتاحة)
CREATE TABLE IF NOT EXISTS permissions (
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

-- 2.4 جدول ربط الأدوار بالصلاحيات
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- 2.5 جدول المستخدمين (بدون role_id)
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, suspended, pending
    email_verified_at TIMESTAMPTZ,
    device_restriction_enabled BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(50),
    password_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 جدول ربط المستخدمين بالشركات (مع role_id)
CREATE TABLE IF NOT EXISTS app_user_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id), -- الدور في هذه الشركة تحديداً
    is_owner BOOLEAN DEFAULT FALSE, -- مالك الشركة
    is_primary BOOLEAN DEFAULT FALSE, -- الشركة الافتراضية للمستخدم
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active', -- active, suspended
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_id)
);

-- 2.7 جدول صلاحيات الفروع للمستخدمين
CREATE TABLE IF NOT EXISTS user_branch_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    can_view BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE, -- الفرع الافتراضي
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, branch_id)
);

-- ربط manager_id في branches بعد إنشاء app_users
ALTER TABLE branches 
ADD CONSTRAINT fk_branches_manager 
FOREIGN KEY (manager_id) REFERENCES app_users(id) ON DELETE SET NULL;

-- 2.8 جدول دعوات المستخدمين
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES roles(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    invited_by UUID REFERENCES app_users(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, expired, cancelled
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 جدول الأجهزة الموثوقة
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_info JSONB,
    ip_address VARCHAR(50),
    is_trusted BOOLEAN DEFAULT FALSE,
    is_current BOOLEAN DEFAULT FALSE,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_fingerprint)
);

-- 2.10 جدول طلبات الموافقة على الأجهزة
CREATE TABLE IF NOT EXISTS device_approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    reviewed_by UUID REFERENCES app_users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- الجزء 3: الأطراف (العملاء والموردين)
-- =============================================

-- 3.1 جدول العملاء
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL, -- الفرع المسؤول
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    customer_type VARCHAR(50) DEFAULT 'individual', -- individual, company
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    tax_number VARCHAR(100),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    credit_days INTEGER DEFAULT 0,
    balance DECIMAL(15,2) DEFAULT 0,
    account_id UUID, -- سيتم ربطه بـ accounts
    price_list_id UUID, -- للأسعار الخاصة
    notes TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- 3.2 جدول الموردين
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    supplier_type VARCHAR(50) DEFAULT 'company',
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    tax_number VARCHAR(100),
    payment_terms INTEGER DEFAULT 0, -- أيام السداد
    balance DECIMAL(15,2) DEFAULT 0,
    account_id UUID,
    notes TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- =============================================
-- الجزء 4: المنتجات والمخزون
-- =============================================

-- 4.1 فئات المنتجات
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- 4.2 وحدات القياس
CREATE TABLE IF NOT EXISTS units_of_measure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    is_base_unit BOOLEAN DEFAULT TRUE,
    conversion_factor DECIMAL(15,6) DEFAULT 1,
    base_unit_id UUID REFERENCES units_of_measure(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- 4.3 المنتجات
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units_of_measure(id),
    sku VARCHAR(100),
    barcode VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description TEXT,
    product_type VARCHAR(50) DEFAULT 'stockable', -- stockable, service, consumable
    cost_price DECIMAL(15,2) DEFAULT 0,
    selling_price DECIMAL(15,2) DEFAULT 0,
    wholesale_price DECIMAL(15,2) DEFAULT 0,
    min_price DECIMAL(15,2) DEFAULT 0, -- أقل سعر بيع مسموح
    tax_rate DECIMAL(5,2) DEFAULT 0,
    min_stock_level DECIMAL(15,3) DEFAULT 0,
    max_stock_level DECIMAL(15,3) DEFAULT 0,
    reorder_level DECIMAL(15,3) DEFAULT 0,
    weight DECIMAL(10,3),
    dimensions JSONB, -- {length, width, height}
    image_url TEXT,
    images TEXT[], -- مصفوفة صور
    is_active BOOLEAN DEFAULT TRUE,
    is_sellable BOOLEAN DEFAULT TRUE,
    is_purchasable BOOLEAN DEFAULT TRUE,
    track_inventory BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, sku)
);

-- 4.4 المخازن
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    address TEXT,
    manager_id UUID REFERENCES app_users(id),
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    allow_negative_stock BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- 4.5 مخزون المنتجات
CREATE TABLE IF NOT EXISTS product_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity DECIMAL(15,3) DEFAULT 0,
    reserved_quantity DECIMAL(15,3) DEFAULT 0,
    available_quantity DECIMAL(15,3) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    avg_cost DECIMAL(15,2) DEFAULT 0,
    last_stock_date TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, warehouse_id)
);

-- 4.6 حركات المخزون
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL, -- in, out, transfer, adjustment
    reference_type VARCHAR(50), -- sales_invoice, purchase_invoice, transfer, adjustment
    reference_id UUID,
    quantity DECIMAL(15,3) NOT NULL,
    unit_cost DECIMAL(15,2),
    total_cost DECIMAL(15,2),
    quantity_before DECIMAL(15,3),
    quantity_after DECIMAL(15,3),
    notes TEXT,
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- الجزء 5: المحاسبة
-- =============================================

-- 5.1 شجرة الحسابات
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    account_type VARCHAR(50) NOT NULL, -- asset, liability, equity, revenue, expense
    account_nature VARCHAR(10) NOT NULL DEFAULT 'debit', -- debit, credit
    is_header BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE, -- حسابات النظام لا يمكن حذفها
    balance DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'EGP',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_bank_account BOOLEAN DEFAULT FALSE,
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- ربط حسابات العملاء والموردين
ALTER TABLE customers ADD CONSTRAINT fk_customers_account 
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE suppliers ADD CONSTRAINT fk_suppliers_account 
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;

-- 5.2 القيود المحاسبية
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    entry_number VARCHAR(50),
    entry_date DATE NOT NULL,
    fiscal_year INTEGER,
    fiscal_period INTEGER, -- الشهر
    description TEXT,
    reference_type VARCHAR(50), -- sales_invoice, purchase_invoice, receipt, payment
    reference_id UUID,
    total_debit DECIMAL(15,2) DEFAULT 0,
    total_credit DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft', -- draft, posted, cancelled
    is_auto_generated BOOLEAN DEFAULT FALSE,
    posted_by UUID REFERENCES app_users(id),
    posted_at TIMESTAMPTZ,
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.3 تفاصيل القيود
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id),
    description TEXT,
    debit DECIMAL(15,2) DEFAULT 0,
    credit DECIMAL(15,2) DEFAULT 0,
    cost_center_id UUID,
    partner_type VARCHAR(50), -- customer, supplier
    partner_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.4 الخزائن
CREATE TABLE IF NOT EXISTS vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    account_id UUID REFERENCES accounts(id), -- الحساب المرتبط
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    vault_type VARCHAR(50) DEFAULT 'cash', -- cash, bank
    balance DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'EGP',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- =============================================
-- الجزء 6: المبيعات
-- =============================================

-- 6.1 فواتير المبيعات
CREATE TABLE IF NOT EXISTS sales_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    warehouse_id UUID REFERENCES warehouses(id),
    customer_id UUID REFERENCES customers(id),
    invoice_number VARCHAR(50),
    invoice_date DATE NOT NULL,
    due_date DATE,
    invoice_type VARCHAR(50) DEFAULT 'invoice', -- invoice, return, quotation
    payment_method VARCHAR(50) DEFAULT 'cash', -- cash, credit, bank
    currency VARCHAR(10) DEFAULT 'EGP',
    exchange_rate DECIMAL(15,6) DEFAULT 1,
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_type VARCHAR(20) DEFAULT 'amount', -- amount, percentage
    discount_value DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    shipping_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (total - paid_amount) STORED,
    status VARCHAR(50) DEFAULT 'draft', -- draft, confirmed, paid, partial, cancelled
    journal_entry_id UUID REFERENCES journal_entries(id),
    notes TEXT,
    internal_notes TEXT,
    created_by UUID REFERENCES app_users(id),
    confirmed_by UUID REFERENCES app_users(id),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.2 تفاصيل فواتير المبيعات
CREATE TABLE IF NOT EXISTS sales_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    warehouse_id UUID REFERENCES warehouses(id),
    description TEXT,
    quantity DECIMAL(15,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    cost_price DECIMAL(15,2) DEFAULT 0,
    discount_type VARCHAR(20) DEFAULT 'amount',
    discount_value DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    profit DECIMAL(15,2) GENERATED ALWAYS AS (total - (cost_price * quantity)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.3 سندات القبض
CREATE TABLE IF NOT EXISTS receipt_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    voucher_number VARCHAR(50),
    voucher_date DATE NOT NULL,
    vault_id UUID REFERENCES vaults(id),
    customer_id UUID REFERENCES customers(id),
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    reference_type VARCHAR(50), -- sales_invoice, advance
    reference_id UUID,
    description TEXT,
    status VARCHAR(50) DEFAULT 'confirmed', -- draft, confirmed, cancelled
    journal_entry_id UUID REFERENCES journal_entries(id),
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- الجزء 7: المشتريات
-- =============================================

-- 7.1 فواتير المشتريات
CREATE TABLE IF NOT EXISTS purchase_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    warehouse_id UUID REFERENCES warehouses(id),
    supplier_id UUID REFERENCES suppliers(id),
    invoice_number VARCHAR(50),
    supplier_invoice_number VARCHAR(100),
    invoice_date DATE NOT NULL,
    due_date DATE,
    invoice_type VARCHAR(50) DEFAULT 'invoice', -- invoice, return
    payment_method VARCHAR(50) DEFAULT 'credit',
    currency VARCHAR(10) DEFAULT 'EGP',
    exchange_rate DECIMAL(15,6) DEFAULT 1,
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_type VARCHAR(20) DEFAULT 'amount',
    discount_value DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    shipping_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (total - paid_amount) STORED,
    status VARCHAR(50) DEFAULT 'draft',
    journal_entry_id UUID REFERENCES journal_entries(id),
    notes TEXT,
    created_by UUID REFERENCES app_users(id),
    confirmed_by UUID REFERENCES app_users(id),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7.2 تفاصيل فواتير المشتريات
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    warehouse_id UUID REFERENCES warehouses(id),
    description TEXT,
    quantity DECIMAL(15,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_type VARCHAR(20) DEFAULT 'amount',
    discount_value DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7.3 سندات الصرف
CREATE TABLE IF NOT EXISTS payment_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    voucher_number VARCHAR(50),
    voucher_date DATE NOT NULL,
    vault_id UUID REFERENCES vaults(id),
    supplier_id UUID REFERENCES suppliers(id),
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    reference_type VARCHAR(50),
    reference_id UUID,
    description TEXT,
    status VARCHAR(50) DEFAULT 'confirmed',
    journal_entry_id UUID REFERENCES journal_entries(id),
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- الجزء 8: الشحن
-- =============================================

-- 8.1 شركات الشحن
CREATE TABLE IF NOT EXISTS shipping_carriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    tracking_url_template TEXT,
    api_credentials JSONB, -- مشفرة
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- 8.2 الشحنات
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    carrier_id UUID REFERENCES shipping_carriers(id),
    sales_invoice_id UUID REFERENCES sales_invoices(id),
    shipment_number VARCHAR(100),
    tracking_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending', -- pending, picked_up, in_transit, delivered, returned, cancelled
    recipient_name VARCHAR(255),
    recipient_phone VARCHAR(50),
    recipient_address TEXT,
    recipient_city VARCHAR(100),
    cod_amount DECIMAL(15,2) DEFAULT 0, -- المبلغ المطلوب تحصيله
    cod_collected DECIMAL(15,2) DEFAULT 0,
    shipping_cost DECIMAL(15,2) DEFAULT 0,
    weight DECIMAL(10,3),
    packages_count INTEGER DEFAULT 1,
    notes TEXT,
    pickup_date TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    returned_at TIMESTAMPTZ,
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- الجزء 9: السجلات والتتبع
-- =============================================

-- 9.1 سجل الأنشطة
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50),
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    resource_name VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9.2 الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info', -- info, warning, error, success
    category VARCHAR(50), -- inventory, sales, accounting
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    action_url TEXT,
    action_data JSONB,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- الجزء 10: تسلسلات الأرقام
-- =============================================

CREATE TABLE IF NOT EXISTS number_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    document_type VARCHAR(50) NOT NULL, -- sales_invoice, purchase_invoice, receipt, payment, shipment
    prefix VARCHAR(20),
    suffix VARCHAR(20),
    next_number INTEGER DEFAULT 1,
    padding INTEGER DEFAULT 5, -- عدد الأصفار
    reset_period VARCHAR(20), -- yearly, monthly, never
    last_reset_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, branch_id, document_type)
);

-- =============================================
-- الفهارس
-- =============================================

-- فهارس الأداء
CREATE INDEX IF NOT EXISTS idx_branches_company ON branches(company_id);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_user_companies_user ON app_user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_app_user_companies_company ON app_user_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_user_branch_access_user ON user_branch_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_branch_access_branch ON user_branch_access(branch_id);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_branch ON customers(branch_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(company_id, sku);
CREATE INDEX IF NOT EXISTS idx_warehouses_company ON warehouses(company_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_branch ON warehouses(branch_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_product ON product_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_warehouse ON product_inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_accounts_company ON accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_parent ON accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_company ON journal_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_company ON sales_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_branch ON sales_invoices(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_company ON purchase_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier ON purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_shipments_company ON shipments(company_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_activity_logs_company ON user_activity_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- =============================================
-- إدخال البيانات الافتراضية
-- =============================================

-- الوحدات
INSERT INTO modules (code, name, name_ar, icon, route, sort_order) VALUES
    ('dashboard', 'Dashboard', 'لوحة التحكم', 'LayoutDashboard', '/dashboard', 1),
    ('sales', 'Sales', 'المبيعات', 'ShoppingCart', '/dashboard/sales', 2),
    ('purchases', 'Purchases', 'المشتريات', 'Package', '/dashboard/purchases', 3),
    ('inventory', 'Inventory', 'المخزون', 'Warehouse', '/dashboard/inventory', 4),
    ('products', 'Products', 'المنتجات', 'Box', '/dashboard/products', 5),
    ('customers', 'Customers', 'العملاء', 'Users', '/dashboard/customers', 6),
    ('suppliers', 'Suppliers', 'الموردين', 'Truck', '/dashboard/suppliers', 7),
    ('accounting', 'Accounting', 'المحاسبة', 'Calculator', '/dashboard/accounting', 8),
    ('shipping', 'Shipping', 'الشحن', 'Package', '/dashboard/shipping', 9),
    ('reports', 'Reports', 'التقارير', 'BarChart', '/dashboard/reports', 10),
    ('settings', 'Settings', 'الإعدادات', 'Settings', '/dashboard/settings', 11),
    ('users', 'Users', 'المستخدمين', 'UserCog', '/dashboard/settings/users', 12),
    ('roles', 'Roles', 'الأدوار', 'Shield', '/dashboard/settings/roles', 13),
    ('branches', 'Branches', 'الفروع', 'Building', '/dashboard/settings/branches', 14)
ON CONFLICT (code) DO NOTHING;

-- الصلاحيات
INSERT INTO permissions (module_id, code, action, name, name_ar)
SELECT m.id, m.code || '_' || a.action, a.action, a.name, a.name_ar
FROM modules m
CROSS JOIN (
    VALUES 
        ('read', 'Read', 'عرض'),
        ('write', 'Write', 'إضافة/تعديل'),
        ('delete', 'Delete', 'حذف'),
        ('export', 'Export', 'تصدير'),
        ('import', 'Import', 'استيراد'),
        ('approve', 'Approve', 'اعتماد')
) AS a(action, name, name_ar)
ON CONFLICT (module_id, action) DO NOTHING;

-- =============================================
-- النهاية
-- =============================================
