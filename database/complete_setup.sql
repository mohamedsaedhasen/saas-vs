-- ============================================
-- نظام ERP SaaS - الإعداد الكامل (نسخة نظيفة)
-- Complete Fresh Database Setup
-- ============================================
-- 
-- تعليمات:
-- 1. انسخ هذا الملف بالكامل في Supabase SQL Editor
-- 2. اضغط Run
-- 3. انتظر حتى يكتمل
--
-- ⚠️ تحذير: هذا سيحذف كل البيانات الموجودة!
-- ============================================

-- تفعيل UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- الخطوة 1: حذف كل الجداول الموجودة
-- ============================================

-- حذف الـ functions أولاً (تحذف الـ triggers معها)
DROP FUNCTION IF EXISTS update_order_totals() CASCADE;
DROP FUNCTION IF EXISTS update_customer_stats() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- حذف كل الـ views
DROP VIEW IF EXISTS v_sales_summary CASCADE;
DROP VIEW IF EXISTS v_pending_cod CASCADE;

-- حذف كل الجداول (بالترتيب العكسي للـ dependencies)
DROP TABLE IF EXISTS shipping_returns_items CASCADE;
DROP TABLE IF EXISTS shipping_returns_inventory CASCADE;
DROP TABLE IF EXISTS shipping_collections CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS shipping_companies CASCADE;
DROP TABLE IF EXISTS shipping_carriers CASCADE;
DROP TABLE IF EXISTS cod_settlements CASCADE;
DROP TABLE IF EXISTS price_list_items CASCADE;
DROP TABLE IF EXISTS price_lists CASCADE;
DROP TABLE IF EXISTS sales_order_items CASCADE;
DROP TABLE IF EXISTS sales_orders CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS stock_transfer_items CASCADE;
DROP TABLE IF EXISTS stock_transfers CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS warehouse_branches CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS journal_entry_lines CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS cost_centers CASCADE;
DROP TABLE IF EXISTS banks CASCADE;
DROP TABLE IF EXISTS vaults CASCADE;
DROP TABLE IF EXISTS chart_of_accounts CASCADE;
DROP TABLE IF EXISTS user_branches CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS idempotency_keys CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS shopify_sync_logs CASCADE;

-- حذف الـ types
DROP TYPE IF EXISTS account_type CASCADE;
DROP TYPE IF EXISTS contact_type CASCADE;
DROP TYPE IF EXISTS invoice_type CASCADE;
DROP TYPE IF EXISTS payment_type CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;

-- ============================================
-- الخطوة 2: إنشاء Types
-- ============================================

CREATE TYPE account_type AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');
CREATE TYPE contact_type AS ENUM ('customer', 'supplier', 'both');
CREATE TYPE invoice_type AS ENUM ('sales', 'purchase', 'sales_return', 'purchase_return');
CREATE TYPE payment_type AS ENUM ('receipt', 'payment');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'check', 'card', 'other');

-- ============================================
-- الخطوة 3: جداول النظام الأساسية
-- ============================================

-- المشتركين
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    logo_url TEXT,
    settings JSONB DEFAULT '{"language": "ar", "currency": "EGP", "timezone": "Africa/Cairo", "vat_rate": 14}'::jsonb,
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    enabled_modules TEXT[] DEFAULT ARRAY['core', 'accounting', 'inventory', 'contacts', 'sales', 'purchases'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    preferences JSONB DEFAULT '{"language": "ar", "theme": "light"}'::jsonb,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

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
    settings JSONB DEFAULT '{"currency": "EGP", "vat_enabled": false, "vat_rate": 14}'::jsonb,
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
    manager_id UUID,
    shopify_store_url VARCHAR(255),
    shopify_api_key VARCHAR(255),
    shopify_access_token TEXT,
    is_main BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- الخطوة 4: المحاسبة
-- ============================================

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
    opening_balance DECIMAL(18,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, code)
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    entry_number VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL,
    description TEXT,
    reference_type VARCHAR(50),
    reference_id UUID,
    total_debit DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    created_by UUID REFERENCES users(id),
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES chart_of_accounts(id),
    description TEXT,
    debit DECIMAL(18,2) DEFAULT 0,
    credit DECIMAL(18,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- الخطوة 5: الخزن والبنوك
-- ============================================

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

CREATE TABLE banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    account_id UUID REFERENCES chart_of_accounts(id),
    bank_name VARCHAR(255) NOT NULL,
    account_name VARCHAR(255),
    account_number VARCHAR(100),
    iban VARCHAR(100),
    swift_code VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'EGP',
    opening_balance DECIMAL(18,2) DEFAULT 0,
    current_balance DECIMAL(18,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- الخطوة 6: العملاء والموردين
-- ============================================

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
    payment_terms INTEGER DEFAULT 0,
    opening_balance DECIMAL(18,2) DEFAULT 0,
    current_balance DECIMAL(18,2) DEFAULT 0,
    customer_group VARCHAR(50) DEFAULT 'retail',
    shopify_customer_id VARCHAR(100),
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(18,2) DEFAULT 0,
    last_order_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- الخطوة 7: المنتجات والمخازن
-- ============================================

CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    symbol VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES product_categories(id),
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    product_type VARCHAR(50) DEFAULT 'product',
    cost_price DECIMAL(18,2) DEFAULT 0,
    selling_price DECIMAL(18,2) DEFAULT 0,
    min_stock_level DECIMAL(18,3) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    track_inventory BOOLEAN DEFAULT true,
    shopify_product_id VARCHAR(100),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, sku)
);

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

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity DECIMAL(18,3) DEFAULT 0,
    reserved_quantity DECIMAL(18,3) DEFAULT 0,
    average_cost DECIMAL(18,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, warehouse_id)
);

-- ============================================
-- الخطوة 8: طلبات المبيعات
-- ============================================

CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    order_number VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    source VARCHAR(50) DEFAULT 'manual',
    shopify_order_id VARCHAR(100),
    shopify_order_name VARCHAR(50),
    customer_id UUID REFERENCES contacts(id),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    billing_address JSONB,
    shipping_address JSONB,
    subtotal DECIMAL(18,2) DEFAULT 0,
    discount_amount DECIMAL(18,2) DEFAULT 0,
    shipping_cost DECIMAL(18,2) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,
    total DECIMAL(18,2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    paid_amount DECIMAL(18,2) DEFAULT 0,
    remaining_amount DECIMAL(18,2) DEFAULT 0,
    payment_method VARCHAR(50),
    cod_amount DECIMAL(18,2) DEFAULT 0,
    fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled',
    warehouse_id UUID REFERENCES warehouses(id),
    tracking_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft',
    notes TEXT,
    tags TEXT[],
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, order_number)
);

CREATE TABLE sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    sku VARCHAR(100),
    name VARCHAR(500) NOT NULL,
    quantity DECIMAL(18,3) NOT NULL DEFAULT 1,
    fulfilled_quantity DECIMAL(18,3) DEFAULT 0,
    unit_price DECIMAL(18,2) NOT NULL,
    cost_price DECIMAL(18,2) DEFAULT 0,
    discount_amount DECIMAL(18,2) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,
    total DECIMAL(18,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- الخطوة 9: الشحن
-- ============================================

CREATE TABLE shipping_carriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    api_url TEXT,
    api_key TEXT,
    cod_enabled BOOLEAN DEFAULT true,
    cod_fee_amount DECIMAL(18,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, code)
);

CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    order_id UUID REFERENCES sales_orders(id),
    carrier_id UUID REFERENCES shipping_carriers(id),
    awb_number VARCHAR(100),
    tracking_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    cod_amount DECIMAL(18,2) DEFAULT 0,
    cod_collected BOOLEAN DEFAULT false,
    cod_settled BOOLEAN DEFAULT false,
    shipping_cost DECIMAL(18,2) DEFAULT 0,
    delivered_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- الخطوة 10: الفواتير والمدفوعات
-- ============================================

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
    subtotal DECIMAL(18,2) DEFAULT 0,
    discount_amount DECIMAL(18,2) DEFAULT 0,
    vat_amount DECIMAL(18,2) DEFAULT 0,
    total DECIMAL(18,2) DEFAULT 0,
    paid_amount DECIMAL(18,2) DEFAULT 0,
    remaining_amount DECIMAL(18,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    notes TEXT,
    shopify_order_id VARCHAR(100),
    journal_entry_id UUID REFERENCES journal_entries(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    description TEXT,
    quantity DECIMAL(18,3) NOT NULL,
    unit_price DECIMAL(18,2) NOT NULL,
    discount_amount DECIMAL(18,2) DEFAULT 0,
    vat_amount DECIMAL(18,2) DEFAULT 0,
    total DECIMAL(18,2) NOT NULL,
    cost_price DECIMAL(18,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    payment_type payment_type NOT NULL,
    payment_method payment_method NOT NULL,
    payment_number VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    contact_id UUID REFERENCES contacts(id),
    vault_id UUID REFERENCES vaults(id),
    bank_id UUID REFERENCES banks(id),
    amount DECIMAL(18,2) NOT NULL,
    reference VARCHAR(255),
    notes TEXT,
    invoice_id UUID REFERENCES invoices(id),
    journal_entry_id UUID REFERENCES journal_entries(id),
    status VARCHAR(50) DEFAULT 'confirmed',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- الخطوة 11: Indexes
-- ============================================

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_companies_tenant ON companies(tenant_id);
CREATE INDEX idx_branches_company ON branches(company_id);
CREATE INDEX idx_coa_company ON chart_of_accounts(company_id);
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_type ON contacts(contact_type);
CREATE INDEX idx_sales_orders_company ON sales_orders(company_id);
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_date ON sales_orders(order_date);
CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_contact ON invoices(contact_id);

-- ============================================
-- الخطوة 12: البيانات الافتراضية
-- ============================================

-- المستأجر الافتراضي
INSERT INTO tenants (id, name, slug, email) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'النظام الموحد للتجارة', 'unified-trade', 'admin@unified-trade.com');

-- المستخدم الافتراضي (المدير)
INSERT INTO users (id, tenant_id, email, full_name, full_name_en, role, is_owner) VALUES 
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'admin@unified-trade.com', 'مدير النظام', 'System Admin', 'admin', true);

-- الشركة الافتراضية
INSERT INTO companies (id, tenant_id, name, name_en, is_default) VALUES 
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'النظام الموحد للتجارة', 'Unified Trade System', true);

-- الفرع الرئيسي
INSERT INTO branches (id, company_id, name, name_en, is_main) VALUES 
    ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'الفرع الرئيسي', 'Main Branch', true);

-- المخزن الرئيسي
INSERT INTO warehouses (id, company_id, name, name_en, code) VALUES 
    ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'المخزن الرئيسي', 'Main Warehouse', 'WH-MAIN');

-- الخزنة الرئيسية
INSERT INTO vaults (id, company_id, name, code, opening_balance, current_balance) VALUES 
    ('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'الخزنة الرئيسية', 'VAULT-001', 0, 0);

-- وحدات القياس الافتراضية
INSERT INTO units (company_id, name, name_en, symbol) VALUES 
    ('33333333-3333-3333-3333-333333333333', 'قطعة', 'Piece', 'PC'),
    ('33333333-3333-3333-3333-333333333333', 'كيلو', 'Kilogram', 'KG'),
    ('33333333-3333-3333-3333-333333333333', 'متر', 'Meter', 'M'),
    ('33333333-3333-3333-3333-333333333333', 'لتر', 'Liter', 'L'),
    ('33333333-3333-3333-3333-333333333333', 'كرتونة', 'Box', 'BOX');

-- شركات الشحن المصرية
INSERT INTO shipping_carriers (company_id, name, code, cod_enabled) VALUES 
    ('33333333-3333-3333-3333-333333333333', 'بوسطة', 'BOSTA', true),
    ('33333333-3333-3333-3333-333333333333', 'أرامكس', 'ARAMEX', true),
    ('33333333-3333-3333-3333-333333333333', 'جي آند تي', 'JNT', true),
    ('33333333-3333-3333-3333-333333333333', 'R2S', 'R2S', true),
    ('33333333-3333-3333-3333-333333333333', 'مايلرز', 'MYLERZ', true);

-- ============================================
-- تم الانتهاء بنجاح! ✅
-- ============================================
-- 
-- الشركة: النظام الموحد للتجارة
-- المستخدم: admin@unified-trade.com
-- الفرع: الفرع الرئيسي
-- المخزن: المخزن الرئيسي
-- الخزنة: الخزنة الرئيسية
--
-- ============================================
