-- =============================================
-- Advanced Features Schema
-- الميزات المتقدمة - قاعدة البيانات
-- =============================================

-- =============================================
-- 1. Scheduled Expenses (المصاريف المجدولة)
-- =============================================
CREATE TABLE IF NOT EXISTS scheduled_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  
  -- معلومات أساسية
  name VARCHAR(255) NOT NULL,
  category_id UUID NOT NULL REFERENCES expense_categories(id),
  description TEXT NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  
  -- الجدولة
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 28),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  month_of_year INTEGER CHECK (month_of_year >= 1 AND month_of_year <= 12),
  
  -- طريقة الدفع
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'bank', 'check', 'card')),
  vault_id UUID,
  bank_id UUID,
  
  -- الارتباطات
  supplier_id UUID,
  cost_center_id UUID REFERENCES cost_centers(id),
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  start_date DATE NOT NULL,
  end_date DATE,
  last_generated_date DATE,
  next_due_date DATE,
  
  -- التتبع
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scheduled_expenses_company ON scheduled_expenses(company_id);
CREATE INDEX idx_scheduled_expenses_active ON scheduled_expenses(company_id, is_active);
CREATE INDEX idx_scheduled_expenses_due ON scheduled_expenses(next_due_date);

-- =============================================
-- 2. Approval Rules (قواعد الموافقات)
-- =============================================
CREATE TABLE IF NOT EXISTS expense_approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  
  -- الشروط
  min_amount DECIMAL(18, 2),
  max_amount DECIMAL(18, 2),
  category_ids UUID[],
  cost_center_ids UUID[],
  
  -- المعتمدين (JSONB array)
  approvers JSONB NOT NULL DEFAULT '[]',
  
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_approval_rules_company ON expense_approval_rules(company_id);
CREATE INDEX idx_approval_rules_active ON expense_approval_rules(company_id, is_active);

-- =============================================
-- 3. Expense Approvals (الموافقات)
-- =============================================
CREATE TABLE IF NOT EXISTS expense_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  voucher_id UUID NOT NULL REFERENCES expense_vouchers(id),
  
  -- مستوى الموافقة
  approval_level INTEGER NOT NULL,
  approver_id UUID NOT NULL,
  approver_name VARCHAR(255),
  
  -- الحالة
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
  
  -- التفاصيل
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expense_approvals_company ON expense_approvals(company_id);
CREATE INDEX idx_expense_approvals_voucher ON expense_approvals(voucher_id);
CREATE INDEX idx_expense_approvals_status ON expense_approvals(status);
CREATE INDEX idx_expense_approvals_approver ON expense_approvals(approver_id, status);

-- =============================================
-- 4. Expense Alerts (التنبيهات)
-- =============================================
CREATE TABLE IF NOT EXISTS expense_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  
  -- نوع التنبيه
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  
  -- المحتوى
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- المرجع
  reference_type VARCHAR(50),
  reference_id UUID,
  reference_name VARCHAR(255),
  
  -- البيانات الإضافية
  data JSONB,
  
  -- الحالة
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  
  -- التتبع
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_expense_alerts_company ON expense_alerts(company_id);
CREATE INDEX idx_expense_alerts_user ON expense_alerts(user_id, is_read);
CREATE INDEX idx_expense_alerts_type ON expense_alerts(type);
CREATE INDEX idx_expense_alerts_unread ON expense_alerts(company_id, is_read, is_dismissed);

-- =============================================
-- 5. Alert Settings (إعدادات التنبيهات)
-- =============================================
CREATE TABLE IF NOT EXISTS expense_alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- تفعيل/تعطيل
  budget_warnings BOOLEAN DEFAULT true,
  scheduled_reminders BOOLEAN DEFAULT true,
  approval_notifications BOOLEAN DEFAULT true,
  unusual_spending_alerts BOOLEAN DEFAULT true,
  
  -- ترددات
  reminder_days_before INTEGER DEFAULT 3,
  budget_warning_threshold INTEGER DEFAULT 80,
  
  -- قنوات الإرسال
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(company_id, user_id)
);

-- =============================================
-- 6. Payroll Expense Links (ربط المرتبات)
-- =============================================
CREATE TABLE IF NOT EXISTS payroll_expense_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  
  -- الموظف
  employee_id UUID NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  employee_code VARCHAR(50),
  
  -- التصنيف
  category_id UUID NOT NULL REFERENCES expense_categories(id),
  
  -- القيم
  base_salary DECIMAL(18, 2) DEFAULT 0,
  allowances DECIMAL(18, 2) DEFAULT 0,
  deductions DECIMAL(18, 2) DEFAULT 0,
  net_salary DECIMAL(18, 2) DEFAULT 0,
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  last_payment_date DATE,
  last_voucher_id UUID REFERENCES expense_vouchers(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(company_id, employee_id)
);

CREATE INDEX idx_payroll_links_company ON payroll_expense_links(company_id);
CREATE INDEX idx_payroll_links_employee ON payroll_expense_links(employee_id);
CREATE INDEX idx_payroll_links_category ON payroll_expense_links(category_id);

-- =============================================
-- 7. Export Templates (قوالب التصدير)
-- =============================================
CREATE TABLE IF NOT EXISTS expense_export_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('excel', 'pdf', 'csv')),
  
  -- الإعدادات
  report_type VARCHAR(50) NOT NULL,
  filters JSONB DEFAULT '{}',
  columns JSONB DEFAULT '[]',
  grouping VARCHAR(50),
  include_summary BOOLEAN DEFAULT true,
  include_charts BOOLEAN DEFAULT false,
  
  -- التنسيق
  date_format VARCHAR(50) DEFAULT 'YYYY-MM-DD',
  number_format VARCHAR(50) DEFAULT '#,##0.00',
  language VARCHAR(5) DEFAULT 'ar',
  
  is_default BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_export_templates_company ON expense_export_templates(company_id);

-- =============================================
-- 8. Triggers for updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_scheduled_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_scheduled_expenses_updated_at
  BEFORE UPDATE ON scheduled_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_expenses_updated_at();

CREATE OR REPLACE FUNCTION update_alert_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_alert_settings_updated_at
  BEFORE UPDATE ON expense_alert_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_settings_updated_at();

-- =============================================
-- Comments
-- =============================================

COMMENT ON TABLE scheduled_expenses IS 'المصاريف المجدولة - للمصاريف المتكررة التي تصرف تلقائياً';
COMMENT ON TABLE expense_approval_rules IS 'قواعد الموافقات - تحديد المعتمدين حسب المبلغ والتصنيف';
COMMENT ON TABLE expense_approvals IS 'الموافقات - تتبع حالة اعتماد كل سند';
COMMENT ON TABLE expense_alerts IS 'التنبيهات - تنبيهات الموازنة والمواعيد';
COMMENT ON TABLE expense_alert_settings IS 'إعدادات التنبيهات - تخصيص التنبيهات لكل مستخدم';
COMMENT ON TABLE payroll_expense_links IS 'ربط المرتبات - ربط الموظفين بتصنيفات المصاريف';
COMMENT ON TABLE expense_export_templates IS 'قوالب التصدير - حفظ إعدادات التقارير المفضلة';
