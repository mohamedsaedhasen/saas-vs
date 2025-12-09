import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get branches for a company
export async function GET(request: NextRequest) {
    try {
        const { supabase, userId } = await createSupabaseServerClientWithContext();

        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('company_id');

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        // Get branches user has access to
        if (userId) {
            // Check if user is owner/admin (has access to all branches)
            const { data: userCompany } = await supabase
                .from('app_user_companies')
                .select(`
                    is_owner,
                    role:roles(is_super_admin)
                `)
                .eq('user_id', userId)
                .eq('company_id', companyId)
                .single();

            if (userCompany?.is_owner || userCompany?.role?.is_super_admin) {
                // Get all branches - RLS automatically filters by company_id
                const { data: branches, error } = await supabase
                    .from('branches')
                    .select('id, code, name, name_ar, is_headquarters, is_active')
                    .eq('is_active', true)
                    .order('is_headquarters', { ascending: false })
                    .order('name', { ascending: true });

                if (error) {
                    return NextResponse.json({ error: error.message }, { status: 400 });
                }

                return NextResponse.json(branches || []);
            }

            // Get only branches user has access to
            const { data: branchAccess } = await supabase
                .from('user_branch_access')
                .select('branch_id')
                .eq('user_id', userId)
                .eq('company_id', companyId)
                .eq('can_view', true);

            const branchIds = branchAccess?.map(ba => ba.branch_id) || [];

            if (branchIds.length === 0) {
                // Fallback to headquarters - RLS filters by company_id
                const { data: hqBranch } = await supabase
                    .from('branches')
                    .select('id, code, name, name_ar, is_headquarters, is_active')
                    .eq('is_headquarters', true)
                    .single();

                return NextResponse.json(hqBranch ? [hqBranch] : []);
            }

            const { data: branches, error } = await supabase
                .from('branches')
                .select('id, code, name, name_ar, is_headquarters, is_active')
                .in('id', branchIds)
                .eq('is_active', true)
                .order('is_headquarters', { ascending: false })
                .order('name', { ascending: true });

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 400 });
            }

            return NextResponse.json(branches || []);
        }

        // No user - return empty
        return NextResponse.json([]);
    } catch (error) {
        console.error('Get branches error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create a new branch
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();
        const body = await request.json();

        const { code, name, name_ar, address, city, phone, email, is_headquarters } = body;

        if (!companyId || !name) {
            return NextResponse.json(
                { error: 'Company ID and name are required' },
                { status: 400 }
            );
        }

        // RLS automatically sets company_id
        const { data: branch, error } = await supabase
            .from('branches')
            .insert({
                company_id: companyId,
                code,
                name,
                name_ar,
                address,
                city,
                phone,
                email,
                is_headquarters: is_headquarters || false,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(branch);
    } catch (error) {
        console.error('Create branch error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
