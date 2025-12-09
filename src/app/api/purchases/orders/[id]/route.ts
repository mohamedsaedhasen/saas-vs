import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get single purchase order
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        const { data: order, error } = await supabase
            .from('purchase_orders')
            .select(`
                *,
                supplier:suppliers(id, code, name, name_ar, phone, email),
                warehouse:warehouses(id, name, name_ar),
                branch:branches(id, name, name_ar),
                items:purchase_order_items(
                    id, product_id, quantity_ordered, quantity_received,
                    unit_price, discount_amount, tax_rate, tax_amount, total, description,
                    product:products(id, sku, name, name_ar)
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error('Get purchase order error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// PUT: Update or approve purchase order
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase, userId } = await createSupabaseServerClientWithContext();
        const { id } = await params;
        const body = await request.json();

        const { data: current } = await supabase
            .from('purchase_orders')
            .select('status')
            .eq('id', id)
            .single();

        if (!current) {
            return NextResponse.json({ error: 'أمر الشراء غير موجود' }, { status: 404 });
        }

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (current.status === 'draft') {
            const draftFields = ['supplier_id', 'warehouse_id', 'expected_delivery_date', 'notes', 'status'];
            draftFields.forEach(field => {
                if (body[field] !== undefined) {
                    updateData[field] = body[field];
                }
            });

            if (body.status === 'sent') {
                updateData.approved_by = userId;
                updateData.approved_at = new Date().toISOString();
            }
        } else if (body.status) {
            updateData.status = body.status;
        }

        const { data: updated, error } = await supabase
            .from('purchase_orders')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Update purchase order error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// DELETE: Delete draft purchase order
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        const { data: current } = await supabase
            .from('purchase_orders')
            .select('status')
            .eq('id', id)
            .single();

        if (!current) {
            return NextResponse.json({ error: 'أمر الشراء غير موجود' }, { status: 404 });
        }

        if (current.status !== 'draft') {
            return NextResponse.json({ error: 'لا يمكن حذف أمر شراء غير مسودة' }, { status: 400 });
        }

        await supabase.from('purchase_order_items').delete().eq('order_id', id);
        const { error } = await supabase.from('purchase_orders').delete().eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete purchase order error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
