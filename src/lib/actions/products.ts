'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getServerCompanyId } from '@/lib/server-company';

// ============================================
// Products
// ============================================

export async function getProducts(limit = 50) {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data, error } = await supabase
        .from('products')
        .select(`
            id,
            sku,
            name,
            name_en,
            cost_price,
            selling_price,
            is_active,
            category_id,
            product_categories (
                id,
                name
            )
        `)
        .eq('company_id', COMPANY_ID)
        .order('name', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return data || [];
}

export async function getProductById(productId: string) {
    const supabase = await createSupabaseServerClient();

    const { data: product } = await supabase
        .from('products')
        .select(`
            *,
            product_categories (id, name)
        `)
        .eq('id', productId)
        .single();

    if (!product) return null;

    // Get inventory
    const { data: inventory } = await supabase
        .from('inventory')
        .select(`
            quantity,
            reserved_quantity,
            average_cost,
            warehouses (id, name)
        `)
        .eq('product_id', productId);

    return { ...product, inventory: inventory || [] };
}

export async function getProductStats() {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { count: totalProducts } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', COMPANY_ID);

    const { count: activeProducts } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', COMPANY_ID)
        .eq('is_active', true);

    // Low stock products
    const { data: lowStock } = await supabase
        .from('inventory')
        .select('product_id, quantity, products!inner(min_stock_level)')
        .lt('quantity', 10);

    return {
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        lowStockCount: lowStock?.length || 0
    };
}

// ============================================
// Categories
// ============================================

export async function getCategories() {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data } = await supabase
        .from('product_categories')
        .select('id, name, name_en, parent_id')
        .eq('company_id', COMPANY_ID)
        .order('name', { ascending: true });

    return data || [];
}

// ============================================
// Inventory
// ============================================

export async function getInventoryStats() {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data } = await supabase
        .from('inventory')
        .select(`
            quantity,
            average_cost,
            products!inner(company_id)
        `)
        .eq('products.company_id', COMPANY_ID);

    const totalItems = data?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0;
    const totalValue = data?.reduce((sum, i) => sum + ((i.quantity || 0) * (i.average_cost || 0)), 0) || 0;

    return { totalItems, totalValue };
}

export async function getWarehouses() {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data } = await supabase
        .from('warehouses')
        .select('id, name, code, is_active')
        .eq('company_id', COMPANY_ID)
        .eq('is_active', true);

    return data || [];
}
