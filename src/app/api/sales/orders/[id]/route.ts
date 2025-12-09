import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get single sales order
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        const { data: order, error } = await supabase
            .from('sales_orders')
            .select(`
                *,
                customer:customers(id, code, name, name_ar, phone, email, address),
                warehouse:warehouses(id, name, name_ar),
                branch:branches(id, name, name_ar),
                quotation:sales_quotations(id, quotation_number),
                items:sales_order_items(
                    id, product_id, quantity_ordered, quantity_delivered, quantity_invoiced,
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
        console.error('Get order error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// PUT: Update or confirm sales order
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase, userId } = await createSupabaseServerClientWithContext();
        const { id } = await params;
        const body = await request.json();

        const { data: current } = await supabase
            .from('sales_orders')
            .select('status')
            .eq('id', id)
            .single();

        if (!current) {
            return NextResponse.json({ error: 'أمر البيع غير موجود' }, { status: 404 });
        }

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        // Update allowed fields based on status
        if (current.status === 'draft') {
            const draftFields = ['customer_id', 'warehouse_id', 'expected_delivery_date', 'notes', 'shipping_address', 'status'];
            draftFields.forEach(field => {
                if (body[field] !== undefined) {
                    updateData[field] = body[field];
                }
            });

            if (body.status === 'confirmed') {
                updateData.confirmed_by = userId;
                updateData.confirmed_at = new Date().toISOString();
            }
        } else if (body.status) {
            // Only status changes allowed for non-draft
            updateData.status = body.status;
        }

        const { data: updated, error } = await supabase
            .from('sales_orders')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Update order error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// DELETE: Delete draft sales order
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        const { data: current } = await supabase
            .from('sales_orders')
            .select('status')
            .eq('id', id)
            .single();

        if (!current) {
            return NextResponse.json({ error: 'أمر البيع غير موجود' }, { status: 404 });
        }

        if (current.status !== 'draft') {
            return NextResponse.json({ error: 'لا يمكن حذف أمر بيع غير مسودة' }, { status: 400 });
        }

        await supabase.from('sales_order_items').delete().eq('order_id', id);
        const { error } = await supabase.from('sales_orders').delete().eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete order error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
