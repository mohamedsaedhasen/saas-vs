-- =============================================
-- نظام ERP SaaS - جداول المشتريات
-- أوامر الشراء، الفواتير، المرتجعات
-- =============================================

-- =============================================
-- 1. أوامر الشراء
-- =============================================
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    warehouse_id UUID REFERENCES warehouses(id),
    supplier_id UUID REFERENCES suppliers(id),
    order_number VARCHAR(50),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    currency VARCHAR(10) DEFAULT 'EGP',
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    shipping_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, confirmed, received, cancelled
    received_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES app_users(id),
    approved_by UUID REFERENCES app_users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    warehouse_id UUID REFERENCES warehouses(id),
    description TEXT,
    quantity_ordered DECIMAL(15,3) NOT NULL,
    quantity_received DECIMAL(15,3) DEFAULT 0,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_company ON purchase_orders(company_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_number ON purchase_orders(company_id, order_number);

-- =============================================
-- 2. فواتير المشتريات
-- =============================================
CREATE TABLE purchase_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    warehouse_id UUID REFERENCES warehouses(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    order_id UUID REFERENCES purchase_orders(id),
    invoice_number VARCHAR(50),
    supplier_invoice_number VARCHAR(100), -- رقم فاتورة المورد
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
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    status VARCHAR(50) DEFAULT 'draft',
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

CREATE TABLE purchase_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    warehouse_id UUID REFERENCES warehouses(id),
    description TEXT,
    quantity DECIMAL(15,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_invoices_company ON purchase_invoices(company_id);
CREATE INDEX idx_purchase_invoices_supplier ON purchase_invoices(supplier_id);
CREATE INDEX idx_purchase_invoices_number ON purchase_invoices(company_id, invoice_number);
CREATE INDEX idx_purchase_invoices_date ON purchase_invoices(company_id, invoice_date);

-- =============================================
-- 3. مرتجعات المشتريات
-- =============================================
CREATE TABLE purchase_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    warehouse_id UUID REFERENCES warehouses(id),
    supplier_id UUID REFERENCES suppliers(id),
    original_invoice_id UUID REFERENCES purchase_invoices(id),
    return_number VARCHAR(50),
    return_date DATE NOT NULL,
    reason VARCHAR(255),
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    refund_method VARCHAR(50) DEFAULT 'credit',
    refund_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft',
    journal_entry_id UUID REFERENCES journal_entries(id),
    notes TEXT,
    created_by UUID REFERENCES app_users(id),
    confirmed_by UUID REFERENCES app_users(id),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL REFERENCES purchase_returns(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    original_item_id UUID REFERENCES purchase_invoice_items(id),
    warehouse_id UUID REFERENCES warehouses(id),
    description TEXT,
    quantity DECIMAL(15,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_returns_company ON purchase_returns(company_id);
CREATE INDEX idx_purchase_returns_supplier ON purchase_returns(supplier_id);
CREATE INDEX idx_purchase_returns_invoice ON purchase_returns(original_invoice_id);

-- =============================================
-- Triggers
-- =============================================
CREATE TRIGGER purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER purchase_invoices_updated_at BEFORE UPDATE ON purchase_invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER purchase_returns_updated_at BEFORE UPDATE ON purchase_returns
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ✅ تم إنشاء جداول المشتريات
