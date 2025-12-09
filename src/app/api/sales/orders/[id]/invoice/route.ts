import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// POST: Convert sales order to invoice
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

        // Get order with items
        const { data: order, error: fetchError } = await supabase
            .from('sales_orders')
            .select(`
                *,
                items:sales_order_items(*)
            `)
            .eq('id', id)
            .single();

        if (fetchError || !order) {
            return NextResponse.json({ error: 'أمر البيع غير موجود' }, { status: 404 });
        }

        if (order.status === 'draft') {
            return NextResponse.json({ error: 'يجب تأكيد أمر البيع أولاً' }, { status: 400 });
        }

        if (order.status === 'cancelled') {
            return NextResponse.json({ error: 'لا يمكن تحويل أمر بيع ملغي' }, { status: 400 });
        }

        // Generate invoice number
        const { data: seqData } = await supabase
            .from('number_sequences')
            .select('next_number, prefix, padding')
            .eq('document_type', 'sales_invoice')
            .single();

        let invoiceNumber = 'INV-00001';
        if (seqData) {
            invoiceNumber = `${seqData.prefix || 'INV-'}${String(seqData.next_number).padStart(seqData.padding || 5, '0')}`;
            await supabase
                .from('number_sequences')
                .update({ next_number: seqData.next_number + 1 })
                .eq('document_type', 'sales_invoice');
        }

        // Create sales invoice
        const { data: invoice, error: invoiceError } = await supabase
            .from('sales_invoices')
            .insert({
                company_id: companyId,
                branch_id: branchId || order.branch_id,
                warehouse_id: order.warehouse_id,
                customer_id: order.customer_id,
                invoice_number: invoiceNumber,
                invoice_date: new Date().toISOString().split('T')[0],
                due_date: body.due_date,
                invoice_type: 'invoice',
                payment_method: body.payment_method || 'credit',
                subtotal: order.subtotal,
                discount_amount: order.discount_amount,
                tax_amount: order.tax_amount,
                shipping_amount: order.shipping_amount || 0,
                total: order.total,
                status: 'draft',
                notes: order.notes,
                created_by: userId,
            })
            .select()
            .single();

        if (invoiceError) {
            console.error('Error creating invoice:', invoiceError);
            return NextResponse.json({ error: invoiceError.message }, { status: 400 });
        }

        // Copy items
        interface OrderItem {
            product_id: string;
            warehouse_id: string;
            quantity_ordered: number;
            unit_price: number;
            discount_amount: number;
            tax_rate: number;
            tax_amount: number;
            total: number;
            description?: string;
        }

        const invoiceItems = (order.items as OrderItem[]).map(item => ({
            invoice_id: invoice.id,
            product_id: item.product_id,
            warehouse_id: item.warehouse_id || order.warehouse_id,
            description: item.description,
            quantity: item.quantity_ordered,
            unit_price: item.unit_price,
            discount_amount: item.discount_amount,
            tax_rate: item.tax_rate,
            tax_amount: item.tax_amount,
            total: item.total,
        }));

        await supabase.from('sales_invoice_items').insert(invoiceItems);

        // Update order invoiced amount
        await supabase
            .from('sales_orders')
            .update({
                invoiced_amount: order.total,
                status: 'delivered',
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        // Update order items invoiced quantities
        interface UpdateOrderItem {
            id: string;
            quantity_ordered: number;
        }

        for (const item of order.items as UpdateOrderItem[]) {
            await supabase
                .from('sales_order_items')
                .update({ quantity_invoiced: item.quantity_ordered })
                .eq('id', item.id);
        }

        // Update quotation if linked
        if (order.quotation_id) {
            await supabase
                .from('sales_quotations')
                .update({ converted_to_invoice_id: invoice.id })
                .eq('id', order.quotation_id);
        }

        return NextResponse.json({
            invoice,
            message: 'تم تحويل أمر البيع إلى فاتورة بنجاح'
        }, { status: 201 });
    } catch (error) {
        console.error('Convert order error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
