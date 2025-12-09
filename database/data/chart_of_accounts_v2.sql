-- =========================================================
-- نظام ERP SaaS - شجرة الحسابات المصرية الموحدة
-- الإصدار: 2.0
-- =========================================================

-- دالة لإنشاء شجرة الحسابات لشركة معينة
CREATE OR REPLACE FUNCTION create_chart_of_accounts(p_company_id UUID)
RETURNS void AS $$
DECLARE
    v_accounts JSONB;
BEGIN
    -- الحسابات الرئيسية المصرية
    v_accounts := '[
        {"code": "1", "name": "Assets", "name_ar": "الأصول", "type": "asset", "nature": "debit", "is_header": true},
        {"code": "11", "name": "Current Assets", "name_ar": "الأصول المتداولة", "type": "asset", "nature": "debit", "is_header": true, "parent": "1"},
        {"code": "1101", "name": "Cash on Hand", "name_ar": "النقدية بالصندوق", "type": "asset", "nature": "debit", "parent": "11"},
        {"code": "1102", "name": "Cash at Bank", "name_ar": "النقدية بالبنك", "type": "asset", "nature": "debit", "parent": "11", "is_bank": true},
        {"code": "1103", "name": "Petty Cash", "name_ar": "سلف العهد", "type": "asset", "nature": "debit", "parent": "11"},
        {"code": "12", "name": "Receivables", "name_ar": "الذمم المدينة", "type": "asset", "nature": "debit", "is_header": true, "parent": "1"},
        {"code": "1201", "name": "Accounts Receivable", "name_ar": "ذمم العملاء", "type": "asset", "nature": "debit", "parent": "12"},
        {"code": "1202", "name": "Notes Receivable", "name_ar": "أوراق قبض", "type": "asset", "nature": "debit", "parent": "12"},
        {"code": "1203", "name": "Employees Advances", "name_ar": "سلف الموظفين", "type": "asset", "nature": "debit", "parent": "12"},
        {"code": "13", "name": "Inventory", "name_ar": "المخزون", "type": "asset", "nature": "debit", "is_header": true, "parent": "1"},
        {"code": "1301", "name": "Merchandise Inventory", "name_ar": "مخزون البضاعة", "type": "asset", "nature": "debit", "parent": "13"},
        {"code": "1302", "name": "Raw Materials", "name_ar": "مواد خام", "type": "asset", "nature": "debit", "parent": "13"},
        {"code": "1303", "name": "Work in Progress", "name_ar": "إنتاج تحت التشغيل", "type": "asset", "nature": "debit", "parent": "13"},
        {"code": "14", "name": "Prepaid & Other Assets", "name_ar": "مصروفات مقدمة وأصول أخرى", "type": "asset", "nature": "debit", "is_header": true, "parent": "1"},
        {"code": "1401", "name": "VAT Receivable", "name_ar": "ضريبة قيمة مضافة مستردة", "type": "asset", "nature": "debit", "parent": "14"},
        {"code": "1402", "name": "Prepaid Expenses", "name_ar": "مصروفات مقدمة", "type": "asset", "nature": "debit", "parent": "14"},
        {"code": "1403", "name": "Prepaid Insurance", "name_ar": "تأمين مقدم", "type": "asset", "nature": "debit", "parent": "14"},
        {"code": "15", "name": "Fixed Assets", "name_ar": "الأصول الثابتة", "type": "asset", "nature": "debit", "is_header": true, "parent": "1"},
        {"code": "1501", "name": "Land", "name_ar": "الأراضي", "type": "asset", "nature": "debit", "parent": "15"},
        {"code": "1502", "name": "Buildings", "name_ar": "المباني", "type": "asset", "nature": "debit", "parent": "15"},
        {"code": "1503", "name": "Vehicles", "name_ar": "السيارات", "type": "asset", "nature": "debit", "parent": "15"},
        {"code": "1504", "name": "Furniture & Equipment", "name_ar": "الأثاث والمعدات", "type": "asset", "nature": "debit", "parent": "15"},
        {"code": "1505", "name": "Computers & IT", "name_ar": "الحاسبات والتقنية", "type": "asset", "nature": "debit", "parent": "15"},
        {"code": "1599", "name": "Accumulated Depreciation", "name_ar": "مجمع الإهلاك", "type": "asset", "nature": "credit", "parent": "15"},
        
        {"code": "2", "name": "Liabilities", "name_ar": "الخصوم", "type": "liability", "nature": "credit", "is_header": true},
        {"code": "21", "name": "Current Liabilities", "name_ar": "الخصوم المتداولة", "type": "liability", "nature": "credit", "is_header": true, "parent": "2"},
        {"code": "2101", "name": "Accounts Payable", "name_ar": "ذمم الموردين", "type": "liability", "nature": "credit", "parent": "21"},
        {"code": "2102", "name": "Notes Payable", "name_ar": "أوراق دفع", "type": "liability", "nature": "credit", "parent": "21"},
        {"code": "2103", "name": "Accrued Expenses", "name_ar": "مصروفات مستحقة", "type": "liability", "nature": "credit", "parent": "21"},
        {"code": "2104", "name": "Salaries Payable", "name_ar": "رواتب مستحقة", "type": "liability", "nature": "credit", "parent": "21"},
        {"code": "2105", "name": "Customer Advances", "name_ar": "دفعات مقدمة من العملاء", "type": "liability", "nature": "credit", "parent": "21"},
        {"code": "23", "name": "Tax Liabilities", "name_ar": "الضرائب المستحقة", "type": "liability", "nature": "credit", "is_header": true, "parent": "2"},
        {"code": "2301", "name": "VAT Payable", "name_ar": "ضريبة القيمة المضافة", "type": "liability", "nature": "credit", "parent": "23"},
        {"code": "2302", "name": "Income Tax Payable", "name_ar": "ضريبة الدخل", "type": "liability", "nature": "credit", "parent": "23"},
        {"code": "2303", "name": "Withholding Tax", "name_ar": "ضريبة الخصم والإضافة", "type": "liability", "nature": "credit", "parent": "23"},
        {"code": "24", "name": "Long Term Liabilities", "name_ar": "الخصوم طويلة الأجل", "type": "liability", "nature": "credit", "is_header": true, "parent": "2"},
        {"code": "2401", "name": "Bank Loans", "name_ar": "قروض بنكية", "type": "liability", "nature": "credit", "parent": "24"},
        
        {"code": "3", "name": "Equity", "name_ar": "حقوق الملكية", "type": "equity", "nature": "credit", "is_header": true},
        {"code": "31", "name": "Capital", "name_ar": "رأس المال", "type": "equity", "nature": "credit", "is_header": true, "parent": "3"},
        {"code": "3101", "name": "Paid-in Capital", "name_ar": "رأس المال المدفوع", "type": "equity", "nature": "credit", "parent": "31"},
        {"code": "3102", "name": "Owner Drawings", "name_ar": "المسحوبات الشخصية", "type": "equity", "nature": "debit", "parent": "31"},
        {"code": "32", "name": "Retained Earnings", "name_ar": "الأرباح المحتجزة", "type": "equity", "nature": "credit", "is_header": true, "parent": "3"},
        {"code": "3201", "name": "Retained Earnings - Prior", "name_ar": "أرباح مرحلة", "type": "equity", "nature": "credit", "parent": "32"},
        {"code": "3202", "name": "Current Year Earnings", "name_ar": "صافي ربح العام", "type": "equity", "nature": "credit", "parent": "32"},
        
        {"code": "4", "name": "Revenue", "name_ar": "الإيرادات", "type": "revenue", "nature": "credit", "is_header": true},
        {"code": "41", "name": "Sales Revenue", "name_ar": "إيرادات المبيعات", "type": "revenue", "nature": "credit", "is_header": true, "parent": "4"},
        {"code": "4101", "name": "Sales", "name_ar": "المبيعات", "type": "revenue", "nature": "credit", "parent": "41"},
        {"code": "4102", "name": "Sales Returns", "name_ar": "مردودات المبيعات", "type": "revenue", "nature": "debit", "parent": "41"},
        {"code": "4103", "name": "Sales Discounts", "name_ar": "خصم مسموح به", "type": "revenue", "nature": "debit", "parent": "41"},
        {"code": "42", "name": "Other Revenue", "name_ar": "إيرادات أخرى", "type": "revenue", "nature": "credit", "is_header": true, "parent": "4"},
        {"code": "4201", "name": "Service Revenue", "name_ar": "إيرادات خدمات", "type": "revenue", "nature": "credit", "parent": "42"},
        {"code": "4202", "name": "Interest Income", "name_ar": "فوائد دائنة", "type": "revenue", "nature": "credit", "parent": "42"},
        {"code": "4203", "name": "Shipping Revenue", "name_ar": "إيرادات شحن", "type": "revenue", "nature": "credit", "parent": "42"},
        
        {"code": "5", "name": "Expenses", "name_ar": "المصروفات", "type": "expense", "nature": "debit", "is_header": true},
        {"code": "51", "name": "Cost of Goods Sold", "name_ar": "تكلفة البضاعة المباعة", "type": "expense", "nature": "debit", "is_header": true, "parent": "5"},
        {"code": "5101", "name": "COGS - Merchandise", "name_ar": "تكلفة بضاعة مباعة", "type": "expense", "nature": "debit", "parent": "51"},
        {"code": "5102", "name": "Purchases", "name_ar": "المشتريات", "type": "expense", "nature": "debit", "parent": "51"},
        {"code": "5103", "name": "Purchase Returns", "name_ar": "مردودات المشتريات", "type": "expense", "nature": "credit", "parent": "51"},
        {"code": "5104", "name": "Purchase Discounts", "name_ar": "خصم مكتسب", "type": "expense", "nature": "credit", "parent": "51"},
        {"code": "5105", "name": "Freight In", "name_ar": "مصاريف نقل للداخل", "type": "expense", "nature": "debit", "parent": "51"},
        {"code": "52", "name": "Operating Expenses", "name_ar": "مصروفات تشغيل", "type": "expense", "nature": "debit", "is_header": true, "parent": "5"},
        {"code": "5201", "name": "Salaries & Wages", "name_ar": "الرواتب والأجور", "type": "expense", "nature": "debit", "parent": "52"},
        {"code": "5202", "name": "Rent Expense", "name_ar": "مصروف الإيجار", "type": "expense", "nature": "debit", "parent": "52"},
        {"code": "5203", "name": "Utilities", "name_ar": "مصروفات المرافق", "type": "expense", "nature": "debit", "parent": "52"},
        {"code": "5204", "name": "Telecommunications", "name_ar": "مصروفات الاتصالات", "type": "expense", "nature": "debit", "parent": "52"},
        {"code": "5205", "name": "Office Supplies", "name_ar": "مستلزمات مكتبية", "type": "expense", "nature": "debit", "parent": "52"},
        {"code": "5206", "name": "Maintenance", "name_ar": "صيانة وإصلاح", "type": "expense", "nature": "debit", "parent": "52"},
        {"code": "5207", "name": "Insurance", "name_ar": "مصروف التأمين", "type": "expense", "nature": "debit", "parent": "52"},
        {"code": "5208", "name": "Depreciation", "name_ar": "مصروف الإهلاك", "type": "expense", "nature": "debit", "parent": "52"},
        {"code": "5209", "name": "Bank Charges", "name_ar": "مصاريف بنكية", "type": "expense", "nature": "debit", "parent": "52"},
        {"code": "5210", "name": "Marketing & Advertising", "name_ar": "مصروفات تسويق وإعلان", "type": "expense", "nature": "debit", "parent": "52"},
        {"code": "5211", "name": "Professional Fees", "name_ar": "أتعاب مهنية", "type": "expense", "nature": "debit", "parent": "52"},
        {"code": "5212", "name": "Transportation", "name_ar": "مصاريف انتقالات", "type": "expense", "nature": "debit", "parent": "52"},
        {"code": "5213", "name": "Shipping Out", "name_ar": "مصاريف شحن للعملاء", "type": "expense", "nature": "debit", "parent": "52"},
        {"code": "53", "name": "Financial Expenses", "name_ar": "مصروفات مالية", "type": "expense", "nature": "debit", "is_header": true, "parent": "5"},
        {"code": "5301", "name": "Interest Expense", "name_ar": "فوائد مدينة", "type": "expense", "nature": "debit", "parent": "53"},
        {"code": "5302", "name": "Foreign Exchange Loss", "name_ar": "خسائر فروق عملة", "type": "expense", "nature": "debit", "parent": "53"},
        {"code": "59", "name": "Other Expenses", "name_ar": "مصروفات أخرى", "type": "expense", "nature": "debit", "is_header": true, "parent": "5"},
        {"code": "5901", "name": "Inventory Adjustments", "name_ar": "فروقات جرد", "type": "expense", "nature": "debit", "parent": "59"},
        {"code": "5902", "name": "Bad Debts", "name_ar": "ديون معدومة", "type": "expense", "nature": "debit", "parent": "59"},
        {"code": "5999", "name": "Miscellaneous Expenses", "name_ar": "مصروفات متنوعة", "type": "expense", "nature": "debit", "parent": "59"}
    ]'::jsonb;
    
    -- إدخال الحسابات
    WITH accounts_data AS (
        SELECT 
            jsonb_array_elements(v_accounts) as account
    )
    INSERT INTO accounts (
        company_id, code, name, name_ar, account_type, account_nature, 
        is_header, is_system, is_bank_account, parent_id
    )
    SELECT
        p_company_id,
        account->>'code',
        account->>'name',
        account->>'name_ar',
        account->>'type',
        account->>'nature',
        COALESCE((account->>'is_header')::boolean, false),
        true, -- system account
        COALESCE((account->>'is_bank')::boolean, false),
        (SELECT id FROM accounts WHERE company_id = p_company_id AND code = account->>'parent')
    FROM accounts_data
    ON CONFLICT (company_id, code) DO NOTHING;
    
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- بيانات خطط الاشتراك
-- =========================================================

INSERT INTO subscription_plans (code, name, name_ar, price_monthly, price_yearly, max_users, max_branches, max_invoices_monthly, max_products, max_storage_gb, features, is_active, sort_order)
VALUES
    ('free', 'Free', 'مجاني', 0, 0, 1, 1, 50, 50, 0.5, 
     '["basic_invoicing", "basic_reports"]'::jsonb, true, 1),
    ('starter', 'Starter', 'مبتدئ', 99, 990, 3, 1, 200, 500, 2, 
     '["basic_invoicing", "basic_reports", "inventory", "customers"]'::jsonb, true, 2),
    ('professional', 'Professional', 'احترافي', 299, 2990, 10, 3, 1000, 5000, 10, 
     '["full_invoicing", "advanced_reports", "inventory", "multi_warehouse", "accounting"]'::jsonb, true, 3),
    ('enterprise', 'Enterprise', 'مؤسسات', 599, 5990, 50, 10, -1, -1, 50, 
     '["full_invoicing", "advanced_reports", "inventory", "multi_warehouse", "accounting", "api_access", "custom_fields", "priority_support"]'::jsonb, true, 4)
ON CONFLICT (code) DO NOTHING;

-- =========================================================
-- دالة للتحقق من حدود الاستخدام
-- =========================================================

CREATE OR REPLACE FUNCTION check_usage_limit(
    p_company_id UUID,
    p_metric_type VARCHAR,
    p_increment INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    v_limit INTEGER;
    v_current_usage INTEGER;
    v_period_start DATE;
BEGIN
    v_period_start := date_trunc('month', CURRENT_DATE)::date;
    
    -- الحصول على الحد
    SELECT 
        CASE p_metric_type
            WHEN 'invoices' THEN sp.max_invoices_monthly
            WHEN 'users' THEN sp.max_users
            WHEN 'products' THEN sp.max_products
            WHEN 'branches' THEN sp.max_branches
            ELSE -1
        END INTO v_limit
    FROM company_subscriptions cs
    JOIN subscription_plans sp ON sp.id = cs.plan_id
    WHERE cs.company_id = p_company_id
    AND cs.status = 'active';
    
    -- -1 يعني بدون حد
    IF v_limit = -1 OR v_limit IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- الحصول على الاستخدام الحالي
    SELECT COALESCE(usage_count, 0) INTO v_current_usage
    FROM usage_tracking
    WHERE company_id = p_company_id
    AND metric_type = p_metric_type
    AND period_start = v_period_start;
    
    IF v_current_usage IS NULL THEN
        v_current_usage := 0;
    END IF;
    
    RETURN (v_current_usage + p_increment) <= v_limit;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- دالة تسجيل الاستخدام
-- =========================================================

CREATE OR REPLACE FUNCTION increment_usage(
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

-- =========================================================
-- النهاية
-- =========================================================
