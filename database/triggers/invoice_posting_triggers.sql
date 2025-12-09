-- =========================================================
-- نظام ERP SaaS - Triggers ترحيل الفواتير والسندات
-- الإصدار: 2.0
-- =========================================================

-- =========================================================
-- الجزء 1: دوال مساعدة للمحاسبة
-- =========================================================

-- 1.1 دالة الحصول على حساب من الإعدادات
CREATE OR REPLACE FUNCTION get_system_account(
    p_company_id UUID,
    p_account_key VARCHAR
) RETURNS UUID AS $$
DECLARE
    v_account_id UUID;
BEGIN
    -- البحث عن الحساب حسب الكود
    SELECT id INTO v_account_id
    FROM accounts
    WHERE company_id = p_company_id
    AND code = p_account_key
    AND is_active = true
    LIMIT 1;
    
    RETURN v_account_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- 1.2 دالة إنشاء رقم القيد
CREATE OR REPLACE FUNCTION generate_journal_entry_number(
    p_company_id UUID
) RETURNS VARCHAR AS $$
DECLARE
    v_next_number INTEGER;
    v_prefix VARCHAR := 'JE-';
BEGIN
    -- الحصول على الرقم التالي
    UPDATE number_sequences
    SET next_number = next_number + 1
    WHERE company_id = p_company_id
    AND document_type = 'journal_entry'
    RETURNING next_number - 1 INTO v_next_number;
    
    IF v_next_number IS NULL THEN
        -- إنشاء تسلسل جديد
        INSERT INTO number_sequences (company_id, document_type, prefix, next_number, padding)
        VALUES (p_company_id, 'journal_entry', 'JE-', 2, 5);
        v_next_number := 1;
    END IF;
    
    RETURN v_prefix || LPAD(v_next_number::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- 1.3 دالة إنشاء قيد محاسبي
CREATE OR REPLACE FUNCTION create_journal_entry(
    p_company_id UUID,
    p_branch_id UUID,
    p_entry_date DATE,
    p_description TEXT,
    p_reference_type VARCHAR,
    p_reference_id UUID,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_entry_id UUID;
    v_entry_number VARCHAR;
BEGIN
    v_entry_number := generate_journal_entry_number(p_company_id);
    
    INSERT INTO journal_entries (
        company_id, branch_id, entry_number, entry_date,
        fiscal_year, fiscal_period, description,
        reference_type, reference_id, status,
        is_auto_generated, created_by
    ) VALUES (
        p_company_id, p_branch_id, v_entry_number, p_entry_date,
        EXTRACT(YEAR FROM p_entry_date),
        EXTRACT(MONTH FROM p_entry_date),
        p_description, p_reference_type, p_reference_id,
        'posted', true, p_created_by
    ) RETURNING id INTO v_entry_id;
    
    RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql;

-- 1.4 دالة إضافة سطر قيد
CREATE OR REPLACE FUNCTION add_journal_entry_line(
    p_entry_id UUID,
    p_account_id UUID,
    p_description TEXT,
    p_debit DECIMAL,
    p_credit DECIMAL,
    p_partner_type VARCHAR DEFAULT NULL,
    p_partner_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_line_id UUID;
BEGIN
    INSERT INTO journal_entry_lines (
        journal_entry_id, account_id, description,
        debit, credit, partner_type, partner_id
    ) VALUES (
        p_entry_id, p_account_id, p_description,
        COALESCE(p_debit, 0), COALESCE(p_credit, 0),
        p_partner_type, p_partner_id
    ) RETURNING id INTO v_line_id;
    
    -- تحديث إجماليات القيد
    UPDATE journal_entries
    SET total_debit = total_debit + COALESCE(p_debit, 0),
        total_credit = total_credit + COALESCE(p_credit, 0)
    WHERE id = p_entry_id;
    
    -- تحديث رصيد الحساب
    UPDATE accounts
    SET balance = balance + COALESCE(p_debit, 0) - COALESCE(p_credit, 0),
        updated_at = NOW()
    WHERE id = p_account_id;
    
    RETURN v_line_id;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- الجزء 2: دوال المخزون
-- =========================================================

-- 2.1 دالة إنشاء حركة مخزون
CREATE OR REPLACE FUNCTION create_inventory_movement(
    p_company_id UUID,
    p_branch_id UUID,
    p_product_id UUID,
    p_warehouse_id UUID,
    p_movement_type VARCHAR,
    p_reference_type VARCHAR,
    p_reference_id UUID,
    p_quantity DECIMAL,
    p_unit_cost DECIMAL,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_movement_id UUID;
    v_qty_before DECIMAL;
    v_qty_after DECIMAL;
BEGIN
    -- الحصول على الكمية الحالية
    SELECT COALESCE(quantity, 0) INTO v_qty_before
    FROM product_inventory
    WHERE product_id = p_product_id AND warehouse_id = p_warehouse_id;
    
    IF v_qty_before IS NULL THEN
        v_qty_before := 0;
    END IF;
    
    v_qty_after := v_qty_before + p_quantity;
    
    -- إنشاء حركة المخزون
    INSERT INTO inventory_movements (
        company_id, branch_id, product_id, warehouse_id,
        movement_type, reference_type, reference_id,
        quantity, unit_cost, total_cost,
        quantity_before, quantity_after, created_by
    ) VALUES (
        p_company_id, p_branch_id, p_product_id, p_warehouse_id,
        p_movement_type, p_reference_type, p_reference_id,
        p_quantity, p_unit_cost, p_quantity * p_unit_cost,
        v_qty_before, v_qty_after, p_created_by
    ) RETURNING id INTO v_movement_id;
    
    RETURN v_movement_id;
END;
$$ LANGUAGE plpgsql;

-- 2.2 دالة تحديث المخزون
CREATE OR REPLACE FUNCTION update_product_inventory(
    p_company_id UUID,
    p_product_id UUID,
    p_warehouse_id UUID,
    p_quantity_change DECIMAL,
    p_new_cost DECIMAL DEFAULT NULL
) RETURNS void AS $$
DECLARE
    v_current_qty DECIMAL;
    v_current_cost DECIMAL;
    v_new_avg_cost DECIMAL;
BEGIN
    -- التحقق من وجود سجل المخزون
    SELECT quantity, avg_cost INTO v_current_qty, v_current_cost
    FROM product_inventory
    WHERE product_id = p_product_id AND warehouse_id = p_warehouse_id;
    
    IF v_current_qty IS NULL THEN
        -- إنشاء سجل جديد
        INSERT INTO product_inventory (
            company_id, product_id, warehouse_id,
            quantity, avg_cost, last_stock_date
        ) VALUES (
            p_company_id, p_product_id, p_warehouse_id,
            p_quantity_change, COALESCE(p_new_cost, 0), NOW()
        );
    ELSE
        -- تحديث السجل الموجود
        -- حساب متوسط التكلفة الجديد (فقط للإضافات)
        IF p_quantity_change > 0 AND p_new_cost IS NOT NULL THEN
            v_new_avg_cost := (
                (v_current_qty * v_current_cost) + (p_quantity_change * p_new_cost)
            ) / NULLIF(v_current_qty + p_quantity_change, 0);
        ELSE
            v_new_avg_cost := v_current_cost;
        END IF;
        
        UPDATE product_inventory
        SET quantity = quantity + p_quantity_change,
            avg_cost = COALESCE(v_new_avg_cost, avg_cost),
            last_stock_date = NOW(),
            updated_at = NOW()
        WHERE product_id = p_product_id AND warehouse_id = p_warehouse_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- الجزء 3: Trigger ترحيل فاتورة المبيعات
-- =========================================================

CREATE OR REPLACE FUNCTION process_sales_invoice_confirmation()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
    v_entry_id UUID;
    v_sales_account UUID;
    v_receivable_account UUID;
    v_inventory_account UUID;
    v_cogs_account UUID;
    v_customer_account UUID;
    v_total_cost DECIMAL := 0;
BEGIN
    -- فقط عند تغيير الحالة إلى confirmed
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status = 'draft') THEN
        
        -- الحصول على الحسابات
        v_sales_account := get_system_account(NEW.company_id, '4101'); -- إيرادات المبيعات
        v_receivable_account := get_system_account(NEW.company_id, '1201'); -- ذمم العملاء
        v_inventory_account := get_system_account(NEW.company_id, '1301'); -- المخزون
        v_cogs_account := get_system_account(NEW.company_id, '5101'); -- تكلفة البضاعة المباعة
        
        -- الحصول على حساب العميل
        IF NEW.customer_id IS NOT NULL THEN
            SELECT account_id INTO v_customer_account
            FROM customers WHERE id = NEW.customer_id;
        END IF;
        v_customer_account := COALESCE(v_customer_account, v_receivable_account);
        
        -- معالجة كل صنف
        FOR v_item IN 
            SELECT sii.*, p.track_inventory, p.cost_price,
                   COALESCE(pi.avg_cost, p.cost_price, 0) as actual_cost
            FROM sales_invoice_items sii
            JOIN products p ON p.id = sii.product_id
            LEFT JOIN product_inventory pi ON pi.product_id = sii.product_id 
                AND pi.warehouse_id = COALESCE(sii.warehouse_id, NEW.warehouse_id)
            WHERE sii.invoice_id = NEW.id
        LOOP
            -- تخفيض المخزون
            IF v_item.track_inventory = true THEN
                PERFORM update_product_inventory(
                    NEW.company_id,
                    v_item.product_id,
                    COALESCE(v_item.warehouse_id, NEW.warehouse_id),
                    -v_item.quantity,
                    NULL
                );
                
                -- إنشاء حركة مخزون
                PERFORM create_inventory_movement(
                    NEW.company_id,
                    NEW.branch_id,
                    v_item.product_id,
                    COALESCE(v_item.warehouse_id, NEW.warehouse_id),
                    'out',
                    'sales_invoice',
                    NEW.id,
                    -v_item.quantity,
                    v_item.actual_cost,
                    NEW.created_by
                );
                
                -- تحديث تكلفة الصنف
                UPDATE sales_invoice_items
                SET cost_price = v_item.actual_cost
                WHERE id = v_item.id;
                
                v_total_cost := v_total_cost + (v_item.quantity * v_item.actual_cost);
            END IF;
        END LOOP;
        
        -- إنشاء القيد المحاسبي
        v_entry_id := create_journal_entry(
            NEW.company_id,
            NEW.branch_id,
            NEW.invoice_date,
            'فاتورة مبيعات رقم ' || NEW.invoice_number,
            'sales_invoice',
            NEW.id,
            NEW.created_by
        );
        
        -- قيد المبيعات
        -- مدين: العميل (الإجمالي)
        PERFORM add_journal_entry_line(
            v_entry_id,
            v_customer_account,
            'مبيعات - ' || NEW.invoice_number,
            NEW.total,
            0,
            'customer',
            NEW.customer_id
        );
        
        -- دائن: المبيعات
        PERFORM add_journal_entry_line(
            v_entry_id,
            v_sales_account,
            'إيرادات مبيعات',
            0,
            NEW.subtotal
        );
        
        -- دائن: ضريبة القيمة المضافة (إن وجدت)
        IF NEW.tax_amount > 0 THEN
            PERFORM add_journal_entry_line(
                v_entry_id,
                get_system_account(NEW.company_id, '2301'), -- ضريبة مستحقة
                'ضريبة قيمة مضافة',
                0,
                NEW.tax_amount
            );
        END IF;
        
        -- قيد تكلفة البضاعة المباعة
        IF v_total_cost > 0 THEN
            -- مدين: تكلفة البضاعة المباعة
            PERFORM add_journal_entry_line(
                v_entry_id,
                v_cogs_account,
                'تكلفة بضاعة مباعة',
                v_total_cost,
                0
            );
            
            -- دائن: المخزون
            PERFORM add_journal_entry_line(
                v_entry_id,
                v_inventory_account,
                'تخفيض مخزون',
                0,
                v_total_cost
            );
        END IF;
        
        -- ربط القيد بالفاتورة
        NEW.journal_entry_id := v_entry_id;
        
        -- تحديث رصيد العميل
        IF NEW.customer_id IS NOT NULL THEN
            UPDATE customers
            SET balance = balance + NEW.total,
                updated_at = NOW()
            WHERE id = NEW.customer_id;
        END IF;
        
        -- تسجيل وقت الترحيل
        NEW.confirmed_at := NOW();
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق Trigger
DROP TRIGGER IF EXISTS trg_sales_invoice_confirmation ON sales_invoices;
CREATE TRIGGER trg_sales_invoice_confirmation
BEFORE UPDATE ON sales_invoices
FOR EACH ROW
EXECUTE FUNCTION process_sales_invoice_confirmation();

-- =========================================================
-- الجزء 4: Trigger ترحيل فاتورة المشتريات
-- =========================================================

CREATE OR REPLACE FUNCTION process_purchase_invoice_confirmation()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
    v_entry_id UUID;
    v_purchase_account UUID;
    v_payable_account UUID;
    v_inventory_account UUID;
    v_supplier_account UUID;
BEGIN
    -- فقط عند تغيير الحالة إلى confirmed
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status = 'draft') THEN
        
        -- الحصول على الحسابات
        v_purchase_account := get_system_account(NEW.company_id, '5102'); -- مشتريات
        v_payable_account := get_system_account(NEW.company_id, '2101'); -- ذمم الموردين
        v_inventory_account := get_system_account(NEW.company_id, '1301'); -- المخزون
        
        -- الحصول على حساب المورد
        IF NEW.supplier_id IS NOT NULL THEN
            SELECT account_id INTO v_supplier_account
            FROM suppliers WHERE id = NEW.supplier_id;
        END IF;
        v_supplier_account := COALESCE(v_supplier_account, v_payable_account);
        
        -- معالجة كل صنف
        FOR v_item IN 
            SELECT pii.*, p.track_inventory
            FROM purchase_invoice_items pii
            JOIN products p ON p.id = pii.product_id
            WHERE pii.invoice_id = NEW.id
        LOOP
            -- زيادة المخزون
            IF v_item.track_inventory = true THEN
                PERFORM update_product_inventory(
                    NEW.company_id,
                    v_item.product_id,
                    COALESCE(v_item.warehouse_id, NEW.warehouse_id),
                    v_item.quantity,
                    v_item.unit_price -- التكلفة الجديدة
                );
                
                -- إنشاء حركة مخزون
                PERFORM create_inventory_movement(
                    NEW.company_id,
                    NEW.branch_id,
                    v_item.product_id,
                    COALESCE(v_item.warehouse_id, NEW.warehouse_id),
                    'in',
                    'purchase_invoice',
                    NEW.id,
                    v_item.quantity,
                    v_item.unit_price,
                    NEW.created_by
                );
                
                -- تحديث تكلفة المنتج
                UPDATE products
                SET cost_price = v_item.unit_price,
                    updated_at = NOW()
                WHERE id = v_item.product_id;
            END IF;
        END LOOP;
        
        -- إنشاء القيد المحاسبي
        v_entry_id := create_journal_entry(
            NEW.company_id,
            NEW.branch_id,
            NEW.invoice_date,
            'فاتورة مشتريات رقم ' || NEW.invoice_number,
            'purchase_invoice',
            NEW.id,
            NEW.created_by
        );
        
        -- مدين: المخزون
        PERFORM add_journal_entry_line(
            v_entry_id,
            v_inventory_account,
            'إضافة مخزون',
            NEW.subtotal,
            0
        );
        
        -- مدين: ضريبة مستردة (إن وجدت)
        IF NEW.tax_amount > 0 THEN
            PERFORM add_journal_entry_line(
                v_entry_id,
                get_system_account(NEW.company_id, '1401'), -- ضريبة مستردة
                'ضريبة قيمة مضافة مستردة',
                NEW.tax_amount,
                0
            );
        END IF;
        
        -- دائن: المورد
        PERFORM add_journal_entry_line(
            v_entry_id,
            v_supplier_account,
            'مشتريات من مورد',
            0,
            NEW.total,
            'supplier',
            NEW.supplier_id
        );
        
        -- ربط القيد بالفاتورة
        NEW.journal_entry_id := v_entry_id;
        
        -- تحديث رصيد المورد
        IF NEW.supplier_id IS NOT NULL THEN
            UPDATE suppliers
            SET balance = balance + NEW.total,
                updated_at = NOW()
            WHERE id = NEW.supplier_id;
        END IF;
        
        -- تسجيل وقت الترحيل
        NEW.confirmed_at := NOW();
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق Trigger
DROP TRIGGER IF EXISTS trg_purchase_invoice_confirmation ON purchase_invoices;
CREATE TRIGGER trg_purchase_invoice_confirmation
BEFORE UPDATE ON purchase_invoices
FOR EACH ROW
EXECUTE FUNCTION process_purchase_invoice_confirmation();

-- =========================================================
-- الجزء 5: Trigger سند القبض
-- =========================================================

CREATE OR REPLACE FUNCTION process_receipt_voucher()
RETURNS TRIGGER AS $$
DECLARE
    v_entry_id UUID;
    v_cash_account UUID;
    v_customer_account UUID;
BEGIN
    -- فقط للسندات الجديدة المؤكدة
    IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
        
        -- الحصول على حساب الخزينة
        IF NEW.vault_id IS NOT NULL THEN
            SELECT account_id INTO v_cash_account
            FROM vaults WHERE id = NEW.vault_id;
        END IF;
        v_cash_account := COALESCE(v_cash_account, get_system_account(NEW.company_id, '1101'));
        
        -- الحصول على حساب العميل
        IF NEW.customer_id IS NOT NULL THEN
            SELECT account_id INTO v_customer_account
            FROM customers WHERE id = NEW.customer_id;
        END IF;
        v_customer_account := COALESCE(v_customer_account, get_system_account(NEW.company_id, '1201'));
        
        -- إنشاء القيد المحاسبي
        v_entry_id := create_journal_entry(
            NEW.company_id,
            NEW.branch_id,
            NEW.receipt_date,
            'سند قبض رقم ' || NEW.receipt_number,
            'receipt_voucher',
            NEW.id,
            NEW.created_by
        );
        
        -- مدين: الخزينة
        PERFORM add_journal_entry_line(
            v_entry_id,
            v_cash_account,
            'قبض من عميل',
            NEW.amount,
            0
        );
        
        -- دائن: العميل
        PERFORM add_journal_entry_line(
            v_entry_id,
            v_customer_account,
            'سداد من عميل',
            0,
            NEW.amount,
            'customer',
            NEW.customer_id
        );
        
        -- ربط القيد
        NEW.journal_entry_id := v_entry_id;
        
        -- تحديث رصيد الخزينة
        IF NEW.vault_id IS NOT NULL THEN
            UPDATE vaults
            SET balance = balance + NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.vault_id;
        END IF;
        
        -- تحديث رصيد العميل (تخفيض)
        IF NEW.customer_id IS NOT NULL THEN
            UPDATE customers
            SET balance = balance - NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.customer_id;
        END IF;
        
        -- تحديث الفاتورة المرتبطة
        IF NEW.invoice_id IS NOT NULL THEN
            UPDATE sales_invoices
            SET paid_amount = paid_amount + NEW.amount,
                status = CASE 
                    WHEN paid_amount + NEW.amount >= total THEN 'paid'
                    ELSE 'partially_paid'
                END,
                updated_at = NOW()
            WHERE id = NEW.invoice_id;
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق Trigger
DROP TRIGGER IF EXISTS trg_receipt_voucher ON receipt_vouchers;
CREATE TRIGGER trg_receipt_voucher
BEFORE INSERT ON receipt_vouchers
FOR EACH ROW
EXECUTE FUNCTION process_receipt_voucher();

-- =========================================================
-- الجزء 6: Trigger سند الصرف
-- =========================================================

CREATE OR REPLACE FUNCTION process_payment_voucher()
RETURNS TRIGGER AS $$
DECLARE
    v_entry_id UUID;
    v_cash_account UUID;
    v_supplier_account UUID;
BEGIN
    -- فقط للسندات الجديدة المؤكدة
    IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
        
        -- الحصول على حساب الخزينة
        IF NEW.vault_id IS NOT NULL THEN
            SELECT account_id INTO v_cash_account
            FROM vaults WHERE id = NEW.vault_id;
        END IF;
        v_cash_account := COALESCE(v_cash_account, get_system_account(NEW.company_id, '1101'));
        
        -- الحصول على حساب المورد
        IF NEW.supplier_id IS NOT NULL THEN
            SELECT account_id INTO v_supplier_account
            FROM suppliers WHERE id = NEW.supplier_id;
        END IF;
        v_supplier_account := COALESCE(v_supplier_account, get_system_account(NEW.company_id, '2101'));
        
        -- إنشاء القيد المحاسبي
        v_entry_id := create_journal_entry(
            NEW.company_id,
            NEW.branch_id,
            NEW.payment_date,
            'سند صرف رقم ' || NEW.payment_number,
            'payment_voucher',
            NEW.id,
            NEW.created_by
        );
        
        -- مدين: المورد
        PERFORM add_journal_entry_line(
            v_entry_id,
            v_supplier_account,
            'سداد لمورد',
            NEW.amount,
            0,
            'supplier',
            NEW.supplier_id
        );
        
        -- دائن: الخزينة
        PERFORM add_journal_entry_line(
            v_entry_id,
            v_cash_account,
            'صرف لمورد',
            0,
            NEW.amount
        );
        
        -- ربط القيد
        NEW.journal_entry_id := v_entry_id;
        
        -- تحديث رصيد الخزينة (تخفيض)
        IF NEW.vault_id IS NOT NULL THEN
            UPDATE vaults
            SET balance = balance - NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.vault_id;
        END IF;
        
        -- تحديث رصيد المورد (تخفيض)
        IF NEW.supplier_id IS NOT NULL THEN
            UPDATE suppliers
            SET balance = balance - NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.supplier_id;
        END IF;
        
        -- تحديث الفاتورة المرتبطة
        IF NEW.invoice_id IS NOT NULL THEN
            UPDATE purchase_invoices
            SET paid_amount = paid_amount + NEW.amount,
                status = CASE 
                    WHEN paid_amount + NEW.amount >= total THEN 'paid'
                    ELSE 'partially_paid'
                END,
                updated_at = NOW()
            WHERE id = NEW.invoice_id;
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق Trigger
DROP TRIGGER IF EXISTS trg_payment_voucher ON payment_vouchers;
CREATE TRIGGER trg_payment_voucher
BEFORE INSERT ON payment_vouchers
FOR EACH ROW
EXECUTE FUNCTION process_payment_voucher();

-- =========================================================
-- النهاية
-- =========================================================
