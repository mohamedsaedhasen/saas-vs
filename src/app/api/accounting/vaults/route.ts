import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: List vaults
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId, branchId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active') !== 'false';
        const vaultType = searchParams.get('type');

        let query = supabase
            .from('vaults')
            .select(`
                *,
                branch:branches(id, name, name_ar),
                account:accounts(id, code, name, name_ar)
            `)
            .order('is_default', { ascending: false })
            .order('name');

        if (branchId) {
            query = query.eq('branch_id', branchId);
        }

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        if (vaultType) {
            query = query.eq('vault_type', vaultType);
        }

        const { data: vaults, error } = await query;

        if (error) {
            console.error('Error fetching vaults:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Calculate totals
        const totalBalance = vaults?.reduce((sum, v) => sum + (v.balance || 0), 0) || 0;

        return NextResponse.json({
            vaults,
            summary: {
                total_balance: totalBalance,
                count: vaults?.length || 0,
            },
        });
    } catch (error) {
        console.error('Vaults error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create new vault
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId, branchId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            code,
            name,
            name_ar,
            vault_type,
            account_id,
            currency,
            is_default,
        } = body;

        if (!name) {
            return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
        }

        // If setting as default, unset other defaults
        if (is_default) {
            await supabase
                .from('vaults')
                .update({ is_default: false })
                .eq('is_default', true);
        }

        const { data: vault, error } = await supabase
            .from('vaults')
            .insert({
                company_id: companyId,
                branch_id: branchId,
                code,
                name,
                name_ar,
                vault_type: vault_type || 'cash',
                account_id,
                currency: currency || 'EGP',
                is_default: is_default || false,
                balance: 0,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating vault:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(vault, { status: 201 });
    } catch (error) {
        console.error('Create vault error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
