import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getCompanyId } from '@/lib/company-utils';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const companyId = getCompanyId(request);

        const { data, error } = await supabase
            .from('products')
            .select('id, sku, name, selling_price, cost_price')
            .eq('company_id', companyId)
            .eq('is_active', true)
            .order('name')
            .limit(100);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
