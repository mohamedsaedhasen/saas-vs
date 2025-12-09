import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get single journal entry
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        const { data: entry, error } = await supabase
            .from('journal_entries')
            .select(`
                *,
                branch:branches(id, name, name_ar),
                lines:journal_entry_lines(
                    id, account_id, description, debit, credit,
                    partner_type, partner_id,
                    account:accounts(id, code, name, name_ar, account_type)
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        return NextResponse.json(entry);
    } catch (error) {
        console.error('Get journal entry error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// PUT: Update or post journal entry
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase, userId } = await createSupabaseServerClientWithContext();
        const { id } = await params;
        const body = await request.json();

        const { data: current } = await supabase
            .from('journal_entries')
            .select('status, is_auto_generated')
            .eq('id', id)
            .single();

        if (!current) {
            return NextResponse.json({ error: 'القيد غير موجود' }, { status: 404 });
        }

        if (current.is_auto_generated && body.action !== 'post') {
            return NextResponse.json({ error: 'لا يمكن تعديل قيد تلقائي' }, { status: 400 });
        }

        if (current.status === 'posted' && body.action !== 'reverse') {
            return NextResponse.json({ error: 'لا يمكن تعديل قيد مرحل' }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (body.action === 'post' && current.status === 'draft') {
            // Get entry lines and update account balances
            const { data: lines } = await supabase
                .from('journal_entry_lines')
                .select('account_id, debit, credit')
                .eq('journal_entry_id', id);

            if (lines) {
                for (const line of lines) {
                    const netChange = (line.debit || 0) - (line.credit || 0);

                    // Update account balance
                    await supabase.rpc('update_account_balance', {
                        p_account_id: line.account_id,
                        p_amount: netChange,
                    });
                }
            }

            updateData.status = 'posted';
            updateData.posted_by = userId;
            updateData.posted_at = new Date().toISOString();
        }

        if (body.description) updateData.description = body.description;

        const { data: updated, error } = await supabase
            .from('journal_entries')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Update journal entry error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// DELETE: Delete draft journal entry
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await createSupabaseServerClientWithContext();
        const { id } = await params;

        const { data: current } = await supabase
            .from('journal_entries')
            .select('status, is_auto_generated')
            .eq('id', id)
            .single();

        if (!current) {
            return NextResponse.json({ error: 'القيد غير موجود' }, { status: 404 });
        }

        if (current.status !== 'draft') {
            return NextResponse.json({ error: 'لا يمكن حذف قيد مرحل' }, { status: 400 });
        }

        if (current.is_auto_generated) {
            return NextResponse.json({ error: 'لا يمكن حذف قيد تلقائي' }, { status: 400 });
        }

        await supabase.from('journal_entry_lines').delete().eq('journal_entry_id', id);
        const { error } = await supabase.from('journal_entries').delete().eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete journal entry error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
