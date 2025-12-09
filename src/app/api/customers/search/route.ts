import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        // Get Supabase client with RLS context automatically set
        const { supabase, companyId } = await createSupabaseServerClientWithContext();
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';

        if (!companyId) {
            return NextResponse.json([]);
        }

        if (query.length < 2) {
            return NextResponse.json([]);
        }

        // RLS automatically filters by company_id
        const { data, error } = await supabase
            .from('customers')
            .select('id, code, name, name_ar, phone, email, city, balance')
            .eq('is_active', true)
            .or(`name.ilike.%${query}%,name_ar.ilike.%${query}%,phone.ilike.%${query}%,code.ilike.%${query}%`)
            .order('name')
            .limit(10);

        if (error) {
            console.error('Customer search error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Transform to match expected interface
        const result = (data || []).map(c => ({
            id: c.id,
            name: c.name_ar || c.name,
            phone: c.phone || '',
            email: c.email,
            city: c.city,
            balance: c.balance,
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
