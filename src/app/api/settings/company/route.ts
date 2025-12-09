import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get company settings
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { data: company, error } = await supabase
            .from('companies')
            .select(`
                id, code, slug, name, name_ar, email, phone,
                address, city, country, tax_number, commercial_register,
                logo_url, currency, timezone, fiscal_year_start,
                settings, subscription_plan, subscription_ends_at
            `)
            .eq('id', companyId)
            .single();

        if (error) {
            console.error('Error fetching company:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(company);
    } catch (error) {
        console.error('Company settings error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// PUT: Update company settings
export async function PUT(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();

        // Allowed fields to update
        const allowedFields = [
            'name', 'name_ar', 'email', 'phone', 'address', 'city',
            'country', 'tax_number', 'commercial_register', 'logo_url',
            'currency', 'timezone', 'fiscal_year_start', 'settings'
        ];

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        });

        const { data: company, error } = await supabase
            .from('companies')
            .update(updateData)
            .eq('id', companyId)
            .select()
            .single();

        if (error) {
            console.error('Error updating company:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(company);
    } catch (error) {
        console.error('Update company error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
