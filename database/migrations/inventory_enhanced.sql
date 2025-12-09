-- =============================================
-- Enhanced Inventory Schema - Shopify Compatible
-- مديول المنتجات المحسن - متوافق مع شوبيفاي
-- =============================================

-- =============================================
-- 1. Product Options (خيارات المنتج)
-- مثل: المقاس، اللون، الخامة
-- =============================================
CREATE TABLE IF NOT EXISTS product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,        -- "المقاس" أو "Size"
  name_en VARCHAR(100),              -- "Size"
  position INTEGER DEFAULT 1,        -- الترتيب
  
  -- القيم المتاحة
  values JSONB DEFAULT '[]',         -- ["S", "M", "L", "XL"]
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_options_product ON product_options(product_id);

-- =============================================
-- 2. Product Variants (تباينات المنتج)
-- كل تباين له SKU وسعر ومخزون منفصل
-- =============================================
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- الترميز
  sku VARCHAR(100),                  -- كود فريد للتباين
  barcode VARCHAR(100),
  
  -- العنوان المركب
  title VARCHAR(255),                -- "أحمر / XL"
  
  -- خيارات التباين (أقصى 3)
  option1 VARCHAR(100),              -- القيمة الأولى (مثل "XL")
  option2 VARCHAR(100),              -- القيمة الثانية (مثل "أحمر")
  option3 VARCHAR(100),              -- القيمة الثالثة (مثل "قطن")
  
  -- الأسعار
  price DECIMAL(18, 2) NOT NULL DEFAULT 0,
  compare_at_price DECIMAL(18, 2),   -- السعر قبل الخصم
  cost_price DECIMAL(18, 2) DEFAULT 0,
  
  -- الوزن
  weight DECIMAL(10, 3),
  weight_unit VARCHAR(10) DEFAULT 'kg',
  
  -- إعدادات
  requires_shipping BOOLEAN DEFAULT true,
  is_taxable BOOLEAN DEFAULT true,
  
  -- الترتيب
  position INTEGER DEFAULT 1,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Shopify
  shopify_variant_id VARCHAR(100),
  shopify_inventory_item_id VARCHAR(100),
  
  -- صورة خاصة بالتباين
  image_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(company_id, sku)
);

CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(company_id, sku);
CREATE INDEX idx_product_variants_barcode ON product_variants(barcode);
CREATE INDEX idx_product_variants_shopify ON product_variants(shopify_variant_id);

-- =============================================
-- 3. Product Images (صور المنتج)
-- =============================================
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  
  -- بيانات الصورة
  src TEXT NOT NULL,                 -- URL الصورة
  alt VARCHAR(255),                  -- النص البديل
  width INTEGER,
  height INTEGER,
  
  position INTEGER DEFAULT 1,
  is_primary BOOLEAN DEFAULT false,
  
  -- Shopify
  shopify_image_id VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- =============================================
-- 4. Update Products Table (تحديث جدول المنتجات)
-- =============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS vendor VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE products ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shopify_synced_at TIMESTAMP WITH TIME ZONE;

-- =============================================
-- 5. Variant Inventory (مخزون التباينات)
-- =============================================
CREATE TABLE IF NOT EXISTS variant_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  
  quantity DECIMAL(18, 3) DEFAULT 0,
  reserved_quantity DECIMAL(18, 3) DEFAULT 0,
  available_quantity DECIMAL(18, 3) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  
  -- متوسط التكلفة
  average_cost DECIMAL(18, 2) DEFAULT 0,
  
  -- Shopify
  shopify_location_id VARCHAR(100),
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(variant_id, warehouse_id)
);

CREATE INDEX idx_variant_inventory_variant ON variant_inventory(variant_id);
CREATE INDEX idx_variant_inventory_warehouse ON variant_inventory(warehouse_id);

-- =============================================
-- 6. Variant Inventory Movements (حركات مخزون التباينات)
-- =============================================
CREATE TABLE IF NOT EXISTS variant_inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  variant_id UUID NOT NULL REFERENCES product_variants(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  
  movement_type VARCHAR(50) NOT NULL,  -- in, out, transfer, adjustment
  reference_type VARCHAR(50),          -- invoice, purchase, transfer, adjustment, shopify_sync
  reference_id UUID,
  
  quantity DECIMAL(18, 3) NOT NULL,
  unit_cost DECIMAL(18, 2),
  
  -- للتحويلات
  from_warehouse_id UUID REFERENCES warehouses(id),
  to_warehouse_id UUID REFERENCES warehouses(id),
  
  notes TEXT,
  
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_variant_movements_variant ON variant_inventory_movements(variant_id);
CREATE INDEX idx_variant_movements_warehouse ON variant_inventory_movements(warehouse_id);
CREATE INDEX idx_variant_movements_date ON variant_inventory_movements(created_at);

-- =============================================
-- 7. Product Categories Enhancement (تحسين التصنيفات)
-- =============================================
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS path VARCHAR(500);
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS has_children BOOLEAN DEFAULT false;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS product_count INTEGER DEFAULT 0;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS shopify_collection_id VARCHAR(100);

-- =============================================
-- 8. Brands (العلامات التجارية)
-- =============================================
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  slug VARCHAR(100),
  
  logo_url TEXT,
  description TEXT,
  website VARCHAR(255),
  
  is_active BOOLEAN DEFAULT true,
  product_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_brands_company ON brands(company_id);

-- Add brand_id to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);

-- =============================================
-- 9. Shopify Sync Log (سجل المزامنة)
-- =============================================
CREATE TABLE IF NOT EXISTS shopify_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  branch_id UUID,
  
  sync_type VARCHAR(50) NOT NULL,    -- products, orders, customers, inventory
  direction VARCHAR(20) NOT NULL,    -- from_shopify, to_shopify
  
  status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed
  
  items_total INTEGER DEFAULT 0,
  items_processed INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  
  error_message TEXT,
  error_details JSONB,
  
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_logs_company ON shopify_sync_logs(company_id);
CREATE INDEX idx_sync_logs_type ON shopify_sync_logs(sync_type);
CREATE INDEX idx_sync_logs_status ON shopify_sync_logs(status);

-- =============================================
-- 10. Triggers
-- =============================================

-- Update variant updated_at
CREATE OR REPLACE FUNCTION update_product_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_variants_updated_at();

-- Update variant_inventory updated_at
CREATE OR REPLACE FUNCTION update_variant_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_variant_inventory_updated_at
  BEFORE UPDATE ON variant_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_variant_inventory_updated_at();

-- =============================================
-- 11. Helper Functions
-- =============================================

-- Generate variant title from options
CREATE OR REPLACE FUNCTION generate_variant_title(
  opt1 VARCHAR,
  opt2 VARCHAR,
  opt3 VARCHAR
)
RETURNS VARCHAR AS $$
BEGIN
  RETURN CONCAT_WS(' / ',
    NULLIF(opt1, ''),
    NULLIF(opt2, ''),
    NULLIF(opt3, '')
  );
END;
$$ LANGUAGE plpgsql;

-- Get total stock for a product (all variants)
CREATE OR REPLACE FUNCTION get_product_total_stock(p_product_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL;
BEGIN
  SELECT COALESCE(SUM(vi.quantity), 0) INTO total
  FROM variant_inventory vi
  JOIN product_variants pv ON vi.variant_id = pv.id
  WHERE pv.product_id = p_product_id;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 12. Views for Analytics
-- =============================================

-- Products with stock summary
CREATE OR REPLACE VIEW v_products_stock_summary AS
SELECT 
  p.id,
  p.company_id,
  p.name,
  p.sku,
  p.category_id,
  pc.name as category_name,
  p.has_variants,
  COUNT(DISTINCT pv.id) as variant_count,
  COALESCE(SUM(vi.quantity), 0) as total_stock,
  COALESCE(SUM(vi.reserved_quantity), 0) as total_reserved,
  MIN(pv.price) as min_price,
  MAX(pv.price) as max_price,
  COALESCE(SUM(vi.quantity * pv.cost_price), 0) as stock_value
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN product_variants pv ON p.id = pv.product_id
LEFT JOIN variant_inventory vi ON pv.id = vi.variant_id
GROUP BY p.id, p.company_id, p.name, p.sku, p.category_id, pc.name, p.has_variants;

-- Low stock products
CREATE OR REPLACE VIEW v_low_stock_products AS
SELECT 
  p.id as product_id,
  p.company_id,
  p.name as product_name,
  pv.id as variant_id,
  pv.sku,
  pv.title as variant_title,
  w.name as warehouse_name,
  vi.quantity,
  p.min_stock_level,
  CASE 
    WHEN vi.quantity <= 0 THEN 'out_of_stock'
    WHEN vi.quantity <= p.min_stock_level THEN 'low_stock'
    ELSE 'in_stock'
  END as stock_status
FROM products p
JOIN product_variants pv ON p.id = pv.product_id
JOIN variant_inventory vi ON pv.id = vi.variant_id
JOIN warehouses w ON vi.warehouse_id = w.id
WHERE p.track_inventory = true
  AND vi.quantity <= p.min_stock_level;

-- =============================================
-- Comments
-- =============================================

COMMENT ON TABLE product_variants IS 'تباينات المنتج - كل منتج له تباينات متعددة بألوان ومقاسات مختلفة';
COMMENT ON TABLE product_options IS 'خيارات المنتج - تعريف الخيارات مثل المقاس واللون';
COMMENT ON TABLE product_images IS 'صور المنتج - صور متعددة لكل منتج وتباين';
COMMENT ON TABLE variant_inventory IS 'مخزون التباينات - الكمية لكل تباين في كل مخزن';
COMMENT ON TABLE brands IS 'العلامات التجارية';
COMMENT ON TABLE shopify_sync_logs IS 'سجل مزامنة شوبيفاي';
