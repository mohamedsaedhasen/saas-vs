-- =============================================
-- Expenses Module Schema
-- وحدة المصاريف - قاعدة البيانات
-- =============================================

-- =============================================
-- 1. Cost Centers Table (مراكز التكلفة)
-- =============================================
CREATE TABLE IF NOT EXISTS cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  code VARCHAR(20) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  type VARCHAR(50) DEFAULT 'other' CHECK (type IN ('branch', 'department', 'project', 'product_line', 'other')),
  parent_id UUID REFERENCES cost_centers(id),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(company_id, code)
);

CREATE INDEX idx_cost_centers_company ON cost_centers(company_id);
CREATE INDEX idx_cost_centers_active ON cost_centers(company_id, is_active);

-- =============================================
-- 2. Expense Categories Table (تصنيفات المصاريف)
-- =============================================
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  
  -- الترميز والتسمية
  code VARCHAR(50) NOT NULL,
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  
  -- الهرمية
  parent_id UUID REFERENCES expense_categories(id),
  level INTEGER DEFAULT 1,
  path VARCHAR(500) NOT NULL,
  has_children BOOLEAN DEFAULT false,
  
  -- المحاسبة
  account_id UUID,
  account_code VARCHAR(50),
  
  -- البيانات الإضافية
  description TEXT,
  budget_amount DECIMAL(18, 2),
  is_active BOOLEAN DEFAULT true,
  
  -- نوع المصروف
  expense_type VARCHAR(50) DEFAULT 'general' CHECK (expense_type IN ('general', 'recurring', 'employee_related', 'supplier_related')),
  
  -- المصاريف المتكررة
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  recurring_day INTEGER CHECK (recurring_day >= 1 AND recurring_day <= 31),
  
  -- الربط الافتراضي
  default_supplier_id UUID,
  default_supplier_name VARCHAR(255),
  default_cost_center_id UUID REFERENCES cost_centers(id),
  
  -- الترتيب
  sort_order INTEGER DEFAULT 0,
  
  -- التتبع
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(company_id, code)
);

-- Indexes for expense_categories
CREATE INDEX idx_expense_categories_company ON expense_categories(company_id);
CREATE INDEX idx_expense_categories_parent ON expense_categories(parent_id);
CREATE INDEX idx_expense_categories_path ON expense_categories(path);
CREATE INDEX idx_expense_categories_level ON expense_categories(company_id, level);
CREATE INDEX idx_expense_categories_active ON expense_categories(company_id, is_active);
CREATE INDEX idx_expense_categories_type ON expense_categories(expense_type);

-- =============================================
-- 3. Expense Vouchers Table (سندات صرف المصاريف)
-- =============================================
CREATE TABLE IF NOT EXISTS expense_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_number VARCHAR(50) NOT NULL,
  company_id UUID NOT NULL,
  branch_id UUID,
  
  -- معلومات أساسية
  date DATE NOT NULL,
  category_id UUID NOT NULL REFERENCES expense_categories(id),
  category_code VARCHAR(50),
  category_name VARCHAR(255),
  description TEXT NOT NULL,
  amount DECIMAL(18, 2) NOT NULL CHECK (amount > 0),
  
  -- طريقة الدفع
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'bank', 'check', 'card')),
  vault_id UUID,
  vault_name VARCHAR(255),
  bank_id UUID,
  bank_name VARCHAR(255),
  check_number VARCHAR(50),
  check_date DATE,
  
  -- جهات الارتباط
  supplier_id UUID,
  supplier_name VARCHAR(255),
  
  -- مركز التكلفة
  cost_center_id UUID REFERENCES cost_centers(id),
  cost_center_name VARCHAR(255),
  
  -- المستندات
  reference_number VARCHAR(100),
  attachment_urls JSONB DEFAULT '[]',
  
  -- الحالة
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
  
  -- المحاسبة
  journal_entry_id UUID,
  journal_entry_number VARCHAR(50),
  
  -- السند السابق (للمصاريف المتكررة)
  previous_voucher_id UUID REFERENCES expense_vouchers(id),
  previous_voucher_number VARCHAR(50),
  previous_voucher_amount DECIMAL(18, 2),
  
  -- ملاحظات
  notes TEXT,
  
  -- التتبع
  created_by UUID NOT NULL,
  created_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(company_id, voucher_number)
);

-- Indexes for expense_vouchers
CREATE INDEX idx_expense_vouchers_company ON expense_vouchers(company_id);
CREATE INDEX idx_expense_vouchers_date ON expense_vouchers(company_id, date);
CREATE INDEX idx_expense_vouchers_category ON expense_vouchers(category_id);
CREATE INDEX idx_expense_vouchers_status ON expense_vouchers(company_id, status);
CREATE INDEX idx_expense_vouchers_cost_center ON expense_vouchers(cost_center_id);
CREATE INDEX idx_expense_vouchers_payment_method ON expense_vouchers(payment_method);
CREATE INDEX idx_expense_vouchers_supplier ON expense_vouchers(supplier_id);
CREATE INDEX idx_expense_vouchers_number ON expense_vouchers(voucher_number);

-- =============================================
-- 4. Expense Audit Logs (سجل التدقيق)
-- =============================================
CREATE TABLE IF NOT EXISTS expense_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  
  -- المصدر
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('expense_category', 'expense_voucher')),
  entity_id UUID NOT NULL,
  entity_number VARCHAR(50),
  
  -- الإجراء
  action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'confirm', 'cancel', 'restore')),
  
  -- التغييرات
  field_name VARCHAR(100),
  old_value JSONB,
  new_value JSONB,
  full_record JSONB,
  
  -- المستخدم
  user_id UUID NOT NULL,
  user_name VARCHAR(255),
  user_ip VARCHAR(45),
  
  -- الوقت
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit logs
CREATE INDEX idx_expense_audit_company ON expense_audit_logs(company_id);
CREATE INDEX idx_expense_audit_entity ON expense_audit_logs(entity_type, entity_id);
CREATE INDEX idx_expense_audit_action ON expense_audit_logs(action);
CREATE INDEX idx_expense_audit_date ON expense_audit_logs(created_at);
CREATE INDEX idx_expense_audit_user ON expense_audit_logs(user_id);

-- =============================================
-- 5. Triggers for updated_at
-- =============================================

-- Cost Centers
CREATE OR REPLACE FUNCTION update_cost_centers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cost_centers_updated_at
  BEFORE UPDATE ON cost_centers
  FOR EACH ROW
  EXECUTE FUNCTION update_cost_centers_updated_at();

-- Expense Categories
CREATE OR REPLACE FUNCTION update_expense_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expense_categories_updated_at
  BEFORE UPDATE ON expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_categories_updated_at();

-- Expense Vouchers
CREATE OR REPLACE FUNCTION update_expense_vouchers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expense_vouchers_updated_at
  BEFORE UPDATE ON expense_vouchers
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_vouchers_updated_at();

-- =============================================
-- 6. Functions for Code Generation
-- =============================================

-- Generate next category code
CREATE OR REPLACE FUNCTION generate_expense_category_code(
  p_company_id UUID,
  p_parent_id UUID DEFAULT NULL
)
RETURNS VARCHAR AS $$
DECLARE
  v_parent_code VARCHAR;
  v_last_code VARCHAR;
  v_next_num INTEGER;
BEGIN
  IF p_parent_id IS NULL THEN
    -- Root level: 51, 52, 53...
    SELECT MAX(code)::INTEGER INTO v_next_num
    FROM expense_categories
    WHERE company_id = p_company_id AND parent_id IS NULL;
    
    RETURN COALESCE(v_next_num + 1, 51)::VARCHAR;
  ELSE
    -- Child level: 52-01, 52-02...
    SELECT code INTO v_parent_code
    FROM expense_categories
    WHERE id = p_parent_id;
    
    SELECT MAX(SPLIT_PART(code, '-', ARRAY_LENGTH(STRING_TO_ARRAY(code, '-'), 1))::INTEGER) INTO v_next_num
    FROM expense_categories
    WHERE parent_id = p_parent_id;
    
    RETURN v_parent_code || '-' || LPAD(COALESCE(v_next_num + 1, 1)::VARCHAR, 2, '0');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Generate voucher number
CREATE OR REPLACE FUNCTION generate_expense_voucher_number(p_company_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_year INTEGER;
  v_count INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM expense_vouchers
  WHERE company_id = p_company_id
    AND voucher_number LIKE 'EXP-' || v_year || '-%';
  
  RETURN 'EXP-' || v_year || '-' || LPAD(v_count::VARCHAR, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. Default Seed Data (بيانات افتراضية)
-- =============================================

-- This will be run after company creation
-- INSERT INTO expense_categories (
--   company_id, code, name_ar, name_en, parent_id, level, path, has_children, 
--   expense_type, is_recurring, sort_order, created_by
-- ) VALUES
-- (company_id, '51', 'مصاريف تشغيلية', 'Operating Expenses', NULL, 1, '51', true, 'general', false, 0, user_id),
-- (company_id, '52', 'مصاريف الموظفين', 'Employee Expenses', NULL, 1, '52', true, 'general', false, 1, user_id),
-- (company_id, '53', 'مصاريف إدارية', 'Administrative Expenses', NULL, 1, '53', false, 'general', false, 2, user_id),
-- (company_id, '54', 'مصاريف تسويقية', 'Marketing Expenses', NULL, 1, '54', false, 'general', false, 3, user_id);

COMMENT ON TABLE cost_centers IS 'مراكز التكلفة - لتوزيع المصاريف على الفروع أو الأقسام أو المشاريع';
COMMENT ON TABLE expense_categories IS 'تصنيفات المصاريف - شجرة هرمية لتصنيف أنواع المصروفات';
COMMENT ON TABLE expense_vouchers IS 'سندات صرف المصاريف - تسجيل كل عملية صرف مصروف';
COMMENT ON TABLE expense_audit_logs IS 'سجل التدقيق - تتبع جميع التغييرات على المصاريف';
