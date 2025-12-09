import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: List all stocktakes
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
        const warehouseId = searchParams.get('warehouse_id');

        const offset = (page - 1) * limit;

        let query = supabase
            .from('stocktakes')
            .select(`
                *,
                warehouse:warehouses(id, name, name_ar),
                branch:branches(id, name, name_ar),
                items:stocktake_items(count)
            `, { count: 'exact' });

        if (branchId) query = query.eq('branch_id', branchId);
        if (status) query = query.eq('status', status);
        if (warehouseId) query = query.eq('warehouse_id', warehouseId);

        const { data: stocktakes, count, error } = await query
            .order('stocktake_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching stocktakes:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
            stocktakes,
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Stocktakes error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create new stocktake
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId, branchId, userId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            warehouse_id,
            stocktake_date,
            stocktake_type,
            notes,
            product_ids, // optional: specific products to count
        } = body;

        if (!warehouse_id) {
            return NextResponse.json({ error: 'المخزن مطلوب' }, { status: 400 });
        }

        // Generate stocktake number
        const { data: seqData } = await supabase
            .from('number_sequences')
            .select('next_number, prefix, padding')
            .eq('document_type', 'stocktake')
            .single();

        let stocktakeNumber = 'STK-00001';
        if (seqData) {
            stocktakeNumber = `${seqData.prefix || 'STK-'}${String(seqData.next_number).padStart(seqData.padding || 5, '0')}`;
            await supabase
                .from('number_sequences')
                .update({ next_number: seqData.next_number + 1 })
                .eq('document_type', 'stocktake');
        } else {
            await supabase.from('number_sequences').insert({
                company_id: companyId,
                document_type: 'stocktake',
                prefix: 'STK-',
                next_number: 2,
            });
        }

        // Get products to count
        let productsQuery = supabase
            .from('product_inventory')
            .select(`
                product_id,
                quantity,
                avg_cost,
                product:products(id, sku, name, name_ar)
            `)
            .eq('warehouse_id', warehouse_id);

        if (product_ids && product_ids.length > 0) {
            productsQuery = productsQuery.in('product_id', product_ids);
        }

        const { data: inventoryItems } = await productsQuery;

        // Create stocktake
        const { data: stocktake, error: stocktakeError } = await supabase
            .from('stocktakes')
            .insert({
                company_id: companyId,
                branch_id: branchId,
                warehouse_id,
                stocktake_number: stocktakeNumber,
                stocktake_date: stocktake_date || new Date().toISOString().split('T')[0],
                stocktake_type: stocktake_type || 'full',
                status: 'draft',
                total_items: inventoryItems?.length || 0,
                notes,
                created_by: userId,
            })
            .select()
            .single();

        if (stocktakeError) {
            console.error('Error creating stocktake:', stocktakeError);
            return NextResponse.json({ error: stocktakeError.message }, { status: 400 });
        }

        // Create stocktake items with system quantities
        if (inventoryItems && inventoryItems.length > 0) {
            const stocktakeItems = inventoryItems.map(item => ({
                stocktake_id: stocktake.id,
                product_id: item.product_id,
                system_quantity: item.quantity || 0,
                unit_cost: item.avg_cost || 0,
                status: 'pending',
            }));

            const { error: itemsError } = await supabase
                .from('stocktake_items')
                .insert(stocktakeItems);

            if (itemsError) {
                console.error('Error creating stocktake items:', itemsError);
            }
        }

        return NextResponse.json(stocktake, { status: 201 });
    } catch (error) {
        console.error('Create stocktake error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
