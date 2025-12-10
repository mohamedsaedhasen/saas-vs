-- =============================================
-- نظام ERP SaaS - المقبوضات والمدفوعات
-- =============================================

-- =============================================
-- 1. سندات القبض (المقبوضات)
-- =============================================
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    vault_id UUID REFERENCES vaults(id),
    customer_id UUID REFERENCES customers(id),
    receipt_number VARCHAR(50),
    receipt_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'EGP',
    exchange_rate DECIMAL(15,6) DEFAULT 1,
    payment_method VARCHAR(50) DEFAULT 'cash', -- cash, check, bank_transfer, card
    check_number VARCHAR(100),
    check_date DATE,
    bank_name VARCHAR(255),
    reference_number VARCHAR(100),
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, confirmed, cancelled
    journal_entry_id UUID REFERENCES journal_entries(id),
    notes TEXT,
    created_by UUID REFERENCES app_users(id),
    confirmed_by UUID REFERENCES app_users(id),
    confirmed_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES app_users(id),
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ربط المقبوضات بالفواتير
CREATE TABLE receipt_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES sales_invoices(id),
    amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_receipts_company ON receipts(company_id);
CREATE INDEX idx_receipts_customer ON receipts(customer_id);
CREATE INDEX idx_receipts_number ON receipts(company_id, receipt_number);
CREATE INDEX idx_receipts_date ON receipts(company_id, receipt_date);

-- =============================================
-- 2. سندات الصرف (المدفوعات)
-- =============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    vault_id UUID REFERENCES vaults(id),
    supplier_id UUID REFERENCES suppliers(id),
    payment_number VARCHAR(50),
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'EGP',
    exchange_rate DECIMAL(15,6) DEFAULT 1,
    payment_method VARCHAR(50) DEFAULT 'cash',
    check_number VARCHAR(100),
    check_date DATE,
    bank_name VARCHAR(255),
    reference_number VARCHAR(100),
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    journal_entry_id UUID REFERENCES journal_entries(id),
    notes TEXT,
    created_by UUID REFERENCES app_users(id),
    confirmed_by UUID REFERENCES app_users(id),
    confirmed_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES app_users(id),
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ربط المدفوعات بالفواتير
CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES purchase_invoices(id),
    amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_company ON payments(company_id);
CREATE INDEX idx_payments_supplier ON payments(supplier_id);
CREATE INDEX idx_payments_number ON payments(company_id, payment_number);
CREATE INDEX idx_payments_date ON payments(company_id, payment_date);

-- =============================================
-- 3. سندات المصروفات
-- =============================================
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES expense_categories(id),
    account_id UUID REFERENCES accounts(id),
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

CREATE TABLE expense_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    vault_id UUID REFERENCES vaults(id),
    category_id UUID REFERENCES expense_categories(id),
    voucher_number VARCHAR(50),
    voucher_date DATE NOT NULL,
    beneficiary_name VARCHAR(255),
    beneficiary_type VARCHAR(50), -- supplier, employee, other
    beneficiary_id UUID,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'EGP',
    payment_method VARCHAR(50) DEFAULT 'cash',
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    journal_entry_id UUID REFERENCES journal_entries(id),
    notes TEXT,
    attachments TEXT[],
    created_by UUID REFERENCES app_users(id),
    approved_by UUID REFERENCES app_users(id),
    approved_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES app_users(id),
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expense_voucher_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id UUID NOT NULL REFERENCES expense_vouchers(id) ON DELETE CASCADE,
    category_id UUID REFERENCES expense_categories(id),
    account_id UUID REFERENCES accounts(id),
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expense_vouchers_company ON expense_vouchers(company_id);
CREATE INDEX idx_expense_vouchers_category ON expense_vouchers(category_id);
CREATE INDEX idx_expense_vouchers_number ON expense_vouchers(company_id, voucher_number);

-- =============================================
-- Triggers
-- =============================================
CREATE TRIGGER receipts_updated_at BEFORE UPDATE ON receipts
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER expense_vouchers_updated_at BEFORE UPDATE ON expense_vouchers
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ✅ تم إنشاء جداول المقبوضات والمدفوعات والمصروفات
