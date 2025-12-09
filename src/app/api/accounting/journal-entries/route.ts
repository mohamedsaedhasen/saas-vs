import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: List journal entries
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
        const fromDate = searchParams.get('from_date');
        const toDate = searchParams.get('to_date');
        const referenceType = searchParams.get('reference_type');

        const offset = (page - 1) * limit;

        let query = supabase
            .from('journal_entries')
            .select(`
                *,
                branch:branches(id, name, name_ar),
                lines:journal_entry_lines(
                    id, account_id, description, debit, credit,
                    account:accounts(id, code, name, name_ar)
                )
            `, { count: 'exact' });

        if (branchId) query = query.eq('branch_id', branchId);
        if (status) query = query.eq('status', status);
        if (fromDate) query = query.gte('entry_date', fromDate);
        if (toDate) query = query.lte('entry_date', toDate);
        if (referenceType) query = query.eq('reference_type', referenceType);

        const { data: entries, count, error } = await query
            .order('entry_date', { ascending: false })
            .order('entry_number', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching entries:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
            entries,
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Journal entries error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create manual journal entry
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId, branchId, userId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const { entry_date, description, lines, notes } = body;

        if (!entry_date) {
            return NextResponse.json({ error: 'تاريخ القيد مطلوب' }, { status: 400 });
        }

        if (!lines || lines.length < 2) {
            return NextResponse.json({ error: 'القيد يجب أن يحتوي على سطرين على الأقل' }, { status: 400 });
        }

        // Validate debit = credit
        let totalDebit = 0;
        let totalCredit = 0;
        lines.forEach((line: { debit?: number; credit?: number }) => {
            totalDebit += line.debit || 0;
            totalCredit += line.credit || 0;
        });

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return NextResponse.json({ error: 'القيد غير متوازن' }, { status: 400 });
        }

        // Generate entry number
        const { data: seqData } = await supabase
            .from('number_sequences')
            .select('next_number, prefix, padding')
            .eq('document_type', 'journal_entry')
            .single();

        let entryNumber = 'JE-00001';
        if (seqData) {
            entryNumber = `${seqData.prefix || 'JE-'}${String(seqData.next_number).padStart(seqData.padding || 5, '0')}`;
            await supabase
                .from('number_sequences')
                .update({ next_number: seqData.next_number + 1 })
                .eq('document_type', 'journal_entry');
        } else {
            await supabase.from('number_sequences').insert({
                company_id: companyId,
                document_type: 'journal_entry',
                prefix: 'JE-',
                next_number: 2,
            });
        }

        // Create entry
        const { data: entry, error: entryError } = await supabase
            .from('journal_entries')
            .insert({
                company_id: companyId,
                branch_id: branchId,
                entry_number: entryNumber,
                entry_date,
                description,
                reference_type: 'manual',
                total_debit: totalDebit,
                total_credit: totalCredit,
                status: 'draft',
                is_auto_generated: false,
                created_by: userId,
            })
            .select()
            .single();

        if (entryError) {
            console.error('Error creating entry:', entryError);
            return NextResponse.json({ error: entryError.message }, { status: 400 });
        }

        // Create lines
        const entryLines = lines.map((line: {
            account_id: string;
            description?: string;
            debit?: number;
            credit?: number;
            partner_type?: string;
            partner_id?: string;
        }) => ({
            journal_entry_id: entry.id,
            account_id: line.account_id,
            description: line.description,
            debit: line.debit || 0,
            credit: line.credit || 0,
            partner_type: line.partner_type,
            partner_id: line.partner_id,
        }));

        const { error: linesError } = await supabase
            .from('journal_entry_lines')
            .insert(entryLines);

        if (linesError) {
            console.error('Error creating lines:', linesError);
        }

        return NextResponse.json(entry, { status: 201 });
    } catch (error) {
        console.error('Create journal entry error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
