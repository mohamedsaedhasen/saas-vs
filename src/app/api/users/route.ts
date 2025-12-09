import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

// GET: Get all users for a company
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('company_id');

        if (!companyId) {
            return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
        }

        // Get users linked to this company
        const { data: userCompanies } = await supabase
            .from('app_user_companies')
            .select('user_id')
            .eq('company_id', companyId);

        if (!userCompanies || userCompanies.length === 0) {
            return NextResponse.json([]);
        }

        const userIds = userCompanies.map(uc => uc.user_id);

        // Get user details with roles
        const { data: users, error } = await supabase
            .from('app_users')
            .select(`
                id, name, email, phone, status, plan,
                last_login_at, created_at,
                role:roles (id, name, name_ar)
            `)
            .in('id', userIds)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(users || []);
    } catch (error) {
        console.error('Users API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove user from company
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');
        const companyId = searchParams.get('company_id');

        if (!userId || !companyId) {
            return NextResponse.json(
                { error: 'user_id and company_id are required' },
                { status: 400 }
            );
        }

        // Remove user from company (not delete user)
        const { error } = await supabase
            .from('app_user_companies')
            .delete()
            .eq('user_id', userId)
            .eq('company_id', companyId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ message: 'User removed from company' });
    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
