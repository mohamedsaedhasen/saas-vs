import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get profit and loss report
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId, branchId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const fromDate = searchParams.get('from_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const toDate = searchParams.get('to_date') || new Date().toISOString().split('T')[0];

        // Get sales - RLS filters by company_id
        let salesQuery = supabase
            .from('sales_invoices')
            .select('total, subtotal, discount_amount')
            .in('status', ['confirmed', 'paid', 'partially_paid'])
            .gte('invoice_date', fromDate)
            .lte('invoice_date', toDate);

        if (branchId) salesQuery = salesQuery.eq('branch_id', branchId);

        const { data: sales } = await salesQuery;

        // Get purchases - RLS filters by company_id
        let purchasesQuery = supabase
            .from('purchase_invoices')
            .select('total, subtotal, discount_amount')
            .in('status', ['confirmed', 'paid', 'partially_paid'])
            .gte('invoice_date', fromDate)
            .lte('invoice_date', toDate);

        if (branchId) purchasesQuery = purchasesQuery.eq('branch_id', branchId);

        const { data: purchases } = await purchasesQuery;

        // Get receipts (income from customers)
        let receiptsQuery = supabase
            .from('receipt_vouchers')
            .select('amount')
            .gte('receipt_date', fromDate)
            .lte('receipt_date', toDate);

        if (branchId) receiptsQuery = receiptsQuery.eq('branch_id', branchId);

        const { data: receipts } = await receiptsQuery;

        // Get payments (expenses to suppliers)
        let paymentsQuery = supabase
            .from('payment_vouchers')
            .select('amount')
            .gte('payment_date', fromDate)
            .lte('payment_date', toDate);

        if (branchId) paymentsQuery = paymentsQuery.eq('branch_id', branchId);

        const { data: payments } = await paymentsQuery;

        // Calculate report
        const totalSales = sales?.reduce((sum, s) => sum + (s.total || 0), 0) || 0;
        const totalSalesDiscounts = sales?.reduce((sum, s) => sum + (s.discount_amount || 0), 0) || 0;
        const totalPurchases = purchases?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
        const totalPurchaseDiscounts = purchases?.reduce((sum, p) => sum + (p.discount_amount || 0), 0) || 0;
        const totalReceipts = receipts?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
        const totalPayments = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

        const grossProfit = totalSales - totalPurchases;
        const netCashFlow = totalReceipts - totalPayments;

        return NextResponse.json({
            period: { from: fromDate, to: toDate },
            income: {
                sales: totalSales,
                discountsGiven: totalSalesDiscounts,
                netSales: totalSales - totalSalesDiscounts,
            },
            expenses: {
                purchases: totalPurchases,
                discountsReceived: totalPurchaseDiscounts,
                netPurchases: totalPurchases - totalPurchaseDiscounts,
            },
            summary: {
                grossProfit,
                profitMargin: totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(2) : 0,
            },
            cashFlow: {
                receipts: totalReceipts,
                payments: totalPayments,
                netCashFlow,
            },
        });
    } catch (error) {
        console.error('P&L report error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
