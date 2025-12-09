import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: List all sales returns
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
        const fromDate = searchParams.get('from_date');
        const toDate = searchParams.get('to_date');

        const offset = (page - 1) * limit;

        let query = supabase
            .from('sales_returns')
            .select(`
                *,
                customer:customers(id, name, name_ar, phone),
                original_invoice:sales_invoices(id, invoice_number),
                items:sales_return_items(count)
            `, { count: 'exact' });

        if (branchId) query = query.eq('branch_id', branchId);
        if (status) query = query.eq('status', status);
        if (customerId) query = query.eq('customer_id', customerId);
        if (fromDate) query = query.gte('return_date', fromDate);
        if (toDate) query = query.lte('return_date', toDate);

        const { data: returns, count, error } = await query
            .order('return_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching returns:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
            returns,
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Sales returns error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create new sales return
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId, branchId, userId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            customer_id,
            original_invoice_id,
            warehouse_id,
            return_date,
            reason,
            refund_method,
            items,
            notes,
        } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'الأصناف مطلوبة' }, { status: 400 });
        }

        // Generate return number
        const { data: seqData } = await supabase
            .from('number_sequences')
            .select('next_number, prefix, padding')
            .eq('document_type', 'sales_return')
            .single();

        let returnNumber = 'SR-00001';
        if (seqData) {
            returnNumber = `${seqData.prefix || 'SR-'}${String(seqData.next_number).padStart(seqData.padding || 5, '0')}`;
            await supabase
                .from('number_sequences')
                .update({ next_number: seqData.next_number + 1 })
                .eq('document_type', 'sales_return');
        } else {
            // Create sequence
            await supabase.from('number_sequences').insert({
                company_id: companyId,
                document_type: 'sales_return',
                prefix: 'SR-',
                next_number: 2,
            });
        }

        // Calculate totals
        let subtotal = 0;
        let taxAmount = 0;

        items.forEach((item: { quantity: number; unit_price: number; tax_rate?: number }) => {
            const itemTotal = item.quantity * item.unit_price;
            const itemTax = (itemTotal * (item.tax_rate || 0)) / 100;
            subtotal += itemTotal;
            taxAmount += itemTax;
        });

        const total = subtotal + taxAmount;

        // Create return
        const { data: salesReturn, error: returnError } = await supabase
            .from('sales_returns')
            .insert({
                company_id: companyId,
                branch_id: branchId,
                warehouse_id,
                customer_id,
                original_invoice_id,
                return_number: returnNumber,
                return_date: return_date || new Date().toISOString().split('T')[0],
                reason,
                refund_method: refund_method || 'credit',
                subtotal,
                tax_amount: taxAmount,
                total,
                status: 'draft',
                notes,
                created_by: userId,
            })
            .select()
            .single();

        if (returnError) {
            console.error('Error creating return:', returnError);
            return NextResponse.json({ error: returnError.message }, { status: 400 });
        }

        // Create items
        const returnItems = items.map((item: {
            product_id: string;
            original_item_id?: string;
            warehouse_id?: string;
            description?: string;
            quantity: number;
            unit_price: number;
            cost_price?: number;
            tax_rate?: number;
            reason?: string;
            condition?: string;
        }) => {
            const itemTotal = item.quantity * item.unit_price;
            const itemTax = (itemTotal * (item.tax_rate || 0)) / 100;

            return {
                return_id: salesReturn.id,
                product_id: item.product_id,
                original_item_id: item.original_item_id,
                warehouse_id: item.warehouse_id || warehouse_id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                cost_price: item.cost_price || 0,
                tax_rate: item.tax_rate || 0,
                tax_amount: itemTax,
                total: itemTotal + itemTax,
                reason: item.reason,
                condition: item.condition || 'good',
            };
        });

        const { error: itemsError } = await supabase
            .from('sales_return_items')
            .insert(returnItems);

        if (itemsError) {
            console.error('Error creating return items:', itemsError);
        }

        return NextResponse.json(salesReturn, { status: 201 });
    } catch (error) {
        console.error('Create sales return error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
