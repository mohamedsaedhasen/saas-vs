import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Get a single product
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { data: product, error } = await supabase
            .from('products')
            .select(`
                *,
                category:product_categories(id, name, name_ar)
            `)
            .eq('id', id)
            .single();

        if (error || !product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Get inventory
        const { data: inventory } = await supabase
            .from('product_inventory')
            .select('warehouse_id, quantity, available_quantity, warehouses:warehouses(id, name, name_ar)')
            .eq('product_id', id);

        return NextResponse.json({
            ...product,
            inventory: inventory || [],
            stock_quantity: inventory?.reduce((sum, inv) => sum + (inv.available_quantity || 0), 0) || 0,
        });
    } catch (error) {
        console.error('Get product error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// PUT: Update product
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();
        const { id } = await params;

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
            selling_price,
            cost_price,
            min_stock,
            max_stock,
            description,
            notes,
            track_inventory,
            is_active,
        } = body;

        const { data: product, error } = await supabase
            .from('products')
            .update({
                sku,
                barcode,
                name,
                name_ar,
                category_id,
                unit_id,
                selling_price,
                cost_price,
                min_stock,
                max_stock,
                description,
                notes,
                track_inventory,
                is_active,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error('Update product error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// DELETE: Delete product (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        // Check if product has inventory
        const { data: inventory } = await supabase
            .from('product_inventory')
            .select('available_quantity')
            .eq('product_id', id);

        const totalStock = inventory?.reduce((sum, inv) => sum + (inv.available_quantity || 0), 0) || 0;
        if (totalStock > 0) {
            return NextResponse.json({ error: 'لا يمكن حذف منتج له مخزون' }, { status: 400 });
        }

        // Soft delete
        const { error } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete product error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
