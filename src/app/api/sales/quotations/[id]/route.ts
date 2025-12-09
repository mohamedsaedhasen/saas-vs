import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get single quotation
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        const { data: quotation, error } = await supabase
            .from('sales_quotations')
            .select(`
                *,
                customer:customers(id, code, name, name_ar, phone, email, address),
                branch:branches(id, name, name_ar),
                items:sales_quotation_items(
                    id, product_id, quantity, unit_price, discount_amount,
                    tax_rate, tax_amount, total, description,
                    product:products(id, sku, name, name_ar, selling_price)
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching quotation:', error);
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        return NextResponse.json(quotation);
    } catch (error) {
        console.error('Get quotation error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// PUT: Update quotation
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase, userId } = await createSupabaseServerClientWithContext();
        const { id } = await params;
        const body = await request.json();

        // Get current quotation
        const { data: current, error: fetchError } = await supabase
            .from('sales_quotations')
            .select('status')
            .eq('id', id)
            .single();

        if (fetchError || !current) {
            return NextResponse.json({ error: 'عرض السعر غير موجود' }, { status: 404 });
        }

        if (current.status !== 'draft') {
            return NextResponse.json({ error: 'لا يمكن تعديل عرض سعر غير مسودة' }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        // Update allowed fields
        const allowedFields = ['customer_id', 'valid_until', 'notes', 'terms', 'status'];
        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        });

        if (body.status === 'sent') {
            updateData.sent_at = new Date().toISOString();
        }

        const { data: updated, error: updateError } = await supabase
            .from('sales_quotations')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 400 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Update quotation error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// DELETE: Delete draft quotation
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        // Check status
        const { data: current } = await supabase
            .from('sales_quotations')
            .select('status')
            .eq('id', id)
            .single();

        if (!current) {
            return NextResponse.json({ error: 'عرض السعر غير موجود' }, { status: 404 });
        }

        if (current.status !== 'draft') {
            return NextResponse.json({ error: 'لا يمكن حذف عرض سعر غير مسودة' }, { status: 400 });
        }

        // Delete items first
        await supabase
            .from('sales_quotation_items')
            .delete()
            .eq('quotation_id', id);

        // Delete quotation
        const { error } = await supabase
            .from('sales_quotations')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete quotation error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
