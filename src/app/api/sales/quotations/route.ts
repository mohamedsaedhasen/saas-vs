import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: List all sales quotations
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
            .from('sales_quotations')
            .select(`
                *,
                customer:customers(id, name, name_ar, phone),
                items:sales_quotation_items(count)
            `, { count: 'exact' });

        if (branchId) query = query.eq('branch_id', branchId);
        if (status) query = query.eq('status', status);
        if (customerId) query = query.eq('customer_id', customerId);

        const { data: quotations, count, error } = await query
            .order('quotation_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching quotations:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
            quotations,
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Quotations error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create new quotation
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId, branchId, userId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            customer_id,
            quotation_date,
            valid_until,
            items,
            notes,
            terms,
        } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'الأصناف مطلوبة' }, { status: 400 });
        }

        // Generate quotation number
        const { data: seqData } = await supabase
            .from('number_sequences')
            .select('next_number, prefix, padding')
            .eq('document_type', 'quotation')
            .single();

        let quotationNumber = 'QT-00001';
        if (seqData) {
            quotationNumber = `${seqData.prefix || 'QT-'}${String(seqData.next_number).padStart(seqData.padding || 5, '0')}`;
            await supabase
                .from('number_sequences')
                .update({ next_number: seqData.next_number + 1 })
                .eq('document_type', 'quotation');
        } else {
            await supabase.from('number_sequences').insert({
                company_id: companyId,
                document_type: 'quotation',
                prefix: 'QT-',
                next_number: 2,
            });
        }

        // Calculate totals
        let subtotal = 0;
        let taxAmount = 0;
        let discountAmount = 0;

        items.forEach((item: { quantity: number; unit_price: number; tax_rate?: number; discount_amount?: number }) => {
            const itemTotal = item.quantity * item.unit_price;
            const itemDiscount = item.discount_amount || 0;
            const itemTax = ((itemTotal - itemDiscount) * (item.tax_rate || 0)) / 100;
            subtotal += itemTotal;
            discountAmount += itemDiscount;
            taxAmount += itemTax;
        });

        const total = subtotal - discountAmount + taxAmount;

        // Create quotation
        const { data: quotation, error: quotationError } = await supabase
            .from('sales_quotations')
            .insert({
                company_id: companyId,
                branch_id: branchId,
                customer_id,
                quotation_number: quotationNumber,
                quotation_date: quotation_date || new Date().toISOString().split('T')[0],
                valid_until,
                subtotal,
                discount_amount: discountAmount,
                tax_amount: taxAmount,
                total,
                status: 'draft',
                notes,
                terms,
                created_by: userId,
            })
            .select()
            .single();

        if (quotationError) {
            console.error('Error creating quotation:', quotationError);
            return NextResponse.json({ error: quotationError.message }, { status: 400 });
        }

        // Create items
        const quotationItems = items.map((item: {
            product_id: string;
            description?: string;
            quantity: number;
            unit_price: number;
            discount_amount?: number;
            tax_rate?: number;
        }) => {
            const itemTotal = item.quantity * item.unit_price;
            const itemDiscount = item.discount_amount || 0;
            const itemTax = ((itemTotal - itemDiscount) * (item.tax_rate || 0)) / 100;

            return {
                quotation_id: quotation.id,
                product_id: item.product_id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                discount_amount: itemDiscount,
                tax_rate: item.tax_rate || 0,
                tax_amount: itemTax,
                total: itemTotal - itemDiscount + itemTax,
            };
        });

        const { error: itemsError } = await supabase
            .from('sales_quotation_items')
            .insert(quotationItems);

        if (itemsError) {
            console.error('Error creating quotation items:', itemsError);
        }

        return NextResponse.json(quotation, { status: 201 });
    } catch (error) {
        console.error('Create quotation error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
