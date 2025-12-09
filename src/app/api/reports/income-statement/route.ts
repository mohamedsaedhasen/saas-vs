import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get income statement report
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId, branchId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const fromDate = searchParams.get('from_date') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
        const toDate = searchParams.get('to_date') || new Date().toISOString().split('T')[0];

        // Get revenue accounts (4xxx)
        const { data: revenueAccounts } = await supabase
            .from('accounts')
            .select('id, code, name, name_ar, balance')
            .eq('account_type', 'revenue')
            .eq('is_active', true)
            .eq('is_header', false)
            .order('code');

        // Get expense accounts (5xxx)
        const { data: expenseAccounts } = await supabase
            .from('accounts')
            .select('id, code, name, name_ar, balance')
            .eq('account_type', 'expense')
            .eq('is_active', true)
            .eq('is_header', false)
            .order('code');

        // Calculate totals
        const revenues = revenueAccounts?.map(acc => ({
            code: acc.code,
            name: acc.name,
            name_ar: acc.name_ar,
            amount: Math.abs(acc.balance || 0),
        })) || [];

        const expenses = expenseAccounts?.map(acc => ({
            code: acc.code,
            name: acc.name,
            name_ar: acc.name_ar,
            amount: Math.abs(acc.balance || 0),
        })) || [];

        const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const netIncome = totalRevenue - totalExpenses;

        // Get sales summary
        let salesQuery = supabase
            .from('sales_invoices')
            .select('total, discount_amount')
            .in('status', ['confirmed', 'paid', 'partially_paid'])
            .gte('invoice_date', fromDate)
            .lte('invoice_date', toDate);

        if (branchId) salesQuery = salesQuery.eq('branch_id', branchId);
        const { data: sales } = await salesQuery;

        // Get COGS from sales invoice items
        let cogsQuery = supabase
            .from('sales_invoice_items')
            .select('quantity, cost_price, invoice:sales_invoices!inner(status, invoice_date)')
            .gte('invoice.invoice_date', fromDate)
            .lte('invoice.invoice_date', toDate);

        const { data: cogsItems } = await cogsQuery;

        const grossSales = sales?.reduce((sum, s) => sum + (s.total || 0), 0) || 0;
        const salesDiscounts = sales?.reduce((sum, s) => sum + (s.discount_amount || 0), 0) || 0;
        const netSales = grossSales;
        const cogs = cogsItems?.reduce((sum, item) => sum + ((item.quantity || 0) * (item.cost_price || 0)), 0) || 0;
        const grossProfit = netSales - cogs;

        return NextResponse.json({
            report: 'income_statement',
            period: { from: fromDate, to: toDate },
            revenue: {
                items: revenues.filter(r => r.amount > 0),
                gross_sales: grossSales,
                sales_discounts: salesDiscounts,
                net_sales: netSales,
                other_revenue: totalRevenue - netSales,
                total: totalRevenue,
            },
            cost_of_goods_sold: {
                cogs,
            },
            gross_profit: grossProfit,
            gross_profit_margin: netSales > 0 ? ((grossProfit / netSales) * 100).toFixed(2) : 0,
            operating_expenses: {
                items: expenses.filter(e => e.amount > 0 && !e.code.startsWith('51')),
                total: expenses.filter(e => !e.code.startsWith('51')).reduce((sum, e) => sum + e.amount, 0),
            },
            total_expenses: totalExpenses,
            net_income: netIncome,
            net_profit_margin: totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(2) : 0,
        });
    } catch (error) {
        console.error('Income statement error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
