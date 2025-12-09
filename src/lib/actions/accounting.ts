'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getServerCompanyId } from '@/lib/server-company';

// ============================================
// Journal Entry Types
// ============================================

interface JournalLine {
    account_id: string;
    debit: number;
    credit: number;
    description?: string;
}

interface JournalEntryData {
    entry_date: string;
    reference_type: string;
    reference_id: string;
    description: string;
    lines: JournalLine[];
}

// ============================================
// Create Journal Entry
// ============================================

export async function createJournalEntry(data: JournalEntryData) {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    // Generate entry number
    const entryNumber = `JE-${Date.now().toString().slice(-8)}`;

    // Create journal entry
    const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
            company_id: COMPANY_ID,
            entry_number: entryNumber,
            entry_date: data.entry_date,
            reference_type: data.reference_type,
            reference_id: data.reference_id,
            description: data.description,
            status: 'posted',
            total_debit: data.lines.reduce((sum, l) => sum + l.debit, 0),
            total_credit: data.lines.reduce((sum, l) => sum + l.credit, 0),
        })
        .select()
        .single();

    if (entryError) {
        console.error('Error creating journal entry:', entryError);
        return null;
    }

    // Create journal lines
    const lines = data.lines.map((line, index) => ({
        entry_id: entry.id,
        account_id: line.account_id,
        debit: line.debit,
        credit: line.credit,
        description: line.description || data.description,
        line_number: index + 1,
    }));

    const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines);

    if (linesError) {
        console.error('Error creating journal lines:', linesError);
    }

    return entry;
}

// ============================================
// Get Account by Code
// ============================================

export async function getAccountByCode(code: string) {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data } = await supabase
        .from('chart_of_accounts')
        .select('id, code, name')
        .eq('company_id', COMPANY_ID)
        .eq('code', code)
        .single();

    return data;
}

// ============================================
// Auto Journal: Sales Invoice
// ============================================

export async function createSalesInvoiceJournal(invoice: {
    id: string;
    invoice_number: string;
    customer_id: string;
    total: number;
    tax_amount?: number;
}) {
    // Accounts
    const receivablesAccount = await getAccountByCode('1200'); // Accounts Receivable
    const revenueAccount = await getAccountByCode('4100'); // Sales Revenue
    const taxAccount = await getAccountByCode('2200'); // VAT Payable

    if (!receivablesAccount || !revenueAccount) {
        console.error('Required accounts not found');
        return null;
    }

    const lines: JournalLine[] = [
        {
            account_id: receivablesAccount.id,
            debit: invoice.total,
            credit: 0,
            description: `ذمم العميل - فاتورة ${invoice.invoice_number}`,
        },
        {
            account_id: revenueAccount.id,
            debit: 0,
            credit: invoice.total - (invoice.tax_amount || 0),
            description: `إيرادات المبيعات - فاتورة ${invoice.invoice_number}`,
        },
    ];

    if (invoice.tax_amount && taxAccount) {
        lines.push({
            account_id: taxAccount.id,
            debit: 0,
            credit: invoice.tax_amount,
            description: `ضريبة القيمة المضافة - فاتورة ${invoice.invoice_number}`,
        });
    }

    return createJournalEntry({
        entry_date: new Date().toISOString(),
        reference_type: 'sales_invoice',
        reference_id: invoice.id,
        description: `فاتورة مبيعات ${invoice.invoice_number}`,
        lines,
    });
}

// ============================================
// Auto Journal: Payment Receipt
// ============================================

export async function createPaymentReceiptJournal(payment: {
    id: string;
    payment_number: string;
    customer_id: string;
    amount: number;
    vault_id: string;
}) {
    const receivablesAccount = await getAccountByCode('1200');

    // Get vault account
    const supabase = await createSupabaseServerClient();
    const { data: vault } = await supabase
        .from('vaults')
        .select('account_id')
        .eq('id', payment.vault_id)
        .single();

    if (!receivablesAccount || !vault?.account_id) {
        console.error('Required accounts not found');
        return null;
    }

    return createJournalEntry({
        entry_date: new Date().toISOString(),
        reference_type: 'payment_receipt',
        reference_id: payment.id,
        description: `سند قبض ${payment.payment_number}`,
        lines: [
            {
                account_id: vault.account_id,
                debit: payment.amount,
                credit: 0,
                description: `تحصيل من العميل`,
            },
            {
                account_id: receivablesAccount.id,
                debit: 0,
                credit: payment.amount,
                description: `تسوية ذمم العميل`,
            },
        ],
    });
}

// ============================================
// Auto Journal: Shipping Fee
// ============================================

export async function createShippingFeeJournal(shipment: {
    id: string;
    tracking_number: string;
    carrier_id: string;
    shipping_fee: number;
}) {
    const shippingExpenseAccount = await getAccountByCode('5210'); // Shipping Expense
    const carriersLiabilityAccount = await getAccountByCode('2120'); // Shipping Carriers

    if (!shippingExpenseAccount || !carriersLiabilityAccount) {
        console.error('Required accounts not found');
        return null;
    }

    return createJournalEntry({
        entry_date: new Date().toISOString(),
        reference_type: 'shipment',
        reference_id: shipment.id,
        description: `مصروفات شحن - ${shipment.tracking_number}`,
        lines: [
            {
                account_id: shippingExpenseAccount.id,
                debit: shipment.shipping_fee,
                credit: 0,
                description: `مصروفات شحن`,
            },
            {
                account_id: carriersLiabilityAccount.id,
                debit: 0,
                credit: shipment.shipping_fee,
                description: `مستحق لشركة الشحن`,
            },
        ],
    });
}

// ============================================
// Auto Journal: COD Settlement
// ============================================

export async function createCODSettlementJournal(settlement: {
    id: string;
    settlement_number: string;
    carrier_id: string;
    total_cod_amount: number;
    carrier_fees: number;
    net_amount: number;
    vault_id: string;
}) {
    const carriersLiabilityAccount = await getAccountByCode('2120');
    const shippingExpenseAccount = await getAccountByCode('5210');

    // Get vault account
    const supabase = await createSupabaseServerClient();
    const { data: vault } = await supabase
        .from('vaults')
        .select('account_id')
        .eq('id', settlement.vault_id)
        .single();

    if (!carriersLiabilityAccount || !vault?.account_id) {
        console.error('Required accounts not found');
        return null;
    }

    const lines: JournalLine[] = [
        {
            account_id: vault.account_id,
            debit: settlement.net_amount,
            credit: 0,
            description: `استلام تسوية COD`,
        },
        {
            account_id: carriersLiabilityAccount.id,
            debit: settlement.total_cod_amount,
            credit: 0,
            description: `تسوية مستحقات شركة الشحن`,
        },
    ];

    if (settlement.carrier_fees > 0 && shippingExpenseAccount) {
        lines.push({
            account_id: shippingExpenseAccount.id,
            debit: settlement.carrier_fees,
            credit: 0,
            description: `رسوم شركة الشحن`,
        });
    }

    // Balance the entry
    const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
    lines[1].credit = totalDebit - settlement.net_amount;

    return createJournalEntry({
        entry_date: new Date().toISOString(),
        reference_type: 'cod_settlement',
        reference_id: settlement.id,
        description: `تسوية COD - ${settlement.settlement_number}`,
        lines,
    });
}

// ============================================
// Get Customer Statement
// ============================================

export async function getCustomerStatement(customerId: string, startDate?: string, endDate?: string) {
    const supabase = await createSupabaseServerClient();

    // Get opening balance (sum before start date)
    let openingBalance = 0;
    if (startDate) {
        const { data: opening } = await supabase
            .from('customer_transactions')
            .select('debit, credit')
            .eq('customer_id', customerId)
            .lt('transaction_date', startDate);

        openingBalance = (opening || []).reduce((sum, t) => sum + (t.debit || 0) - (t.credit || 0), 0);
    }

    // Get transactions
    let query = supabase
        .from('customer_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('transaction_date', { ascending: true });

    if (startDate) {
        query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
        query = query.lte('transaction_date', endDate);
    }

    const { data: transactions } = await query;

    // Calculate running balance
    let balance = openingBalance;
    const statement = (transactions || []).map((t) => {
        balance += (t.debit || 0) - (t.credit || 0);
        return { ...t, balance };
    });

    return {
        openingBalance,
        transactions: statement,
        closingBalance: balance,
    };
}

// ============================================
// Get Supplier Statement
// ============================================

export async function getSupplierStatement(supplierId: string, startDate?: string, endDate?: string) {
    const supabase = await createSupabaseServerClient();

    let openingBalance = 0;
    if (startDate) {
        const { data: opening } = await supabase
            .from('supplier_transactions')
            .select('debit, credit')
            .eq('supplier_id', supplierId)
            .lt('transaction_date', startDate);

        openingBalance = (opening || []).reduce((sum, t) => sum + (t.credit || 0) - (t.debit || 0), 0);
    }

    let query = supabase
        .from('supplier_transactions')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('transaction_date', { ascending: true });

    if (startDate) {
        query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
        query = query.lte('transaction_date', endDate);
    }

    const { data: transactions } = await query;

    let balance = openingBalance;
    const statement = (transactions || []).map((t) => {
        balance += (t.credit || 0) - (t.debit || 0);
        return { ...t, balance };
    });

    return {
        openingBalance,
        transactions: statement,
        closingBalance: balance,
    };
}
