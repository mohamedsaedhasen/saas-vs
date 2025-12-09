import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get trial balance report
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const asOfDate = searchParams.get('as_of_date') || new Date().toISOString().split('T')[0];
        const includeZeroBalances = searchParams.get('include_zero') === 'true';

        // Get all accounts with their balances
        const { data: accounts, error } = await supabase
            .from('accounts')
            .select('id, code, name, name_ar, account_type, account_nature, is_header, balance, parent_id')
            .eq('is_active', true)
            .order('code');

        if (error) {
            console.error('Error fetching accounts:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Build tree and calculate totals
        const trialBalance: {
            code: string;
            name: string;
            name_ar: string;
            account_type: string;
            is_header: boolean;
            debit: number;
            credit: number;
        }[] = [];

        let totalDebit = 0;
        let totalCredit = 0;

        accounts?.forEach(account => {
            if (account.is_header && !includeZeroBalances) return;

            const balance = account.balance || 0;

            // Skip zero balances if not requested
            if (balance === 0 && !includeZeroBalances) return;

            let debit = 0;
            let credit = 0;

            // Determine debit/credit based on account nature and balance
            if (account.account_nature === 'debit') {
                if (balance >= 0) {
                    debit = balance;
                } else {
                    credit = Math.abs(balance);
                }
            } else {
                if (balance >= 0) {
                    credit = balance;
                } else {
                    debit = Math.abs(balance);
                }
            }

            totalDebit += debit;
            totalCredit += credit;

            trialBalance.push({
                code: account.code,
                name: account.name,
                name_ar: account.name_ar || account.name,
                account_type: account.account_type,
                is_header: account.is_header || false,
                debit,
                credit,
            });
        });

        return NextResponse.json({
            report: 'trial_balance',
            as_of_date: asOfDate,
            accounts: trialBalance,
            totals: {
                debit: totalDebit,
                credit: totalCredit,
                is_balanced: Math.abs(totalDebit - totalCredit) < 0.01,
                difference: totalDebit - totalCredit,
            },
        });
    } catch (error) {
        console.error('Trial balance error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
