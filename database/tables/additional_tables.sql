-- =========================================================
-- نظام ERP SaaS - جداول المرتجعات والتحويلات والجرد
-- الإصدار: 2.0
-- =========================================================

-- =========================================================
-- الجزء 1: مرتجعات المبيعات
-- =========================================================

CREATE TABLE IF NOT EXISTS sales_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    warehouse_id UUID REFERENCES warehouses(id),
    customer_id UUID REFERENCES customers(id),
    original_invoice_id UUID REFERENCES sales_invoices(id),
    return_number VARCHAR(50),
    return_date DATE NOT NULL,
    return_type VARCHAR(50) DEFAULT 'full', -- full, partial
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

CREATE TABLE IF NOT EXISTS sales_return_items (
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

-- فهارس
CREATE INDEX IF NOT EXISTS idx_sales_returns_company ON sales_returns(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_customer ON sales_returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_original ON sales_returns(original_invoice_id);

-- =========================================================
-- الجزء 2: مرتجعات المشتريات
-- =========================================================

CREATE TABLE IF NOT EXISTS purchase_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    warehouse_id UUID REFERENCES warehouses(id),
    supplier_id UUID REFERENCES suppliers(id),
    original_invoice_id UUID REFERENCES purchase_invoices(id),
    return_number VARCHAR(50),
    return_date DATE NOT NULL,
    return_type VARCHAR(50) DEFAULT 'full',
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

CREATE TABLE IF NOT EXISTS purchase_return_items (
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

-- فهارس
CREATE INDEX IF NOT EXISTS idx_purchase_returns_company ON purchase_returns(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_returns_supplier ON purchase_returns(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_returns_original ON purchase_returns(original_invoice_id);

-- =========================================================
-- الجزء 3: تحويلات المخزون
-- =========================================================

CREATE TABLE IF NOT EXISTS inventory_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    transfer_number VARCHAR(50),
    transfer_date DATE NOT NULL,
    from_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    to_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    status VARCHAR(50) DEFAULT 'draft', -- draft, pending, in_transit, completed, cancelled
    total_items INTEGER DEFAULT 0,
    total_quantity DECIMAL(15,3) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    requested_by UUID REFERENCES app_users(id),
    approved_by UUID REFERENCES app_users(id),
    approved_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    received_by UUID REFERENCES app_users(id),
    created_by UUID REFERENCES app_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES inventory_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity_requested DECIMAL(15,3) NOT NULL,
    quantity_sent DECIMAL(15,3) DEFAULT 0,
    quantity_received DECIMAL(15,3) DEFAULT 0,
    unit_cost DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس
CREATE INDEX IF NOT EXISTS idx_transfers_company ON inventory_transfers(company_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_warehouse ON inventory_transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_warehouse ON inventory_transfers(to_warehouse_id);

-- =========================================================
-- الجزء 4: الجرد
-- =========================================================

CREATE TABLE IF NOT EXISTS stocktakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    stocktake_number VARCHAR(50),
    stocktake_date DATE NOT NULL,
    stocktake_type VARCHAR(50) DEFAULT 'full', -- full, partial, cycle
    status VARCHAR(50) DEFAULT 'draft', -- draft, in_progress, completed, cancelled
    total_items INTEGER DEFAULT 0,
    items_counted INTEGER DEFAULT 0,
    items_matched INTEGER DEFAULT 0,
    items_variance INTEGER DEFAULT 0,
    total_variance_value DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    adjustment_entry_id UUID REFERENCES journal_entries(id),
    created_by UUID REFERENCES app_users(id),
    approved_by UUID REFERENCES app_users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stocktake_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stocktake_id UUID NOT NULL REFERENCES stocktakes(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    system_quantity DECIMAL(15,3) DEFAULT 0,
    counted_quantity DECIMAL(15,3),
    variance_quantity DECIMAL(15,3) GENERATED ALWAYS AS (COALESCE(counted_quantity, 0) - system_quantity) STORED,
    unit_cost DECIMAL(15,2) DEFAULT 0,
    variance_value DECIMAL(15,2) GENERATED ALWAYS AS ((COALESCE(counted_quantity, 0) - system_quantity) * unit_cost) STORED,
    status VARCHAR(50) DEFAULT 'pending', -- pending, counted, adjusted
    counted_by UUID REFERENCES app_users(id),
    counted_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس
CREATE INDEX IF NOT EXISTS idx_stocktakes_company ON stocktakes(company_id);
CREATE INDEX IF NOT EXISTS idx_stocktakes_warehouse ON stocktakes(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stocktake_items_product ON stocktake_items(product_id);

-- =========================================================
-- الجزء 5: الفترات المالية
-- =========================================================

CREATE TABLE IF NOT EXISTS fiscal_periods (
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
    reopened_by UUID REFERENCES app_users(id),
    reopened_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, fiscal_year, period_number)
);

-- فهرس
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_company ON fiscal_periods(company_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_year ON fiscal_periods(fiscal_year);

-- =========================================================
-- الجزء 6: عروض الأسعار
-- =========================================================

CREATE TABLE IF NOT EXISTS sales_quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    customer_id UUID REFERENCES customers(id),
    quotation_number VARCHAR(50),
    quotation_date DATE NOT NULL,
    valid_until DATE,
    currency VARCHAR(10) DEFAULT 'EGP',
    subtotal DECIMAL(15,2) DEFAULT 0,
    discount_type VARCHAR(20) DEFAULT 'amount',
    discount_value DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, accepted, rejected, expired, converted
    converted_to_order_id UUID,
    converted_to_invoice_id UUID,
    notes TEXT,
    terms TEXT,
    created_by UUID REFERENCES app_users(id),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_quotation_items (
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

-- فهارس
CREATE INDEX IF NOT EXISTS idx_quotations_company ON sales_quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_quotations_customer ON sales_quotations(customer_id);

-- =========================================================
-- الجزء 7: أوامر البيع
-- =========================================================

CREATE TABLE IF NOT EXISTS sales_orders (
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

CREATE TABLE IF NOT EXISTS sales_order_items (
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

-- فهارس
CREATE INDEX IF NOT EXISTS idx_sales_orders_company ON sales_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);

-- =========================================================
-- الجزء 8: أوامر الشراء
-- =========================================================

CREATE TABLE IF NOT EXISTS purchase_orders (
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

CREATE TABLE IF NOT EXISTS purchase_order_items (
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

-- فهارس
CREATE INDEX IF NOT EXISTS idx_purchase_orders_company ON purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);

-- =========================================================
-- الجزء 9: خطط الاشتراك (SaaS)
-- =========================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
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

CREATE TABLE IF NOT EXISTS company_subscriptions (
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

CREATE TABLE IF NOT EXISTS usage_tracking (
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

-- فهارس
CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON company_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_usage_company ON usage_tracking(company_id);

-- =========================================================
-- الجزء 10: معدلات الضرائب
-- =========================================================

CREATE TABLE IF NOT EXISTS tax_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(50),
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    rate DECIMAL(5,2) NOT NULL,
    tax_type VARCHAR(50) DEFAULT 'vat', -- vat, sales_tax, withholding
    is_inclusive BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- =========================================================
-- RLS للجداول الجديدة
-- =========================================================

ALTER TABLE sales_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocktakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocktake_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;

-- سياسات RLS
CREATE POLICY sales_returns_all ON sales_returns FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY purchase_returns_all ON purchase_returns FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY inventory_transfers_all ON inventory_transfers FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY stocktakes_all ON stocktakes FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY fiscal_periods_all ON fiscal_periods FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY sales_quotations_all ON sales_quotations FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY sales_orders_all ON sales_orders FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY purchase_orders_all ON purchase_orders FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY tax_rates_all ON tax_rates FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- =========================================================
-- النهاية
-- =========================================================
