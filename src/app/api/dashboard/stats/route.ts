import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Dashboard statistics
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId, branchId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'month'; // day, week, month, year

        // Calculate date range
        const now = new Date();
        let startDate: Date;
        let previousStartDate: Date;
        let previousEndDate: Date;

        switch (period) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                previousStartDate = new Date(startDate);
                previousStartDate.setDate(previousStartDate.getDate() - 1);
                previousEndDate = new Date(startDate);
                break;
            case 'week':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                previousStartDate = new Date(startDate);
                previousStartDate.setDate(previousStartDate.getDate() - 7);
                previousEndDate = new Date(startDate);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
                previousEndDate = new Date(now.getFullYear() - 1, 11, 31);
                break;
            default: // month
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        }

        const startDateStr = startDate.toISOString();
        const previousStartStr = previousStartDate.toISOString();
        const previousEndStr = previousEndDate.toISOString();

        // Current period sales
        const { data: salesData } = await supabase
            .from('sales_invoices')
            .select('total, paid_amount')
            .gte('invoice_date', startDateStr.split('T')[0])
            .in('status', ['confirmed', 'paid']);

        const totalSales = salesData?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
        const totalReceived = salesData?.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0) || 0;

        // Previous period sales
        const { data: prevSalesData } = await supabase
            .from('sales_invoices')
            .select('total')
            .gte('invoice_date', previousStartStr.split('T')[0])
            .lte('invoice_date', previousEndStr.split('T')[0])
            .in('status', ['confirmed', 'paid']);

        const prevSales = prevSalesData?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

        // Current period purchases
        const { data: purchasesData } = await supabase
            .from('purchase_invoices')
            .select('total, paid_amount')
            .gte('invoice_date', startDateStr.split('T')[0])
            .in('status', ['confirmed', 'paid']);

        const totalPurchases = purchasesData?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
        const totalPayments = purchasesData?.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0) || 0;

        // Counts
        const [
            { count: invoicesCount },
            { count: customersCount },
            { count: productsCount },
            { count: lowStockCount },
        ] = await Promise.all([
            supabase.from('sales_invoices').select('*', { count: 'exact', head: true })
                .gte('invoice_date', startDateStr.split('T')[0]),
            supabase.from('customers').select('*', { count: 'exact', head: true })
                .eq('is_active', true),
            supabase.from('products').select('*', { count: 'exact', head: true })
                .eq('is_active', true),
            supabase.from('product_inventory').select('*', { count: 'exact', head: true })
                .lt('quantity', 10), // Low stock threshold
        ]);

        // Customer balances (receivables)
        const { data: receivablesData } = await supabase
            .from('customers')
            .select('balance')
            .gt('balance', 0);

        const totalReceivables = receivablesData?.reduce((sum, c) => sum + (c.balance || 0), 0) || 0;

        // Supplier balances (payables)
        const { data: payablesData } = await supabase
            .from('suppliers')
            .select('balance')
            .gt('balance', 0);

        const totalPayables = payablesData?.reduce((sum, s) => sum + (s.balance || 0), 0) || 0;

        // Vault balances
        const { data: vaultsData } = await supabase
            .from('vaults')
            .select('balance')
            .eq('is_active', true);

        const totalCash = vaultsData?.reduce((sum, v) => sum + (v.balance || 0), 0) || 0;

        // Recent invoices
        const { data: recentInvoices } = await supabase
            .from('sales_invoices')
            .select(`
                id, invoice_number, invoice_date, total, status,
                customer:customers(name, name_ar)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        // Top products
        const { data: topProducts } = await supabase
            .from('sales_invoice_items')
            .select(`
                product_id,
                quantity,
                total,
                product:products(name, name_ar)
            `)
            .order('quantity', { ascending: false })
            .limit(5);

        // Calculate growth
        const salesGrowth = prevSales > 0 ? ((totalSales - prevSales) / prevSales * 100).toFixed(1) : 0;

        return NextResponse.json({
            summary: {
                total_sales: totalSales,
                total_purchases: totalPurchases,
                gross_profit: totalSales - totalPurchases,
                total_receivables: totalReceivables,
                total_payables: totalPayables,
                total_cash: totalCash,
                net_position: totalCash + totalReceivables - totalPayables,
            },
            period_stats: {
                period,
                invoices_count: invoicesCount || 0,
                sales_growth: salesGrowth,
                total_received: totalReceived,
                total_payments: totalPayments,
            },
            counts: {
                customers: customersCount || 0,
                products: productsCount || 0,
                low_stock_items: lowStockCount || 0,
            },
            recent_invoices: recentInvoices || [],
            top_products: topProducts || [],
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
