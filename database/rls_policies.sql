-- =============================================
-- سياسات RLS الكاملة لنظام ERP SaaS V2
-- =============================================

-- =============================================
-- الجزء 1: الدوال المساعدة
-- =============================================

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
        RETURN TRUE; -- إذا لم يُحدد فرع، السماح
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
    
    -- Super Admin لديه كل الصلاحيات
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

-- =============================================
-- الجزء 2: Triggers للتحقق من تناسق البيانات
-- =============================================

-- 2.1 التأكد أن الفرع ينتمي للشركة الصحيحة
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
CREATE TRIGGER trg_warehouses_branch_company
BEFORE INSERT OR UPDATE ON warehouses
FOR EACH ROW EXECUTE FUNCTION check_branch_belongs_to_company();

CREATE TRIGGER trg_vaults_branch_company
BEFORE INSERT OR UPDATE ON vaults
FOR EACH ROW EXECUTE FUNCTION check_branch_belongs_to_company();

CREATE TRIGGER trg_sales_invoices_branch_company
BEFORE INSERT OR UPDATE ON sales_invoices
FOR EACH ROW EXECUTE FUNCTION check_branch_belongs_to_company();

CREATE TRIGGER trg_purchase_invoices_branch_company
BEFORE INSERT OR UPDATE ON purchase_invoices
FOR EACH ROW EXECUTE FUNCTION check_branch_belongs_to_company();

CREATE TRIGGER trg_shipments_branch_company
BEFORE INSERT OR UPDATE ON shipments
FOR EACH ROW EXECUTE FUNCTION check_branch_belongs_to_company();

-- 2.2 التأكد من تناسق المخزون
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

CREATE TRIGGER trg_inventory_consistency
BEFORE INSERT OR UPDATE ON product_inventory
FOR EACH ROW EXECUTE FUNCTION check_inventory_consistency();

-- =============================================
-- الجزء 3: سياسات RLS للجداول
-- =============================================

-- 3.1 الشركات (خاص - يرى المستخدم شركاته فقط)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY companies_select ON companies FOR SELECT
USING (
    id IN (
        SELECT company_id FROM app_user_companies 
        WHERE user_id = current_user_id()
    )
);

CREATE POLICY companies_update ON companies FOR UPDATE
USING (
    id IN (
        SELECT company_id FROM app_user_companies 
        WHERE user_id = current_user_id() AND is_owner = true
    )
);

-- 3.2 الفروع
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY branches_select ON branches FOR SELECT
USING (company_id = current_company_id());

CREATE POLICY branches_insert ON branches FOR INSERT
WITH CHECK (company_id = current_company_id() AND is_super_admin());

CREATE POLICY branches_update ON branches FOR UPDATE
USING (company_id = current_company_id() AND is_super_admin());

CREATE POLICY branches_delete ON branches FOR DELETE
USING (company_id = current_company_id() AND is_super_admin());

-- 3.3 العملاء
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY customers_select ON customers FOR SELECT
USING (
    company_id = current_company_id()
    AND (branch_id IS NULL OR user_has_branch_access(branch_id) OR is_super_admin())
);

CREATE POLICY customers_insert ON customers FOR INSERT
WITH CHECK (
    company_id = current_company_id()
    AND user_has_permission('customers', 'write')
);

CREATE POLICY customers_update ON customers FOR UPDATE
USING (
    company_id = current_company_id()
    AND user_has_permission('customers', 'write')
);

CREATE POLICY customers_delete ON customers FOR DELETE
USING (
    company_id = current_company_id()
    AND user_has_permission('customers', 'delete')
);

-- 3.4 الموردين
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY suppliers_select ON suppliers FOR SELECT
USING (company_id = current_company_id());

CREATE POLICY suppliers_insert ON suppliers FOR INSERT
WITH CHECK (
    company_id = current_company_id()
    AND user_has_permission('suppliers', 'write')
);

CREATE POLICY suppliers_update ON suppliers FOR UPDATE
USING (
    company_id = current_company_id()
    AND user_has_permission('suppliers', 'write')
);

CREATE POLICY suppliers_delete ON suppliers FOR DELETE
USING (
    company_id = current_company_id()
    AND user_has_permission('suppliers', 'delete')
);

-- 3.5 المنتجات
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_select ON products FOR SELECT
USING (company_id = current_company_id());

CREATE POLICY products_insert ON products FOR INSERT
WITH CHECK (
    company_id = current_company_id()
    AND user_has_permission('products', 'write')
);

CREATE POLICY products_update ON products FOR UPDATE
USING (
    company_id = current_company_id()
    AND user_has_permission('products', 'write')
);

CREATE POLICY products_delete ON products FOR DELETE
USING (
    company_id = current_company_id()
    AND user_has_permission('products', 'delete')
);

-- 3.6 فئات المنتجات
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_categories_all ON product_categories
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- 3.7 المخازن
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY warehouses_select ON warehouses FOR SELECT
USING (
    company_id = current_company_id()
    AND (branch_id IS NULL OR user_has_branch_access(branch_id) OR is_super_admin())
);

CREATE POLICY warehouses_insert ON warehouses FOR INSERT
WITH CHECK (company_id = current_company_id() AND user_has_permission('inventory', 'write'));

CREATE POLICY warehouses_update ON warehouses FOR UPDATE
USING (company_id = current_company_id() AND user_has_permission('inventory', 'write'));

CREATE POLICY warehouses_delete ON warehouses FOR DELETE
USING (company_id = current_company_id() AND user_has_permission('inventory', 'delete'));

-- 3.8 المخزون
ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_select ON product_inventory FOR SELECT
USING (company_id = current_company_id());

CREATE POLICY inventory_insert ON product_inventory FOR INSERT
WITH CHECK (company_id = current_company_id());

CREATE POLICY inventory_update ON product_inventory FOR UPDATE
USING (company_id = current_company_id());

-- 3.9 حركات المخزون
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_movements_select ON inventory_movements FOR SELECT
USING (company_id = current_company_id());

CREATE POLICY inventory_movements_insert ON inventory_movements FOR INSERT
WITH CHECK (company_id = current_company_id());

-- 3.10 الحسابات
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY accounts_select ON accounts FOR SELECT
USING (company_id = current_company_id());

CREATE POLICY accounts_insert ON accounts FOR INSERT
WITH CHECK (
    company_id = current_company_id()
    AND user_has_permission('accounting', 'write')
);

CREATE POLICY accounts_update ON accounts FOR UPDATE
USING (
    company_id = current_company_id()
    AND user_has_permission('accounting', 'write')
    AND is_system = false
);

CREATE POLICY accounts_delete ON accounts FOR DELETE
USING (
    company_id = current_company_id()
    AND user_has_permission('accounting', 'delete')
    AND is_system = false
);

-- 3.11 القيود المحاسبية
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY journal_entries_select ON journal_entries FOR SELECT
USING (
    company_id = current_company_id()
    AND (branch_id IS NULL OR user_has_branch_access(branch_id) OR is_super_admin())
);

CREATE POLICY journal_entries_insert ON journal_entries FOR INSERT
WITH CHECK (
    company_id = current_company_id()
    AND user_has_permission('accounting', 'write')
);

CREATE POLICY journal_entries_update ON journal_entries FOR UPDATE
USING (
    company_id = current_company_id()
    AND user_has_permission('accounting', 'write')
    AND status = 'draft'
);

-- 3.12 تفاصيل القيود
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY journal_entry_lines_all ON journal_entry_lines
USING (
    journal_entry_id IN (
        SELECT id FROM journal_entries WHERE company_id = current_company_id()
    )
)
WITH CHECK (
    journal_entry_id IN (
        SELECT id FROM journal_entries WHERE company_id = current_company_id()
    )
);

-- 3.13 فواتير المبيعات
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY sales_invoices_select ON sales_invoices FOR SELECT
USING (
    company_id = current_company_id()
    AND (branch_id IS NULL OR user_has_branch_access(branch_id) OR is_super_admin())
);

CREATE POLICY sales_invoices_insert ON sales_invoices FOR INSERT
WITH CHECK (
    company_id = current_company_id()
    AND user_has_permission('sales', 'write')
);

CREATE POLICY sales_invoices_update ON sales_invoices FOR UPDATE
USING (
    company_id = current_company_id()
    AND user_has_permission('sales', 'write')
);

CREATE POLICY sales_invoices_delete ON sales_invoices FOR DELETE
USING (
    company_id = current_company_id()
    AND user_has_permission('sales', 'delete')
    AND status = 'draft'
);

-- 3.14 تفاصيل فواتير المبيعات
ALTER TABLE sales_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY sales_invoice_items_all ON sales_invoice_items
USING (
    invoice_id IN (
        SELECT id FROM sales_invoices WHERE company_id = current_company_id()
    )
)
WITH CHECK (
    invoice_id IN (
        SELECT id FROM sales_invoices WHERE company_id = current_company_id()
    )
);

-- 3.15 فواتير المشتريات
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY purchase_invoices_select ON purchase_invoices FOR SELECT
USING (
    company_id = current_company_id()
    AND (branch_id IS NULL OR user_has_branch_access(branch_id) OR is_super_admin())
);

CREATE POLICY purchase_invoices_insert ON purchase_invoices FOR INSERT
WITH CHECK (
    company_id = current_company_id()
    AND user_has_permission('purchases', 'write')
);

CREATE POLICY purchase_invoices_update ON purchase_invoices FOR UPDATE
USING (
    company_id = current_company_id()
    AND user_has_permission('purchases', 'write')
);

CREATE POLICY purchase_invoices_delete ON purchase_invoices FOR DELETE
USING (
    company_id = current_company_id()
    AND user_has_permission('purchases', 'delete')
    AND status = 'draft'
);

-- 3.16 تفاصيل فواتير المشتريات
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY purchase_invoice_items_all ON purchase_invoice_items
USING (
    invoice_id IN (
        SELECT id FROM purchase_invoices WHERE company_id = current_company_id()
    )
)
WITH CHECK (
    invoice_id IN (
        SELECT id FROM purchase_invoices WHERE company_id = current_company_id()
    )
);

-- 3.17 الخزائن
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY vaults_select ON vaults FOR SELECT
USING (
    company_id = current_company_id()
    AND (branch_id IS NULL OR user_has_branch_access(branch_id) OR is_super_admin())
);

CREATE POLICY vaults_insert ON vaults FOR INSERT
WITH CHECK (company_id = current_company_id() AND is_super_admin());

CREATE POLICY vaults_update ON vaults FOR UPDATE
USING (company_id = current_company_id() AND is_super_admin());

-- 3.18 سندات القبض
ALTER TABLE receipt_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY receipt_vouchers_select ON receipt_vouchers FOR SELECT
USING (company_id = current_company_id());

CREATE POLICY receipt_vouchers_insert ON receipt_vouchers FOR INSERT
WITH CHECK (
    company_id = current_company_id()
    AND user_has_permission('accounting', 'write')
);

-- 3.19 سندات الصرف
ALTER TABLE payment_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_vouchers_select ON payment_vouchers FOR SELECT
USING (company_id = current_company_id());

CREATE POLICY payment_vouchers_insert ON payment_vouchers FOR INSERT
WITH CHECK (
    company_id = current_company_id()
    AND user_has_permission('accounting', 'write')
);

-- 3.20 شركات الشحن
ALTER TABLE shipping_carriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY shipping_carriers_all ON shipping_carriers
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- 3.21 الشحنات
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY shipments_select ON shipments FOR SELECT
USING (
    company_id = current_company_id()
    AND (branch_id IS NULL OR user_has_branch_access(branch_id) OR is_super_admin())
);

CREATE POLICY shipments_insert ON shipments FOR INSERT
WITH CHECK (
    company_id = current_company_id()
    AND user_has_permission('shipping', 'write')
);

CREATE POLICY shipments_update ON shipments FOR UPDATE
USING (
    company_id = current_company_id()
    AND user_has_permission('shipping', 'write')
);

-- 3.22 سجل الأنشطة
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY activity_logs_select ON user_activity_logs FOR SELECT
USING (company_id = current_company_id() AND is_super_admin());

CREATE POLICY activity_logs_insert ON user_activity_logs FOR INSERT
WITH CHECK (company_id = current_company_id());

-- 3.23 الإشعارات
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select ON notifications FOR SELECT
USING (
    company_id = current_company_id()
    AND user_id = current_user_id()
);

CREATE POLICY notifications_update ON notifications FOR UPDATE
USING (
    company_id = current_company_id()
    AND user_id = current_user_id()
);

-- 3.24 الأدوار
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY roles_select ON roles FOR SELECT
USING (company_id = current_company_id() OR company_id IS NULL);

CREATE POLICY roles_insert ON roles FOR INSERT
WITH CHECK (company_id = current_company_id() AND is_super_admin());

CREATE POLICY roles_update ON roles FOR UPDATE
USING (company_id = current_company_id() AND is_super_admin() AND is_system = false);

CREATE POLICY roles_delete ON roles FOR DELETE
USING (company_id = current_company_id() AND is_super_admin() AND is_system = false);

-- 3.25 صلاحيات الأدوار
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY role_permissions_select ON role_permissions FOR SELECT
USING (
    role_id IN (
        SELECT id FROM roles WHERE company_id = current_company_id() OR company_id IS NULL
    )
);

CREATE POLICY role_permissions_insert ON role_permissions FOR INSERT
WITH CHECK (
    role_id IN (
        SELECT id FROM roles WHERE company_id = current_company_id()
    )
    AND is_super_admin()
);

CREATE POLICY role_permissions_delete ON role_permissions FOR DELETE
USING (
    role_id IN (
        SELECT id FROM roles WHERE company_id = current_company_id()
    )
    AND is_super_admin()
);

-- 3.26 وحدات القياس
ALTER TABLE units_of_measure ENABLE ROW LEVEL SECURITY;

CREATE POLICY units_all ON units_of_measure
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- 3.27 تسلسلات الأرقام
ALTER TABLE number_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY sequences_all ON number_sequences
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- =============================================
-- الجداول بدون RLS (عامة أو محمية بطريقة أخرى)
-- =============================================

-- الوحدات والصلاحيات المعرّفة عامة
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;

-- المستخدمين وأجهزتهم
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_branch_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE device_approval_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations DISABLE ROW LEVEL SECURITY;

-- =============================================
-- النهاية
-- =============================================
