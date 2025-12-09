import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get single purchase return
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        const { data: purchaseReturn, error } = await supabase
            .from('purchase_returns')
            .select(`
                *,
                supplier:suppliers(id, code, name, name_ar, phone, email),
                original_invoice:purchase_invoices(id, invoice_number, invoice_date, total),
                warehouse:warehouses(id, name, name_ar),
                branch:branches(id, name, name_ar),
                items:purchase_return_items(
                    id, product_id, quantity, unit_price, 
                    tax_rate, tax_amount, total, reason,
                    product:products(id, sku, name, name_ar)
                ),
                journal_entry:journal_entries(id, entry_number, entry_date)
            `)
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        return NextResponse.json(purchaseReturn);
    } catch (error) {
        console.error('Get purchase return error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// PUT: Update or confirm purchase return
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase, userId } = await createSupabaseServerClientWithContext();
        const { id } = await params;
        const body = await request.json();

        const { data: current } = await supabase
            .from('purchase_returns')
            .select('status')
            .eq('id', id)
            .single();

        if (!current) {
            return NextResponse.json({ error: 'المرتجع غير موجود' }, { status: 404 });
        }

        if (current.status !== 'draft') {
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

        const { data: updated, error } = await supabase
            .from('purchase_returns')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Update purchase return error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// DELETE: Delete draft purchase return
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        const { data: current } = await supabase
            .from('purchase_returns')
            .select('status')
            .eq('id', id)
            .single();

        if (!current) {
            return NextResponse.json({ error: 'المرتجع غير موجود' }, { status: 404 });
        }

        if (current.status !== 'draft') {
            return NextResponse.json({ error: 'لا يمكن حذف مرتجع مؤكد' }, { status: 400 });
        }

        await supabase.from('purchase_return_items').delete().eq('return_id', id);
        const { error } = await supabase.from('purchase_returns').delete().eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete purchase return error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
