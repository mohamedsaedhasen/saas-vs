import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: List all inventory transfers
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId, branchId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status');

        const offset = (page - 1) * limit;

        let query = supabase
            .from('inventory_transfers')
            .select(`
                *,
                from_warehouse:warehouses!from_warehouse_id(id, name, name_ar),
                to_warehouse:warehouses!to_warehouse_id(id, name, name_ar),
                branch:branches(id, name, name_ar),
                items:inventory_transfer_items(count)
            `, { count: 'exact' });

        if (branchId) query = query.eq('branch_id', branchId);
        if (status) query = query.eq('status', status);

        const { data: transfers, count, error } = await query
            .order('transfer_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching transfers:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
            transfers,
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Inventory transfers error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create new inventory transfer
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId, branchId, userId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            from_warehouse_id,
            to_warehouse_id,
            transfer_date,
            items,
            notes,
        } = body;

        if (!from_warehouse_id || !to_warehouse_id) {
            return NextResponse.json({ error: 'المخزن المصدر والمستهدف مطلوبان' }, { status: 400 });
        }

        if (from_warehouse_id === to_warehouse_id) {
            return NextResponse.json({ error: 'لا يمكن التحويل لنفس المخزن' }, { status: 400 });
        }

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'الأصناف مطلوبة' }, { status: 400 });
        }

        // Generate transfer number
        const { data: seqData } = await supabase
            .from('number_sequences')
            .select('next_number, prefix, padding')
            .eq('document_type', 'inventory_transfer')
            .single();

        let transferNumber = 'TRF-00001';
        if (seqData) {
            transferNumber = `${seqData.prefix || 'TRF-'}${String(seqData.next_number).padStart(seqData.padding || 5, '0')}`;
            await supabase
                .from('number_sequences')
                .update({ next_number: seqData.next_number + 1 })
                .eq('document_type', 'inventory_transfer');
        } else {
            await supabase.from('number_sequences').insert({
                company_id: companyId,
                document_type: 'inventory_transfer',
                prefix: 'TRF-',
                next_number: 2,
            });
        }

        // Calculate totals
        let totalQuantity = 0;
        let totalCost = 0;

        // Create transfer
        const { data: transfer, error: transferError } = await supabase
            .from('inventory_transfers')
            .insert({
                company_id: companyId,
                branch_id: branchId,
                transfer_number: transferNumber,
                transfer_date: transfer_date || new Date().toISOString().split('T')[0],
                from_warehouse_id,
                to_warehouse_id,
                status: 'draft',
                total_items: items.length,
                notes,
                requested_by: userId,
                created_by: userId,
            })
            .select()
            .single();

        if (transferError) {
            console.error('Error creating transfer:', transferError);
            return NextResponse.json({ error: transferError.message }, { status: 400 });
        }

        // Create items
        const transferItems = items.map((item: {
            product_id: string;
            quantity: number;
            unit_cost?: number;
            notes?: string;
        }) => {
            totalQuantity += item.quantity;
            const itemCost = (item.unit_cost || 0) * item.quantity;
            totalCost += itemCost;

            return {
                transfer_id: transfer.id,
                product_id: item.product_id,
                quantity_requested: item.quantity,
                unit_cost: item.unit_cost || 0,
                total_cost: itemCost,
                notes: item.notes,
            };
        });

        const { error: itemsError } = await supabase
            .from('inventory_transfer_items')
            .insert(transferItems);

        if (itemsError) {
            console.error('Error creating transfer items:', itemsError);
        }

        // Update totals
        await supabase
            .from('inventory_transfers')
            .update({
                total_quantity: totalQuantity,
                total_cost: totalCost,
            })
            .eq('id', transfer.id);

        return NextResponse.json(transfer, { status: 201 });
    } catch (error) {
        console.error('Create transfer error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
