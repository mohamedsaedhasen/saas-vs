import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get sales report
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId, branchId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const fromDate = searchParams.get('from_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const toDate = searchParams.get('to_date') || new Date().toISOString().split('T')[0];

        // Get sales invoices - RLS filters by company_id
        let query = supabase
            .from('sales_invoices')
            .select('id, invoice_number, invoice_date, total, paid_amount, status, customer:customers(name, name_ar)')
            .gte('invoice_date', fromDate)
            .lte('invoice_date', toDate)
            .order('invoice_date', { ascending: false });

        if (branchId) {
            query = query.eq('branch_id', branchId);
        }

        const { data: invoices, error } = await query;

        if (error) {
            console.error('Error fetching sales report:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Calculate summary
        const summary = {
            totalInvoices: invoices?.length || 0,
            totalSales: invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0,
            totalPaid: invoices?.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0) || 0,
            totalUnpaid: invoices?.reduce((sum, inv) => sum + ((inv.total || 0) - (inv.paid_amount || 0)), 0) || 0,
            confirmedInvoices: invoices?.filter(inv => inv.status === 'confirmed' || inv.status === 'paid').length || 0,
            draftInvoices: invoices?.filter(inv => inv.status === 'draft').length || 0,
        };

        // Group by date
        const dailySales: Record<string, { count: number; total: number }> = {};
        invoices?.forEach(inv => {
            const date = inv.invoice_date;
            if (!dailySales[date]) {
                dailySales[date] = { count: 0, total: 0 };
            }
            dailySales[date].count++;
            dailySales[date].total += inv.total || 0;
        });

        return NextResponse.json({
            summary,
            invoices: invoices || [],
            dailySales: Object.entries(dailySales).map(([date, data]) => ({ date, ...data })),
            period: { from: fromDate, to: toDate },
        });
    } catch (error) {
        console.error('Sales report error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
