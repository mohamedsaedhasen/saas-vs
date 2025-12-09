import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getCompanyId } from '@/lib/company-utils';

// GET: Fetch shipping carriers
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const companyId = getCompanyId(request);

        const { data, error } = await supabase
            .from('shipping_companies')
            .select('*')
            .eq('company_id', companyId)
            .eq('is_active', true)
            .order('name');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create shipping carrier
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const companyId = getCompanyId(request);
        const body = await request.json();

        const { data, error } = await supabase
            .from('shipping_companies')
            .insert({
                company_id: companyId,
                name: body.name,
                name_en: body.name_en,
                code: body.code,
                contact_person: body.contact_person,
                phone: body.phone,
                email: body.email,
                default_shipping_cost: body.default_shipping_cost || 0,
                default_return_cost: body.default_return_cost || 0,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
