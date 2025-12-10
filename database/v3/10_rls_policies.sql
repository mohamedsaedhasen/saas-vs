-- =============================================
-- نظام ERP SaaS - سياسات أمان الصفوف (RLS)
-- =============================================

-- =============================================
-- تفعيل RLS على جميع الجداول
-- =============================================

-- الأساسيات
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_branch_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- المحاسبة
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;

-- المخزون
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE units_of_measure ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- العملاء والموردين
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_addresses ENABLE ROW LEVEL SECURITY;

-- المبيعات
ALTER TABLE sales_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_return_items ENABLE ROW LEVEL SECURITY;

-- المشتريات
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_return_items ENABLE ROW LEVEL SECURITY;

-- المقبوضات والمدفوعات
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_voucher_items ENABLE ROW LEVEL SECURITY;

-- =============================================
-- سياسات الشركات
-- =============================================
CREATE POLICY companies_select ON companies FOR SELECT
USING (
    id = current_company_id() 
    OR current_company_id() IS NULL
);

CREATE POLICY companies_all ON companies FOR ALL
USING (id = current_company_id())
WITH CHECK (id = current_company_id());

-- =============================================
-- سياسات الفروع
-- =============================================
CREATE POLICY branches_all ON branches FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- =============================================
-- سياسات المستخدمين
-- =============================================
CREATE POLICY app_users_select ON app_users FOR SELECT
USING (
    id = current_user_id()
    OR id IN (
        SELECT auc.user_id FROM app_user_companies auc
        WHERE auc.company_id = current_company_id()
    )
    OR current_company_id() IS NULL
);

-- =============================================
-- سياسات عامة للجداول ذات company_id
-- =============================================

-- المحاسبة
CREATE POLICY accounts_all ON accounts FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY fiscal_periods_all ON fiscal_periods FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY journal_entries_all ON journal_entries FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY vaults_all ON vaults FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- المخزون
CREATE POLICY product_categories_all ON product_categories FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY brands_all ON brands FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY units_all ON units_of_measure FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY warehouses_all ON warehouses FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY products_all ON products FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY product_inventory_all ON product_inventory FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY inventory_movements_all ON inventory_movements FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- العملاء والموردين
CREATE POLICY customers_all ON customers FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY suppliers_all ON suppliers FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- المبيعات
CREATE POLICY sales_quotations_all ON sales_quotations FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY sales_orders_all ON sales_orders FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY sales_invoices_all ON sales_invoices FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY sales_returns_all ON sales_returns FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- المشتريات
CREATE POLICY purchase_orders_all ON purchase_orders FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY purchase_invoices_all ON purchase_invoices FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY purchase_returns_all ON purchase_returns FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- المقبوضات والمدفوعات
CREATE POLICY receipts_all ON receipts FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY payments_all ON payments FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY expense_categories_all ON expense_categories FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY expense_vouchers_all ON expense_vouchers FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- الأدوار والصلاحيات
CREATE POLICY roles_all ON roles FOR ALL
USING (company_id = current_company_id() OR company_id IS NULL)
WITH CHECK (company_id = current_company_id() OR company_id IS NULL);

CREATE POLICY app_user_companies_all ON app_user_companies FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY user_branch_access_all ON user_branch_access FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY user_invitations_all ON user_invitations FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- ✅ تم إنشاء سياسات الأمان
