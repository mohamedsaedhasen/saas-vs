'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getServerCompanyId } from '@/lib/server-company';

// ============================================
// Get Products
// ============================================

export async function getProducts(limit = 100) {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            category:product_categories(id, name)
        `)
        .eq('company_id', COMPANY_ID)
        .order('name')
        .limit(limit);

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return data || [];
}

// ============================================
// Get Low Stock Products
// ============================================

export async function getLowStockProducts() {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data } = await supabase
        .from('products')
        .select('id, name, sku, stock_quantity, min_stock_level')
        .eq('company_id', COMPANY_ID)
        .not('min_stock_level', 'is', null)
        .order('stock_quantity');

    // Filter products where stock <= min_stock_level
    const lowStock = (data || []).filter((p) =>
        p.stock_quantity <= (p.min_stock_level || 0)
    );

    return lowStock;
}

// ============================================
// Get Warehouses
// ============================================

export async function getWarehouses() {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data } = await supabase
        .from('warehouses')
        .select('*')
        .eq('company_id', COMPANY_ID)
        .eq('is_active', true)
        .order('name');

    return data || [];
}

// ============================================
// Create Stock Transfer
// ============================================

export async function createStockTransfer(transfer: {
    from_warehouse_id: string;
    to_warehouse_id: string;
    items: Array<{
        product_id: string;
        quantity: number;
    }>;
    notes?: string;
}) {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const transferNumber = `TRF-${Date.now().toString().slice(-8)}`;

    // Create transfer record
    const { data: transferRecord, error: transferError } = await supabase
        .from('stock_transfers')
        .insert({
            company_id: COMPANY_ID,
            transfer_number: transferNumber,
            from_warehouse_id: transfer.from_warehouse_id,
            to_warehouse_id: transfer.to_warehouse_id,
            status: 'pending',
            notes: transfer.notes,
            transfer_date: new Date().toISOString(),
        })
        .select()
        .single();

    if (transferError) {
        console.error('Error creating transfer:', transferError);
        return { error: transferError.message };
    }

    // Create transfer items
    const items = transfer.items.map((item) => ({
        transfer_id: transferRecord.id,
        product_id: item.product_id,
        quantity: item.quantity,
    }));

    await supabase.from('stock_transfer_items').insert(items);

    return { data: transferRecord };
}

// ============================================
// Confirm Stock Transfer
// ============================================

export async function confirmStockTransfer(transferId: string) {
    const supabase = await createSupabaseServerClient();

    // Get transfer with items
    const { data: transfer } = await supabase
        .from('stock_transfers')
        .select(`
            *,
            items:stock_transfer_items(product_id, quantity)
        `)
        .eq('id', transferId)
        .single();

    if (!transfer) {
        return { error: 'Transfer not found' };
    }

    // Update inventory for each item
    for (const item of transfer.items || []) {
        // Decrease from source warehouse
        await supabase.rpc('update_inventory', {
            p_product_id: item.product_id,
            p_warehouse_id: transfer.from_warehouse_id,
            p_quantity_change: -item.quantity,
        });

        // Increase in destination warehouse
        await supabase.rpc('update_inventory', {
            p_product_id: item.product_id,
            p_warehouse_id: transfer.to_warehouse_id,
            p_quantity_change: item.quantity,
        });
    }

    // Update transfer status
    await supabase
        .from('stock_transfers')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', transferId);

    return { success: true };
}

// ============================================
// Get Stock Transfers
// ============================================

export async function getStockTransfers(limit = 50) {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data } = await supabase
        .from('stock_transfers')
        .select(`
            *,
            from_warehouse:warehouses!from_warehouse_id(id, name),
            to_warehouse:warehouses!to_warehouse_id(id, name),
            items:stock_transfer_items(
                id,
                quantity,
                product:products(id, name, sku)
            )
        `)
        .eq('company_id', COMPANY_ID)
        .order('created_at', { ascending: false })
        .limit(limit);

    return data || [];
}

// ============================================
// Get Inventory Stats
// ============================================

export async function getInventoryStats() {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    // Total products
    const { count: totalProducts } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', COMPANY_ID);

    // Total stock value
    const { data: products } = await supabase
        .from('products')
        .select('stock_quantity, cost_price')
        .eq('company_id', COMPANY_ID);

    const totalValue = (products || []).reduce(
        (sum, p) => sum + (p.stock_quantity || 0) * (p.cost_price || 0),
        0
    );

    // Low stock count
    const lowStock = await getLowStockProducts();

    // Warehouses count
    const { count: warehouseCount } = await supabase
        .from('warehouses')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', COMPANY_ID)
        .eq('is_active', true);

    return {
        totalProducts: totalProducts || 0,
        totalValue,
        lowStockCount: lowStock.length,
        warehouseCount: warehouseCount || 0,
    };
}
