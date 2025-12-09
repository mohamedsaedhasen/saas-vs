import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: List all purchase orders
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
        const supplierId = searchParams.get('supplier_id');

        const offset = (page - 1) * limit;

        let query = supabase
            .from('purchase_orders')
            .select(`
                *,
                supplier:suppliers(id, name, name_ar, phone),
                warehouse:warehouses(id, name, name_ar),
                items:purchase_order_items(count)
            `, { count: 'exact' });

        if (branchId) query = query.eq('branch_id', branchId);
        if (status) query = query.eq('status', status);
        if (supplierId) query = query.eq('supplier_id', supplierId);

        const { data: orders, count, error } = await query
            .order('order_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching orders:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
            orders,
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Purchase orders error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create new purchase order
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId, branchId, userId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            supplier_id,
            warehouse_id,
            order_date,
            expected_delivery_date,
            items,
            notes,
        } = body;

        if (!supplier_id) {
            return NextResponse.json({ error: 'المورد مطلوب' }, { status: 400 });
        }

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'الأصناف مطلوبة' }, { status: 400 });
        }

        // Generate order number
        const { data: seqData } = await supabase
            .from('number_sequences')
            .select('next_number, prefix, padding')
            .eq('document_type', 'purchase_order')
            .single();

        let orderNumber = 'PO-00001';
        if (seqData) {
            orderNumber = `${seqData.prefix || 'PO-'}${String(seqData.next_number).padStart(seqData.padding || 5, '0')}`;
            await supabase
                .from('number_sequences')
                .update({ next_number: seqData.next_number + 1 })
                .eq('document_type', 'purchase_order');
        } else {
            await supabase.from('number_sequences').insert({
                company_id: companyId,
                document_type: 'purchase_order',
                prefix: 'PO-',
                next_number: 2,
            });
        }

        // Calculate totals
        let subtotal = 0;
        let taxAmount = 0;
        let discountAmount = 0;

        items.forEach((item: { quantity_ordered: number; unit_price: number; tax_rate?: number; discount_amount?: number }) => {
            const itemTotal = item.quantity_ordered * item.unit_price;
            const itemDiscount = item.discount_amount || 0;
            const itemTax = ((itemTotal - itemDiscount) * (item.tax_rate || 0)) / 100;
            subtotal += itemTotal;
            discountAmount += itemDiscount;
            taxAmount += itemTax;
        });

        const total = subtotal - discountAmount + taxAmount;

        // Create order
        const { data: order, error: orderError } = await supabase
            .from('purchase_orders')
            .insert({
                company_id: companyId,
                branch_id: branchId,
                supplier_id,
                warehouse_id,
                order_number: orderNumber,
                order_date: order_date || new Date().toISOString().split('T')[0],
                expected_delivery_date,
                subtotal,
                discount_amount: discountAmount,
                tax_amount: taxAmount,
                total,
                status: 'draft',
                notes,
                created_by: userId,
            })
            .select()
            .single();

        if (orderError) {
            console.error('Error creating order:', orderError);
            return NextResponse.json({ error: orderError.message }, { status: 400 });
        }

        // Create items
        const orderItems = items.map((item: {
            product_id: string;
            warehouse_id?: string;
            description?: string;
            quantity_ordered: number;
            unit_price: number;
            discount_amount?: number;
            tax_rate?: number;
        }) => {
            const itemTotal = item.quantity_ordered * item.unit_price;
            const itemDiscount = item.discount_amount || 0;
            const itemTax = ((itemTotal - itemDiscount) * (item.tax_rate || 0)) / 100;

            return {
                order_id: order.id,
                product_id: item.product_id,
                warehouse_id: item.warehouse_id || warehouse_id,
                description: item.description,
                quantity_ordered: item.quantity_ordered,
                unit_price: item.unit_price,
                discount_amount: itemDiscount,
                tax_rate: item.tax_rate || 0,
                tax_amount: itemTax,
                total: itemTotal - itemDiscount + itemTax,
            };
        });

        const { error: itemsError } = await supabase
            .from('purchase_order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Error creating order items:', itemsError);
        }

        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        console.error('Create purchase order error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
