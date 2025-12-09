import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get all sales invoices for the current company
export async function GET(request: NextRequest) {
    try {
        // Get Supabase client with RLS context automatically set
        const { supabase, companyId, branchId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const customerId = searchParams.get('customer_id');
        const fromDate = searchParams.get('from_date');
        const toDate = searchParams.get('to_date');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        // RLS automatically filters by company_id - no need for manual .eq('company_id', companyId)
        let query = supabase
            .from('sales_invoices')
            .select(`
                *,
                customer:customers(id, name, name_ar, phone),
                branch:branches(id, name, name_ar),
                items:sales_invoice_items(
                    id, product_id, description, quantity, unit_price, 
                    discount_amount, tax_rate, tax_amount, total,
                    product:products(id, name, name_ar, sku)
                )
            `, { count: 'exact' })
            .order('invoice_date', { ascending: false })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (branchId) {
            query = query.eq('branch_id', branchId);
        }
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (customerId) {
            query = query.eq('customer_id', customerId);
        }
        if (fromDate) {
            query = query.gte('invoice_date', fromDate);
        }
        if (toDate) {
            query = query.lte('invoice_date', toDate);
        }

        const { data: invoices, error, count } = await query;

        if (error) {
            console.error('Error fetching invoices:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Get stats - RLS automatically filters by company_id
        const { data: stats } = await supabase
            .from('sales_invoices')
            .select('status, total, paid_amount');

        const statsData = {
            total: stats?.length || 0,
            totalAmount: stats?.reduce((sum, i) => sum + (i.total || 0), 0) || 0,
            unpaid: stats?.filter(i => i.status === 'draft' || i.status === 'confirmed').length || 0,
            unpaidAmount: stats?.reduce((sum, i) => sum + ((i.total || 0) - (i.paid_amount || 0)), 0) || 0,
        };

        return NextResponse.json({
            invoices: invoices || [],
            stats: statsData,
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            }
        });
    } catch (error) {
        console.error('Get invoices error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create a new sales invoice
export async function POST(request: NextRequest) {
    try {
        // Get Supabase client with RLS context automatically set
        const { supabase, companyId, branchId, userId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            customer_id,
            warehouse_id,
            invoice_date,
            due_date,
            payment_method = 'cash',
            discount_type = 'amount',
            discount_value = 0,
            discount_amount = 0,
            tax_amount = 0,
            shipping_amount = 0,
            notes,
            internal_notes,
            items,
            status = 'draft',
        } = body;

        // Generate invoice number - RLS automatically filters by company_id
        const { data: sequence } = await supabase
            .from('number_sequences')
            .select('prefix, next_number, padding')
            .eq('document_type', 'sales_invoice')
            .single();

        let invoiceNumber = 'INV-00001';
        if (sequence) {
            const paddedNumber = String(sequence.next_number).padStart(sequence.padding || 5, '0');
            invoiceNumber = `${sequence.prefix || 'INV-'}${paddedNumber}`;

            // Increment sequence - RLS automatically filters by company_id
            await supabase
                .from('number_sequences')
                .update({ next_number: sequence.next_number + 1 })
                .eq('document_type', 'sales_invoice');
        }

        // Calculate totals
        const subtotal = items?.reduce((sum: number, item: any) =>
            sum + (item.quantity * item.unit_price), 0) || 0;
        const total = subtotal - discount_amount + tax_amount + shipping_amount;

        // Create invoice - company_id, branch_id, user_id from RLS context
        const { data: invoice, error: invoiceError } = await supabase
            .from('sales_invoices')
            .insert({
                company_id: companyId,
                branch_id: branchId || null,
                warehouse_id: warehouse_id || null,
                customer_id: customer_id || null,
                invoice_number: invoiceNumber,
                invoice_date: invoice_date || new Date().toISOString().split('T')[0],
                due_date: due_date || null,
                invoice_type: 'invoice',
                payment_method,
                discount_type,
                discount_value,
                discount_amount,
                subtotal,
                tax_amount,
                shipping_amount,
                total,
                paid_amount: 0,
                status,
                notes,
                internal_notes,
                created_by: userId || null,
            })
            .select()
            .single();

        if (invoiceError) {
            console.error('Error creating invoice:', invoiceError);
            return NextResponse.json({ error: invoiceError.message }, { status: 400 });
        }

        // Create invoice items
        if (items && items.length > 0) {
            const invoiceItems = items.map((item: any) => ({
                invoice_id: invoice.id,
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

            const { error: itemsError } = await supabase
                .from('sales_invoice_items')
                .insert(invoiceItems);

            if (itemsError) {
                console.error('Error creating invoice items:', itemsError);
            }
        }

        // Update customer balance if confirmed
        if (status === 'confirmed' && customer_id) {
            await supabase.rpc('update_customer_balance', {
                p_customer_id: customer_id,
                p_amount: total
            });
        }

        return NextResponse.json(invoice, { status: 201 });
    } catch (error) {
        console.error('Create invoice error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
