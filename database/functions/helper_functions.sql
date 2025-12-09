-- =========================================================
-- دوال RPC إضافية لنظام ERP
-- =========================================================

-- دالة تحديث رصيد الحساب
CREATE OR REPLACE FUNCTION update_account_balance(
    p_account_id UUID,
    p_amount DECIMAL
) RETURNS void AS $$
BEGIN
    UPDATE accounts
    SET 
        balance = balance + p_amount,
        updated_at = NOW()
    WHERE id = p_account_id;
END;
$$ LANGUAGE plpgsql;

-- دالة زيادة عداد الاستخدام
CREATE OR REPLACE FUNCTION rpc_increment_usage(
    p_company_id UUID,
    p_metric_type VARCHAR,
    p_increment INTEGER DEFAULT 1
) RETURNS void AS $$
DECLARE
    v_period_start DATE;
    v_period_end DATE;
BEGIN
    v_period_start := date_trunc('month', CURRENT_DATE)::date;
    v_period_end := (v_period_start + INTERVAL '1 month' - INTERVAL '1 day')::date;
    
    INSERT INTO usage_tracking (
        company_id, metric_type, period_start, period_end, usage_count
    ) VALUES (
        p_company_id, p_metric_type, v_period_start, v_period_end, p_increment
    )
    ON CONFLICT (company_id, metric_type, period_start)
    DO UPDATE SET 
        usage_count = usage_tracking.usage_count + p_increment,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- دالة الحصول على الرصيد الحالي للعميل
CREATE OR REPLACE FUNCTION get_customer_balance(
    p_customer_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    v_balance DECIMAL;
BEGIN
    SELECT COALESCE(balance, 0) INTO v_balance
    FROM customers
    WHERE id = p_customer_id;
    
    RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- دالة الحصول على الرصيد الحالي للمورد
CREATE OR REPLACE FUNCTION get_supplier_balance(
    p_supplier_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    v_balance DECIMAL;
BEGIN
    SELECT COALESCE(balance, 0) INTO v_balance
    FROM suppliers
    WHERE id = p_supplier_id;
    
    RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- دالة الحصول على رصيد المخزون
CREATE OR REPLACE FUNCTION get_product_stock(
    p_product_id UUID,
    p_warehouse_id UUID DEFAULT NULL
) RETURNS DECIMAL AS $$
DECLARE
    v_quantity DECIMAL;
BEGIN
    IF p_warehouse_id IS NOT NULL THEN
        SELECT COALESCE(quantity, 0) INTO v_quantity
        FROM product_inventory
        WHERE product_id = p_product_id
        AND warehouse_id = p_warehouse_id;
    ELSE
        SELECT COALESCE(SUM(quantity), 0) INTO v_quantity
        FROM product_inventory
        WHERE product_id = p_product_id;
    END IF;
    
    RETURN COALESCE(v_quantity, 0);
END;
$$ LANGUAGE plpgsql;

-- دالة التحقق من توفر المخزون
CREATE OR REPLACE FUNCTION check_stock_availability(
    p_product_id UUID,
    p_warehouse_id UUID,
    p_required_quantity DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
    v_available DECIMAL;
BEGIN
    SELECT COALESCE(available_quantity, 0) INTO v_available
    FROM product_inventory
    WHERE product_id = p_product_id
    AND warehouse_id = p_warehouse_id;
    
    RETURN COALESCE(v_available, 0) >= p_required_quantity;
END;
$$ LANGUAGE plpgsql;

-- دالة حساب إجمالي الفاتورة
CREATE OR REPLACE FUNCTION calculate_invoice_totals(
    p_items JSONB
) RETURNS JSONB AS $$
DECLARE
    v_subtotal DECIMAL := 0;
    v_tax_amount DECIMAL := 0;
    v_discount_amount DECIMAL := 0;
    v_item RECORD;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        quantity DECIMAL,
        unit_price DECIMAL,
        tax_rate DECIMAL,
        discount_amount DECIMAL
    )
    LOOP
        v_subtotal := v_subtotal + (v_item.quantity * v_item.unit_price);
        v_discount_amount := v_discount_amount + COALESCE(v_item.discount_amount, 0);
        v_tax_amount := v_tax_amount + 
            ((v_item.quantity * v_item.unit_price - COALESCE(v_item.discount_amount, 0)) * 
             COALESCE(v_item.tax_rate, 0) / 100);
    END LOOP;
    
    RETURN jsonb_build_object(
        'subtotal', v_subtotal,
        'discount_amount', v_discount_amount,
        'tax_amount', v_tax_amount,
        'total', v_subtotal - v_discount_amount + v_tax_amount
    );
END;
$$ LANGUAGE plpgsql;

-- دالة إنشاء رقم تسلسلي
CREATE OR REPLACE FUNCTION generate_document_number(
    p_company_id UUID,
    p_document_type VARCHAR,
    p_branch_id UUID DEFAULT NULL
) RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR;
    v_next_number INTEGER;
    v_padding INTEGER;
    v_result VARCHAR;
BEGIN
    -- Get or create sequence
    SELECT prefix, next_number, padding
    INTO v_prefix, v_next_number, v_padding
    FROM number_sequences
    WHERE company_id = p_company_id
    AND document_type = p_document_type
    AND (branch_id = p_branch_id OR (branch_id IS NULL AND p_branch_id IS NULL));
    
    IF v_next_number IS NULL THEN
        -- Create new sequence
        v_prefix := CASE p_document_type
            WHEN 'sales_invoice' THEN 'INV-'
            WHEN 'purchase_invoice' THEN 'PINV-'
            WHEN 'receipt' THEN 'RCV-'
            WHEN 'payment' THEN 'PAY-'
            WHEN 'sales_return' THEN 'SR-'
            WHEN 'purchase_return' THEN 'PR-'
            WHEN 'transfer' THEN 'TRF-'
            WHEN 'stocktake' THEN 'STK-'
            WHEN 'quotation' THEN 'QT-'
            WHEN 'sales_order' THEN 'SO-'
            WHEN 'purchase_order' THEN 'PO-'
            WHEN 'journal_entry' THEN 'JE-'
            ELSE 'DOC-'
        END;
        v_next_number := 1;
        v_padding := 5;
        
        INSERT INTO number_sequences (company_id, branch_id, document_type, prefix, next_number, padding)
        VALUES (p_company_id, p_branch_id, p_document_type, v_prefix, v_next_number + 1, v_padding);
    ELSE
        -- Increment sequence
        UPDATE number_sequences
        SET next_number = next_number + 1, updated_at = NOW()
        WHERE company_id = p_company_id
        AND document_type = p_document_type
        AND (branch_id = p_branch_id OR (branch_id IS NULL AND p_branch_id IS NULL));
    END IF;
    
    v_result := v_prefix || LPAD(v_next_number::text, v_padding, '0');
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- النهاية
-- =========================================================
