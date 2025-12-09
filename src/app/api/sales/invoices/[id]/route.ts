import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Get a single invoice by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        // RLS automatically filters by company_id
        const { data: invoice, error } = await supabase
            .from('sales_invoices')
            .select(`
                *,
                customer:customers(id, code, name, name_ar, phone, email, address, balance),
                branch:branches(id, code, name, name_ar),
                warehouse:warehouses(id, code, name, name_ar),
                created_by_user:app_users!sales_invoices_created_by_fkey(id, name, email),
                items:sales_invoice_items(
                    id, product_id, description, quantity, unit_price,
                    cost_price, discount_type, discount_value, discount_amount,
                    tax_rate, tax_amount, total,
                    product:products(id, sku, name, name_ar)
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching invoice:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error('Get invoice error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// PUT: Update invoice
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { supabase, companyId, userId } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            customer_id,
            warehouse_id,
            invoice_date,
            due_date,
            payment_method,
            discount_type,
            discount_value,
            discount_amount,
            tax_amount,
            shipping_amount,
            notes,
            internal_notes,
            items,
            status,
        } = body;

        // Check current invoice status - RLS filters by company_id
        const { data: currentInvoice } = await supabase
            .from('sales_invoices')
            .select('status')
            .eq('id', id)
            .single();

        if (!currentInvoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Only allow editing draft invoices
        if (currentInvoice.status !== 'draft' && status !== 'cancelled') {
            return NextResponse.json({ error: 'لا يمكن تعديل فاتورة مرحّلة' }, { status: 400 });
        }

        // Calculate totals
        const subtotal = items?.reduce((sum: number, item: any) =>
            sum + (item.quantity * item.unit_price), 0) || 0;
        const total = subtotal - (discount_amount || 0) + (tax_amount || 0) + (shipping_amount || 0);

        // Update invoice
        const { data: invoice, error: updateError } = await supabase
            .from('sales_invoices')
            .update({
                customer_id,
                warehouse_id,
                invoice_date,
                due_date,
                payment_method,
                discount_type,
                discount_value,
                discount_amount,
                subtotal,
                tax_amount,
                shipping_amount,
                total,
                notes,
                internal_notes,
                status,
                confirmed_by: status === 'confirmed' ? userId : null,
                confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 400 });
        }

        // Update items
        if (items) {
            // Delete existing items
            await supabase
                .from('sales_invoice_items')
                .delete()
                .eq('invoice_id', id);

            // Insert new items
            if (items.length > 0) {
                const invoiceItems = items.map((item: any) => ({
                    invoice_id: id,
                    product_id: item.product_id || null,
                    warehouse_id: item.warehouse_id || warehouse_id || null,
                    description: item.description || item.name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    cost_price: item.cost_price || 0,
                    discount_type: item.discount_type || 'amount',
                    discount_value: item.discount_value || 0,
                    discount_amount: item.discount_amount || 0,
                    tax_rate: item.tax_rate || 0,
                    tax_amount: item.tax_amount || 0,
                    total: item.quantity * item.unit_price - (item.discount_amount || 0),
                }));

                await supabase
                    .from('sales_invoice_items')
                    .insert(invoiceItems);
            }
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error('Update invoice error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// DELETE: Delete invoice (only drafts)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        // Check status - RLS filters by company_id
        const { data: invoice } = await supabase
            .from('sales_invoices')
            .select('status')
            .eq('id', id)
            .single();

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        if (invoice.status !== 'draft') {
            return NextResponse.json({ error: 'لا يمكن حذف فاتورة مرحّلة' }, { status: 400 });
        }

        // Delete items first
        await supabase
            .from('sales_invoice_items')
            .delete()
            .eq('invoice_id', id);

        // Delete invoice
        const { error } = await supabase
            .from('sales_invoices')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete invoice error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
