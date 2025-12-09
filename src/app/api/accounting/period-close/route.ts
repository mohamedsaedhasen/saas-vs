import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// POST: Close a fiscal period
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId, userId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const { period_id, action } = body; // action: 'close' or 'reopen'

        if (!period_id) {
            return NextResponse.json({ error: 'معرف الفترة مطلوب' }, { status: 400 });
        }

        // Get current period
        const { data: period, error: fetchError } = await supabase
            .from('fiscal_periods')
            .select('*')
            .eq('id', period_id)
            .single();

        if (fetchError || !period) {
            return NextResponse.json({ error: 'الفترة غير موجودة' }, { status: 404 });
        }

        if (action === 'close') {
            if (period.status === 'closed') {
                return NextResponse.json({ error: 'الفترة مغلقة بالفعل' }, { status: 400 });
            }

            // Check if previous periods are closed (must close in order)
            const { data: openPrevious } = await supabase
                .from('fiscal_periods')
                .select('id')
                .eq('fiscal_year', period.fiscal_year)
                .lt('period_number', period.period_number)
                .eq('status', 'open')
                .limit(1);

            if (openPrevious && openPrevious.length > 0) {
                return NextResponse.json({
                    error: 'يجب إقفال الفترات السابقة أولاً'
                }, { status: 400 });
            }

            // Validate that all journal entries are posted
            const { data: draftEntries } = await supabase
                .from('journal_entries')
                .select('id')
                .gte('entry_date', period.start_date)
                .lte('entry_date', period.end_date)
                .eq('status', 'draft')
                .limit(1);

            if (draftEntries && draftEntries.length > 0) {
                return NextResponse.json({
                    error: 'يوجد قيود غير مرحلة في هذه الفترة'
                }, { status: 400 });
            }

            // Close the period
            const { data: updated, error: updateError } = await supabase
                .from('fiscal_periods')
                .update({
                    status: 'closed',
                    closed_by: userId,
                    closed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', period_id)
                .select()
                .single();

            if (updateError) {
                return NextResponse.json({ error: updateError.message }, { status: 400 });
            }

            return NextResponse.json({
                period: updated,
                message: 'تم إقفال الفترة بنجاح'
            });

        } else if (action === 'reopen') {
            if (period.status !== 'closed') {
                return NextResponse.json({ error: 'الفترة غير مغلقة' }, { status: 400 });
            }

            // Check if next periods are still open (can't reopen if next is closed)
            const { data: closedNext } = await supabase
                .from('fiscal_periods')
                .select('id')
                .eq('fiscal_year', period.fiscal_year)
                .gt('period_number', period.period_number)
                .eq('status', 'closed')
                .limit(1);

            if (closedNext && closedNext.length > 0) {
                return NextResponse.json({
                    error: 'يجب إعادة فتح الفترات اللاحقة أولاً'
                }, { status: 400 });
            }

            // Reopen the period
            const { data: updated, error: updateError } = await supabase
                .from('fiscal_periods')
                .update({
                    status: 'open',
                    reopened_by: userId,
                    reopened_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', period_id)
                .select()
                .single();

            if (updateError) {
                return NextResponse.json({ error: updateError.message }, { status: 400 });
            }

            return NextResponse.json({
                period: updated,
                message: 'تم إعادة فتح الفترة بنجاح'
            });
        }

        return NextResponse.json({ error: 'الإجراء غير صحيح' }, { status: 400 });
    } catch (error) {
        console.error('Period close error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
