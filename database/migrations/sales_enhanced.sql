-- ============================================
-- مديول المبيعات - Shopify Compatible Schema
-- ============================================

-- تحديث جدول جهات الاتصال للعملاء
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS customer_group VARCHAR(50) DEFAULT 'retail';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(18,2) DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS default_price_list_id UUID;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS shopify_customer_id VARCHAR(100);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS shopify_synced_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS total_spent DECIMAL(18,2) DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_order_date DATE;

-- ============================================
-- طلبات المبيعات (Sales Orders)
-- ============================================

CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    
    -- Order Info
    order_number VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    
    -- Source (manual, shopify, api, pos)
    source VARCHAR(50) DEFAULT 'manual',
    shopify_order_id VARCHAR(100),
    shopify_order_number VARCHAR(50),
    shopify_order_name VARCHAR(50),
    
    -- Customer
    customer_id UUID REFERENCES contacts(id),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    
    -- Addresses (JSONB for Shopify compatibility)
    billing_address JSONB,
    shipping_address JSONB,
    
    -- Amounts
    subtotal DECIMAL(18,2) DEFAULT 0,
    discount_code VARCHAR(50),
    discount_amount DECIMAL(18,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    shipping_cost DECIMAL(18,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,
    total DECIMAL(18,2) DEFAULT 0,
    
    -- Payment
    payment_status VARCHAR(50) DEFAULT 'unpaid',  -- unpaid, partial, paid, refunded
    paid_amount DECIMAL(18,2) DEFAULT 0,
    remaining_amount DECIMAL(18,2) DEFAULT 0,
    payment_method VARCHAR(50),
    cod_amount DECIMAL(18,2) DEFAULT 0,
    
    -- Fulfillment
    fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled',  -- unfulfilled, partial, fulfilled
    warehouse_id UUID REFERENCES warehouses(id),
    
    -- Shipping
    shipping_carrier_id UUID,
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft',  -- draft, pending, confirmed, processing, ready, shipped, delivered, completed, cancelled, refunded
    
    -- Notes
    notes TEXT,
    internal_notes TEXT,
    tags TEXT[],
    
    -- Meta
    created_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancel_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(company_id, order_number)
);

-- ============================================
-- بنود الطلبات (Order Items)
-- ============================================

CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
    
    -- Product (Shopify compatible)
    product_id UUID REFERENCES products(id),
    variant_id UUID,
    shopify_line_item_id VARCHAR(100),
    
    -- Info
    sku VARCHAR(100),
    name VARCHAR(500) NOT NULL,
    variant_title VARCHAR(255),
    
    -- Quantities
    quantity DECIMAL(18,3) NOT NULL DEFAULT 1,
    fulfilled_quantity DECIMAL(18,3) DEFAULT 0,
    returned_quantity DECIMAL(18,3) DEFAULT 0,
    
    -- Pricing
    unit_price DECIMAL(18,2) NOT NULL,
    cost_price DECIMAL(18,2) DEFAULT 0,
    discount_amount DECIMAL(18,2) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,
    total DECIMAL(18,2) DEFAULT 0,
    
    -- Flags
    requires_shipping BOOLEAN DEFAULT true,
    is_gift_card BOOLEAN DEFAULT false,
    
    -- Custom properties (JSONB for Shopify)
    properties JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- شركات الشحن (Shipping Carriers)
-- ============================================

CREATE TABLE IF NOT EXISTS shipping_carriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,  -- bosta, aramex, jt, r2s, mylerz
    
    -- API Config
    api_url TEXT,
    api_key TEXT,
    api_secret TEXT,
    
    -- COD Settings
    cod_enabled BOOLEAN DEFAULT true,
    cod_fee_type VARCHAR(20) DEFAULT 'fixed',  -- fixed, percent
    cod_fee_amount DECIMAL(18,2) DEFAULT 0,
    
    -- Settings
    tracking_url_template TEXT,
    auto_create_awb BOOLEAN DEFAULT false,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(company_id, code)
);

-- ============================================
-- الشحنات (Shipments)
-- ============================================

CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    order_id UUID REFERENCES sales_orders(id),
    carrier_id UUID REFERENCES shipping_carriers(id),
    
    awb_number VARCHAR(100),
    tracking_number VARCHAR(100),
    
    status VARCHAR(50) DEFAULT 'pending',  -- pending, picked_up, in_transit, out_for_delivery, delivered, returned, cancelled
    
    -- COD
    cod_amount DECIMAL(18,2) DEFAULT 0,
    cod_collected BOOLEAN DEFAULT false,
    cod_settled BOOLEAN DEFAULT false,
    
    -- Shipping Details
    shipping_cost DECIMAL(18,2) DEFAULT 0,
    actual_weight DECIMAL(10,3),
    
    -- Dates
    picked_up_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- تسويات COD (COD Settlements)
-- ============================================

CREATE TABLE IF NOT EXISTS cod_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    carrier_id UUID REFERENCES shipping_carriers(id),
    
    settlement_date DATE NOT NULL,
    settlement_number VARCHAR(50),
    
    total_shipments INTEGER DEFAULT 0,
    total_cod_amount DECIMAL(18,2) DEFAULT 0,
    carrier_fees DECIMAL(18,2) DEFAULT 0,
    net_amount DECIMAL(18,2) DEFAULT 0,
    
    status VARCHAR(50) DEFAULT 'pending',  -- pending, received, reconciled
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- قوائم الأسعار (Price Lists)
-- ============================================

CREATE TABLE IF NOT EXISTS price_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    
    price_type VARCHAR(50) DEFAULT 'fixed',  -- fixed, percentage
    adjustment_percent DECIMAL(5,2) DEFAULT 0,
    
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- أسعار المنتجات (Price List Items)
-- ============================================

CREATE TABLE IF NOT EXISTS price_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    price_list_id UUID REFERENCES price_lists(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID,
    
    price DECIMAL(18,2) NOT NULL,
    min_quantity DECIMAL(18,3) DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(price_list_id, product_id, variant_id, min_quantity)
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sales_orders_company ON sales_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_source ON sales_orders(source);
CREATE INDEX IF NOT EXISTS idx_sales_orders_shopify ON sales_orders(shopify_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON sales_orders(order_date);

CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier ON shipments(carrier_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);

CREATE INDEX IF NOT EXISTS idx_contacts_shopify ON contacts(shopify_customer_id);

-- ============================================
-- Triggers
-- ============================================

CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_order_id UUID;
BEGIN
    -- Handle DELETE case where NEW is null
    IF TG_OP = 'DELETE' THEN
        v_order_id := OLD.order_id;
    ELSE
        v_order_id := NEW.order_id;
    END IF;
    
    UPDATE sales_orders
    SET 
        subtotal = (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM sales_order_items WHERE order_id = v_order_id),
        updated_at = NOW()
    WHERE id = v_order_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if sales_order_items table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_order_items') THEN
        DROP TRIGGER IF EXISTS trg_update_order_totals ON sales_order_items;
        CREATE TRIGGER trg_update_order_totals
        AFTER INSERT OR UPDATE OR DELETE ON sales_order_items
        FOR EACH ROW EXECUTE FUNCTION update_order_totals();
    END IF;
END $$;

-- Update customer stats on order completion
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE contacts
        SET 
            total_orders = total_orders + 1,
            total_spent = total_spent + NEW.total,
            last_order_date = NEW.order_date
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_orders') THEN
        DROP TRIGGER IF EXISTS trg_update_customer_stats ON sales_orders;
        CREATE TRIGGER trg_update_customer_stats
        AFTER UPDATE ON sales_orders
        FOR EACH ROW EXECUTE FUNCTION update_customer_stats();
    END IF;
END $$;

-- ============================================
-- Views
-- ============================================

CREATE OR REPLACE VIEW v_sales_summary AS
SELECT 
    company_id,
    DATE_TRUNC('day', order_date) as date,
    COUNT(*) as orders_count,
    SUM(total) as total_amount,
    SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END) as paid_amount,
    SUM(cod_amount) as cod_amount,
    AVG(total) as avg_order_value
FROM sales_orders
WHERE status NOT IN ('cancelled', 'refunded')
GROUP BY company_id, DATE_TRUNC('day', order_date);

CREATE OR REPLACE VIEW v_pending_cod AS
SELECT 
    s.carrier_id,
    sc.name as carrier_name,
    COUNT(*) as shipments_count,
    SUM(s.cod_amount) as total_cod
FROM shipments s
JOIN shipping_carriers sc ON sc.id = s.carrier_id
WHERE s.status = 'delivered' 
  AND s.cod_collected = true 
  AND s.cod_settled = false
GROUP BY s.carrier_id, sc.name;
