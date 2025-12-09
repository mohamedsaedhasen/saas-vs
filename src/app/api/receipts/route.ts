import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get all receipt vouchers
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId, branchId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const fromDate = searchParams.get('from_date');
        const toDate = searchParams.get('to_date');
        const customerId = searchParams.get('customer_id');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        // RLS automatically filters by company_id
        let query = supabase
            .from('receipt_vouchers')
            .select(`
                *,
                customer:customers(id, name, name_ar, phone),
                vault:vaults(id, name, name_ar),
                invoice:sales_invoices(id, invoice_number)
            `, { count: 'exact' })
            .order('receipt_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (branchId) {
            query = query.eq('branch_id', branchId);
        }
        if (customerId) {
            query = query.eq('customer_id', customerId);
        }
        if (fromDate) {
            query = query.gte('receipt_date', fromDate);
        }
        if (toDate) {
            query = query.lte('receipt_date', toDate);
        }

        const { data: receipts, error, count } = await query;

        if (error) {
            console.error('Error fetching receipts:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Get totals
        const { data: stats } = await supabase
            .from('receipt_vouchers')
            .select('amount');

        return NextResponse.json({
            receipts: receipts || [],
            stats: {
                total: stats?.length || 0,
                totalAmount: stats?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0,
            },
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            }
        });
    } catch (error) {
        console.error('Get receipts error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create a new receipt voucher
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId, branchId, userId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            customer_id,
            vault_id,
            invoice_id,
            receipt_date,
            amount,
            payment_method = 'cash',
            reference_number,
            notes,
        } = body;

        if (!customer_id || !amount) {
            return NextResponse.json({ error: 'Customer and amount are required' }, { status: 400 });
        }

        // Generate receipt number
        const { data: sequence } = await supabase
            .from('number_sequences')
            .select('prefix, next_number, padding')
            .eq('document_type', 'receipt')
            .single();

        let receiptNumber = 'REC-00001';
        if (sequence) {
            const paddedNumber = String(sequence.next_number).padStart(sequence.padding || 5, '0');
            receiptNumber = `${sequence.prefix || 'REC-'}${paddedNumber}`;

            await supabase
                .from('number_sequences')
                .update({ next_number: sequence.next_number + 1 })
                .eq('document_type', 'receipt');
        }

        // Create receipt
        const { data: receipt, error } = await supabase
            .from('receipt_vouchers')
            .insert({
                company_id: companyId,
                branch_id: branchId || null,
                customer_id,
                vault_id: vault_id || null,
                invoice_id: invoice_id || null,
                receipt_number: receiptNumber,
                receipt_date: receipt_date || new Date().toISOString().split('T')[0],
                amount,
                payment_method,
                reference_number,
                notes,
                status: 'confirmed',
                created_by: userId || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating receipt:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Update customer balance
        await supabase.rpc('update_customer_balance', {
            p_customer_id: customer_id,
            p_amount: -amount // Negative because payment reduces balance
        });

        // Update invoice paid amount if linked
        if (invoice_id) {
            const { data: invoice } = await supabase
                .from('sales_invoices')
                .select('paid_amount, total')
                .eq('id', invoice_id)
                .single();

            if (invoice) {
                const newPaidAmount = (invoice.paid_amount || 0) + amount;
                const newStatus = newPaidAmount >= invoice.total ? 'paid' : 'partially_paid';

                await supabase
                    .from('sales_invoices')
                    .update({
                        paid_amount: newPaidAmount,
                        status: newStatus
                    })
                    .eq('id', invoice_id);
            }
        }

        // Update vault balance
        if (vault_id) {
            await supabase.rpc('update_vault_balance', {
                p_vault_id: vault_id,
                p_amount: amount
            });
        }

        return NextResponse.json(receipt, { status: 201 });
    } catch (error) {
        console.error('Create receipt error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
