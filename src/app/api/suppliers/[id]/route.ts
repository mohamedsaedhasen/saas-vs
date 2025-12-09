import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Get a single supplier
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { data: supplier, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !supplier) {
            return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
        }

        return NextResponse.json(supplier);
    } catch (error) {
        console.error('Get supplier error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// PUT: Update supplier
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
            notes,
            is_active,
        } = body;

        const { data: supplier, error } = await supabase
            .from('suppliers')
            .update({
                name,
                name_ar,
                phone,
                phone2,
                email,
                address,
                city,
                tax_number,
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

        return NextResponse.json(supplier);
    } catch (error) {
        console.error('Update supplier error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// DELETE: Delete supplier (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        // Check if supplier has balance
        const { data: supplier } = await supabase
            .from('suppliers')
            .select('balance')
            .eq('id', id)
            .single();

        if (supplier?.balance && supplier.balance !== 0) {
            return NextResponse.json({ error: 'لا يمكن حذف مورد له رصيد' }, { status: 400 });
        }

        // Soft delete
        const { error } = await supabase
            .from('suppliers')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete supplier error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
