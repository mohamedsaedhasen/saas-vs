import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get account ledger entries
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const fromDate = searchParams.get('from_date');
        const toDate = searchParams.get('to_date');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const offset = (page - 1) * limit;

        // Get account info
        const { data: account, error: accountError } = await supabase
            .from('accounts')
            .select('id, code, name, name_ar, account_type, account_nature, balance')
            .eq('id', id)
            .single();

        if (accountError || !account) {
            return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 });
        }

        // Get entries
        let query = supabase
            .from('journal_entry_lines')
            .select(`
                id, debit, credit, description,
                journal_entry:journal_entries(
                    id, entry_number, entry_date, description, status
                )
            `, { count: 'exact' })
            .eq('account_id', id);

        if (fromDate) {
            query = query.gte('journal_entry.entry_date', fromDate);
        }
        if (toDate) {
            query = query.lte('journal_entry.entry_date', toDate);
        }

        const { data: entries, count, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching ledger:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Calculate running balance
        let runningBalance = 0;
        const entriesWithBalance = entries?.map(entry => {
            const netChange = (entry.debit || 0) - (entry.credit || 0);
            runningBalance += netChange;
            return {
                ...entry,
                running_balance: runningBalance,
            };
        }) || [];

        // Calculate totals
        const totalDebit = entries?.reduce((sum, e) => sum + (e.debit || 0), 0) || 0;
        const totalCredit = entries?.reduce((sum, e) => sum + (e.credit || 0), 0) || 0;

        return NextResponse.json({
            account,
            entries: entriesWithBalance,
            summary: {
                total_debit: totalDebit,
                total_credit: totalCredit,
                net_balance: totalDebit - totalCredit,
            },
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Account ledger error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
