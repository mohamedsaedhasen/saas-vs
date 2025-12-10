-- =============================================
-- نظام ERP SaaS - جداول المحاسبة
-- الحسابات، القيود، الخزائن
-- =============================================

-- =============================================
-- 1. شجرة الحسابات
-- =============================================
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    account_type VARCHAR(50) NOT NULL, -- asset, liability, equity, revenue, expense
    account_nature VARCHAR(10) NOT NULL DEFAULT 'debit', -- debit, credit
    is_header BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
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

CREATE INDEX idx_accounts_company ON accounts(company_id);
CREATE INDEX idx_accounts_parent ON accounts(parent_id);
CREATE INDEX idx_accounts_type ON accounts(company_id, account_type);
CREATE INDEX idx_accounts_code ON accounts(company_id, code);

-- =============================================
-- 2. الفترات المالية
-- =============================================
CREATE TABLE fiscal_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,
    period_number INTEGER NOT NULL, -- 1-12 للشهور
    period_name VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'open', -- open, closed, locked
    closed_by UUID REFERENCES app_users(id),
    closed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, fiscal_year, period_number)
);

CREATE INDEX idx_fiscal_periods_company ON fiscal_periods(company_id);

-- =============================================
-- 3. القيود المحاسبية
-- =============================================
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    entry_number VARCHAR(50),
    entry_date DATE NOT NULL,
    fiscal_year INTEGER,
    fiscal_period INTEGER,
    description TEXT,
    reference_type VARCHAR(50), -- sales_invoice, purchase_invoice, receipt, payment, expense
    reference_id UUID,
    total_debit DECIMAL(15,2) DEFAULT 0,
    total_credit DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft', -- draft, posted, cancelled
    is_auto_generated BOOLEAN DEFAULT FALSE,
    posted_by UUID REFERENCES app_users(id),
    posted_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES app_users(id),
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journal_entries_company ON journal_entries(company_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(company_id, entry_date);
CREATE INDEX idx_journal_entries_reference ON journal_entries(reference_type, reference_id);

-- =============================================
-- 4. تفاصيل القيود
-- =============================================
CREATE TABLE journal_entry_lines (
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

CREATE INDEX idx_journal_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_entry_lines(account_id);

-- =============================================
-- 5. الخزائن والبنوك
-- =============================================
CREATE TABLE vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    account_id UUID REFERENCES accounts(id),
    code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    vault_type VARCHAR(50) DEFAULT 'cash', -- cash, bank
    balance DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'EGP',
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(100),
    bank_iban VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

CREATE INDEX idx_vaults_company ON vaults(company_id);
CREATE INDEX idx_vaults_type ON vaults(company_id, vault_type);

-- =============================================
-- Triggers
-- =============================================
CREATE TRIGGER accounts_updated_at BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER fiscal_periods_updated_at BEFORE UPDATE ON fiscal_periods
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER journal_entries_updated_at BEFORE UPDATE ON journal_entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER vaults_updated_at BEFORE UPDATE ON vaults
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ✅ تم إنشاء جداول المحاسبة
