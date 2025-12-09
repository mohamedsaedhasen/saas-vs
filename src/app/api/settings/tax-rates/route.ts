import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: List tax rates
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const taxType = searchParams.get('type');
        const activeOnly = searchParams.get('active') !== 'false';

        let query = supabase
            .from('tax_rates')
            .select('*')
            .order('rate');

        if (taxType) {
            query = query.eq('tax_type', taxType);
        }

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data: taxRates, error } = await query;

        if (error) {
            console.error('Error fetching tax rates:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ tax_rates: taxRates });
    } catch (error) {
        console.error('Tax rates error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create new tax rate
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            code,
            name,
            name_ar,
            rate,
            tax_type,
            is_inclusive,
            is_default,
        } = body;

        if (!name || rate === undefined) {
            return NextResponse.json({ error: 'الاسم والنسبة مطلوبان' }, { status: 400 });
        }

        // If setting as default, unset other defaults
        if (is_default) {
            await supabase
                .from('tax_rates')
                .update({ is_default: false })
                .eq('is_default', true);
        }

        const { data: taxRate, error } = await supabase
            .from('tax_rates')
            .insert({
                company_id: companyId,
                code,
                name,
                name_ar,
                rate,
                tax_type: tax_type || 'vat',
                is_inclusive: is_inclusive || false,
                is_default: is_default || false,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating tax rate:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(taxRate, { status: 201 });
    } catch (error) {
        console.error('Create tax rate error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
