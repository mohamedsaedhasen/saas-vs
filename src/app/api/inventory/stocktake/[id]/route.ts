import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get single stocktake
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        const { data: stocktake, error } = await supabase
            .from('stocktakes')
            .select(`
                *,
                warehouse:warehouses(id, name, name_ar),
                branch:branches(id, name, name_ar),
                items:stocktake_items(
                    id, product_id, system_quantity, counted_quantity,
                    variance_quantity, unit_cost, variance_value, status, notes,
                    product:products(id, sku, name, name_ar)
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        return NextResponse.json(stocktake);
    } catch (error) {
        console.error('Get stocktake error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// PUT: Update stocktake (start, count item, complete)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase, userId } = await createSupabaseServerClientWithContext();
        const { id } = await params;
        const body = await request.json();

        const { data: current } = await supabase
            .from('stocktakes')
            .select('status')
            .eq('id', id)
            .single();

        if (!current) {
            return NextResponse.json({ error: 'الجرد غير موجود' }, { status: 404 });
        }

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        // Handle status transitions
        if (body.action === 'start' && current.status === 'draft') {
            updateData.status = 'in_progress';
            updateData.started_at = new Date().toISOString();
        } else if (body.action === 'complete' && current.status === 'in_progress') {
            // Calculate stats
            const { data: items } = await supabase
                .from('stocktake_items')
                .select('counted_quantity, system_quantity, variance_quantity')
                .eq('stocktake_id', id);

            let itemsCounted = 0;
            let itemsMatched = 0;
            let itemsVariance = 0;

            items?.forEach(item => {
                if (item.counted_quantity !== null) {
                    itemsCounted++;
                    if (item.variance_quantity === 0) {
                        itemsMatched++;
                    } else {
                        itemsVariance++;
                    }
                }
            });

            updateData.status = 'completed';
            updateData.items_counted = itemsCounted;
            updateData.items_matched = itemsMatched;
            updateData.items_variance = itemsVariance;
            updateData.approved_by = userId;
            updateData.approved_at = new Date().toISOString();
        }

        if (body.notes) updateData.notes = body.notes;

        const { data: updated, error } = await supabase
            .from('stocktakes')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Update stocktake error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// DELETE: Delete draft stocktake
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        const { data: current } = await supabase
            .from('stocktakes')
            .select('status')
            .eq('id', id)
            .single();

        if (!current) {
            return NextResponse.json({ error: 'الجرد غير موجود' }, { status: 404 });
        }

        if (current.status !== 'draft') {
            return NextResponse.json({ error: 'لا يمكن حذف جرد غير مسودة' }, { status: 400 });
        }

        await supabase.from('stocktake_items').delete().eq('stocktake_id', id);
        const { error } = await supabase.from('stocktakes').delete().eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete stocktake error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
