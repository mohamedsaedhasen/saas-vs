-- ============================================
-- Shipping Module Enhancement
-- المناطق والأسعار والقيود المحاسبية
-- ============================================

-- ============================================
-- 1. أنواع الخدمات
-- ============================================

CREATE TABLE IF NOT EXISTS shipping_service_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    description TEXT,
    -- Accounting
    expense_account_id UUID REFERENCES chart_of_accounts(id),
    liability_account_id UUID REFERENCES chart_of_accounts(id),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- ============================================
-- 2. المناطق
-- ============================================

CREATE TABLE IF NOT EXISTS shipping_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    carrier_id UUID REFERENCES shipping_carriers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    code VARCHAR(50),
    cities TEXT[],
    governorates TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(carrier_id, code)
);

-- ============================================
-- 3. أسعار الشحن
-- ============================================

CREATE TABLE IF NOT EXISTS carrier_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID REFERENCES shipping_carriers(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES shipping_zones(id) ON DELETE CASCADE,
    service_type_id UUID REFERENCES shipping_service_types(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    vat_included BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(carrier_id, zone_id, service_type_id)
);

-- ============================================
-- 4. تحديث جدول الشحنات
-- ============================================

ALTER TABLE shipments ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) DEFAULT 'DELIVERY';
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS zone_id UUID;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS return_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS total_fees DECIMAL(10,2) DEFAULT 0;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS journal_entry_id UUID;

-- ============================================
-- 5. تسويات COD
-- ============================================

CREATE TABLE IF NOT EXISTS cod_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    carrier_id UUID REFERENCES shipping_carriers(id) ON DELETE CASCADE,
    settlement_number VARCHAR(50),
    settlement_date DATE NOT NULL,
    total_shipments INTEGER DEFAULT 0,
    total_cod_amount DECIMAL(12,2) DEFAULT 0,
    carrier_fees DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    vault_id UUID REFERENCES vaults(id),
    journal_entry_id UUID REFERENCES journal_entries(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cod_settlements_carrier ON cod_settlements(carrier_id);
CREATE INDEX IF NOT EXISTS idx_cod_settlements_status ON cod_settlements(status);

-- ============================================
-- 6. Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_carrier_pricing_carrier ON carrier_pricing(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_pricing_zone ON carrier_pricing(zone_id);
CREATE INDEX IF NOT EXISTS idx_shipping_zones_carrier ON shipping_zones(carrier_id);
CREATE INDEX IF NOT EXISTS idx_shipments_service ON shipments(service_type);

-- ============================================
-- 7. بيانات افتراضية - أنواع الخدمات
-- ============================================

INSERT INTO shipping_service_types (company_id, code, name, name_en, is_system) VALUES
('33333333-3333-3333-3333-333333333333', 'DELIVERY', 'التوصيل', 'Delivery', true),
('33333333-3333-3333-3333-333333333333', 'RTS', 'الإعادة للمصدر', 'Return to Sender', true),
('33333333-3333-3333-3333-333333333333', 'CUSTOMER_RETURN', 'مرتجعات العملاء', 'Customer Return', true),
('33333333-3333-3333-3333-333333333333', 'EXCHANGE', 'استبدال', 'Exchange', true),
('33333333-3333-3333-3333-333333333333', 'REJECTED', 'مرفوض', 'Rejected', true),
('33333333-3333-3333-3333-333333333333', 'PARTIAL_DELIVERY', 'توصيل جزئي', 'Partial Delivery', true)
ON CONFLICT (company_id, code) DO NOTHING;

-- ============================================
-- 8. مناطق شركة بوسطة
-- ============================================

-- الحصول على carrier_id لبوسطة
DO $$
DECLARE
    bosta_id UUID;
BEGIN
    SELECT id INTO bosta_id FROM shipping_carriers 
    WHERE code = 'BOSTA' AND company_id = '33333333-3333-3333-3333-333333333333';
    
    IF bosta_id IS NOT NULL THEN
        INSERT INTO shipping_zones (company_id, carrier_id, code, name, name_en, governorates) VALUES
        ('33333333-3333-3333-3333-333333333333', bosta_id, 'CAIRO', 'القاهرة والجيزة', 'Cairo & Giza', ARRAY['القاهرة', 'الجيزة']),
        ('33333333-3333-3333-3333-333333333333', bosta_id, 'ALEX', 'الإسكندرية', 'Alexandria', ARRAY['الإسكندرية']),
        ('33333333-3333-3333-3333-333333333333', bosta_id, 'DELTA', 'الدلتا والقناة', 'Delta & Canal', ARRAY['الشرقية', 'الدقهلية', 'الغربية', 'المنوفية', 'البحيرة', 'كفر الشيخ', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس']),
        ('33333333-3333-3333-3333-333333333333', bosta_id, 'UPPER', 'الصعيد والبحر الأحمر', 'Upper Egypt', ARRAY['الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر'])
        ON CONFLICT (carrier_id, code) DO NOTHING;
        
        -- أسعار بوسطة
        INSERT INTO carrier_pricing (carrier_id, zone_id, service_type_id, price) 
        SELECT 
            bosta_id,
            z.id,
            st.id,
            CASE 
                WHEN st.code = 'DELIVERY' AND z.code = 'CAIRO' THEN 84
                WHEN st.code = 'DELIVERY' AND z.code = 'ALEX' THEN 89
                WHEN st.code = 'DELIVERY' AND z.code = 'DELTA' THEN 96
                WHEN st.code = 'DELIVERY' AND z.code = 'UPPER' THEN 122
                WHEN st.code = 'RTS' THEN 74
                WHEN st.code = 'CUSTOMER_RETURN' THEN 94
                WHEN st.code = 'REJECTED' THEN 74
                ELSE 0
            END
        FROM shipping_zones z
        CROSS JOIN shipping_service_types st
        WHERE z.carrier_id = bosta_id 
          AND st.company_id = '33333333-3333-3333-3333-333333333333'
          AND st.code IN ('DELIVERY', 'RTS', 'CUSTOMER_RETURN', 'REJECTED')
        ON CONFLICT (carrier_id, zone_id, service_type_id) DO NOTHING;
    END IF;
END $$;

-- ============================================
-- تم! ✅
-- ============================================
