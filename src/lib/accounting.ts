// نظام القيود المحاسبية التلقائية
// يُنشئ قيود اليومية تلقائياً لكل عملية

import { supabase } from './supabase';
import { generateIdempotencyKey } from './idempotency';

// أنواع المعاملات
type TransactionType =
    | 'sales_invoice'
    | 'purchase_invoice'
    | 'sales_return'
    | 'purchase_return'
    | 'receipt'
    | 'payment'
    | 'stock_adjustment'
    | 'stock_transfer';

// واجهة سطر القيد
interface JournalEntryLine {
    account_id: string;
    description?: string;
    debit: number;
    credit: number;
    cost_center_id?: string;
}

// واجهة القيد
interface JournalEntry {
    company_id: string;
    branch_id?: string;
    entry_date: string;
    description: string;
    reference_type: TransactionType;
    reference_id: string;
    lines: JournalEntryLine[];
}

// الحسابات الافتراضية (سيتم جلبها من الإعدادات)
const DEFAULT_ACCOUNTS = {
    CASH: '1110',           // النقدية
    BANKS: '1120',          // البنوك
    CUSTOMERS: '1130',      // العملاء
    INVENTORY: '1140',      // المخزون
    SUPPLIERS: '2110',      // الموردين
    VAT_PAYABLE: '2130',    // ضريبة القيمة المضافة المستحقة
    SALES_REVENUE: '4100',  // إيرادات المبيعات
    SALES_RETURNS: '4110',  // مردودات المبيعات
    COGS: '5110',           // تكلفة البضاعة المباعة
    PURCHASE_RETURNS: '5120', // مردودات المشتريات
};

// إنشاء رقم القيد التالي
async function getNextEntryNumber(companyId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');

    const prefix = `JE-${year}${month}`;

    const { count } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .like('entry_number', `${prefix}%`);

    const nextNumber = (count || 0) + 1;
    return `${prefix}-${String(nextNumber).padStart(5, '0')}`;
}

// إنشاء قيد يومية
export async function createJournalEntry(entry: JournalEntry): Promise<{
    success: boolean;
    journalEntryId?: string;
    error?: string;
}> {
    try {
        // التحقق من توازن القيد
        const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
        const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return {
                success: false,
                error: `القيد غير متوازن: مدين ${totalDebit} ≠ دائن ${totalCredit}`,
            };
        }

        // إنشاء مفتاح Idempotency
        const idempotencyKey = generateIdempotencyKey(
            'journal_entry',
            entry.reference_type,
            entry.reference_id
        );

        // إنشاء رقم القيد
        const entryNumber = await getNextEntryNumber(entry.company_id);

        // إنشاء القيد
        const { data: journalEntry, error: journalError } = await supabase
            .from('journal_entries')
            .insert({
                company_id: entry.company_id,
                branch_id: entry.branch_id,
                entry_number: entryNumber,
                entry_date: entry.entry_date,
                description: entry.description,
                reference_type: entry.reference_type,
                reference_id: entry.reference_id,
                idempotency_key: idempotencyKey,
                total_debit: totalDebit,
                total_credit: totalCredit,
                status: 'posted',
            })
            .select()
            .single();

        if (journalError) throw journalError;

        // إضافة سطور القيد
        const lines = entry.lines.map(line => ({
            journal_entry_id: journalEntry.id,
            account_id: line.account_id,
            description: line.description,
            debit: line.debit,
            credit: line.credit,
            cost_center_id: line.cost_center_id,
        }));

        const { error: linesError } = await supabase
            .from('journal_entry_lines')
            .insert(lines);

        if (linesError) throw linesError;

        return {
            success: true,
            journalEntryId: journalEntry.id,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// قيد فاتورة مبيعات
export async function createSalesInvoiceEntry(invoice: {
    id: string;
    company_id: string;
    branch_id?: string;
    invoice_date: string;
    customer_account_id: string;
    subtotal: number;
    vat_amount: number;
    total: number;
    vat_enabled: boolean;
}): Promise<{ success: boolean; journalEntryId?: string; error?: string }> {
    const lines: JournalEntryLine[] = [
        // العملاء (مدين)
        {
            account_id: invoice.customer_account_id,
            description: 'مبيعات للعميل',
            debit: invoice.total,
            credit: 0,
        },
        // إيرادات المبيعات (دائن)
        {
            account_id: DEFAULT_ACCOUNTS.SALES_REVENUE,
            description: 'إيرادات مبيعات',
            debit: 0,
            credit: invoice.subtotal,
        },
    ];

    // إضافة ضريبة القيمة المضافة إذا مفعلة
    if (invoice.vat_enabled && invoice.vat_amount > 0) {
        lines.push({
            account_id: DEFAULT_ACCOUNTS.VAT_PAYABLE,
            description: 'ضريبة القيمة المضافة',
            debit: 0,
            credit: invoice.vat_amount,
        });
    }

    return createJournalEntry({
        company_id: invoice.company_id,
        branch_id: invoice.branch_id,
        entry_date: invoice.invoice_date,
        description: 'قيد فاتورة مبيعات',
        reference_type: 'sales_invoice',
        reference_id: invoice.id,
        lines,
    });
}

// قيد سند قبض
export async function createReceiptEntry(receipt: {
    id: string;
    company_id: string;
    branch_id?: string;
    payment_date: string;
    customer_account_id: string;
    vault_id?: string;
    bank_id?: string;
    vault_account_id?: string;
    bank_account_id?: string;
    amount: number;
}): Promise<{ success: boolean; journalEntryId?: string; error?: string }> {
    const cashAccountId = receipt.vault_account_id || receipt.bank_account_id;

    if (!cashAccountId) {
        return {
            success: false,
            error: 'يجب تحديد الخزنة أو البنك',
        };
    }

    const lines: JournalEntryLine[] = [
        // النقدية/البنك (مدين)
        {
            account_id: cashAccountId,
            description: 'تحصيل من العميل',
            debit: receipt.amount,
            credit: 0,
        },
        // العملاء (دائن)
        {
            account_id: receipt.customer_account_id,
            description: 'سداد من العميل',
            debit: 0,
            credit: receipt.amount,
        },
    ];

    return createJournalEntry({
        company_id: receipt.company_id,
        branch_id: receipt.branch_id,
        entry_date: receipt.payment_date,
        description: 'قيد سند قبض',
        reference_type: 'receipt',
        reference_id: receipt.id,
        lines,
    });
}

// قيد فاتورة مشتريات
export async function createPurchaseInvoiceEntry(invoice: {
    id: string;
    company_id: string;
    branch_id?: string;
    invoice_date: string;
    supplier_account_id: string;
    subtotal: number;
    vat_amount: number;
    total: number;
    vat_enabled: boolean;
}): Promise<{ success: boolean; journalEntryId?: string; error?: string }> {
    const lines: JournalEntryLine[] = [
        // المخزون (مدين)
        {
            account_id: DEFAULT_ACCOUNTS.INVENTORY,
            description: 'مشتريات بضاعة',
            debit: invoice.subtotal,
            credit: 0,
        },
        // الموردين (دائن)
        {
            account_id: invoice.supplier_account_id,
            description: 'مشتريات من المورد',
            debit: 0,
            credit: invoice.total,
        },
    ];

    // إضافة ضريبة القيمة المضافة إذا مفعلة
    if (invoice.vat_enabled && invoice.vat_amount > 0) {
        lines.push({
            account_id: DEFAULT_ACCOUNTS.VAT_PAYABLE,
            description: 'ضريبة القيمة المضافة على المشتريات',
            debit: invoice.vat_amount,
            credit: 0,
        });
    }

    return createJournalEntry({
        company_id: invoice.company_id,
        branch_id: invoice.branch_id,
        entry_date: invoice.invoice_date,
        description: 'قيد فاتورة مشتريات',
        reference_type: 'purchase_invoice',
        reference_id: invoice.id,
        lines,
    });
}

// قيد سند صرف
export async function createPaymentEntry(payment: {
    id: string;
    company_id: string;
    branch_id?: string;
    payment_date: string;
    supplier_account_id: string;
    vault_id?: string;
    bank_id?: string;
    vault_account_id?: string;
    bank_account_id?: string;
    amount: number;
}): Promise<{ success: boolean; journalEntryId?: string; error?: string }> {
    const cashAccountId = payment.vault_account_id || payment.bank_account_id;

    if (!cashAccountId) {
        return {
            success: false,
            error: 'يجب تحديد الخزنة أو البنك',
        };
    }

    const lines: JournalEntryLine[] = [
        // الموردين (مدين)
        {
            account_id: payment.supplier_account_id,
            description: 'سداد للمورد',
            debit: payment.amount,
            credit: 0,
        },
        // النقدية/البنك (دائن)
        {
            account_id: cashAccountId,
            description: 'صرف للمورد',
            debit: 0,
            credit: payment.amount,
        },
    ];

    return createJournalEntry({
        company_id: payment.company_id,
        branch_id: payment.branch_id,
        entry_date: payment.payment_date,
        description: 'قيد سند صرف',
        reference_type: 'payment',
        reference_id: payment.id,
        lines,
    });
}

export { DEFAULT_ACCOUNTS };
