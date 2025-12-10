// Types for Expense Management Module
// وحدة إدارة المصاريف

// ==========================================
// تصنيفات المصاريف (Expense Categories)
// ==========================================

export interface ExpenseCategory {
    id: string;
    company_id: string;

    // الترميز والتسمية
    code: string;                    // "52-01-01"
    name_ar: string;                 // "مرتب محمد سعيد"
    name_en?: string;

    // الهرمية
    parent_id: string | null;        // البند الأب
    level: number;                   // المستوى (1، 2، 3...)
    path: string;                    // "52/52-01/52-01-01" للبحث السريع
    has_children: boolean;           // هل يملك فروع؟

    // المحاسبة
    account_id: string | null;       // الحساب المحاسبي المرتبط
    account_code?: string;           // (denormalized) للسرعة

    // البيانات الإضافية
    description?: string;
    budget_amount: number | null;    // الموازنة الشهرية
    is_active: boolean;

    // نوع المصروف
    expense_type: ExpenseType;

    // للمصاريف المتكررة
    is_recurring: boolean;
    recurring_frequency?: RecurringFrequency;
    recurring_day?: number;          // يوم الشهر للمصاريف الشهرية

    // للموردين المتكررين (مثل شركة الكهرباء)
    default_supplier_id?: string;
    default_supplier_name?: string;

    // مركز التكلفة الافتراضي
    default_cost_center_id?: string;

    // الترتيب
    sort_order: number;

    // التتبع
    created_by: string;
    created_at: string;
    updated_at: string;

    // للعرض فقط (computed)
    children?: ExpenseCategory[];
    total_spent?: number;
    voucher_count?: number;
    last_voucher_date?: string | null;
    last_voucher_number?: string | null;    // ** جديد ** رقم آخر سند
    previous_voucher?: {
        id?: string;
        number?: string;
        amount: number;
        date?: string;
    } | null;
}

export type ExpenseType =
    | 'general'          // بند عادي
    | 'recurring'        // مصروف متكرر (إيجار، كهرباء)
    | 'employee_related' // مرتبط بموظف (سيربط بمديول المرتبات)
    | 'supplier_related';// مرتبط بمورد ثابت

export type RecurringFrequency =
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'quarterly'
    | 'yearly';

// ==========================================
// سندات صرف المصاريف (Expense Vouchers)
// ==========================================

export interface ExpenseVoucher {
    id: string;
    voucher_number: string;          // EXP-2024-0001
    company_id: string;
    branch_id?: string;

    // معلومات أساسية
    date: string;                    // تاريخ الصرف
    category_id: string;             // التصنيف
    category_code?: string;          // (denormalized)
    category_name?: string;          // (denormalized)
    description: string;             // وصف المصروف
    amount: number;                  // المبلغ

    // طريقة الدفع
    payment_method: PaymentMethod;
    vault_id?: string;               // الخزنة (إذا نقدي)
    vault_name?: string;
    bank_id?: string;                // البنك (إذا تحويل)
    bank_name?: string;
    check_number?: string;           // رقم الشيك
    check_date?: string;             // تاريخ الشيك

    // جهات الارتباط
    supplier_id?: string;            // المورد (اختياري)
    supplier_name?: string;

    // مركز التكلفة
    cost_center_id?: string;         // ** جديد **
    cost_center_name?: string;

    // المستندات
    reference_number?: string;       // رقم الفاتورة الخارجية
    attachment_urls: string[];       // روابط المرفقات

    // الحالة
    status: VoucherStatus;

    // المحاسبة
    journal_entry_id?: string;       // القيد المحاسبي المرتبط
    journal_entry_number?: string;

    // السند السابق (للمصاريف المتكررة)
    previous_voucher_id?: string;    // ** جديد **
    previous_voucher_number?: string;// ** جديد **
    previous_voucher_amount?: number;// ** جديد **

    // ملاحظات
    notes?: string;

    // التتبع
    created_by: string;
    created_by_name?: string;
    created_at: string;
    updated_at: string;
}

export type PaymentMethod = 'cash' | 'bank' | 'check' | 'card';

export type VoucherStatus = 'draft' | 'confirmed' | 'cancelled';

// ==========================================
// مراكز التكلفة (Cost Centers)
// ==========================================

export interface CostCenter {
    id: string;
    company_id: string;
    code: string;                    // CC-001
    name_ar: string;
    name_en?: string;
    type: CostCenterType;
    parent_id?: string;              // للهرمية
    is_active: boolean;
    description?: string;
    created_at: string;
    updated_at: string;
}

export type CostCenterType =
    | 'branch'           // فرع
    | 'department'       // قسم
    | 'project'          // مشروع
    | 'product_line'     // خط إنتاج
    | 'other';

// ==========================================
// سجل التدقيق (Audit Trail)
// ==========================================

export interface ExpenseAuditLog {
    id: string;
    company_id: string;

    // المصدر
    entity_type: 'expense_category' | 'expense_voucher';
    entity_id: string;
    entity_number?: string;          // رقم السند أو كود التصنيف

    // الإجراء
    action: AuditAction;

    // التغييرات
    field_name?: string;             // اسم الحقل المتغير
    old_value?: string;              // القيمة القديمة (JSON)
    new_value?: string;              // القيمة الجديدة (JSON)

    // البيانات الكاملة (للحذف)
    full_record?: string;            // السجل كاملاً (JSON)

    // المستخدم
    user_id: string;
    user_name?: string;
    user_ip?: string;

    // الوقت
    created_at: string;
}

export type AuditAction =
    | 'create'
    | 'update'
    | 'delete'
    | 'confirm'
    | 'cancel'
    | 'restore';

// ==========================================
// الإحصائيات والتحليلات
// ==========================================

export interface ExpenseStats {
    total_amount: number;
    voucher_count: number;
    average_amount: number;
    max_amount: number;
    min_amount: number;
}

export interface ExpenseDistribution {
    category_id: string;
    category_name: string;
    category_code: string;
    amount: number;
    percentage: number;
    color?: string;
}

export interface ExpenseTrend {
    period: string;                  // الفترة (شهر، أسبوع)
    amount: number;
    voucher_count: number;
}

export interface BudgetComparison {
    category_id: string;
    category_name: string;
    budget: number;
    actual: number;
    variance: number;
    variance_percentage: number;
    status: 'under' | 'on-track' | 'over';
}

export interface CostCenterExpense {
    cost_center_id: string;
    cost_center_name: string;
    amount: number;
    percentage: number;
}

// ==========================================
// الفلاتر والبحث
// ==========================================

export interface ExpenseVoucherFilters {
    search?: string;
    category_id?: string;
    cost_center_id?: string;
    status?: VoucherStatus;
    payment_method?: PaymentMethod;
    date_from?: string;
    date_to?: string;
    amount_min?: number;
    amount_max?: number;
    supplier_id?: string;
    created_by?: string;
}

export interface ExpenseCategoryFilters {
    search?: string;
    parent_id?: string | null;
    level?: number;
    is_active?: boolean;
    expense_type?: ExpenseType;
    has_budget?: boolean;
}

// ==========================================
// Pagination
// ==========================================

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
    };
}

// ==========================================
// Form Data
// ==========================================

export interface CreateExpenseCategoryInput {
    name_ar: string;
    name_en?: string;
    parent_id?: string | null;
    description?: string;
    budget_amount?: number;
    expense_type: ExpenseType;
    is_recurring?: boolean;
    recurring_frequency?: RecurringFrequency;
    recurring_day?: number;
    default_supplier_id?: string;
    default_cost_center_id?: string;
    create_account_automatically?: boolean;
    existing_account_id?: string;
}

export interface UpdateExpenseCategoryInput extends Partial<CreateExpenseCategoryInput> {
    id: string;
}

export interface CreateExpenseVoucherInput {
    date: string;
    category_id: string;
    description: string;
    amount: number;
    payment_method: PaymentMethod;
    vault_id?: string;
    bank_id?: string;
    check_number?: string;
    check_date?: string;
    supplier_id?: string;
    cost_center_id?: string;
    reference_number?: string;
    notes?: string;
    status?: 'draft' | 'confirmed';
}

export interface UpdateExpenseVoucherInput extends Partial<CreateExpenseVoucherInput> {
    id: string;
}

// ==========================================
// API Responses
// ==========================================

export interface ExpenseCategoryWithStats extends ExpenseCategory {
    total_spent: number;
    voucher_count: number;
    budget_used_percentage: number | null;
    last_voucher_date: string | null;
    last_voucher_number: string | null;
    previous_voucher?: {
        id: string;
        number: string;
        amount: number;
        date: string;
    } | null;
}

export interface ExpenseTreeNode extends ExpenseCategoryWithStats {
    children: ExpenseTreeNode[];
    is_expanded?: boolean;
    is_loading?: boolean;
}

// ==========================================
// Database Row Types (for Supabase)
// ==========================================

export interface ExpenseCategoryRow {
    id: string;
    company_id: string;
    code: string;
    name_ar: string;
    name_en: string | null;
    parent_id: string | null;
    level: number;
    path: string;
    has_children: boolean;
    account_id: string | null;
    account_code: string | null;
    description: string | null;
    budget_amount: number | null;
    is_active: boolean;
    expense_type: ExpenseType;
    is_recurring: boolean;
    recurring_frequency: RecurringFrequency | null;
    recurring_day: number | null;
    default_supplier_id: string | null;
    default_supplier_name: string | null;
    default_cost_center_id: string | null;
    sort_order: number;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface ExpenseVoucherRow {
    id: string;
    voucher_number: string;
    company_id: string;
    branch_id: string | null;
    date: string;
    category_id: string;
    category_code: string | null;
    category_name: string | null;
    description: string;
    amount: number;
    payment_method: PaymentMethod;
    vault_id: string | null;
    vault_name: string | null;
    bank_id: string | null;
    bank_name: string | null;
    check_number: string | null;
    check_date: string | null;
    supplier_id: string | null;
    supplier_name: string | null;
    cost_center_id: string | null;
    cost_center_name: string | null;
    reference_number: string | null;
    attachment_urls: string[] | null;
    status: VoucherStatus;
    journal_entry_id: string | null;
    journal_entry_number: string | null;
    previous_voucher_id: string | null;
    previous_voucher_number: string | null;
    previous_voucher_amount: number | null;
    notes: string | null;
    created_by: string;
    created_by_name: string | null;
    created_at: string;
    updated_at: string;
}

export interface CostCenterRow {
    id: string;
    company_id: string;
    code: string;
    name_ar: string;
    name_en: string | null;
    type: CostCenterType;
    parent_id: string | null;
    is_active: boolean;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface ExpenseAuditLogRow {
    id: string;
    company_id: string;
    entity_type: 'expense_category' | 'expense_voucher';
    entity_id: string;
    entity_number: string | null;
    action: AuditAction;
    field_name: string | null;
    old_value: string | null;
    new_value: string | null;
    full_record: string | null;
    user_id: string;
    user_name: string | null;
    user_ip: string | null;
    created_at: string;
}

// ==========================================
// المصاريف المجدولة (Scheduled Expenses)
// ==========================================

export interface ScheduledExpense {
    id: string;
    company_id: string;

    // معلومات أساسية
    name: string;
    category_id: string;
    category_name?: string;
    category_code?: string;
    description: string;
    amount: number;

    // الجدولة
    frequency: RecurringFrequency;
    day_of_month?: number;       // للشهري (1-28)
    day_of_week?: number;        // للأسبوعي (0-6)
    month_of_year?: number;      // للسنوي (1-12)

    // طريقة الدفع
    payment_method: PaymentMethod;
    vault_id?: string;
    bank_id?: string;

    // الارتباطات
    supplier_id?: string;
    supplier_name?: string;
    cost_center_id?: string;
    cost_center_name?: string;

    // الحالة
    is_active: boolean;
    start_date: string;
    end_date?: string;
    last_generated_date?: string;
    next_due_date?: string;

    // التتبع
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface CreateScheduledExpenseInput {
    name: string;
    category_id: string;
    description: string;
    amount: number;
    frequency: RecurringFrequency;
    day_of_month?: number;
    day_of_week?: number;
    month_of_year?: number;
    payment_method: PaymentMethod;
    vault_id?: string;
    bank_id?: string;
    supplier_id?: string;
    cost_center_id?: string;
    start_date: string;
    end_date?: string;
}

// ==========================================
// الموافقات والصلاحيات (Approvals)
// ==========================================

export interface ExpenseApproval {
    id: string;
    company_id: string;
    voucher_id: string;
    voucher_number?: string;

    // مستوى الموافقة
    approval_level: number;
    approver_id: string;
    approver_name?: string;

    // الحالة
    status: ApprovalStatus;

    // التفاصيل
    comments?: string;
    approved_at?: string;
    rejected_at?: string;

    // التتبع
    created_at: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

export interface ApprovalRule {
    id: string;
    company_id: string;
    name: string;

    // الشروط
    min_amount?: number;         // الحد الأدنى للمبلغ
    max_amount?: number;         // الحد الأقصى للمبلغ
    category_ids?: string[];     // التصنيفات المحددة
    cost_center_ids?: string[];  // مراكز التكلفة

    // المعتمدين
    approvers: ApprovalLevel[];

    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ApprovalLevel {
    level: number;
    user_id: string;
    user_name?: string;
    is_required: boolean;        // إلزامي أم اختياري
    can_skip_if_below?: number;  // يمكن التخطي إذا المبلغ أقل من
}

export interface PendingApproval {
    voucher_id: string;
    voucher_number: string;
    amount: number;
    description: string;
    category_name: string;
    requester_name: string;
    requested_at: string;
    approval_level: number;
    days_pending: number;
}

// ==========================================
// التنبيهات الذكية (Smart Alerts)
// ==========================================

export interface ExpenseAlert {
    id: string;
    company_id: string;

    // نوع التنبيه
    type: AlertType;
    priority: AlertPriority;

    // المحتوى
    title: string;
    message: string;

    // المرجع
    reference_type?: 'category' | 'voucher' | 'scheduled';
    reference_id?: string;
    reference_name?: string;

    // البيانات الإضافية
    data?: Record<string, any>;

    // الحالة
    is_read: boolean;
    is_dismissed: boolean;

    // التتبع
    created_at: string;
    expires_at?: string;
}

export type AlertType =
    | 'budget_warning_80'    // تحذير 80% من الموازنة
    | 'budget_exceeded'      // تجاوز الموازنة
    | 'scheduled_due'        // موعد مصروف مجدول
    | 'scheduled_overdue'    // تأخر في مصروف مجدول
    | 'unusual_spending'     // صرف غير معتاد
    | 'approval_pending'     // موافقة معلقة
    | 'approval_reminder';   // تذكير بالموافقة

export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AlertSettings {
    id: string;
    company_id: string;
    user_id: string;

    // تفعيل/تعطيل
    budget_warnings: boolean;
    scheduled_reminders: boolean;
    approval_notifications: boolean;
    unusual_spending_alerts: boolean;

    // ترددات
    reminder_days_before: number;  // التذكير قبل الموعد بكم يوم
    budget_warning_threshold: number; // نسبة التحذير (مثل 80%)

    // قنوات الإرسال
    email_notifications: boolean;
    push_notifications: boolean;

    created_at: string;
    updated_at: string;
}

// ==========================================
// تكامل المرتبات (Payroll Integration)
// ==========================================

export interface PayrollExpenseLink {
    id: string;
    company_id: string;

    // الموظف
    employee_id: string;
    employee_name: string;
    employee_code?: string;

    // التصنيف
    category_id: string;
    category_name?: string;
    category_code?: string;

    // القيم
    base_salary: number;
    allowances: number;
    deductions: number;
    net_salary: number;

    // الحالة
    is_active: boolean;
    last_payment_date?: string;
    last_voucher_id?: string;

    created_at: string;
    updated_at: string;
}

// ==========================================
// التصدير المتقدم (Advanced Export)
// ==========================================

export interface ExportTemplate {
    id: string;
    company_id: string;
    name: string;
    type: 'excel' | 'pdf' | 'csv';

    // الإعدادات
    report_type: ExportReportType;
    filters: ExpenseVoucherFilters;
    columns: string[];
    grouping?: 'category' | 'date' | 'cost_center' | 'supplier';
    include_summary: boolean;
    include_charts: boolean;

    // التنسيق
    date_format: string;
    number_format: string;
    language: 'ar' | 'en';

    is_default: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export type ExportReportType =
    | 'vouchers_list'        // قائمة السندات
    | 'expense_tree'         // شجرة المصاريف
    | 'budget_comparison'    // مقارنة الموازنة
    | 'cost_center_report'   // تقرير مراكز التكلفة
    | 'supplier_report'      // تقرير الموردين
    | 'monthly_comparison'   // مقارنة شهرية
    | 'category_ledger';     // كشف حساب تصنيف

export interface ExportRequest {
    template_id?: string;
    report_type: ExportReportType;
    format: 'excel' | 'pdf' | 'csv';
    filters: ExpenseVoucherFilters;
    options?: {
        include_summary?: boolean;
        include_charts?: boolean;
        grouping?: string;
        language?: 'ar' | 'en';
    };
}

// ==========================================
// التقارير المتقدمة (Advanced Reports)
// ==========================================

export interface MonthlyComparison {
    month: string;
    year: number;
    total: number;
    by_category: {
        category_id: string;
        category_name: string;
        amount: number;
    }[];
    change_from_previous: number;
    change_percentage: number;
}

export interface CostCenterReport {
    cost_center_id: string;
    cost_center_name: string;
    cost_center_code: string;
    total_amount: number;
    voucher_count: number;
    by_category: {
        category_id: string;
        category_name: string;
        amount: number;
        percentage: number;
    }[];
    by_month: {
        month: string;
        amount: number;
    }[];
}

export interface ExpenseHeatmapData {
    date: string;
    day_of_week: number;
    week_of_year: number;
    amount: number;
    voucher_count: number;
    intensity: number; // 0-1 للتلوين
}

export interface SupplierExpenseReport {
    supplier_id: string;
    supplier_name: string;
    total_amount: number;
    voucher_count: number;
    average_amount: number;
    last_payment_date: string;
    by_category: {
        category_id: string;
        category_name: string;
        amount: number;
    }[];
    trend: {
        period: string;
        amount: number;
    }[];
}

