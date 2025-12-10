import { SupabaseClient } from '@supabase/supabase-js';

/**
 * إنشاء البيانات الافتراضية للشركة الجديدة
 * يتم استدعاء هذه الدالة تلقائياً عند إنشاء شركة جديدة
 */
export async function initializeCompanyDefaults(
    supabase: SupabaseClient,
    companyId: string,
    branchId?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        console.log(`[Company Initializer] Starting initialization for company: ${companyId}`);

        // 1. إنشاء شجرة الحسابات الأساسية
        await createDefaultAccounts(supabase, companyId);
        console.log('[Company Initializer] ✓ Default accounts created');

        // 2. إنشاء الخزينة الرئيسية
        const mainVaultId = await createDefaultVault(supabase, companyId, branchId);
        console.log('[Company Initializer] ✓ Main vault created');

        // 3. إنشاء البنك الرئيسي
        await createDefaultBank(supabase, companyId, branchId);
        console.log('[Company Initializer] ✓ Main bank created');

        // 4. إنشاء عميل الكاش
        await createCashCustomer(supabase, companyId);
        console.log('[Company Initializer] ✓ Cash customer created');

        // 5. إنشاء مورد الكاش
        await createCashSupplier(supabase, companyId);
        console.log('[Company Initializer] ✓ Cash supplier created');

        console.log(`[Company Initializer] ✓ All defaults created for company: ${companyId}`);
        return { success: true };
    } catch (error) {
        console.error('[Company Initializer] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * إنشاء شجرة الحسابات الأساسية
 */
async function createDefaultAccounts(
    supabase: SupabaseClient,
    companyId: string
): Promise<void> {
    // الحسابات الرئيسية
    const mainAccounts = [
        { code: '1', name: 'Assets', name_ar: 'الأصول', account_type: 'asset', account_nature: 'debit', is_header: true },
        { code: '2', name: 'Liabilities', name_ar: 'الخصوم', account_type: 'liability', account_nature: 'credit', is_header: true },
        { code: '3', name: 'Equity', name_ar: 'حقوق الملكية', account_type: 'equity', account_nature: 'credit', is_header: true },
        { code: '4', name: 'Revenue', name_ar: 'الإيرادات', account_type: 'revenue', account_nature: 'credit', is_header: true },
        { code: '5', name: 'Expenses', name_ar: 'المصروفات', account_type: 'expense', account_nature: 'debit', is_header: true },
    ];

    // إدخال الحسابات الرئيسية
    for (const account of mainAccounts) {
        await supabase.from('accounts').upsert({
            company_id: companyId,
            code: account.code,
            name: account.name,
            name_ar: account.name_ar,
            account_type: account.account_type,
            account_nature: account.account_nature,
            is_header: account.is_header,
            is_system: true,
            is_active: true,
        }, { onConflict: 'company_id,code' });
    }

    // الانتظار قليلاً ثم إضافة الحسابات الفرعية
    const subAccounts = [
        // الأصول المتداولة
        { code: '11', name: 'Current Assets', name_ar: 'الأصول المتداولة', account_type: 'asset', account_nature: 'debit', is_header: true, parent_code: '1' },
        { code: '1101', name: 'Cash on Hand', name_ar: 'النقدية بالصندوق', account_type: 'asset', account_nature: 'debit', parent_code: '11' },
        { code: '1102', name: 'Cash at Bank', name_ar: 'النقدية بالبنك', account_type: 'asset', account_nature: 'debit', is_bank_account: true, parent_code: '11' },
        { code: '12', name: 'Receivables', name_ar: 'الذمم المدينة', account_type: 'asset', account_nature: 'debit', is_header: true, parent_code: '1' },
        { code: '1201', name: 'Accounts Receivable', name_ar: 'ذمم العملاء', account_type: 'asset', account_nature: 'debit', parent_code: '12' },
        { code: '13', name: 'Inventory', name_ar: 'المخزون', account_type: 'asset', account_nature: 'debit', is_header: true, parent_code: '1' },
        { code: '1301', name: 'Merchandise Inventory', name_ar: 'مخزون البضاعة', account_type: 'asset', account_nature: 'debit', parent_code: '13' },

        // الخصوم المتداولة
        { code: '21', name: 'Current Liabilities', name_ar: 'الخصوم المتداولة', account_type: 'liability', account_nature: 'credit', is_header: true, parent_code: '2' },
        { code: '2101', name: 'Accounts Payable', name_ar: 'ذمم الموردين', account_type: 'liability', account_nature: 'credit', parent_code: '21' },
        { code: '2301', name: 'VAT Payable', name_ar: 'ضريبة القيمة المضافة', account_type: 'liability', account_nature: 'credit', parent_code: '21' },

        // حقوق الملكية
        { code: '3101', name: 'Paid-in Capital', name_ar: 'رأس المال المدفوع', account_type: 'equity', account_nature: 'credit', parent_code: '3' },
        { code: '3202', name: 'Retained Earnings', name_ar: 'الأرباح المحتجزة', account_type: 'equity', account_nature: 'credit', parent_code: '3' },

        // الإيرادات
        { code: '4101', name: 'Sales Revenue', name_ar: 'إيرادات المبيعات', account_type: 'revenue', account_nature: 'credit', parent_code: '4' },
        { code: '4102', name: 'Sales Returns', name_ar: 'مردودات المبيعات', account_type: 'revenue', account_nature: 'debit', parent_code: '4' },

        // المصروفات
        { code: '5101', name: 'Cost of Goods Sold', name_ar: 'تكلفة البضاعة المباعة', account_type: 'expense', account_nature: 'debit', parent_code: '5' },
        { code: '5201', name: 'Salaries & Wages', name_ar: 'الرواتب والأجور', account_type: 'expense', account_nature: 'debit', parent_code: '5' },
        { code: '5202', name: 'Rent Expense', name_ar: 'مصروف الإيجار', account_type: 'expense', account_nature: 'debit', parent_code: '5' },
        { code: '5209', name: 'Bank Charges', name_ar: 'مصاريف بنكية', account_type: 'expense', account_nature: 'debit', parent_code: '5' },
    ];

    for (const account of subAccounts) {
        // الحصول على parent_id
        let parentId = null;
        if (account.parent_code) {
            const { data: parentData } = await supabase
                .from('accounts')
                .select('id')
                .eq('company_id', companyId)
                .eq('code', account.parent_code)
                .single();
            parentId = parentData?.id || null;
        }

        await supabase.from('accounts').upsert({
            company_id: companyId,
            parent_id: parentId,
            code: account.code,
            name: account.name,
            name_ar: account.name_ar,
            account_type: account.account_type,
            account_nature: account.account_nature,
            is_header: account.is_header || false,
            is_bank_account: account.is_bank_account || false,
            is_system: true,
            is_active: true,
        }, { onConflict: 'company_id,code' });
    }
}

/**
 * إنشاء الخزينة الرئيسية
 */
async function createDefaultVault(
    supabase: SupabaseClient,
    companyId: string,
    branchId?: string
): Promise<string | null> {
    // الحصول على حساب النقدية
    const { data: cashAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('company_id', companyId)
        .eq('code', '1101')
        .single();

    const { data, error } = await supabase.from('vaults').upsert({
        company_id: companyId,
        branch_id: branchId || null,
        account_id: cashAccount?.id || null,
        code: 'CASH-001',
        name: 'Main Cash',
        name_ar: 'الخزينة الرئيسية',
        vault_type: 'cash',
        balance: 0,
        currency: 'EGP',
        is_default: true,
        is_active: true,
    }, { onConflict: 'company_id,code' }).select('id').single();

    if (error) {
        console.error('Error creating default vault:', error);
    }
    return data?.id || null;
}

/**
 * إنشاء البنك الرئيسي
 */
async function createDefaultBank(
    supabase: SupabaseClient,
    companyId: string,
    branchId?: string
): Promise<string | null> {
    // الحصول على حساب البنك
    const { data: bankAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('company_id', companyId)
        .eq('code', '1102')
        .single();

    const { data, error } = await supabase.from('vaults').upsert({
        company_id: companyId,
        branch_id: branchId || null,
        account_id: bankAccount?.id || null,
        code: 'BANK-001',
        name: 'Main Bank',
        name_ar: 'البنك الرئيسي',
        vault_type: 'bank',
        balance: 0,
        currency: 'EGP',
        is_default: false,
        is_active: true,
    }, { onConflict: 'company_id,code' }).select('id').single();

    if (error) {
        console.error('Error creating default bank:', error);
    }
    return data?.id || null;
}

/**
 * إنشاء عميل الكاش
 */
async function createCashCustomer(
    supabase: SupabaseClient,
    companyId: string
): Promise<string | null> {
    const { data, error } = await supabase.from('customers').upsert({
        company_id: companyId,
        code: 'CASH-CUSTOMER',
        name: 'Cash Customer',
        name_ar: 'عميل نقدي',
        phone: null,
        email: null,
        is_active: true,
        credit_limit: 0,
        current_balance: 0,
    }, { onConflict: 'company_id,code' }).select('id').single();

    if (error) {
        console.error('Error creating cash customer:', error);
    }
    return data?.id || null;
}

/**
 * إنشاء مورد الكاش
 */
async function createCashSupplier(
    supabase: SupabaseClient,
    companyId: string
): Promise<string | null> {
    const { data, error } = await supabase.from('suppliers').upsert({
        company_id: companyId,
        code: 'CASH-SUPPLIER',
        name: 'Cash Supplier',
        name_ar: 'مورد نقدي',
        phone: null,
        email: null,
        is_active: true,
        credit_limit: 0,
        current_balance: 0,
    }, { onConflict: 'company_id,code' }).select('id').single();

    if (error) {
        console.error('Error creating cash supplier:', error);
    }
    return data?.id || null;
}
