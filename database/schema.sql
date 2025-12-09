-- ============================================
-- نظام ERP SaaS - قاعدة البيانات الكاملة
-- قم بنسخ هذا الملف ولصقه في Supabase SQL Editor
-- ============================================

-- تفعيل UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. جداول النظام الأساسية (Multi-Tenant)
-- ============================================

-- المشتركين (Tenants)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    logo_url TEXT,
    
    -- الإعدادات
    settings JSONB DEFAULT '{
        "language": "ar",
        "currency": "EGP",
        "timezone": "Africa/Cairo",
        "vat_enabled": false,
        "vat_rate": 14,
        "cost_centers_enabled": false,
        "fiscal_year_start": "01-01"
    }'::jsonb,
    
    -- الاشتراك
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- المديولات المفعلة
    enabled_modules TEXT[] DEFAULT ARRAY['core', 'accounting', 'inventory', 'contacts'],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- خطط الاشتراك
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- الميزات
    max_users INTEGER DEFAULT 1,
    max_companies INTEGER DEFAULT 1,
    max_branches INTEGER DEFAULT 1,
    max_products INTEGER DEFAULT 100,
    included_modules TEXT[] DEFAULT ARRAY['core', 'accounting'],
    
    features JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. المستخدمين والصلاحيات
-- ============================================

-- المستخدمين
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    email VARCHAR(255) NOT NULL,
    password_hash TEXT,
    full_name VARCHAR(255) NOT NULL,
    full_name_en VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    
    role VARCHAR(50) DEFAULT 'user',
    is_owner BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- الإعدادات الشخصية
    preferences JSONB DEFAULT '{
        "language": "ar",
        "theme": "light",
        "notifications_enabled": true
    }'::jsonb,
    
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, email)
);

-- الأدوار
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description TEXT,
    
    -- صلاحيات كل مديول
    permissions JSONB DEFAULT '{}'::jsonb,
    
    is_system BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, name)
);

-- ربط المستخدمين بالأدوار
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, role_id)
);

-- ============================================
-- 3. الشركات والفروع
-- ============================================

-- الشركات
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    legal_name VARCHAR(255),
    
    tax_number VARCHAR(100),
    commercial_register VARCHAR(100),
    
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'مصر',
    
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    
    -- الإعدادات
    settings JSONB DEFAULT '{
        "currency": "EGP",
        "vat_enabled": false,
        "vat_rate": 14,
        "invoice_prefix": "INV",
        "invoice_start_number": 1
    }'::jsonb,
    
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- الفروع
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    code VARCHAR(50),
    
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    
    manager_id UUID REFERENCES users(id),
    
    -- Shopify API (كل فرع له API منفصل)
    shopify_store_url VARCHAR(255),
    shopify_api_key VARCHAR(255),
    shopify_api_secret TEXT,
    shopify_access_token TEXT,
    shopify_last_sync_at TIMESTAMP WITH TIME ZONE,
    
    is_main BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ربط المستخدمين بالفروع (صلاحيات الفروع)
CREATE TABLE user_branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, branch_id)
);

-- ============================================
-- 4. شجرة الحسابات والمحاسبة
-- ============================================

-- أنواع الحسابات
CREATE TYPE account_type AS ENUM (
    'asset',      -- أصول
    'liability',  -- خصوم
    'equity',     -- حقوق ملكية
    'revenue',    -- إيرادات
    'expense'     -- مصروفات
);

-- شجرة الحسابات
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES chart_of_accounts(id),
    
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    
    account_type account_type NOT NULL,
    
    description TEXT,
    
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    allows_transactions BOOLEAN DEFAULT true,
    
    -- الرصيد الافتتاحي
    opening_balance DECIMAL(18,2) DEFAULT 0,
    opening_balance_type VARCHAR(10) DEFAULT 'debit',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(company_id, code)
);

-- دفتر اليومية
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    
    entry_number VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL,
    
    description TEXT,
    reference_type VARCHAR(50),  -- invoice, payment, transfer, manual
    reference_id UUID,
    
    -- Idempotency Key لمنع التكرار
    idempotency_key VARCHAR(255) UNIQUE,
    
    total_debit DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    status VARCHAR(50) DEFAULT 'draft',  -- draft, posted, cancelled
    
    created_by UUID REFERENCES users(id),
    posted_by UUID REFERENCES users(id),
    posted_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- سطور دفتر اليومية
CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES chart_of_accounts(id),
    
    description TEXT,
    
    debit DECIMAL(18,2) DEFAULT 0,
    credit DECIMAL(18,2) DEFAULT 0,
    
    -- مركز التكلفة (اختياري)
    cost_center_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- مراكز التكلفة
CREATE TABLE cost_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES cost_centers(id),
    
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(company_id, code)
);

-- ============================================
-- 5. الخزن والبنوك
-- ============================================

-- الخزن
CREATE TABLE vaults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    account_id UUID REFERENCES chart_of_accounts(id),
    
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    code VARCHAR(50),
    
    currency VARCHAR(10) DEFAULT 'EGP',
    opening_balance DECIMAL(18,2) DEFAULT 0,
    current_balance DECIMAL(18,2) DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- البنوك
CREATE TABLE banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    account_id UUID REFERENCES chart_of_accounts(id),
    
    bank_name VARCHAR(255) NOT NULL,
    bank_name_en VARCHAR(255),
    
    account_name VARCHAR(255),
    account_number VARCHAR(100),
    iban VARCHAR(100),
    swift_code VARCHAR(50),
    
    branch_name VARCHAR(255),
    branch_address TEXT,
    
    currency VARCHAR(10) DEFAULT 'EGP',
    opening_balance DECIMAL(18,2) DEFAULT 0,
    current_balance DECIMAL(18,2) DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. العملاء والموردين
-- ============================================

CREATE TYPE contact_type AS ENUM ('customer', 'supplier', 'both');

CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    account_id UUID REFERENCES chart_of_accounts(id),
    
    contact_type contact_type NOT NULL,
    
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    
    tax_number VARCHAR(100),
    
    credit_limit DECIMAL(18,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 0,  -- أيام
    
    opening_balance DECIMAL(18,2) DEFAULT 0,
    current_balance DECIMAL(18,2) DEFAULT 0,
    
    notes TEXT,
    
    -- Shopify
    shopify_customer_id VARCHAR(100),
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. المنتجات والمخازن
-- ============================================

-- وحدات القياس
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    symbol VARCHAR(20),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فئات المنتجات
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES product_categories(id),
    
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    
    description TEXT,
    image_url TEXT,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- المنتجات
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id),
    unit_id UUID REFERENCES units(id),
    
    sku VARCHAR(100),
    barcode VARCHAR(100),
    
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    description TEXT,
    
    product_type VARCHAR(50) DEFAULT 'product',  -- product, service
    
    cost_price DECIMAL(18,2) DEFAULT 0,
    selling_price DECIMAL(18,2) DEFAULT 0,
    
    min_stock_level DECIMAL(18,3) DEFAULT 0,
    max_stock_level DECIMAL(18,3) DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    track_inventory BOOLEAN DEFAULT true,
    
    -- Shopify
    shopify_product_id VARCHAR(100),
    shopify_variant_id VARCHAR(100),
    
    image_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(company_id, sku)
);

-- المخازن
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    code VARCHAR(50),
    
    address TEXT,
    manager_id UUID REFERENCES users(id),
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ربط المخازن بالفروع
CREATE TABLE warehouse_branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(warehouse_id, branch_id)
);

-- أرصدة المخزون
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    
    quantity DECIMAL(18,3) DEFAULT 0,
    reserved_quantity DECIMAL(18,3) DEFAULT 0,
    available_quantity DECIMAL(18,3) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    
    average_cost DECIMAL(18,2) DEFAULT 0,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(product_id, warehouse_id)
);

-- حركات المخزون
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    warehouse_id UUID REFERENCES warehouses(id),
    
    movement_type VARCHAR(50) NOT NULL,  -- in, out, transfer, adjustment
    reference_type VARCHAR(50),  -- invoice, purchase, transfer, adjustment
    reference_id UUID,
    
    quantity DECIMAL(18,3) NOT NULL,
    unit_cost DECIMAL(18,2),
    
    from_warehouse_id UUID REFERENCES warehouses(id),
    to_warehouse_id UUID REFERENCES warehouses(id),
    
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تحويلات المخزون بين المخازن
CREATE TABLE stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    transfer_number VARCHAR(50) NOT NULL,
    transfer_date DATE NOT NULL,
    
    from_warehouse_id UUID REFERENCES warehouses(id) NOT NULL,
    to_warehouse_id UUID REFERENCES warehouses(id) NOT NULL,
    
    status VARCHAR(50) DEFAULT 'draft',  -- draft, in_transit, received, cancelled
    
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    received_by UUID REFERENCES users(id),
    received_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- سطور تحويلات المخزون
CREATE TABLE stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID REFERENCES stock_transfers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    
    quantity DECIMAL(18,3) NOT NULL,
    received_quantity DECIMAL(18,3) DEFAULT 0,
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. الفواتير والمستندات
-- ============================================

CREATE TYPE invoice_type AS ENUM ('sales', 'purchase', 'sales_return', 'purchase_return');

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    
    invoice_type invoice_type NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    
    contact_id UUID REFERENCES contacts(id),
    warehouse_id UUID REFERENCES warehouses(id),
    
    -- المبالغ
    subtotal DECIMAL(18,2) DEFAULT 0,
    discount_amount DECIMAL(18,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    vat_amount DECIMAL(18,2) DEFAULT 0,
    total DECIMAL(18,2) DEFAULT 0,
    paid_amount DECIMAL(18,2) DEFAULT 0,
    remaining_amount DECIMAL(18,2) DEFAULT 0,
    
    -- الضريبة
    vat_enabled BOOLEAN DEFAULT false,
    vat_rate DECIMAL(5,2) DEFAULT 14,
    
    status VARCHAR(50) DEFAULT 'draft',  -- draft, confirmed, paid, partial, cancelled
    payment_status VARCHAR(50) DEFAULT 'unpaid',  -- unpaid, partial, paid
    
    notes TEXT,
    
    -- Shopify
    shopify_order_id VARCHAR(100),
    shopify_order_number VARCHAR(100),
    
    -- القيد المحاسبي
    journal_entry_id UUID REFERENCES journal_entries(id),
    
    -- Idempotency
    idempotency_key VARCHAR(255) UNIQUE,
    
    created_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- سطور الفواتير
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    
    description TEXT,
    
    quantity DECIMAL(18,3) NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL,
    discount_amount DECIMAL(18,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    vat_amount DECIMAL(18,2) DEFAULT 0,
    total DECIMAL(18,2) NOT NULL,
    
    cost_price DECIMAL(18,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. المدفوعات والسندات
-- ============================================

CREATE TYPE payment_type AS ENUM ('receipt', 'payment');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'check', 'card', 'other');

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    
    payment_type payment_type NOT NULL,
    payment_method payment_method NOT NULL,
    
    payment_number VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    
    contact_id UUID REFERENCES contacts(id),
    
    -- مصدر الدفع/القبض
    vault_id UUID REFERENCES vaults(id),
    bank_id UUID REFERENCES banks(id),
    
    amount DECIMAL(18,2) NOT NULL,
    
    reference VARCHAR(255),
    notes TEXT,
    
    -- ربط بالفواتير
    invoice_id UUID REFERENCES invoices(id),
    
    -- القيد المحاسبي
    journal_entry_id UUID REFERENCES journal_entries(id),
    
    -- Idempotency
    idempotency_key VARCHAR(255) UNIQUE,
    
    status VARCHAR(50) DEFAULT 'confirmed',
    
    created_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 10. شركات الشحن
-- ============================================

CREATE TABLE shipping_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    account_id UUID REFERENCES chart_of_accounts(id),
    
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    code VARCHAR(50),
    
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    
    -- API Integration
    api_type VARCHAR(50),  -- aramex, dhl, fedex, custom
    api_key VARCHAR(255),
    api_secret TEXT,
    api_config JSONB DEFAULT '{}'::jsonb,
    
    -- الرسوم الافتراضية
    default_shipping_cost DECIMAL(18,2) DEFAULT 0,
    default_return_cost DECIMAL(18,2) DEFAULT 0,
    
    -- الأرصدة
    total_shipping_costs DECIMAL(18,2) DEFAULT 0,
    total_return_costs DECIMAL(18,2) DEFAULT 0,
    total_rejection_costs DECIMAL(18,2) DEFAULT 0,
    total_collected DECIMAL(18,2) DEFAULT 0,
    pending_collection DECIMAL(18,2) DEFAULT 0,
    
    current_balance DECIMAL(18,2) DEFAULT 0,  -- صافي الحساب
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- الشحنات
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    
    shipping_company_id UUID REFERENCES shipping_companies(id),
    invoice_id UUID REFERENCES invoices(id),
    
    tracking_number VARCHAR(100),
    shipment_date DATE NOT NULL,
    
    recipient_name VARCHAR(255),
    recipient_phone VARCHAR(50),
    recipient_address TEXT,
    recipient_city VARCHAR(100),
    
    -- المبالغ
    shipping_cost DECIMAL(18,2) DEFAULT 0,
    cod_amount DECIMAL(18,2) DEFAULT 0,  -- الدفع عند الاستلام
    
    status VARCHAR(50) DEFAULT 'pending',
    -- pending, shipped, in_transit, delivered, returned, rejected
    
    delivery_date DATE,
    return_date DATE,
    
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تحصيلات شركات الشحن
CREATE TABLE shipping_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipping_company_id UUID REFERENCES shipping_companies(id) ON DELETE CASCADE,
    
    collection_number VARCHAR(50) NOT NULL,
    collection_date DATE NOT NULL,
    
    -- المبالغ
    total_cod DECIMAL(18,2) DEFAULT 0,
    shipping_deductions DECIMAL(18,2) DEFAULT 0,
    return_deductions DECIMAL(18,2) DEFAULT 0,
    other_deductions DECIMAL(18,2) DEFAULT 0,
    net_amount DECIMAL(18,2) DEFAULT 0,
    
    -- طريقة الاستلام
    vault_id UUID REFERENCES vaults(id),
    bank_id UUID REFERENCES banks(id),
    
    notes TEXT,
    
    journal_entry_id UUID REFERENCES journal_entries(id),
    
    created_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- مخزون المرتجعات عند شركات الشحن
CREATE TABLE shipping_returns_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipping_company_id UUID REFERENCES shipping_companies(id) ON DELETE CASCADE,
    shipment_id UUID REFERENCES shipments(id),
    invoice_id UUID REFERENCES invoices(id),
    
    return_date DATE NOT NULL,
    
    status VARCHAR(50) DEFAULT 'at_shipping',
    -- at_shipping: عند شركة الشحن
    -- returned_to_warehouse: تم إرجاعه للمخزن
    
    returned_at TIMESTAMP WITH TIME ZONE,
    warehouse_id UUID REFERENCES warehouses(id),
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- منتجات المرتجعات
CREATE TABLE shipping_returns_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipping_return_id UUID REFERENCES shipping_returns_inventory(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    
    quantity DECIMAL(18,3) NOT NULL,
    unit_cost DECIMAL(18,2) DEFAULT 0,
    total_cost DECIMAL(18,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 11. Shopify Integration
-- ============================================

-- سجل المزامنة
CREATE TABLE shopify_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    
    sync_type VARCHAR(50) NOT NULL,  -- products, customers, orders, inventory
    direction VARCHAR(20) NOT NULL,  -- import, export
    
    status VARCHAR(50) DEFAULT 'pending',  -- pending, running, completed, failed
    
    records_total INTEGER DEFAULT 0,
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    
    error_message TEXT,
    
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 12. Idempotency Keys (لمنع التكرار)
-- ============================================

CREATE TABLE idempotency_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    
    request_path VARCHAR(255),
    request_body JSONB,
    response_body JSONB,
    
    status_code INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

-- ============================================
-- 13. سجل النشاطات (Audit Log)
-- ============================================

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    
    old_values JSONB,
    new_values JSONB,
    
    ip_address VARCHAR(50),
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 14. الإشعارات
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    body TEXT,
    
    type VARCHAR(50),  -- info, warning, success, error
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    action_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES للأداء
-- ============================================

-- Tenants
CREATE INDEX idx_tenants_slug ON tenants(slug);

-- Users
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

-- Companies & Branches
CREATE INDEX idx_companies_tenant ON companies(tenant_id);
CREATE INDEX idx_branches_company ON branches(company_id);

-- Chart of Accounts
CREATE INDEX idx_coa_company ON chart_of_accounts(company_id);
CREATE INDEX idx_coa_parent ON chart_of_accounts(parent_id);
CREATE INDEX idx_coa_type ON chart_of_accounts(account_type);

-- Journal Entries
CREATE INDEX idx_journal_company ON journal_entries(company_id);
CREATE INDEX idx_journal_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_reference ON journal_entries(reference_type, reference_id);
CREATE INDEX idx_journal_idempotency ON journal_entries(idempotency_key);

-- Products
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_shopify ON products(shopify_product_id);

-- Inventory
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_id);

-- Contacts
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_type ON contacts(contact_type);

-- Invoices
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_contact ON invoices(contact_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_shopify ON invoices(shopify_order_id);

-- Shipments
CREATE INDEX idx_shipments_company ON shipments(company_id);
CREATE INDEX idx_shipments_shipping_co ON shipments(shipping_company_id);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX idx_shipments_status ON shipments(status);

-- Activity Logs
CREATE INDEX idx_activity_tenant ON activity_logs(tenant_id);
CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);

-- ============================================
-- FUNCTIONS للأتمتة
-- ============================================

-- تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- تطبيق Trigger على الجداول
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chart_of_accounts_updated_at BEFORE UPDATE ON chart_of_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- تفعيل RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- البيانات الافتراضية
-- ============================================

-- خطط الاشتراك
INSERT INTO subscription_plans (name, name_ar, slug, price_monthly, price_yearly, max_users, max_companies, max_branches, max_products, included_modules) VALUES
('Free', 'مجاني', 'free', 0, 0, 1, 1, 1, 50, ARRAY['core', 'accounting']),
('Starter', 'المبتدئ', 'starter', 99, 999, 3, 1, 2, 500, ARRAY['core', 'accounting', 'inventory', 'contacts']),
('Professional', 'المحترف', 'professional', 299, 2999, 10, 3, 10, 5000, ARRAY['core', 'accounting', 'inventory', 'contacts', 'shopify']),
('Enterprise', 'المؤسسي', 'enterprise', 599, 5999, 50, 10, 50, -1, ARRAY['core', 'accounting', 'inventory', 'contacts', 'shopify', 'shipping', 'analytics']);

-- ============================================
-- تم الانتهاء!
-- ============================================
