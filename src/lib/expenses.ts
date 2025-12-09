// API Functions for Expense Management Module
// دوال API لوحدة إدارة المصاريف

import { supabase } from '@/lib/supabase';
import type {
    ExpenseCategory,
    ExpenseCategoryWithStats,
    ExpenseTreeNode,
    ExpenseVoucher,
    CreateExpenseCategoryInput,
    UpdateExpenseCategoryInput,
    CreateExpenseVoucherInput,
    UpdateExpenseVoucherInput,
    ExpenseVoucherFilters,
    ExpenseCategoryFilters,
    PaginatedResponse,
    ExpenseStats,
    ExpenseDistribution,
    ExpenseTrend,
    BudgetComparison,
    CostCenter,
    ExpenseAuditLog,
    AuditAction,
} from '@/types/expenses';

// ==========================================
// Helper Functions
// ==========================================

function getCurrentCompanyId(): string {
    // TODO: Get from auth context
    return 'default-company-id';
}

function getCurrentUserId(): string {
    // TODO: Get from auth context
    return 'default-user-id';
}

function getCurrentUserName(): string {
    // TODO: Get from auth context
    return 'المستخدم';
}

// ==========================================
// Expense Categories API
// ==========================================

/**
 * Get expense categories tree
 */
export async function getExpenseCategoriesTree(): Promise<ExpenseTreeNode[]> {
    const companyId = getCurrentCompanyId();

    const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('code', { ascending: true });

    if (error) throw new Error(error.message);

    // Get stats for each category
    const categoriesWithStats = await Promise.all(
        (data || []).map(async (cat) => {
            const stats = await getCategoryStats(cat.id);
            const previousVoucher = await getLastVoucherForCategory(cat.id);

            return {
                ...cat,
                ...stats,
                previous_voucher: previousVoucher,
                children: [],
            } as ExpenseTreeNode;
        })
    );

    // Build tree structure
    return buildTree(categoriesWithStats);
}

function buildTree(categories: ExpenseTreeNode[]): ExpenseTreeNode[] {
    const map = new Map<string, ExpenseTreeNode>();
    const roots: ExpenseTreeNode[] = [];

    // Create map
    categories.forEach(cat => {
        map.set(cat.id, { ...cat, children: [] });
    });

    // Build tree
    categories.forEach(cat => {
        const node = map.get(cat.id)!;
        if (cat.parent_id && map.has(cat.parent_id)) {
            map.get(cat.parent_id)!.children.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
}

/**
 * Get category stats
 */
async function getCategoryStats(categoryId: string): Promise<{
    total_spent: number;
    voucher_count: number;
    budget_used_percentage: number | null;
    last_voucher_date: string | null;
    last_voucher_number: string | null;
}> {
    const { data, error } = await supabase
        .from('expense_vouchers')
        .select('id, amount, date, voucher_number')
        .eq('category_id', categoryId)
        .eq('status', 'confirmed')
        .order('date', { ascending: false });

    if (error) {
        return {
            total_spent: 0,
            voucher_count: 0,
            budget_used_percentage: null,
            last_voucher_date: null,
            last_voucher_number: null,
        };
    }

    const vouchers = data || [];
    const total = vouchers.reduce((sum, v) => sum + (v.amount || 0), 0);

    // Get category budget
    const { data: catData } = await supabase
        .from('expense_categories')
        .select('budget_amount')
        .eq('id', categoryId)
        .single();

    const budgetUsed = catData?.budget_amount
        ? Math.round((total / catData.budget_amount) * 100)
        : null;

    return {
        total_spent: total,
        voucher_count: vouchers.length,
        budget_used_percentage: budgetUsed,
        last_voucher_date: vouchers[0]?.date || null,
        last_voucher_number: vouchers[0]?.voucher_number || null,
    };
}

/**
 * Get last voucher for category (for recurring expenses)
 */
async function getLastVoucherForCategory(categoryId: string): Promise<{
    id: string;
    number: string;
    amount: number;
    date: string;
} | null> {
    const { data, error } = await supabase
        .from('expense_vouchers')
        .select('id, voucher_number, amount, date')
        .eq('category_id', categoryId)
        .eq('status', 'confirmed')
        .order('date', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        number: data.voucher_number,
        amount: data.amount,
        date: data.date,
    };
}

/**
 * Get single category with stats
 */
export async function getExpenseCategory(id: string): Promise<ExpenseCategoryWithStats | null> {
    const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return null;

    const stats = await getCategoryStats(id);
    const previousVoucher = await getLastVoucherForCategory(id);

    return {
        ...data,
        ...stats,
        previous_voucher: previousVoucher,
    };
}

/**
 * Create expense category
 */
export async function createExpenseCategory(
    input: CreateExpenseCategoryInput
): Promise<ExpenseCategory> {
    const companyId = getCurrentCompanyId();
    const userId = getCurrentUserId();

    // Generate code
    const code = await generateCategoryCode(input.parent_id || null);

    // Calculate level and path
    let level = 1;
    let path = code;

    if (input.parent_id) {
        const parent = await getExpenseCategory(input.parent_id);
        if (parent) {
            level = parent.level + 1;
            path = `${parent.path}/${code}`;
        }
    }

    // Create category
    const { data, error } = await supabase
        .from('expense_categories')
        .insert({
            company_id: companyId,
            code,
            name_ar: input.name_ar,
            name_en: input.name_en,
            parent_id: input.parent_id,
            level,
            path,
            has_children: false,
            description: input.description,
            budget_amount: input.budget_amount,
            expense_type: input.expense_type,
            is_recurring: input.is_recurring || false,
            recurring_frequency: input.recurring_frequency,
            recurring_day: input.recurring_day,
            default_supplier_id: input.default_supplier_id,
            default_cost_center_id: input.default_cost_center_id,
            is_active: true,
            sort_order: 0,
            created_by: userId,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    // Update parent has_children
    if (input.parent_id) {
        await supabase
            .from('expense_categories')
            .update({ has_children: true })
            .eq('id', input.parent_id);
    }

    // Create audit log
    await createAuditLog('expense_category', data.id, data.code, 'create', null, data);

    // Create account if requested
    if (input.create_account_automatically) {
        // TODO: Create account in chart of accounts
    }

    return data;
}

/**
 * Generate category code
 */
async function generateCategoryCode(parentId: string | null): Promise<string> {
    const companyId = getCurrentCompanyId();

    if (!parentId) {
        // Root level: 51, 52, 53...
        const { data } = await supabase
            .from('expense_categories')
            .select('code')
            .eq('company_id', companyId)
            .is('parent_id', null)
            .order('code', { ascending: false })
            .limit(1);

        if (!data || data.length === 0) return '51';

        const lastCode = parseInt(data[0].code);
        return String(lastCode + 1);
    } else {
        // Child level: 52-01, 52-02...
        const parent = await getExpenseCategory(parentId);
        if (!parent) throw new Error('Parent not found');

        const { data } = await supabase
            .from('expense_categories')
            .select('code')
            .eq('parent_id', parentId)
            .order('code', { ascending: false })
            .limit(1);

        if (!data || data.length === 0) return `${parent.code}-01`;

        const lastCode = data[0].code;
        const parts = lastCode.split('-');
        const lastNum = parseInt(parts[parts.length - 1]);
        return `${parent.code}-${String(lastNum + 1).padStart(2, '0')}`;
    }
}

/**
 * Update expense category
 */
export async function updateExpenseCategory(
    input: UpdateExpenseCategoryInput
): Promise<ExpenseCategory> {
    // Check if category has transactions
    const hasTransactions = await checkCategoryHasTransactions(input.id);
    if (hasTransactions) {
        throw new Error('لا يمكن تعديل بند تم استخدامه في معاملات مالية');
    }

    // Get old data for audit
    const oldData = await getExpenseCategory(input.id);
    if (!oldData) throw new Error('Category not found');

    const { data, error } = await supabase
        .from('expense_categories')
        .update({
            name_ar: input.name_ar,
            name_en: input.name_en,
            description: input.description,
            budget_amount: input.budget_amount,
            expense_type: input.expense_type,
            is_recurring: input.is_recurring,
            recurring_frequency: input.recurring_frequency,
            recurring_day: input.recurring_day,
            default_supplier_id: input.default_supplier_id,
            default_cost_center_id: input.default_cost_center_id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single();

    if (error) throw new Error(error.message);

    // Create audit log
    await createAuditLog('expense_category', data.id, data.code, 'update', oldData, data);

    return data;
}

/**
 * Delete expense category
 */
export async function deleteExpenseCategory(id: string): Promise<void> {
    const category = await getExpenseCategory(id);
    if (!category) throw new Error('Category not found');

    // Check if has children
    if (category.has_children) {
        throw new Error('لا يمكن حذف بند يحتوي على فروع. احذف الفروع أولاً.');
    }

    // Check if has transactions
    const hasTransactions = await checkCategoryHasTransactions(id);
    if (hasTransactions) {
        throw new Error('لا يمكن حذف بند تم استخدامه في معاملات مالية');
    }

    // Create audit log before deletion
    await createAuditLog('expense_category', id, category.code, 'delete', category, null);

    // Delete
    const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);

    // Update parent has_children if needed
    if (category.parent_id) {
        const { data: siblings } = await supabase
            .from('expense_categories')
            .select('id')
            .eq('parent_id', category.parent_id)
            .limit(1);

        if (!siblings || siblings.length === 0) {
            await supabase
                .from('expense_categories')
                .update({ has_children: false })
                .eq('id', category.parent_id);
        }
    }
}

/**
 * Check if category has transactions
 */
async function checkCategoryHasTransactions(categoryId: string): Promise<boolean> {
    const { count, error } = await supabase
        .from('expense_vouchers')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', categoryId);

    return (count || 0) > 0;
}

// ==========================================
// Expense Vouchers API
// ==========================================

/**
 * Get expense vouchers with filters
 */
export async function getExpenseVouchers(
    filters: ExpenseVoucherFilters = {},
    page = 1,
    perPage = 20
): Promise<PaginatedResponse<ExpenseVoucher>> {
    const companyId = getCurrentCompanyId();

    let query = supabase
        .from('expense_vouchers')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

    // Apply filters
    if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
    }
    if (filters.cost_center_id) {
        query = query.eq('cost_center_id', filters.cost_center_id);
    }
    if (filters.status) {
        query = query.eq('status', filters.status);
    }
    if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
    }
    if (filters.date_from) {
        query = query.gte('date', filters.date_from);
    }
    if (filters.date_to) {
        query = query.lte('date', filters.date_to);
    }
    if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
    }
    if (filters.search) {
        query = query.or(`voucher_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) throw new Error(error.message);

    return {
        data: (data || []) as ExpenseVoucher[],
        pagination: {
            total: count || 0,
            page,
            per_page: perPage,
            total_pages: Math.ceil((count || 0) / perPage),
        },
    };
}

/**
 * Get single voucher
 */
export async function getExpenseVoucher(id: string): Promise<ExpenseVoucher | null> {
    const { data, error } = await supabase
        .from('expense_vouchers')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

/**
 * Create expense voucher
 */
export async function createExpenseVoucher(
    input: CreateExpenseVoucherInput
): Promise<ExpenseVoucher> {
    const companyId = getCurrentCompanyId();
    const userId = getCurrentUserId();
    const userName = getCurrentUserName();

    // Validate category is leaf (no children)
    const category = await getExpenseCategory(input.category_id);
    if (!category) throw new Error('التصنيف غير موجود');
    if (category.has_children) {
        throw new Error('يجب اختيار تصنيف نهائي (ليس مجموعة)');
    }

    // Validate amount
    if (input.amount <= 0) {
        throw new Error('المبلغ يجب أن يكون أكبر من صفر');
    }

    // Validate payment method
    if (input.payment_method === 'cash' && !input.vault_id) {
        throw new Error('يجب اختيار الخزنة عند الدفع نقداً');
    }
    if (input.payment_method === 'bank' && !input.bank_id) {
        throw new Error('يجب اختيار البنك عند التحويل البنكي');
    }

    // Generate voucher number
    const voucherNumber = await generateVoucherNumber();

    // Get previous voucher for this category
    const previousVoucher = await getLastVoucherForCategory(input.category_id);

    // Get vault/bank names
    let vaultName, bankName;
    if (input.vault_id) {
        const { data } = await supabase.from('vaults').select('name').eq('id', input.vault_id).single();
        vaultName = data?.name;
    }
    if (input.bank_id) {
        const { data } = await supabase.from('banks').select('name').eq('id', input.bank_id).single();
        bankName = data?.name;
    }

    // Get supplier name
    let supplierName;
    if (input.supplier_id) {
        const { data } = await supabase.from('suppliers').select('name').eq('id', input.supplier_id).single();
        supplierName = data?.name;
    }

    // Get cost center name
    let costCenterName;
    if (input.cost_center_id) {
        const { data } = await supabase.from('cost_centers').select('name_ar').eq('id', input.cost_center_id).single();
        costCenterName = data?.name_ar;
    }

    const status = input.status || 'draft';

    // Create voucher
    const { data, error } = await supabase
        .from('expense_vouchers')
        .insert({
            voucher_number: voucherNumber,
            company_id: companyId,
            date: input.date,
            category_id: input.category_id,
            category_code: category.code,
            category_name: category.name_ar,
            description: input.description,
            amount: input.amount,
            payment_method: input.payment_method,
            vault_id: input.vault_id,
            vault_name: vaultName,
            bank_id: input.bank_id,
            bank_name: bankName,
            check_number: input.check_number,
            check_date: input.check_date,
            supplier_id: input.supplier_id,
            supplier_name: supplierName,
            cost_center_id: input.cost_center_id || category.default_cost_center_id,
            cost_center_name: costCenterName,
            reference_number: input.reference_number,
            attachment_urls: [],
            status,
            previous_voucher_id: previousVoucher?.id,
            previous_voucher_number: previousVoucher?.number,
            previous_voucher_amount: previousVoucher?.amount,
            notes: input.notes,
            created_by: userId,
            created_by_name: userName,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    // Create audit log
    await createAuditLog('expense_voucher', data.id, data.voucher_number, 'create', null, data);

    // If confirmed, create journal entry
    if (status === 'confirmed') {
        await createExpenseJournalEntry(data);
    }

    return data;
}

/**
 * Generate voucher number
 */
async function generateVoucherNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const companyId = getCurrentCompanyId();

    const { count } = await supabase
        .from('expense_vouchers')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .ilike('voucher_number', `EXP-${year}-%`);

    const sequence = (count || 0) + 1;
    return `EXP-${year}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Update expense voucher
 */
export async function updateExpenseVoucher(
    input: UpdateExpenseVoucherInput
): Promise<ExpenseVoucher> {
    const voucher = await getExpenseVoucher(input.id);
    if (!voucher) throw new Error('Voucher not found');

    // Can only update draft vouchers
    if (voucher.status !== 'draft') {
        throw new Error('لا يمكن تعديل سند مؤكد. يجب إلغاؤه أولاً.');
    }

    const { data, error } = await supabase
        .from('expense_vouchers')
        .update({
            date: input.date,
            category_id: input.category_id,
            description: input.description,
            amount: input.amount,
            payment_method: input.payment_method,
            vault_id: input.vault_id,
            bank_id: input.bank_id,
            check_number: input.check_number,
            check_date: input.check_date,
            supplier_id: input.supplier_id,
            cost_center_id: input.cost_center_id,
            reference_number: input.reference_number,
            notes: input.notes,
            updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single();

    if (error) throw new Error(error.message);

    // Create audit log
    await createAuditLog('expense_voucher', data.id, data.voucher_number, 'update', voucher, data);

    return data;
}

/**
 * Confirm expense voucher
 */
export async function confirmExpenseVoucher(id: string): Promise<ExpenseVoucher> {
    const voucher = await getExpenseVoucher(id);
    if (!voucher) throw new Error('Voucher not found');

    if (voucher.status !== 'draft') {
        throw new Error('السند ليس مسودة');
    }

    // Create journal entry
    const journalEntryId = await createExpenseJournalEntry(voucher);

    const { data, error } = await supabase
        .from('expense_vouchers')
        .update({
            status: 'confirmed',
            journal_entry_id: journalEntryId,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);

    // Create audit log
    await createAuditLog('expense_voucher', data.id, data.voucher_number, 'confirm', voucher, data);

    return data;
}

/**
 * Cancel expense voucher
 */
export async function cancelExpenseVoucher(id: string): Promise<ExpenseVoucher> {
    const voucher = await getExpenseVoucher(id);
    if (!voucher) throw new Error('Voucher not found');

    // Delete journal entry if exists
    if (voucher.journal_entry_id) {
        await supabase
            .from('journal_entries')
            .delete()
            .eq('id', voucher.journal_entry_id);
    }

    const { data, error } = await supabase
        .from('expense_vouchers')
        .update({
            status: 'cancelled',
            journal_entry_id: null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);

    // Create audit log
    await createAuditLog('expense_voucher', data.id, data.voucher_number, 'cancel', voucher, data);

    return data;
}

/**
 * Delete expense voucher (draft only)
 */
export async function deleteExpenseVoucher(id: string): Promise<void> {
    const voucher = await getExpenseVoucher(id);
    if (!voucher) throw new Error('Voucher not found');

    if (voucher.status !== 'draft') {
        throw new Error('لا يمكن حذف سند غير مسودة');
    }

    // Create audit log before deletion
    await createAuditLog('expense_voucher', id, voucher.voucher_number, 'delete', voucher, null);

    const { error } = await supabase
        .from('expense_vouchers')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
}

/**
 * Create journal entry for expense
 */
async function createExpenseJournalEntry(voucher: ExpenseVoucher): Promise<string> {
    const category = await getExpenseCategory(voucher.category_id);
    if (!category?.account_id) {
        throw new Error('التصنيف غير مرتبط بحساب محاسبي');
    }

    // Get cash/bank account
    let cashAccountId: string | null = null;

    if (voucher.vault_id) {
        const { data } = await supabase
            .from('vaults')
            .select('account_id')
            .eq('id', voucher.vault_id)
            .single();
        cashAccountId = data?.account_id;
    } else if (voucher.bank_id) {
        const { data } = await supabase
            .from('banks')
            .select('account_id')
            .eq('id', voucher.bank_id)
            .single();
        cashAccountId = data?.account_id;
    }

    if (!cashAccountId) {
        throw new Error('لم يتم العثور على حساب الخزنة/البنك');
    }

    // Create journal entry
    const { data: entry, error } = await supabase
        .from('journal_entries')
        .insert({
            company_id: voucher.company_id,
            entry_date: voucher.date,
            description: `سند صرف ${voucher.voucher_number} - ${voucher.description}`,
            reference_type: 'expense_voucher',
            reference_id: voucher.id,
            status: 'posted',
            created_by: voucher.created_by,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    // Create journal entry lines
    const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert([
            {
                journal_entry_id: entry.id,
                account_id: category.account_id,
                description: voucher.description,
                debit: voucher.amount,
                credit: 0,
                cost_center_id: voucher.cost_center_id,
            },
            {
                journal_entry_id: entry.id,
                account_id: cashAccountId,
                description: `صرف من ${voucher.vault_id ? 'الخزنة' : 'البنك'}`,
                debit: 0,
                credit: voucher.amount,
                cost_center_id: voucher.cost_center_id,
            },
        ]);

    if (linesError) throw new Error(linesError.message);

    return entry.id;
}

// ==========================================
// Analytics API
// ==========================================

/**
 * Get expense statistics
 */
export async function getExpenseStats(
    dateFrom?: string,
    dateTo?: string,
    costCenterId?: string
): Promise<ExpenseStats> {
    const companyId = getCurrentCompanyId();

    let query = supabase
        .from('expense_vouchers')
        .select('amount')
        .eq('company_id', companyId)
        .eq('status', 'confirmed');

    if (dateFrom) query = query.gte('date', dateFrom);
    if (dateTo) query = query.lte('date', dateTo);
    if (costCenterId) query = query.eq('cost_center_id', costCenterId);

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    const amounts = (data || []).map(v => v.amount);
    const total = amounts.reduce((sum, a) => sum + a, 0);

    return {
        total_amount: total,
        voucher_count: amounts.length,
        average_amount: amounts.length > 0 ? total / amounts.length : 0,
        max_amount: amounts.length > 0 ? Math.max(...amounts) : 0,
        min_amount: amounts.length > 0 ? Math.min(...amounts) : 0,
    };
}

/**
 * Get expense distribution by category
 */
export async function getExpenseDistribution(
    dateFrom?: string,
    dateTo?: string,
    level = 1
): Promise<ExpenseDistribution[]> {
    const companyId = getCurrentCompanyId();

    // Get categories at specified level
    const { data: categories } = await supabase
        .from('expense_categories')
        .select('id, code, name_ar')
        .eq('company_id', companyId)
        .eq('level', level);

    if (!categories) return [];

    // Get amounts for each category
    const distribution: ExpenseDistribution[] = [];
    let totalAmount = 0;

    for (const cat of categories) {
        let query = supabase
            .from('expense_vouchers')
            .select('amount')
            .eq('company_id', companyId)
            .eq('status', 'confirmed')
            .like('category_code', `${cat.code}%`);

        if (dateFrom) query = query.gte('date', dateFrom);
        if (dateTo) query = query.lte('date', dateTo);

        const { data } = await query;
        const amount = (data || []).reduce((sum, v) => sum + v.amount, 0);
        totalAmount += amount;

        distribution.push({
            category_id: cat.id,
            category_name: cat.name_ar,
            category_code: cat.code,
            amount,
            percentage: 0,
        });
    }

    // Calculate percentages
    return distribution.map(d => ({
        ...d,
        percentage: totalAmount > 0 ? Math.round((d.amount / totalAmount) * 100) : 0,
    }));
}

/**
 * Get expense trend
 */
export async function getExpenseTrend(
    months = 6,
    costCenterId?: string
): Promise<ExpenseTrend[]> {
    const companyId = getCurrentCompanyId();
    const trends: ExpenseTrend[] = [];

    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
        const dateTo = `${year}-${String(month).padStart(2, '0')}-31`;

        let query = supabase
            .from('expense_vouchers')
            .select('id, amount')
            .eq('company_id', companyId)
            .eq('status', 'confirmed')
            .gte('date', dateFrom)
            .lte('date', dateTo);

        if (costCenterId) query = query.eq('cost_center_id', costCenterId);

        const { data } = await query;

        const amount = (data || []).reduce((sum, v) => sum + v.amount, 0);
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        trends.push({
            period: monthNames[month - 1],
            amount,
            voucher_count: (data || []).length,
        });
    }

    return trends;
}

/**
 * Get budget comparison
 */
export async function getBudgetComparison(
    year: number,
    month: number
): Promise<BudgetComparison[]> {
    const companyId = getCurrentCompanyId();

    // Get categories with budget
    const { data: categories } = await supabase
        .from('expense_categories')
        .select('id, code, name_ar, budget_amount')
        .eq('company_id', companyId)
        .not('budget_amount', 'is', null);

    if (!categories) return [];

    const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
    const dateTo = `${year}-${String(month).padStart(2, '0')}-31`;

    const comparisons: BudgetComparison[] = [];

    for (const cat of categories) {
        const { data } = await supabase
            .from('expense_vouchers')
            .select('amount')
            .eq('category_id', cat.id)
            .eq('status', 'confirmed')
            .gte('date', dateFrom)
            .lte('date', dateTo);

        const actual = (data || []).reduce((sum, v) => sum + v.amount, 0);
        const budget = cat.budget_amount || 0;
        const variance = actual - budget;
        const variancePercentage = budget > 0 ? Math.round((variance / budget) * 100) : 0;

        let status: 'under' | 'on-track' | 'over' = 'on-track';
        if (variancePercentage < -10) status = 'under';
        else if (variancePercentage > 10) status = 'over';

        comparisons.push({
            category_id: cat.id,
            category_name: cat.name_ar,
            budget,
            actual,
            variance,
            variance_percentage: variancePercentage,
            status,
        });
    }

    return comparisons;
}

// ==========================================
// Audit Trail API
// ==========================================

/**
 * Create audit log
 */
async function createAuditLog(
    entityType: 'expense_category' | 'expense_voucher',
    entityId: string,
    entityNumber: string,
    action: AuditAction,
    oldValue: any,
    newValue: any
): Promise<void> {
    const companyId = getCurrentCompanyId();
    const userId = getCurrentUserId();
    const userName = getCurrentUserName();

    await supabase
        .from('expense_audit_logs')
        .insert({
            company_id: companyId,
            entity_type: entityType,
            entity_id: entityId,
            entity_number: entityNumber,
            action,
            old_value: oldValue ? JSON.stringify(oldValue) : null,
            new_value: newValue ? JSON.stringify(newValue) : null,
            full_record: action === 'delete' ? JSON.stringify(oldValue) : null,
            user_id: userId,
            user_name: userName,
        });
}

/**
 * Get audit logs
 */
export async function getAuditLogs(
    entityType?: 'expense_category' | 'expense_voucher',
    entityId?: string,
    page = 1,
    perPage = 50
): Promise<PaginatedResponse<ExpenseAuditLog>> {
    const companyId = getCurrentCompanyId();

    let query = supabase
        .from('expense_audit_logs')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

    if (entityType) query = query.eq('entity_type', entityType);
    if (entityId) query = query.eq('entity_id', entityId);

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) throw new Error(error.message);

    return {
        data: (data || []) as ExpenseAuditLog[],
        pagination: {
            total: count || 0,
            page,
            per_page: perPage,
            total_pages: Math.ceil((count || 0) / perPage),
        },
    };
}

// ==========================================
// Cost Centers API
// ==========================================

/**
 * Get cost centers
 */
export async function getCostCenters(): Promise<CostCenter[]> {
    const companyId = getCurrentCompanyId();

    const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('code', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
}

/**
 * Create cost center
 */
export async function createCostCenter(
    input: Omit<CostCenter, 'id' | 'company_id' | 'created_at' | 'updated_at'>
): Promise<CostCenter> {
    const companyId = getCurrentCompanyId();

    const { data, error } = await supabase
        .from('cost_centers')
        .insert({
            ...input,
            company_id: companyId,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

// ==========================================
// Ledger API
// ==========================================

/**
 * Get category ledger (account statement)
 */
export async function getCategoryLedger(
    categoryId: string,
    dateFrom?: string,
    dateTo?: string
): Promise<{
    category: ExpenseCategoryWithStats;
    transactions: {
        date: string;
        voucher_number: string;
        description: string;
        debit: number;
        balance: number;
    }[];
    summary: {
        opening_balance: number;
        total_debit: number;
        closing_balance: number;
    };
}> {
    const category = await getExpenseCategory(categoryId);
    if (!category) throw new Error('Category not found');

    let query = supabase
        .from('expense_vouchers')
        .select('date, voucher_number, description, amount')
        .eq('category_id', categoryId)
        .eq('status', 'confirmed')
        .order('date', { ascending: true });

    if (dateFrom) query = query.gte('date', dateFrom);
    if (dateTo) query = query.lte('date', dateTo);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let balance = 0;
    const transactions = (data || []).map(v => {
        balance += v.amount;
        return {
            date: v.date,
            voucher_number: v.voucher_number,
            description: v.description,
            debit: v.amount,
            balance,
        };
    });

    const totalDebit = transactions.reduce((sum, t) => sum + t.debit, 0);

    return {
        category,
        transactions,
        summary: {
            opening_balance: 0,
            total_debit: totalDebit,
            closing_balance: totalDebit,
        },
    };
}

// ==========================================
// Export API
// ==========================================

/**
 * Export expenses to Excel data
 */
export async function exportExpensesData(
    filters: ExpenseVoucherFilters = {}
): Promise<any[]> {
    const { data } = await getExpenseVouchers(filters, 1, 10000);

    return data.map(v => ({
        'رقم السند': v.voucher_number,
        'التاريخ': v.date,
        'التصنيف': v.category_name,
        'الوصف': v.description,
        'المبلغ': v.amount,
        'طريقة الدفع': v.payment_method === 'cash' ? 'نقدي' :
            v.payment_method === 'bank' ? 'تحويل بنكي' :
                v.payment_method === 'check' ? 'شيك' : 'بطاقة',
        'الخزنة/البنك': v.vault_name || v.bank_name || '',
        'مركز التكلفة': v.cost_center_name || '',
        'الحالة': v.status === 'confirmed' ? 'مؤكد' :
            v.status === 'draft' ? 'مسودة' : 'ملغي',
        'رقم المرجع': v.reference_number || '',
        'ملاحظات': v.notes || '',
    }));
}

/**
 * Export expense tree to Excel data
 */
export async function exportExpenseTreeData(): Promise<any[]> {
    const tree = await getExpenseCategoriesTree();
    const flatList: any[] = [];

    function flatten(nodes: ExpenseTreeNode[], indent = 0) {
        for (const node of nodes) {
            flatList.push({
                'الكود': node.code,
                'الاسم': '  '.repeat(indent) + node.name_ar,
                'المستوى': node.level,
                'الموازنة': node.budget_amount || '',
                'المصروف الفعلي': node.total_spent || 0,
                'عدد السندات': node.voucher_count || 0,
                'آخر سند': node.last_voucher_number || '',
                'نسبة الاستخدام': node.budget_used_percentage ? `${node.budget_used_percentage}%` : '',
            });

            if (node.children.length > 0) {
                flatten(node.children, indent + 1);
            }
        }
    }

    flatten(tree);
    return flatList;
}
