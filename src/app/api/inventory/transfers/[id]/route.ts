import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get single inventory transfer
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        const { data: transfer, error } = await supabase
            .from('inventory_transfers')
            .select(`
                *,
                from_warehouse:warehouses!from_warehouse_id(id, name, name_ar),
                to_warehouse:warehouses!to_warehouse_id(id, name, name_ar),
                branch:branches(id, name, name_ar),
                items:inventory_transfer_items(
                    id, product_id, quantity_requested, quantity_sent, quantity_received,
                    unit_cost, total_cost, notes,
                    product:products(id, sku, name, name_ar)
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        return NextResponse.json(transfer);
    } catch (error) {
        console.error('Get transfer error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// PUT: Update transfer status (approve, ship, receive)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase, userId } = await createSupabaseServerClientWithContext();
        const { id } = await params;
        const body = await request.json();

        const { data: current } = await supabase
            .from('inventory_transfers')
            .select('status')
            .eq('id', id)
            .single();

        if (!current) {
            return NextResponse.json({ error: 'التحويل غير موجود' }, { status: 404 });
        }

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        // Handle status transitions
        if (body.action === 'approve' && current.status === 'draft') {
            updateData.status = 'pending';
            updateData.approved_by = userId;
            updateData.approved_at = new Date().toISOString();
        } else if (body.action === 'ship' && current.status === 'pending') {
            updateData.status = 'in_transit';
            updateData.shipped_at = new Date().toISOString();

            // Update items sent quantities
            if (body.items) {
                for (const item of body.items) {
                    await supabase
                        .from('inventory_transfer_items')
                        .update({ quantity_sent: item.quantity_sent })
                        .eq('id', item.id);
                }
            }
        } else if (body.action === 'receive' && current.status === 'in_transit') {
            updateData.status = 'completed';
            updateData.received_by = userId;
            updateData.received_at = new Date().toISOString();

            // Update items received quantities
            if (body.items) {
                for (const item of body.items) {
                    await supabase
                        .from('inventory_transfer_items')
                        .update({ quantity_received: item.quantity_received })
                        .eq('id', item.id);
                }
            }
        } else if (body.action === 'cancel' && ['draft', 'pending'].includes(current.status)) {
            updateData.status = 'cancelled';
        }

        if (body.notes) updateData.notes = body.notes;

        const { data: updated, error } = await supabase
            .from('inventory_transfers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Update transfer error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// DELETE: Delete draft transfer
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        const { data: current } = await supabase
            .from('inventory_transfers')
            .select('status')
            .eq('id', id)
            .single();

        if (!current) {
            return NextResponse.json({ error: 'التحويل غير موجود' }, { status: 404 });
        }

        if (current.status !== 'draft') {
            return NextResponse.json({ error: 'لا يمكن حذف تحويل غير مسودة' }, { status: 400 });
        }

        await supabase.from('inventory_transfer_items').delete().eq('transfer_id', id);
        const { error } = await supabase.from('inventory_transfers').delete().eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete transfer error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
