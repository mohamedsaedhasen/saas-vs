import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// PUT: Update counted quantity for a stocktake item
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    try {
        const { supabase, userId } = await createSupabaseServerClientWithContext();
        const { id, itemId } = await params;
        const body = await request.json();

        // Check stocktake status
        const { data: stocktake } = await supabase
            .from('stocktakes')
            .select('status')
            .eq('id', id)
            .single();

        if (!stocktake) {
            return NextResponse.json({ error: 'الجرد غير موجود' }, { status: 404 });
        }

        if (stocktake.status !== 'in_progress') {
            return NextResponse.json({ error: 'الجرد ليس قيد التنفيذ' }, { status: 400 });
        }

        // Update item
        const { data: updated, error } = await supabase
            .from('stocktake_items')
            .update({
                counted_quantity: body.counted_quantity,
                status: 'counted',
                counted_by: userId,
                counted_at: new Date().toISOString(),
                notes: body.notes,
            })
            .eq('id', itemId)
            .eq('stocktake_id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating item:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Update stocktake counts
        const { data: items } = await supabase
            .from('stocktake_items')
            .select('counted_quantity')
            .eq('stocktake_id', id);

        const itemsCounted = items?.filter(i => i.counted_quantity !== null).length || 0;

        await supabase
            .from('stocktakes')
            .update({
                items_counted: itemsCounted,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Update stocktake item error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
