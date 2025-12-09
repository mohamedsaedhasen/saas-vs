import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// POST: Convert quotation to sales order
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase, companyId, branchId, userId } = await createSupabaseServerClientWithContext();
        const { id } = await params;
        const body = await request.json();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        // Get quotation with items
        const { data: quotation, error: fetchError } = await supabase
            .from('sales_quotations')
            .select(`
                *,
                items:sales_quotation_items(*)
            `)
            .eq('id', id)
            .single();

        if (fetchError || !quotation) {
            return NextResponse.json({ error: 'عرض السعر غير موجود' }, { status: 404 });
        }

        if (quotation.status === 'converted') {
            return NextResponse.json({ error: 'عرض السعر محول بالفعل' }, { status: 400 });
        }

        if (quotation.status === 'rejected' || quotation.status === 'expired') {
            return NextResponse.json({ error: 'لا يمكن تحويل عرض سعر مرفوض أو منتهي' }, { status: 400 });
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
        }

        // Create sales order
        const { data: order, error: orderError } = await supabase
            .from('sales_orders')
            .insert({
                company_id: companyId,
                branch_id: branchId || quotation.branch_id,
                customer_id: quotation.customer_id,
                quotation_id: quotation.id,
                warehouse_id: body.warehouse_id,
                order_number: orderNumber,
                order_date: new Date().toISOString().split('T')[0],
                expected_delivery_date: body.expected_delivery_date,
                subtotal: quotation.subtotal,
                discount_amount: quotation.discount_amount,
                tax_amount: quotation.tax_amount,
                total: quotation.total,
                status: 'draft',
                notes: quotation.notes,
                shipping_address: body.shipping_address,
                created_by: userId,
            })
            .select()
            .single();

        if (orderError) {
            console.error('Error creating order:', orderError);
            return NextResponse.json({ error: orderError.message }, { status: 400 });
        }

        // Copy items
        interface QuotationItem {
            product_id: string;
            quantity: number;
            unit_price: number;
            discount_amount: number;
            tax_rate: number;
            tax_amount: number;
            total: number;
            description?: string;
        }

        const orderItems = (quotation.items as QuotationItem[]).map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            warehouse_id: body.warehouse_id,
            description: item.description,
            quantity_ordered: item.quantity,
            unit_price: item.unit_price,
            discount_amount: item.discount_amount,
            tax_rate: item.tax_rate,
            tax_amount: item.tax_amount,
            total: item.total,
        }));

        await supabase.from('sales_order_items').insert(orderItems);

        // Update quotation status
        await supabase
            .from('sales_quotations')
            .update({
                status: 'converted',
                converted_to_order_id: order.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        return NextResponse.json({
            order,
            message: 'تم تحويل عرض السعر إلى أمر بيع بنجاح'
        }, { status: 201 });
    } catch (error) {
        console.error('Convert quotation error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
