-- =========================================================
-- نظام ERP SaaS - دوال وسياسات RLS
-- الإصدار: 2.0
-- شغّل هذا الملف بعد complete_supabase_setup_v2.sql
-- =========================================================

-- =========================================================
-- الجزء 1: الدوال المساعدة
-- =========================================================

-- 1.1 دالة ضبط سياق المستأجر
CREATE OR REPLACE FUNCTION set_tenant_context(
    p_user_id UUID,
    p_company_id UUID,
    p_branch_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_id', COALESCE(p_user_id::text, ''), false);
    PERFORM set_config('app.current_company_id', COALESCE(p_company_id::text, ''), false);
    PERFORM set_config('app.current_branch_id', COALESCE(p_branch_id::text, ''), false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.2 الحصول على معرف المستخدم الحالي
CREATE OR REPLACE FUNCTION current_user_id() 
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 1.3 الحصول على معرف الشركة الحالية
CREATE OR REPLACE FUNCTION current_company_id() 
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_company_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 1.4 الحصول على معرف الفرع الحالي
CREATE OR REPLACE FUNCTION current_branch_id() 
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_branch_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 1.5 التحقق من وصول المستخدم للشركة
CREATE OR REPLACE FUNCTION user_has_company_access(p_company_id UUID DEFAULT NULL) 
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_company_id UUID;
BEGIN
    v_user_id := current_user_id();
    v_company_id := COALESCE(p_company_id, current_company_id());
    
    IF v_user_id IS NULL OR v_company_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM app_user_companies
        WHERE user_id = v_user_id
        AND company_id = v_company_id
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 1.6 التحقق من وصول المستخدم للفرع
CREATE OR REPLACE FUNCTION user_has_branch_access(p_branch_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := current_user_id();
    
    IF v_user_id IS NULL OR p_branch_id IS NULL THEN
        RETURN TRUE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM user_branch_access
        WHERE user_id = v_user_id
        AND branch_id = p_branch_id
        AND can_view = true
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 1.7 التحقق من أن المستخدم Super Admin
CREATE OR REPLACE FUNCTION is_super_admin() 
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_company_id UUID;
BEGIN
    v_user_id := current_user_id();
    v_company_id := current_company_id();
    
    IF v_user_id IS NULL OR v_company_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 FROM app_user_companies auc
        JOIN roles r ON r.id = auc.role_id
        WHERE auc.user_id = v_user_id
        AND auc.company_id = v_company_id
        AND (auc.is_owner = true OR r.is_super_admin = true)
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 1.8 التحقق من صلاحية معينة
CREATE OR REPLACE FUNCTION user_has_permission(
    p_module_code VARCHAR,
    p_action VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_company_id UUID;
BEGIN
    v_user_id := current_user_id();
    v_company_id := current_company_id();
    
    IF is_super_admin() THEN
        RETURN TRUE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 
        FROM app_user_companies auc
        JOIN role_permissions rp ON rp.role_id = auc.role_id
        JOIN permissions p ON p.id = rp.permission_id
        JOIN modules m ON m.id = p.module_id
        WHERE auc.user_id = v_user_id
        AND auc.company_id = v_company_id
        AND m.code = p_module_code
        AND p.action = p_action
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =========================================================
-- الجزء 2: دوال تحديث الأرصدة
-- =========================================================

-- 2.1 تحديث رصيد العميل
CREATE OR REPLACE FUNCTION update_customer_balance(
    p_customer_id UUID,
    p_amount DECIMAL(15,2)
) RETURNS void AS $$
BEGIN
    UPDATE customers 
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.2 تحديث رصيد المورد
CREATE OR REPLACE FUNCTION update_supplier_balance(
    p_supplier_id UUID,
    p_amount DECIMAL(15,2)
) RETURNS void AS $$
BEGIN
    UPDATE suppliers 
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE id = p_supplier_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.3 تحديث رصيد الخزينة
CREATE OR REPLACE FUNCTION update_vault_balance(
    p_vault_id UUID,
    p_amount DECIMAL(15,2)
) RETURNS void AS $$
BEGIN
    UPDATE vaults 
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE id = p_vault_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- الجزء 3: Triggers للتحقق من التناسق
-- =========================================================

-- 3.1 التأكد أن الفرع ينتمي للشركة
CREATE OR REPLACE FUNCTION check_branch_belongs_to_company() 
RETURNS TRIGGER AS $$
DECLARE
    v_branch_company_id UUID;
BEGIN
    IF NEW.branch_id IS NOT NULL AND NEW.company_id IS NOT NULL THEN
        SELECT company_id INTO v_branch_company_id 
        FROM branches WHERE id = NEW.branch_id;
        
        IF v_branch_company_id IS NULL THEN
            RAISE EXCEPTION 'Branch not found';
        END IF;
        
        IF v_branch_company_id != NEW.company_id THEN
            RAISE EXCEPTION 'Branch does not belong to the specified company';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق على الجداول
DROP TRIGGER IF EXISTS trg_warehouses_branch_company ON warehouses;
CREATE TRIGGER trg_warehouses_branch_company
BEFORE INSERT OR UPDATE ON warehouses
FOR EACH ROW EXECUTE FUNCTION check_branch_belongs_to_company();

DROP TRIGGER IF EXISTS trg_vaults_branch_company ON vaults;
CREATE TRIGGER trg_vaults_branch_company
BEFORE INSERT OR UPDATE ON vaults
FOR EACH ROW EXECUTE FUNCTION check_branch_belongs_to_company();

DROP TRIGGER IF EXISTS trg_sales_invoices_branch_company ON sales_invoices;
CREATE TRIGGER trg_sales_invoices_branch_company
BEFORE INSERT OR UPDATE ON sales_invoices
FOR EACH ROW EXECUTE FUNCTION check_branch_belongs_to_company();

DROP TRIGGER IF EXISTS trg_purchase_invoices_branch_company ON purchase_invoices;
CREATE TRIGGER trg_purchase_invoices_branch_company
BEFORE INSERT OR UPDATE ON purchase_invoices
FOR EACH ROW EXECUTE FUNCTION check_branch_belongs_to_company();

DROP TRIGGER IF EXISTS trg_shipments_branch_company ON shipments;
CREATE TRIGGER trg_shipments_branch_company
BEFORE INSERT OR UPDATE ON shipments
FOR EACH ROW EXECUTE FUNCTION check_branch_belongs_to_company();

-- 3.2 التأكد من تناسق المخزون
CREATE OR REPLACE FUNCTION check_inventory_consistency() 
RETURNS TRIGGER AS $$
DECLARE
    v_product_company_id UUID;
    v_warehouse_company_id UUID;
BEGIN
    SELECT company_id INTO v_product_company_id FROM products WHERE id = NEW.product_id;
    SELECT company_id INTO v_warehouse_company_id FROM warehouses WHERE id = NEW.warehouse_id;
    
    IF v_product_company_id != v_warehouse_company_id THEN
        RAISE EXCEPTION 'Product and Warehouse must belong to the same company';
    END IF;
    
    IF NEW.company_id != v_product_company_id THEN
        RAISE EXCEPTION 'Inventory company_id must match product company';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_consistency ON product_inventory;
CREATE TRIGGER trg_inventory_consistency
BEFORE INSERT OR UPDATE ON product_inventory
FOR EACH ROW EXECUTE FUNCTION check_inventory_consistency();

-- =========================================================
-- الجزء 4: سياسات RLS
-- =========================================================

-- تفعيل RLS على جميع الجداول
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_branch_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- الشركات
DROP POLICY IF EXISTS companies_select ON companies;
CREATE POLICY companies_select ON companies FOR SELECT
USING (id IN (SELECT company_id FROM app_user_companies WHERE user_id = current_user_id()));

DROP POLICY IF EXISTS companies_update ON companies;
CREATE POLICY companies_update ON companies FOR UPDATE
USING (id IN (SELECT company_id FROM app_user_companies WHERE user_id = current_user_id() AND is_owner = true));

-- الفروع
DROP POLICY IF EXISTS branches_select ON branches;
CREATE POLICY branches_select ON branches FOR SELECT
USING (company_id = current_company_id());

DROP POLICY IF EXISTS branches_all ON branches;
CREATE POLICY branches_all ON branches FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- الأدوار
DROP POLICY IF EXISTS roles_all ON roles;
CREATE POLICY roles_all ON roles FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- العملاء
DROP POLICY IF EXISTS customers_all ON customers;
CREATE POLICY customers_all ON customers FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- الموردين
DROP POLICY IF EXISTS suppliers_all ON suppliers;
CREATE POLICY suppliers_all ON suppliers FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- فئات المنتجات
DROP POLICY IF EXISTS product_categories_all ON product_categories;
CREATE POLICY product_categories_all ON product_categories FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- المنتجات
DROP POLICY IF EXISTS products_all ON products;
CREATE POLICY products_all ON products FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- المخازن
DROP POLICY IF EXISTS warehouses_all ON warehouses;
CREATE POLICY warehouses_all ON warehouses FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- مخزون المنتجات
DROP POLICY IF EXISTS product_inventory_all ON product_inventory;
CREATE POLICY product_inventory_all ON product_inventory FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- حركات المخزون
DROP POLICY IF EXISTS inventory_movements_all ON inventory_movements;
CREATE POLICY inventory_movements_all ON inventory_movements FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- الحسابات
DROP POLICY IF EXISTS accounts_all ON accounts;
CREATE POLICY accounts_all ON accounts FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- القيود المحاسبية
DROP POLICY IF EXISTS journal_entries_all ON journal_entries;
CREATE POLICY journal_entries_all ON journal_entries FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- تفاصيل القيود
DROP POLICY IF EXISTS journal_entry_lines_all ON journal_entry_lines;
CREATE POLICY journal_entry_lines_all ON journal_entry_lines FOR ALL
USING (journal_entry_id IN (SELECT id FROM journal_entries WHERE company_id = current_company_id()))
WITH CHECK (journal_entry_id IN (SELECT id FROM journal_entries WHERE company_id = current_company_id()));

-- الخزائن
DROP POLICY IF EXISTS vaults_all ON vaults;
CREATE POLICY vaults_all ON vaults FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- فواتير المبيعات
DROP POLICY IF EXISTS sales_invoices_all ON sales_invoices;
CREATE POLICY sales_invoices_all ON sales_invoices FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- تفاصيل فواتير المبيعات
DROP POLICY IF EXISTS sales_invoice_items_all ON sales_invoice_items;
CREATE POLICY sales_invoice_items_all ON sales_invoice_items FOR ALL
USING (invoice_id IN (SELECT id FROM sales_invoices WHERE company_id = current_company_id()))
WITH CHECK (invoice_id IN (SELECT id FROM sales_invoices WHERE company_id = current_company_id()));

-- سندات القبض
DROP POLICY IF EXISTS receipt_vouchers_all ON receipt_vouchers;
CREATE POLICY receipt_vouchers_all ON receipt_vouchers FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- فواتير المشتريات
DROP POLICY IF EXISTS purchase_invoices_all ON purchase_invoices;
CREATE POLICY purchase_invoices_all ON purchase_invoices FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- تفاصيل فواتير المشتريات
DROP POLICY IF EXISTS purchase_invoice_items_all ON purchase_invoice_items;
CREATE POLICY purchase_invoice_items_all ON purchase_invoice_items FOR ALL
USING (invoice_id IN (SELECT id FROM purchase_invoices WHERE company_id = current_company_id()))
WITH CHECK (invoice_id IN (SELECT id FROM purchase_invoices WHERE company_id = current_company_id()));

-- سندات الصرف
DROP POLICY IF EXISTS payment_vouchers_all ON payment_vouchers;
CREATE POLICY payment_vouchers_all ON payment_vouchers FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- شركات الشحن
DROP POLICY IF EXISTS shipping_carriers_all ON shipping_carriers;
CREATE POLICY shipping_carriers_all ON shipping_carriers FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- الشحنات
DROP POLICY IF EXISTS shipments_all ON shipments;
CREATE POLICY shipments_all ON shipments FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- تسلسلات الأرقام
DROP POLICY IF EXISTS number_sequences_all ON number_sequences;
CREATE POLICY number_sequences_all ON number_sequences FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- سجل الأنشطة
DROP POLICY IF EXISTS user_activity_logs_all ON user_activity_logs;
CREATE POLICY user_activity_logs_all ON user_activity_logs FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- الإشعارات
DROP POLICY IF EXISTS notifications_all ON notifications;
CREATE POLICY notifications_all ON notifications FOR ALL
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

-- =========================================================
-- نهاية ملف RLS
-- =========================================================
