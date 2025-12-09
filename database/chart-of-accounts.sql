-- ============================================
-- شجرة الحسابات الافتراضية
-- يتم تشغيل هذا بعد إنشاء شركة جديدة
-- استخدم company_id الخاص بشركتك
-- ============================================

-- ملاحظة: استبدل 'YOUR_COMPANY_ID' بـ ID الشركة الفعلي

-- ============================================
-- 1. الأصول (1000-1999)
-- ============================================

-- الأصول الرئيسية
INSERT INTO chart_of_accounts (company_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('YOUR_COMPANY_ID', '1000', 'الأصول', 'Assets', 'asset', true, false);

-- الأصول المتداولة
INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '1000' AND company_id = 'YOUR_COMPANY_ID'), '1100', 'الأصول المتداولة', 'Current Assets', 'asset', true, false);

-- النقدية والبنوك
INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '1100' AND company_id = 'YOUR_COMPANY_ID'), '1110', 'النقدية (الخزن)', 'Cash', 'asset', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '1100' AND company_id = 'YOUR_COMPANY_ID'), '1120', 'البنوك', 'Banks', 'asset', true);

-- العملاء
INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '1100' AND company_id = 'YOUR_COMPANY_ID'), '1130', 'العملاء', 'Accounts Receivable', 'asset', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '1100' AND company_id = 'YOUR_COMPANY_ID'), '1131', 'أوراق القبض', 'Notes Receivable', 'asset', true);

-- المخزون
INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '1100' AND company_id = 'YOUR_COMPANY_ID'), '1140', 'المخزون', 'Inventory', 'asset', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '1100' AND company_id = 'YOUR_COMPANY_ID'), '1141', 'بضاعة بالطريق', 'Goods in Transit', 'asset', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '1100' AND company_id = 'YOUR_COMPANY_ID'), '1142', 'مرتجعات عند شركات الشحن', 'Returns at Shipping Companies', 'asset', true);

-- مصروفات مدفوعة مقدماً
INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '1100' AND company_id = 'YOUR_COMPANY_ID'), '1150', 'مصروفات مدفوعة مقدماً', 'Prepaid Expenses', 'asset', true);

-- الأصول الثابتة
INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '1000' AND company_id = 'YOUR_COMPANY_ID'), '1200', 'الأصول الثابتة', 'Fixed Assets', 'asset', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '1200' AND company_id = 'YOUR_COMPANY_ID'), '1210', 'الأثاث والتجهيزات', 'Furniture & Fixtures', 'asset', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '1200' AND company_id = 'YOUR_COMPANY_ID'), '1220', 'أجهزة الكمبيوتر', 'Computer Equipment', 'asset', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '1200' AND company_id = 'YOUR_COMPANY_ID'), '1230', 'السيارات', 'Vehicles', 'asset', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '1200' AND company_id = 'YOUR_COMPANY_ID'), '1290', 'مجمع الإهلاك', 'Accumulated Depreciation', 'asset', true);

-- ============================================
-- 2. الخصوم (2000-2999)
-- ============================================

INSERT INTO chart_of_accounts (company_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('YOUR_COMPANY_ID', '2000', 'الخصوم', 'Liabilities', 'liability', true, false);

-- الخصوم المتداولة
INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '2000' AND company_id = 'YOUR_COMPANY_ID'), '2100', 'الخصوم المتداولة', 'Current Liabilities', 'liability', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '2100' AND company_id = 'YOUR_COMPANY_ID'), '2110', 'الموردين', 'Accounts Payable', 'liability', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '2100' AND company_id = 'YOUR_COMPANY_ID'), '2111', 'أوراق الدفع', 'Notes Payable', 'liability', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '2100' AND company_id = 'YOUR_COMPANY_ID'), '2120', 'شركات الشحن', 'Shipping Companies Payable', 'liability', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '2100' AND company_id = 'YOUR_COMPANY_ID'), '2130', 'ضريبة القيمة المضافة المستحقة', 'VAT Payable', 'liability', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '2100' AND company_id = 'YOUR_COMPANY_ID'), '2140', 'مصروفات مستحقة', 'Accrued Expenses', 'liability', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '2100' AND company_id = 'YOUR_COMPANY_ID'), '2150', 'إيرادات مقدمة', 'Unearned Revenue', 'liability', true);

-- الخصوم طويلة الأجل
INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '2000' AND company_id = 'YOUR_COMPANY_ID'), '2200', 'الخصوم طويلة الأجل', 'Long-term Liabilities', 'liability', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '2200' AND company_id = 'YOUR_COMPANY_ID'), '2210', 'قروض طويلة الأجل', 'Long-term Loans', 'liability', true);

-- ============================================
-- 3. حقوق الملكية (3000-3999)
-- ============================================

INSERT INTO chart_of_accounts (company_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('YOUR_COMPANY_ID', '3000', 'حقوق الملكية', 'Equity', 'equity', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '3000' AND company_id = 'YOUR_COMPANY_ID'), '3100', 'رأس المال', 'Capital', 'equity', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '3000' AND company_id = 'YOUR_COMPANY_ID'), '3200', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '3000' AND company_id = 'YOUR_COMPANY_ID'), '3300', 'صافي ربح/خسارة العام', 'Net Profit/Loss', 'equity', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '3000' AND company_id = 'YOUR_COMPANY_ID'), '3400', 'المسحوبات الشخصية', 'Drawings', 'equity', true);

-- ============================================
-- 4. الإيرادات (4000-4999)
-- ============================================

INSERT INTO chart_of_accounts (company_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('YOUR_COMPANY_ID', '4000', 'الإيرادات', 'Revenue', 'revenue', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '4000' AND company_id = 'YOUR_COMPANY_ID'), '4100', 'إيرادات المبيعات', 'Sales Revenue', 'revenue', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '4000' AND company_id = 'YOUR_COMPANY_ID'), '4110', 'مردودات المبيعات', 'Sales Returns', 'revenue', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '4000' AND company_id = 'YOUR_COMPANY_ID'), '4120', 'خصم مسموح به', 'Sales Discounts', 'revenue', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '4000' AND company_id = 'YOUR_COMPANY_ID'), '4200', 'إيرادات أخرى', 'Other Income', 'revenue', true);

-- ============================================
-- 5. المصروفات (5000-5999)
-- ============================================

INSERT INTO chart_of_accounts (company_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('YOUR_COMPANY_ID', '5000', 'المصروفات', 'Expenses', 'expense', true, false);

-- تكلفة المبيعات
INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5000' AND company_id = 'YOUR_COMPANY_ID'), '5100', 'تكلفة المبيعات', 'Cost of Goods Sold', 'expense', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5100' AND company_id = 'YOUR_COMPANY_ID'), '5110', 'تكلفة البضاعة المباعة', 'Cost of Goods Sold', 'expense', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5100' AND company_id = 'YOUR_COMPANY_ID'), '5120', 'مردودات المشتريات', 'Purchase Returns', 'expense', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5100' AND company_id = 'YOUR_COMPANY_ID'), '5130', 'خصم مكتسب', 'Purchase Discounts', 'expense', true);

-- مصروفات الشحن والتوصيل
INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5000' AND company_id = 'YOUR_COMPANY_ID'), '5200', 'مصروفات الشحن والتوصيل', 'Shipping & Delivery Expenses', 'expense', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5200' AND company_id = 'YOUR_COMPANY_ID'), '5210', 'مصروفات الشحن', 'Shipping Costs', 'expense', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5200' AND company_id = 'YOUR_COMPANY_ID'), '5220', 'مصروفات المرتجعات', 'Return Costs', 'expense', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5200' AND company_id = 'YOUR_COMPANY_ID'), '5230', 'مصروفات الرفض', 'Rejection Costs', 'expense', true);

-- المصروفات التشغيلية
INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5000' AND company_id = 'YOUR_COMPANY_ID'), '5300', 'المصروفات التشغيلية', 'Operating Expenses', 'expense', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5300' AND company_id = 'YOUR_COMPANY_ID'), '5310', 'الرواتب والأجور', 'Salaries & Wages', 'expense', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5300' AND company_id = 'YOUR_COMPANY_ID'), '5320', 'الإيجارات', 'Rent', 'expense', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5300' AND company_id = 'YOUR_COMPANY_ID'), '5330', 'المرافق (كهرباء-ماء-غاز)', 'Utilities', 'expense', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5300' AND company_id = 'YOUR_COMPANY_ID'), '5340', 'الاتصالات والإنترنت', 'Communications', 'expense', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5300' AND company_id = 'YOUR_COMPANY_ID'), '5350', 'مصروفات الصيانة', 'Maintenance', 'expense', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5300' AND company_id = 'YOUR_COMPANY_ID'), '5360', 'مصروفات التسويق والإعلان', 'Marketing & Advertising', 'expense', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5300' AND company_id = 'YOUR_COMPANY_ID'), '5370', 'مصروفات الضيافة', 'Hospitality', 'expense', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5300' AND company_id = 'YOUR_COMPANY_ID'), '5380', 'مصروفات السفر والانتقالات', 'Travel & Transportation', 'expense', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5300' AND company_id = 'YOUR_COMPANY_ID'), '5390', 'مصروفات الإهلاك', 'Depreciation', 'expense', true);

-- المصروفات الإدارية
INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system, allows_transactions) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5000' AND company_id = 'YOUR_COMPANY_ID'), '5400', 'المصروفات الإدارية', 'Administrative Expenses', 'expense', true, false);

INSERT INTO chart_of_accounts (company_id, parent_id, code, name, name_en, account_type, is_system) VALUES
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5400' AND company_id = 'YOUR_COMPANY_ID'), '5410', 'مصروفات بنكية', 'Bank Charges', 'expense', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5400' AND company_id = 'YOUR_COMPANY_ID'), '5420', 'مصروفات قانونية', 'Legal Fees', 'expense', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5400' AND company_id = 'YOUR_COMPANY_ID'), '5430', 'رسوم حكومية', 'Government Fees', 'expense', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5400' AND company_id = 'YOUR_COMPANY_ID'), '5440', 'مصروفات تأمين', 'Insurance', 'expense', true),
('YOUR_COMPANY_ID', (SELECT id FROM chart_of_accounts WHERE code = '5400' AND company_id = 'YOUR_COMPANY_ID'), '5490', 'مصروفات متنوعة', 'Miscellaneous Expenses', 'expense', true);

-- ============================================
-- تم الانتهاء من شجرة الحسابات!
-- ============================================
