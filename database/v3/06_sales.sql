-- =============================================
-- نظام ERP SaaS - جداول المبيعات
-- عروض الأسعار، الطلبات، الفواتير، المرتجعات
-- =============================================

-- =============================================
-- 1. عروض الأسعار
-- =============================================
CREATE TABLE sales_quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    customer_id UUID REFERENCES customers(id),
    quotation_number VARCHAR(50),
    quotation_date DATE NOT NULL,
    valid_until DATE,
    currency VARCHAR(10) DEFAULT 'EGP',
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_type VARCHAR(20) DEFAULT 'amount', -- amount, percentage
    discount_value DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, accepted, rejected, expired, converted
    converted_to_invoice_id UUID,
    notes TEXT,
    terms TEXT,
    created_by UUID REFERENCES app_users(id),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales_quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES sales_quotations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    description TEXT,
    quantity DECIMAL(15,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quotations_company ON sales_quotations(company_id);
CREATE INDEX idx_quotations_customer ON sales_quotations(customer_id);
CREATE INDEX idx_quotations_number ON sales_quotations(company_id, quotation_number);

-- =============================================
-- 2. أوامر البيع
-- =============================================
CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    warehouse_id UUID REFERENCES warehouses(id),
    customer_id UUID REFERENCES customers(id),
    quotation_id UUID REFERENCES sales_quotations(id),
    order_number VARCHAR(50),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    currency VARCHAR(10) DEFAULT 'EGP',
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    shipping_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft', -- draft, confirmed, processing, shipped, delivered, cancelled
    invoiced_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    shipping_address TEXT,
    created_by UUID REFERENCES app_users(id),
    confirmed_by UUID REFERENCES app_users(id),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    warehouse_id UUID REFERENCES warehouses(id),
    description TEXT,
    quantity_ordered DECIMAL(15,3) NOT NULL,
    quantity_delivered DECIMAL(15,3) DEFAULT 0,
    quantity_invoiced DECIMAL(15,3) DEFAULT 0,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_orders_company ON sales_orders(company_id);
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_number ON sales_orders(company_id, order_number);

-- =============================================
-- 3. فواتير المبيعات
-- =============================================
CREATE TABLE sales_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    warehouse_id UUID REFERENCES warehouses(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    order_id UUID REFERENCES sales_orders(id),
    invoice_number VARCHAR(50),
    invoice_date DATE NOT NULL,
    due_date DATE,
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
    balance DECIMAL(15,2) GENERATED ALWAYS AS (total - paid_amount) STORED,
    payment_method VARCHAR(50), -- cash, credit, bank
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, partial, paid
    status VARCHAR(50) DEFAULT 'draft', -- draft, confirmed, cancelled
    journal_entry_id UUID REFERENCES journal_entries(id),
    notes TEXT,
    internal_notes TEXT,
    created_by UUID REFERENCES app_users(id),
    confirmed_by UUID REFERENCES app_users(id),
    confirmed_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES app_users(id),
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    warehouse_id UUID REFERENCES warehouses(id),
    description TEXT,
    quantity DECIMAL(15,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    cost_price DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_invoices_company ON sales_invoices(company_id);
CREATE INDEX idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX idx_sales_invoices_number ON sales_invoices(company_id, invoice_number);
CREATE INDEX idx_sales_invoices_date ON sales_invoices(company_id, invoice_date);
CREATE INDEX idx_sales_invoices_status ON sales_invoices(company_id, status);

-- =============================================
-- 4. مرتجعات المبيعات
-- =============================================
CREATE TABLE sales_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    warehouse_id UUID REFERENCES warehouses(id),
    customer_id UUID REFERENCES customers(id),
    original_invoice_id UUID REFERENCES sales_invoices(id),
    return_number VARCHAR(50),
    return_date DATE NOT NULL,
    reason VARCHAR(255),
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    refund_method VARCHAR(50) DEFAULT 'credit', -- credit, cash, bank
    refund_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft', -- draft, confirmed, cancelled
    journal_entry_id UUID REFERENCES journal_entries(id),
    notes TEXT,
    created_by UUID REFERENCES app_users(id),
    confirmed_by UUID REFERENCES app_users(id),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL REFERENCES sales_returns(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    original_item_id UUID REFERENCES sales_invoice_items(id),
    warehouse_id UUID REFERENCES warehouses(id),
    description TEXT,
    quantity DECIMAL(15,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    cost_price DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    reason VARCHAR(255),
    condition VARCHAR(50) DEFAULT 'good', -- good, damaged, expired
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_returns_company ON sales_returns(company_id);
CREATE INDEX idx_sales_returns_customer ON sales_returns(customer_id);
CREATE INDEX idx_sales_returns_invoice ON sales_returns(original_invoice_id);

-- =============================================
-- Triggers
-- =============================================
CREATE TRIGGER sales_quotations_updated_at BEFORE UPDATE ON sales_quotations
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sales_orders_updated_at BEFORE UPDATE ON sales_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sales_invoices_updated_at BEFORE UPDATE ON sales_invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sales_returns_updated_at BEFORE UPDATE ON sales_returns
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ✅ تم إنشاء جداول المبيعات
