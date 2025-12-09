-- =========================================================
-- نظام ERP SaaS - Triggers المرتجعات والتحويلات
-- الإصدار: 2.0
-- =========================================================

-- =========================================================
-- الجزء 1: Trigger مرتجع المبيعات
-- =========================================================

CREATE OR REPLACE FUNCTION process_sales_return_confirmation()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
    v_entry_id UUID;
    v_sales_account UUID;
    v_receivable_account UUID;
    v_inventory_account UUID;
    v_customer_account UUID;
    v_total_cost DECIMAL := 0;
BEGIN
    -- فقط عند تغيير الحالة إلى confirmed
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status = 'draft') THEN
        
        -- الحصول على الحسابات
        v_sales_account := get_system_account(NEW.company_id, '4101');
        v_receivable_account := get_system_account(NEW.company_id, '1201');
        v_inventory_account := get_system_account(NEW.company_id, '1301');
        
        -- الحصول على حساب العميل
        IF NEW.customer_id IS NOT NULL THEN
            SELECT account_id INTO v_customer_account
            FROM customers WHERE id = NEW.customer_id;
        END IF;
        v_customer_account := COALESCE(v_customer_account, v_receivable_account);
        
        -- معالجة كل صنف
        FOR v_item IN 
            SELECT sri.*, p.track_inventory
            FROM sales_return_items sri
            JOIN products p ON p.id = sri.product_id
            WHERE sri.return_id = NEW.id
        LOOP
            -- زيادة المخزون (إرجاع)
            IF v_item.track_inventory = true AND v_item.condition = 'good' THEN
                PERFORM update_product_inventory(
                    NEW.company_id,
                    v_item.product_id,
                    COALESCE(v_item.warehouse_id, NEW.warehouse_id),
                    v_item.quantity, -- إضافة
                    v_item.cost_price
                );
                
                -- إنشاء حركة مخزون
                PERFORM create_inventory_movement(
                    NEW.company_id,
                    NEW.branch_id,
                    v_item.product_id,
                    COALESCE(v_item.warehouse_id, NEW.warehouse_id),
                    'in',
                    'sales_return',
                    NEW.id,
                    v_item.quantity,
                    v_item.cost_price,
                    NEW.created_by
                );
                
                v_total_cost := v_total_cost + (v_item.quantity * v_item.cost_price);
            END IF;
        END LOOP;
        
        -- إنشاء القيد المحاسبي (عكس قيد البيع)
        v_entry_id := create_journal_entry(
            NEW.company_id,
            NEW.branch_id,
            NEW.return_date,
            'مرتجع مبيعات رقم ' || NEW.return_number,
            'sales_return',
            NEW.id,
            NEW.created_by
        );
        
        -- مدين: مردودات المبيعات
        PERFORM add_journal_entry_line(
            v_entry_id,
            get_system_account(NEW.company_id, '4102'), -- مردودات مبيعات
            'مرتجع مبيعات',
            NEW.subtotal,
            0
        );
        
        -- دائن: العميل
        PERFORM add_journal_entry_line(
            v_entry_id,
            v_customer_account,
            'إلغاء ذمة عميل',
            0,
            NEW.total,
            'customer',
            NEW.customer_id
        );
        
        -- قيد إرجاع المخزون
        IF v_total_cost > 0 THEN
            -- مدين: المخزون
            PERFORM add_journal_entry_line(
                v_entry_id,
                v_inventory_account,
                'إرجاع مخزون',
                v_total_cost,
                0
            );
            
            -- دائن: تكلفة البضاعة المباعة
            PERFORM add_journal_entry_line(
                v_entry_id,
                get_system_account(NEW.company_id, '5101'),
                'تخفيض تكلفة مبيعات',
                0,
                v_total_cost
            );
        END IF;
        
        -- ربط القيد
        NEW.journal_entry_id := v_entry_id;
        
        -- تحديث رصيد العميل (تخفيض)
        IF NEW.customer_id IS NOT NULL THEN
            UPDATE customers
            SET balance = balance - NEW.total,
                updated_at = NOW()
            WHERE id = NEW.customer_id;
        END IF;
        
        NEW.confirmed_at := NOW();
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sales_return_confirmation ON sales_returns;
CREATE TRIGGER trg_sales_return_confirmation
BEFORE UPDATE ON sales_returns
FOR EACH ROW
EXECUTE FUNCTION process_sales_return_confirmation();

-- =========================================================
-- الجزء 2: Trigger مرتجع المشتريات
-- =========================================================

CREATE OR REPLACE FUNCTION process_purchase_return_confirmation()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
    v_entry_id UUID;
    v_inventory_account UUID;
    v_supplier_account UUID;
BEGIN
    -- فقط عند تغيير الحالة إلى confirmed
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status = 'draft') THEN
        
        v_inventory_account := get_system_account(NEW.company_id, '1301');
        
        -- الحصول على حساب المورد
        IF NEW.supplier_id IS NOT NULL THEN
            SELECT account_id INTO v_supplier_account
            FROM suppliers WHERE id = NEW.supplier_id;
        END IF;
        v_supplier_account := COALESCE(v_supplier_account, get_system_account(NEW.company_id, '2101'));
        
        -- معالجة كل صنف
        FOR v_item IN 
            SELECT pri.*, p.track_inventory
            FROM purchase_return_items pri
            JOIN products p ON p.id = pri.product_id
            WHERE pri.return_id = NEW.id
        LOOP
            -- تخفيض المخزون (إرجاع للمورد)
            IF v_item.track_inventory = true THEN
                PERFORM update_product_inventory(
                    NEW.company_id,
                    v_item.product_id,
                    COALESCE(v_item.warehouse_id, NEW.warehouse_id),
                    -v_item.quantity, -- تخفيض
                    NULL
                );
                
                -- إنشاء حركة مخزون
                PERFORM create_inventory_movement(
                    NEW.company_id,
                    NEW.branch_id,
                    v_item.product_id,
                    COALESCE(v_item.warehouse_id, NEW.warehouse_id),
                    'out',
                    'purchase_return',
                    NEW.id,
                    -v_item.quantity,
                    v_item.unit_price,
                    NEW.created_by
                );
            END IF;
        END LOOP;
        
        -- إنشاء القيد المحاسبي
        v_entry_id := create_journal_entry(
            NEW.company_id,
            NEW.branch_id,
            NEW.return_date,
            'مرتجع مشتريات رقم ' || NEW.return_number,
            'purchase_return',
            NEW.id,
            NEW.created_by
        );
        
        -- مدين: المورد
        PERFORM add_journal_entry_line(
            v_entry_id,
            v_supplier_account,
            'تخفيض ذمة مورد',
            NEW.total,
            0,
            'supplier',
            NEW.supplier_id
        );
        
        -- دائن: المخزون
        PERFORM add_journal_entry_line(
            v_entry_id,
            v_inventory_account,
            'إرجاع مخزون لمورد',
            0,
            NEW.subtotal
        );
        
        -- ربط القيد
        NEW.journal_entry_id := v_entry_id;
        
        -- تحديث رصيد المورد (تخفيض)
        IF NEW.supplier_id IS NOT NULL THEN
            UPDATE suppliers
            SET balance = balance - NEW.total,
                updated_at = NOW()
            WHERE id = NEW.supplier_id;
        END IF;
        
        NEW.confirmed_at := NOW();
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_purchase_return_confirmation ON purchase_returns;
CREATE TRIGGER trg_purchase_return_confirmation
BEFORE UPDATE ON purchase_returns
FOR EACH ROW
EXECUTE FUNCTION process_purchase_return_confirmation();

-- =========================================================
-- الجزء 3: Trigger تحويل المخزون
-- =========================================================

CREATE OR REPLACE FUNCTION process_inventory_transfer_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
BEGIN
    -- عند إكمال التحويل
    IF NEW.status = 'completed' AND OLD.status = 'in_transit' THEN
        
        FOR v_item IN 
            SELECT iti.*, p.track_inventory,
                   COALESCE(pi.avg_cost, p.cost_price, 0) as unit_cost
            FROM inventory_transfer_items iti
            JOIN products p ON p.id = iti.product_id
            LEFT JOIN product_inventory pi ON pi.product_id = iti.product_id 
                AND pi.warehouse_id = NEW.from_warehouse_id
            WHERE iti.transfer_id = NEW.id
        LOOP
            IF v_item.track_inventory = true THEN
                -- تخفيض من المخزن المصدر
                PERFORM update_product_inventory(
                    NEW.company_id,
                    v_item.product_id,
                    NEW.from_warehouse_id,
                    -v_item.quantity_sent,
                    NULL
                );
                
                PERFORM create_inventory_movement(
                    NEW.company_id,
                    NEW.branch_id,
                    v_item.product_id,
                    NEW.from_warehouse_id,
                    'transfer_out',
                    'inventory_transfer',
                    NEW.id,
                    -v_item.quantity_sent,
                    v_item.unit_cost,
                    NEW.created_by
                );
                
                -- إضافة للمخزن المستلم
                PERFORM update_product_inventory(
                    NEW.company_id,
                    v_item.product_id,
                    NEW.to_warehouse_id,
                    v_item.quantity_received,
                    v_item.unit_cost
                );
                
                PERFORM create_inventory_movement(
                    NEW.company_id,
                    NEW.branch_id,
                    v_item.product_id,
                    NEW.to_warehouse_id,
                    'transfer_in',
                    'inventory_transfer',
                    NEW.id,
                    v_item.quantity_received,
                    v_item.unit_cost,
                    NEW.received_by
                );
            END IF;
        END LOOP;
        
        NEW.received_at := NOW();
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_transfer_completion ON inventory_transfers;
CREATE TRIGGER trg_inventory_transfer_completion
BEFORE UPDATE ON inventory_transfers
FOR EACH ROW
EXECUTE FUNCTION process_inventory_transfer_completion();

-- =========================================================
-- الجزء 4: Trigger تسوية الجرد
-- =========================================================

CREATE OR REPLACE FUNCTION process_stocktake_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
    v_entry_id UUID;
    v_inventory_account UUID;
    v_adjustment_account UUID;
    v_total_positive DECIMAL := 0;
    v_total_negative DECIMAL := 0;
BEGIN
    -- عند إكمال الجرد
    IF NEW.status = 'completed' AND OLD.status = 'in_progress' THEN
        
        v_inventory_account := get_system_account(NEW.company_id, '1301');
        v_adjustment_account := get_system_account(NEW.company_id, '5901'); -- فروقات جرد
        
        FOR v_item IN 
            SELECT si.*, p.track_inventory
            FROM stocktake_items si
            JOIN products p ON p.id = si.product_id
            WHERE si.stocktake_id = NEW.id
            AND si.counted_quantity IS NOT NULL
            AND si.variance_quantity != 0
        LOOP
            IF v_item.track_inventory = true THEN
                -- تسوية المخزون
                PERFORM update_product_inventory(
                    NEW.company_id,
                    v_item.product_id,
                    NEW.warehouse_id,
                    v_item.variance_quantity,
                    NULL
                );
                
                -- حركة مخزون
                PERFORM create_inventory_movement(
                    NEW.company_id,
                    NEW.branch_id,
                    v_item.product_id,
                    NEW.warehouse_id,
                    'adjustment',
                    'stocktake',
                    NEW.id,
                    v_item.variance_quantity,
                    v_item.unit_cost,
                    NEW.created_by
                );
                
                IF v_item.variance_value > 0 THEN
                    v_total_positive := v_total_positive + v_item.variance_value;
                ELSE
                    v_total_negative := v_total_negative + ABS(v_item.variance_value);
                END IF;
                
                -- تحديث حالة الصنف
                UPDATE stocktake_items
                SET status = 'adjusted'
                WHERE id = v_item.id;
            END IF;
        END LOOP;
        
        -- إنشاء قيد التسوية
        IF v_total_positive > 0 OR v_total_negative > 0 THEN
            v_entry_id := create_journal_entry(
                NEW.company_id,
                NEW.branch_id,
                NEW.stocktake_date,
                'تسوية جرد رقم ' || NEW.stocktake_number,
                'stocktake',
                NEW.id,
                NEW.created_by
            );
            
            IF v_total_positive > 0 THEN
                -- زيادة في المخزون
                PERFORM add_journal_entry_line(v_entry_id, v_inventory_account, 'زيادة جرد', v_total_positive, 0);
                PERFORM add_journal_entry_line(v_entry_id, v_adjustment_account, 'فروقات جرد دائنة', 0, v_total_positive);
            END IF;
            
            IF v_total_negative > 0 THEN
                -- نقص في المخزون
                PERFORM add_journal_entry_line(v_entry_id, v_adjustment_account, 'فروقات جرد مدينة', v_total_negative, 0);
                PERFORM add_journal_entry_line(v_entry_id, v_inventory_account, 'نقص جرد', 0, v_total_negative);
            END IF;
            
            NEW.adjustment_entry_id := v_entry_id;
        END IF;
        
        NEW.completed_at := NOW();
        NEW.total_variance_value := v_total_positive - v_total_negative;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stocktake_completion ON stocktakes;
CREATE TRIGGER trg_stocktake_completion
BEFORE UPDATE ON stocktakes
FOR EACH ROW
EXECUTE FUNCTION process_stocktake_completion();

-- =========================================================
-- النهاية
-- =========================================================
