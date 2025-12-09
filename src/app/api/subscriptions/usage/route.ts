import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get usage statistics
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const metricType = searchParams.get('metric_type');
        const months = parseInt(searchParams.get('months') || '6');

        // Get historical usage
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        let query = supabase
            .from('usage_tracking')
            .select('*')
            .gte('period_start', startDate.toISOString().split('T')[0])
            .order('period_start', { ascending: false });

        if (metricType) {
            query = query.eq('metric_type', metricType);
        }

        const { data: usage, error } = await query;

        if (error) {
            console.error('Error fetching usage:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Get current month stats
        const currentMonth = new Date();
        const periodStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
            .toISOString().split('T')[0];

        // Get real-time counts
        const [
            { count: invoicesCount },
            { count: usersCount },
            { count: productsCount },
            { count: branchesCount },
        ] = await Promise.all([
            supabase.from('sales_invoices').select('*', { count: 'exact', head: true })
                .gte('invoice_date', periodStart),
            supabase.from('app_user_companies').select('*', { count: 'exact', head: true })
                .eq('company_id', companyId),
            supabase.from('products').select('*', { count: 'exact', head: true })
                .eq('is_active', true),
            supabase.from('branches').select('*', { count: 'exact', head: true })
                .eq('is_active', true),
        ]);

        return NextResponse.json({
            current_period: periodStart,
            current_usage: {
                invoices: invoicesCount || 0,
                users: usersCount || 0,
                products: productsCount || 0,
                branches: branchesCount || 0,
            },
            history: usage,
        });
    } catch (error) {
        console.error('Usage tracking error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
