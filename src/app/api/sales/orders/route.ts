import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: List all sales orders
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
        const customerId = searchParams.get('customer_id');

        const offset = (page - 1) * limit;

        let query = supabase
            .from('sales_orders')
            .select(`
                *,
                customer:customers(id, name, name_ar, phone),
                warehouse:warehouses(id, name, name_ar),
                items:sales_order_items(count)
            `, { count: 'exact' });

        if (branchId) query = query.eq('branch_id', branchId);
        if (status) query = query.eq('status', status);
        if (customerId) query = query.eq('customer_id', customerId);

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
        console.error('Sales orders error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create new sales order
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId, branchId, userId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            customer_id,
            quotation_id,
            warehouse_id,
            order_date,
            expected_delivery_date,
            items,
            notes,
            shipping_address,
        } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'الأصناف مطلوبة' }, { status: 400 });
        }

        // Generate order number
        const { data: seqData } = await supabase
            .from('number_sequences')
            .select('next_number, prefix, padding')
            .eq('document_type', 'sales_order')
            .single();

        let orderNumber = 'SO-00001';
        if (seqData) {
            orderNumber = `${seqData.prefix || 'SO-'}${String(seqData.next_number).padStart(seqData.padding || 5, '0')}`;
            await supabase
                .from('number_sequences')
                .update({ next_number: seqData.next_number + 1 })
                .eq('document_type', 'sales_order');
        } else {
            await supabase.from('number_sequences').insert({
                company_id: companyId,
                document_type: 'sales_order',
                prefix: 'SO-',
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
            .from('sales_orders')
            .insert({
                company_id: companyId,
                branch_id: branchId,
                customer_id,
                quotation_id,
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
                shipping_address,
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
            .from('sales_order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Error creating order items:', itemsError);
        }

        // Update quotation if linked
        if (quotation_id) {
            await supabase
                .from('sales_quotations')
                .update({
                    status: 'converted',
                    converted_to_order_id: order.id,
                })
                .eq('id', quotation_id);
        }

        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        console.error('Create order error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
