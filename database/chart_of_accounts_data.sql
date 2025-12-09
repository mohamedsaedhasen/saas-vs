-- ============================================
-- شجرة الحسابات - النظام الموحد للتجارة
-- Chart of Accounts
-- ============================================
-- 
-- شغّل هذا الملف في Supabase بعد complete_setup.sql
-- ============================================

-- المتغير: company_id
-- نستخدم: 33333333-3333-3333-3333-333333333333

-- ============================================
-- 1. الأصول (1000-1999)
-- ============================================

INSERT INTO chart_of_accounts (company_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('33333333-3333-3333-3333-333333333333', '1000', 'الأصول', 'Assets', 'asset', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '1000' AND company_id = '33333333-3333-3333-3333-333333333333'), '1100', 'الأصول المتداولة', 'Current Assets', 'asset', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '1100' AND company_id = '33333333-3333-3333-3333-333333333333'), '1110', 'النقدية (الخزن)', 'Cash', 'asset', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '1100' AND company_id = '33333333-3333-3333-3333-333333333333'), '1120', 'البنوك', 'Banks', 'asset', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '1100' AND company_id = '33333333-3333-3333-3333-333333333333'), '1130', 'العملاء', 'Accounts Receivable', 'asset', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '1100' AND company_id = '33333333-3333-3333-3333-333333333333'), '1131', 'أوراق القبض', 'Notes Receivable', 'asset', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '1100' AND company_id = '33333333-3333-3333-3333-333333333333'), '1140', 'المخزون', 'Inventory', 'asset', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '1100' AND company_id = '33333333-3333-3333-3333-333333333333'), '1141', 'بضاعة بالطريق', 'Goods in Transit', 'asset', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '1100' AND company_id = '33333333-3333-3333-3333-333333333333'), '1142', 'مرتجعات عند شركات الشحن', 'Returns at Shipping Companies', 'asset', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '1100' AND company_id = '33333333-3333-3333-3333-333333333333'), '1150', 'مصروفات مدفوعة مقدماً', 'Prepaid Expenses', 'asset', true);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '1000' AND company_id = '33333333-3333-3333-3333-333333333333'), '1200', 'الأصول الثابتة', 'Fixed Assets', 'asset', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '1200' AND company_id = '33333333-3333-3333-3333-333333333333'), '1210', 'الأثاث والتجهيزات', 'Furniture & Fixtures', 'asset', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '1200' AND company_id = '33333333-3333-3333-3333-333333333333'), '1220', 'أجهزة الكمبيوتر', 'Computer Equipment', 'asset', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '1200' AND company_id = '33333333-3333-3333-3333-333333333333'), '1230', 'السيارات', 'Vehicles', 'asset', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '1200' AND company_id = '33333333-3333-3333-3333-333333333333'), '1290', 'مجمع الإهلاك', 'Accumulated Depreciation', 'asset', true);

-- ============================================
-- 2. الخصوم (2000-2999)
-- ============================================

INSERT INTO chart_of_accounts (company_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('33333333-3333-3333-3333-333333333333', '2000', 'الخصوم', 'Liabilities', 'liability', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '2000' AND company_id = '33333333-3333-3333-3333-333333333333'), '2100', 'الخصوم المتداولة', 'Current Liabilities', 'liability', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '2100' AND company_id = '33333333-3333-3333-3333-333333333333'), '2110', 'الموردين', 'Accounts Payable', 'liability', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '2100' AND company_id = '33333333-3333-3333-3333-333333333333'), '2111', 'أوراق الدفع', 'Notes Payable', 'liability', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '2100' AND company_id = '33333333-3333-3333-3333-333333333333'), '2120', 'شركات الشحن', 'Shipping Companies Payable', 'liability', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '2100' AND company_id = '33333333-3333-3333-3333-333333333333'), '2130', 'ضريبة القيمة المضافة المستحقة', 'VAT Payable', 'liability', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '2100' AND company_id = '33333333-3333-3333-3333-333333333333'), '2140', 'مصروفات مستحقة', 'Accrued Expenses', 'liability', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '2100' AND company_id = '33333333-3333-3333-3333-333333333333'), '2150', 'إيرادات مقدمة', 'Unearned Revenue', 'liability', true);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '2000' AND company_id = '33333333-3333-3333-3333-333333333333'), '2200', 'الخصوم طويلة الأجل', 'Long-term Liabilities', 'liability', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '2200' AND company_id = '33333333-3333-3333-3333-333333333333'), '2210', 'قروض طويلة الأجل', 'Long-term Loans', 'liability', true);

-- ============================================
-- 3. حقوق الملكية (3000-3999)
-- ============================================

INSERT INTO chart_of_accounts (company_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('33333333-3333-3333-3333-333333333333', '3000', 'حقوق الملكية', 'Equity', 'equity', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '3000' AND company_id = '33333333-3333-3333-3333-333333333333'), '3100', 'رأس المال', 'Capital', 'equity', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '3000' AND company_id = '33333333-3333-3333-3333-333333333333'), '3200', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '3000' AND company_id = '33333333-3333-3333-3333-333333333333'), '3300', 'صافي ربح/خسارة العام', 'Net Profit/Loss', 'equity', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '3000' AND company_id = '33333333-3333-3333-3333-333333333333'), '3400', 'المسحوبات الشخصية', 'Drawings', 'equity', true);

-- ============================================
-- 4. الإيرادات (4000-4999)
-- ============================================

INSERT INTO chart_of_accounts (company_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('33333333-3333-3333-3333-333333333333', '4000', 'الإيرادات', 'Revenue', 'revenue', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '4000' AND company_id = '33333333-3333-3333-3333-333333333333'), '4100', 'إيرادات المبيعات', 'Sales Revenue', 'revenue', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '4000' AND company_id = '33333333-3333-3333-3333-333333333333'), '4110', 'مردودات المبيعات', 'Sales Returns', 'revenue', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '4000' AND company_id = '33333333-3333-3333-3333-333333333333'), '4120', 'خصم مسموح به', 'Sales Discounts', 'revenue', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '4000' AND company_id = '33333333-3333-3333-3333-333333333333'), '4200', 'إيرادات أخرى', 'Other Income', 'revenue', true);

-- ============================================
-- 5. المصروفات (5000-5999)
-- ============================================

INSERT INTO chart_of_accounts (company_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('33333333-3333-3333-3333-333333333333', '5000', 'المصروفات', 'Expenses', 'expense', true, false);

-- تكلفة المبيعات
INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5000' AND company_id = '33333333-3333-3333-3333-333333333333'), '5100', 'تكلفة المبيعات', 'Cost of Goods Sold', 'expense', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5100' AND company_id = '33333333-3333-3333-3333-333333333333'), '5110', 'تكلفة البضاعة المباعة', 'COGS', 'expense', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5100' AND company_id = '33333333-3333-3333-3333-333333333333'), '5120', 'مردودات المشتريات', 'Purchase Returns', 'expense', true);

-- مصروفات الشحن
INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5000' AND company_id = '33333333-3333-3333-3333-333333333333'), '5200', 'مصروفات الشحن والتوصيل', 'Shipping Expenses', 'expense', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5200' AND company_id = '33333333-3333-3333-3333-333333333333'), '5210', 'مصروفات الشحن', 'Shipping Costs', 'expense', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5200' AND company_id = '33333333-3333-3333-3333-333333333333'), '5220', 'مصروفات المرتجعات', 'Return Costs', 'expense', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5200' AND company_id = '33333333-3333-3333-3333-333333333333'), '5230', 'مصروفات الرفض', 'Rejection Costs', 'expense', true);

-- المصروفات التشغيلية
INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5000' AND company_id = '33333333-3333-3333-3333-333333333333'), '5300', 'المصروفات التشغيلية', 'Operating Expenses', 'expense', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5300' AND company_id = '33333333-3333-3333-3333-333333333333'), '5310', 'الرواتب والأجور', 'Salaries & Wages', 'expense', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5300' AND company_id = '33333333-3333-3333-3333-333333333333'), '5320', 'الإيجارات', 'Rent', 'expense', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5300' AND company_id = '33333333-3333-3333-3333-333333333333'), '5330', 'المرافق (كهرباء-ماء-غاز)', 'Utilities', 'expense', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5300' AND company_id = '33333333-3333-3333-3333-333333333333'), '5340', 'الاتصالات والإنترنت', 'Communications', 'expense', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5300' AND company_id = '33333333-3333-3333-3333-333333333333'), '5350', 'مصروفات الصيانة', 'Maintenance', 'expense', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5300' AND company_id = '33333333-3333-3333-3333-333333333333'), '5360', 'مصروفات التسويق والإعلان', 'Marketing', 'expense', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5300' AND company_id = '33333333-3333-3333-3333-333333333333'), '5370', 'مصروفات الضيافة', 'Hospitality', 'expense', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5300' AND company_id = '33333333-3333-3333-3333-333333333333'), '5380', 'مصروفات السفر', 'Travel', 'expense', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5300' AND company_id = '33333333-3333-3333-3333-333333333333'), '5390', 'مصروفات الإهلاك', 'Depreciation', 'expense', true);

-- المصروفات الإدارية
INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5000' AND company_id = '33333333-3333-3333-3333-333333333333'), '5400', 'المصروفات الإدارية', 'Admin Expenses', 'expense', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5400' AND company_id = '33333333-3333-3333-3333-333333333333'), '5410', 'مصروفات بنكية', 'Bank Charges', 'expense', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5400' AND company_id = '33333333-3333-3333-3333-333333333333'), '5420', 'مصروفات قانونية', 'Legal Fees', 'expense', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5400' AND company_id = '33333333-3333-3333-3333-333333333333'), '5430', 'رسوم حكومية', 'Government Fees', 'expense', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5400' AND company_id = '33333333-3333-3333-3333-333333333333'), '5440', 'مصروفات تأمين', 'Insurance', 'expense', true),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM chart_of_accounts WHERE code = '5400' AND company_id = '33333333-3333-3333-3333-333333333333'), '5490', 'مصروفات متنوعة', 'Miscellaneous', 'expense', true);

-- ============================================
-- تم إنشاء شجرة الحسابات بنجاح! ✅
-- ============================================
