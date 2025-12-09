import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get all products for the current company
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const categoryId = searchParams.get('category_id');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        // RLS automatically filters by company_id
        let query = supabase
            .from('products')
            .select(`
                *,
                category:product_categories(id, name, name_ar)
            `, { count: 'exact' })
            .eq('is_active', true)
            .order('name', { ascending: true })
            .range(offset, offset + limit - 1);

        if (search) {
            query = query.or(`name.ilike.%${search}%,name_ar.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`);
        }
        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }

        const { data: products, error, count } = await query;

        if (error) {
            console.error('Error fetching products:', error);
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

        // Add stock to products
        const productsWithStock = products?.map(p => ({
            ...p,
            stock_quantity: inventoryData[p.id] || 0,
        })) || [];

        return NextResponse.json({
            products: productsWithStock,
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create a new product
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            sku,
            barcode,
            name,
            name_ar,
            category_id,
            unit_id,
            selling_price = 0,
            cost_price = 0,
            min_stock = 0,
            max_stock = 0,
            description,
            notes,
            track_inventory = true,
        } = body;

        if (!name) {
            return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
        }

        // Generate SKU if not provided
        let productSku = sku;
        if (!productSku) {
            productSku = `SKU-${Date.now().toString().slice(-8)}`;
        }

        const { data: product, error } = await supabase
            .from('products')
            .insert({
                company_id: companyId,
                sku: productSku,
                barcode,
                name,
                name_ar,
                category_id: category_id || null,
                unit_id: unit_id || null,
                selling_price,
                cost_price,
                min_stock,
                max_stock,
                description,
                notes,
                track_inventory,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating product:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error('Create product error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
