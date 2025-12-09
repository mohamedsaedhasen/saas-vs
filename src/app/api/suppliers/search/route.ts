import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
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
            .from('suppliers')
            .select('id, code, name, name_ar, phone, email, city, balance')
            .eq('is_active', true)
            .or(`name.ilike.%${query}%,name_ar.ilike.%${query}%,phone.ilike.%${query}%,code.ilike.%${query}%`)
            .order('name')
            .limit(10);

        if (error) {
            console.error('Supplier search error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Transform to match expected interface
        const result = (data || []).map(s => ({
            id: s.id,
            name: s.name_ar || s.name,
            phone: s.phone || '',
            email: s.email,
            city: s.city,
            balance: s.balance,
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
