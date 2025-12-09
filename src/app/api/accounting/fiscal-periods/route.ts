import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get fiscal periods
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const fiscalYear = searchParams.get('fiscal_year');

        let query = supabase
            .from('fiscal_periods')
            .select('*')
            .order('fiscal_year', { ascending: false })
            .order('period_number', { ascending: true });

        if (fiscalYear) {
            query = query.eq('fiscal_year', parseInt(fiscalYear));
        }

        const { data: periods, error } = await query;

        if (error) {
            console.error('Error fetching periods:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ periods });
    } catch (error) {
        console.error('Fiscal periods error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create fiscal periods for a year
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId, userId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const { fiscal_year } = body;

        if (!fiscal_year) {
            return NextResponse.json({ error: 'السنة المالية مطلوبة' }, { status: 400 });
        }

        // Check if periods already exist
        const { data: existing } = await supabase
            .from('fiscal_periods')
            .select('id')
            .eq('fiscal_year', fiscal_year)
            .limit(1);

        if (existing && existing.length > 0) {
            return NextResponse.json({ error: 'الفترات موجودة بالفعل لهذه السنة' }, { status: 400 });
        }

        // Create 12 monthly periods
        const periods = [];
        const monthNames = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];

        for (let i = 1; i <= 12; i++) {
            const startDate = new Date(fiscal_year, i - 1, 1);
            const endDate = new Date(fiscal_year, i, 0);

            periods.push({
                company_id: companyId,
                fiscal_year,
                period_number: i,
                period_name: monthNames[i - 1],
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                status: 'open',
            });
        }

        const { data, error } = await supabase
            .from('fiscal_periods')
            .insert(periods)
            .select();

        if (error) {
            console.error('Error creating periods:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ periods: data, message: 'تم إنشاء الفترات بنجاح' }, { status: 201 });
    } catch (error) {
        console.error('Create periods error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
