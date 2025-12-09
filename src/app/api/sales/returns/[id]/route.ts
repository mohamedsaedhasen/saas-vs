import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get single sales return
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        const { data: salesReturn, error } = await supabase
            .from('sales_returns')
            .select(`
                *,
                customer:customers(id, code, name, name_ar, phone, email),
                original_invoice:sales_invoices(id, invoice_number, invoice_date, total),
                warehouse:warehouses(id, name, name_ar),
                branch:branches(id, name, name_ar),
                items:sales_return_items(
                    id, product_id, quantity, unit_price, cost_price, 
                    tax_rate, tax_amount, total, reason, condition,
                    product:products(id, sku, name, name_ar)
                ),
                journal_entry:journal_entries(id, entry_number, entry_date)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching return:', error);
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        return NextResponse.json(salesReturn);
    } catch (error) {
        console.error('Get sales return error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// PUT: Update or confirm sales return
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase, userId } = await createSupabaseServerClientWithContext();
        const { id } = await params;
        const body = await request.json();

        // Get current return
        const { data: currentReturn, error: fetchError } = await supabase
            .from('sales_returns')
            .select('status')
            .eq('id', id)
            .single();

        if (fetchError || !currentReturn) {
            return NextResponse.json({ error: 'المرتجع غير موجود' }, { status: 404 });
        }

        if (currentReturn.status !== 'draft') {
            return NextResponse.json({ error: 'لا يمكن تعديل مرتجع مؤكد' }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (body.status === 'confirmed') {
            updateData.status = 'confirmed';
            updateData.confirmed_by = userId;
            updateData.confirmed_at = new Date().toISOString();
        }

        if (body.reason) updateData.reason = body.reason;
        if (body.notes) updateData.notes = body.notes;
        if (body.refund_method) updateData.refund_method = body.refund_method;

        const { data: updatedReturn, error: updateError } = await supabase
            .from('sales_returns')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating return:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 400 });
        }

        return NextResponse.json(updatedReturn);
    } catch (error) {
        console.error('Update sales return error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// DELETE: Delete draft sales return
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        // Check status
        const { data: currentReturn } = await supabase
            .from('sales_returns')
            .select('status')
            .eq('id', id)
            .single();

        if (!currentReturn) {
            return NextResponse.json({ error: 'المرتجع غير موجود' }, { status: 404 });
        }

        if (currentReturn.status !== 'draft') {
            return NextResponse.json({ error: 'لا يمكن حذف مرتجع مؤكد' }, { status: 400 });
        }

        // Delete items first
        await supabase
            .from('sales_return_items')
            .delete()
            .eq('return_id', id);

        // Delete return
        const { error } = await supabase
            .from('sales_returns')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting return:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete sales return error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
