import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        // Get Supabase client with RLS context automatically set
        const { supabase, companyId } = await createSupabaseServerClientWithContext();
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';

        if (!companyId) {
            return NextResponse.json([]);
        }

        if (query.length < 1) {
            return NextResponse.json([]);
        }

        // RLS automatically filters by company_id
        const { data: products, error } = await supabase
            .from('products')
            .select('id, sku, name, name_ar, selling_price, cost_price')
            .eq('is_active', true)
            .or(`name.ilike.%${query}%,name_ar.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%`)
            .order('name')
            .limit(15);

        if (error) {
            console.error('Product search error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Get inventory for products
        const productIds = products?.map(p => p.id) || [];
        let inventoryData: Record<string, number> = {};

        if (productIds.length > 0) {
            const { data: inventory } = await supabase
                .from('product_inventory')
                .select('product_id, available_quantity')
                .in('product_id', productIds);

            if (inventory) {
                inventoryData = inventory.reduce((acc, inv) => {
                    acc[inv.product_id] = (acc[inv.product_id] || 0) + (inv.available_quantity || 0);
                    return acc;
                }, {} as Record<string, number>);
            }
        }

        // Transform to match expected ProductComboBox interface
        const result = products?.map(p => ({
            id: p.id,
            name: p.name_ar || p.name,
            sku: p.sku || '',
            price: p.selling_price || 0,
            stock_quantity: inventoryData[p.id] || 0,
        })) || [];

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
