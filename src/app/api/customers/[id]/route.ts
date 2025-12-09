import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Get a single customer
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { data: customer, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        return NextResponse.json(customer);
    } catch (error) {
        console.error('Get customer error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// PUT: Update customer
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            name,
            name_ar,
            phone,
            phone2,
            email,
            address,
            city,
            tax_number,
            credit_limit,
            notes,
            is_active,
        } = body;

        const { data: customer, error } = await supabase
            .from('customers')
            .update({
                name,
                name_ar,
                phone,
                phone2,
                email,
                address,
                city,
                tax_number,
                credit_limit,
                notes,
                is_active,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(customer);
    } catch (error) {
        console.error('Update customer error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// DELETE: Delete customer (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        // Check if customer has balance
        const { data: customer } = await supabase
            .from('customers')
            .select('balance')
            .eq('id', id)
            .single();

        if (customer?.balance && customer.balance !== 0) {
            return NextResponse.json({ error: 'لا يمكن حذف عميل له رصيد' }, { status: 400 });
        }

        // Soft delete
        const { error } = await supabase
            .from('customers')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete customer error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
