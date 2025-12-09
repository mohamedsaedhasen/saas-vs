import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get balance sheet report
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const asOfDate = searchParams.get('as_of_date') || new Date().toISOString().split('T')[0];

        // Get all balance sheet accounts
        const { data: accounts, error } = await supabase
            .from('accounts')
            .select('id, code, name, name_ar, account_type, balance, is_header')
            .in('account_type', ['asset', 'liability', 'equity'])
            .eq('is_active', true)
            .eq('is_header', false)
            .order('code');

        if (error) {
            console.error('Error fetching accounts:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Categorize accounts
        const assets = accounts?.filter(a => a.account_type === 'asset') || [];
        const liabilities = accounts?.filter(a => a.account_type === 'liability') || [];
        const equity = accounts?.filter(a => a.account_type === 'equity') || [];

        // Calculate current assets (11xx, 12xx, 13xx, 14xx)
        const currentAssets = assets.filter(a => {
            const code = parseInt(a.code);
            return code >= 1100 && code < 1500;
        });

        // Fixed assets (15xx)
        const fixedAssets = assets.filter(a => {
            const code = parseInt(a.code);
            return code >= 1500 && code < 1600;
        });

        // Current liabilities (21xx)
        const currentLiabilities = liabilities.filter(a => {
            const code = parseInt(a.code);
            return code >= 2100 && code < 2400;
        });

        // Long-term liabilities (24xx+)
        const longTermLiabilities = liabilities.filter(a => {
            const code = parseInt(a.code);
            return code >= 2400;
        });

        const formatAccounts = (accs: typeof accounts) => accs?.map(a => ({
            code: a.code,
            name: a.name,
            name_ar: a.name_ar,
            balance: Math.abs(a.balance || 0),
        })).filter(a => a.balance > 0) || [];

        const sumBalance = (accs: typeof accounts) =>
            accs?.reduce((sum, a) => sum + Math.abs(a.balance || 0), 0) || 0;

        const totalCurrentAssets = sumBalance(currentAssets);
        const totalFixedAssets = sumBalance(fixedAssets);
        const totalAssets = sumBalance(assets);

        const totalCurrentLiabilities = sumBalance(currentLiabilities);
        const totalLongTermLiabilities = sumBalance(longTermLiabilities);
        const totalLiabilities = sumBalance(liabilities);

        const totalEquity = sumBalance(equity);
        const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

        return NextResponse.json({
            report: 'balance_sheet',
            as_of_date: asOfDate,
            assets: {
                current_assets: {
                    items: formatAccounts(currentAssets),
                    total: totalCurrentAssets,
                },
                fixed_assets: {
                    items: formatAccounts(fixedAssets),
                    total: totalFixedAssets,
                },
                total: totalAssets,
            },
            liabilities: {
                current_liabilities: {
                    items: formatAccounts(currentLiabilities),
                    total: totalCurrentLiabilities,
                },
                long_term_liabilities: {
                    items: formatAccounts(longTermLiabilities),
                    total: totalLongTermLiabilities,
                },
                total: totalLiabilities,
            },
            equity: {
                items: formatAccounts(equity),
                total: totalEquity,
            },
            total_liabilities_and_equity: totalLiabilitiesAndEquity,
            is_balanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
            working_capital: totalCurrentAssets - totalCurrentLiabilities,
            current_ratio: totalCurrentLiabilities > 0 ? (totalCurrentAssets / totalCurrentLiabilities).toFixed(2) : 'N/A',
            debt_to_equity: totalEquity > 0 ? (totalLiabilities / totalEquity).toFixed(2) : 'N/A',
        });
    } catch (error) {
        console.error('Balance sheet error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
