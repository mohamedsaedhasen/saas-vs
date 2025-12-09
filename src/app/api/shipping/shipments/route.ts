import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getCompanyId } from '@/lib/company-utils';

// GET: Fetch shipments
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const companyId = getCompanyId(request);

        const { data, error } = await supabase
            .from('shipments')
            .select(`
                *,
                shipping_company:shipping_company_id(id, name),
                invoice:invoice_id(id, invoice_number)
            `)
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create shipment
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const companyId = getCompanyId(request);
        const body = await request.json();

        const { data, error } = await supabase
            .from('shipments')
            .insert({
                company_id: companyId,
                shipping_company_id: body.shipping_company_id,
                invoice_id: body.invoice_id,
                tracking_number: body.tracking_number,
                shipment_date: body.shipment_date || new Date().toISOString().split('T')[0],
                recipient_name: body.recipient_name,
                recipient_phone: body.recipient_phone,
                recipient_address: body.recipient_address,
                recipient_city: body.recipient_city,
                shipping_cost: body.shipping_cost || 0,
                cod_amount: body.cod_amount || 0,
                status: 'pending',
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
