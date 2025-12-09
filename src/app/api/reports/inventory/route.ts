import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get inventory report
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const warehouseId = searchParams.get('warehouse_id');
        const categoryId = searchParams.get('category_id');
        const lowStockOnly = searchParams.get('low_stock') === 'true';

        // Get products with inventory - RLS filters by company_id
        let productsQuery = supabase
            .from('products')
            .select(`
                id, sku, barcode, name, name_ar, 
                selling_price, cost_price, min_stock, max_stock,
                category:product_categories(id, name, name_ar)
            `)
            .eq('is_active', true)
            .eq('track_inventory', true);

        if (categoryId) {
            productsQuery = productsQuery.eq('category_id', categoryId);
        }

        const { data: products, error } = await productsQuery;

        if (error) {
            console.error('Error fetching products:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Get inventory for all products
        const productIds = products?.map(p => p.id) || [];
        let inventoryQuery = supabase
            .from('product_inventory')
            .select('product_id, warehouse_id, quantity, available_quantity')
            .in('product_id', productIds);

        if (warehouseId) {
            inventoryQuery = inventoryQuery.eq('warehouse_id', warehouseId);
        }

        const { data: inventory } = await inventoryQuery;

        // Get warehouses for display names
        const { data: warehouses } = await supabase
            .from('warehouses')
            .select('id, name, name_ar');

        // Build inventory map
        const inventoryMap: Record<string, { total: number; byWarehouse: Record<string, number> }> = {};
        inventory?.forEach(inv => {
            if (!inventoryMap[inv.product_id]) {
                inventoryMap[inv.product_id] = { total: 0, byWarehouse: {} };
            }
            inventoryMap[inv.product_id].total += inv.available_quantity || 0;
            inventoryMap[inv.product_id].byWarehouse[inv.warehouse_id] = inv.available_quantity || 0;
        });

        // Create report
        let report = products?.map(product => ({
            ...product,
            stock_quantity: inventoryMap[product.id]?.total || 0,
            stock_value: (inventoryMap[product.id]?.total || 0) * (product.cost_price || 0),
            is_low_stock: (inventoryMap[product.id]?.total || 0) < (product.min_stock || 0),
            stock_by_warehouse: inventoryMap[product.id]?.byWarehouse || {},
        })) || [];

        // Filter low stock if requested
        if (lowStockOnly) {
            report = report.filter(p => p.is_low_stock);
        }

        // Calculate summary
        const summary = {
            totalProducts: report.length,
            totalStockValue: report.reduce((sum, p) => sum + p.stock_value, 0),
            lowStockProducts: report.filter(p => p.is_low_stock).length,
            outOfStockProducts: report.filter(p => p.stock_quantity === 0).length,
        };

        return NextResponse.json({
            summary,
            products: report,
            warehouses: warehouses || [],
        });
    } catch (error) {
        console.error('Inventory report error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
