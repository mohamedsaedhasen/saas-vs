-- =============================================
-- نظام ERP SaaS - إعادة تعيين قاعدة البيانات
-- =============================================
-- ⚠️ تحذير: هذا الملف يحذف كل البيانات!
-- =============================================

-- حذف الجداول بالترتيب الصحيح (عكس الإنشاء)

-- المدفوعات والمقبوضات
DROP TABLE IF EXISTS payment_allocations CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS receipt_allocations CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;

-- المبيعات
DROP TABLE IF EXISTS sales_return_items CASCADE;
DROP TABLE IF EXISTS sales_returns CASCADE;
DROP TABLE IF EXISTS sales_invoice_items CASCADE;
DROP TABLE IF EXISTS sales_invoices CASCADE;
DROP TABLE IF EXISTS sales_order_items CASCADE;
DROP TABLE IF EXISTS sales_orders CASCADE;
DROP TABLE IF EXISTS sales_quotation_items CASCADE;
DROP TABLE IF EXISTS sales_quotations CASCADE;

-- المشتريات
DROP TABLE IF EXISTS purchase_return_items CASCADE;
DROP TABLE IF EXISTS purchase_returns CASCADE;
DROP TABLE IF EXISTS purchase_invoice_items CASCADE;
DROP TABLE IF EXISTS purchase_invoices CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;

-- المصروفات
DROP TABLE IF EXISTS expense_voucher_items CASCADE;
DROP TABLE IF EXISTS expense_vouchers CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;

-- المخزون
DROP TABLE IF EXISTS stocktake_items CASCADE;
DROP TABLE IF EXISTS stocktakes CASCADE;
DROP TABLE IF EXISTS inventory_transfer_items CASCADE;
DROP TABLE IF EXISTS inventory_transfers CASCADE;
DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS product_inventory CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS units_of_measure CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;

-- المحاسبة
DROP TABLE IF EXISTS journal_entry_lines CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS vaults CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS fiscal_periods CASCADE;

-- العملاء والموردين
DROP TABLE IF EXISTS customer_addresses CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS supplier_addresses CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- الشحن
DROP TABLE IF EXISTS shipment_items CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS shipping_zones CASCADE;
DROP TABLE IF EXISTS shipping_carriers CASCADE;

-- SaaS
DROP TABLE IF EXISTS usage_tracking CASCADE;
DROP TABLE IF EXISTS company_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- الإشعارات والسجلات
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS security_logs CASCADE;

-- الصلاحيات
DROP TABLE IF EXISTS user_branch_access CASCADE;
DROP TABLE IF EXISTS user_devices CASCADE;
DROP TABLE IF EXISTS user_invitations CASCADE;
DROP TABLE IF EXISTS app_user_companies CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS modules CASCADE;

-- الأساسيات
DROP TABLE IF EXISTS app_users CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- الدوال
DROP FUNCTION IF EXISTS set_tenant_context(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS current_company_id() CASCADE;
DROP FUNCTION IF EXISTS current_user_id() CASCADE;
DROP FUNCTION IF EXISTS current_branch_id() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- ✅ تم حذف كل شيء
