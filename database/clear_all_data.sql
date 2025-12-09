-- كود مسح جميع البيانات التجريبية (نسخة آمنة)
-- ⚠️ تحذير: هذا الملف سيحذف جميع البيانات من قاعدة البيانات!
-- شغّل هذا الملف في Supabase SQL Editor

-- حذف جميع الجداول بشكل آمن (IF EXISTS)
-- سيتخطى الجداول غير الموجودة

DROP TABLE IF EXISTS journal_entry_lines CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS sales_order_items CASCADE;
DROP TABLE IF EXISTS sales_orders CASCADE;
DROP TABLE IF EXISTS quotation_items CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS purchase_return_items CASCADE;
DROP TABLE IF EXISTS purchase_returns CASCADE;
DROP TABLE IF EXISTS sales_return_items CASCADE;
DROP TABLE IF EXISTS sales_returns CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS stocktake_items CASCADE;
DROP TABLE IF EXISTS stocktakes CASCADE;
DROP TABLE IF EXISTS transfer_items CASCADE;
DROP TABLE IF EXISTS transfers CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS product_stock CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS vaults CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS tax_rates CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS shipping_carriers CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS usage_history CASCADE;
DROP TABLE IF EXISTS app_user_companies CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS currencies CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- حذف الدوال إن وجدت
DROP FUNCTION IF EXISTS update_account_balance CASCADE;
DROP FUNCTION IF EXISTS rpc_increment_usage CASCADE;
DROP FUNCTION IF EXISTS get_customer_balance CASCADE;
DROP FUNCTION IF EXISTS get_supplier_balance CASCADE;
DROP FUNCTION IF EXISTS get_product_stock CASCADE;
DROP FUNCTION IF EXISTS check_stock_availability CASCADE;
DROP FUNCTION IF EXISTS calculate_invoice_totals CASCADE;
DROP FUNCTION IF EXISTS generate_document_number CASCADE;

-- رسالة نجاح
DO $$
BEGIN
    RAISE NOTICE '✅ تم مسح جميع الجداول بنجاح!';
    RAISE NOTICE '💡 الآن شغّل ملف complete_final_setup.sql لإعادة إنشاء الجداول';
END $$;
