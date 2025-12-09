import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// GET: Get all invitations for a company
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('company_id');

        if (!companyId) {
            return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('user_invitations')
            .select(`
                id, email, status, expires_at, created_at,
                role:roles (name, name_ar)
            `)
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching invitations:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Invitations API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
