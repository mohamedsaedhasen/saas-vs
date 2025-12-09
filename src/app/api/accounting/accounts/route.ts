import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: List chart of accounts
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const accountType = searchParams.get('type');
        const includeHeaders = searchParams.get('include_headers') !== 'false';
        const parentId = searchParams.get('parent_id');

        let query = supabase
            .from('accounts')
            .select('*')
            .eq('is_active', true)
            .order('code');

        if (accountType) {
            query = query.eq('account_type', accountType);
        }

        if (!includeHeaders) {
            query = query.eq('is_header', false);
        }

        if (parentId) {
            query = query.eq('parent_id', parentId);
        }

        const { data: accounts, error } = await query;

        if (error) {
            console.error('Error fetching accounts:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Build tree structure
        interface AccountWithChildren {
            id: string;
            parent_id: string | null;
            code: string;
            name: string;
            name_ar: string;
            account_type: string;
            is_header: boolean;
            balance: number;
            children?: AccountWithChildren[];
        }

        const buildTree = (items: AccountWithChildren[], parentId: string | null = null): AccountWithChildren[] => {
            return items
                .filter(item => item.parent_id === parentId)
                .map(item => ({
                    ...item,
                    children: buildTree(items, item.id),
                }));
        };

        const tree = buildTree(accounts || []);

        return NextResponse.json({
            accounts,
            tree,
            summary: {
                total: accounts?.length || 0,
                by_type: {
                    asset: accounts?.filter(a => a.account_type === 'asset').length || 0,
                    liability: accounts?.filter(a => a.account_type === 'liability').length || 0,
                    equity: accounts?.filter(a => a.account_type === 'equity').length || 0,
                    revenue: accounts?.filter(a => a.account_type === 'revenue').length || 0,
                    expense: accounts?.filter(a => a.account_type === 'expense').length || 0,
                },
            },
        });
    } catch (error) {
        console.error('Chart of accounts error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create new account
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId, userId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            code,
            name,
            name_ar,
            account_type,
            account_nature,
            parent_id,
            is_header,
            description,
            is_bank_account,
            bank_name,
            bank_account_number,
        } = body;

        if (!code || !name || !account_type) {
            return NextResponse.json({ error: 'الكود والاسم ونوع الحساب مطلوبة' }, { status: 400 });
        }

        // Check for duplicate code
        const { data: existing } = await supabase
            .from('accounts')
            .select('id')
            .eq('code', code)
            .limit(1);

        if (existing && existing.length > 0) {
            return NextResponse.json({ error: 'كود الحساب موجود بالفعل' }, { status: 400 });
        }

        const { data: account, error } = await supabase
            .from('accounts')
            .insert({
                company_id: companyId,
                code,
                name,
                name_ar,
                account_type,
                account_nature: account_nature || 'debit',
                parent_id,
                is_header: is_header || false,
                is_system: false,
                description,
                is_bank_account: is_bank_account || false,
                bank_name,
                bank_account_number,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating account:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(account, { status: 201 });
    } catch (error) {
        console.error('Create account error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
