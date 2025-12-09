import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get supplier aging report
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const asOfDate = searchParams.get('as_of_date') || new Date().toISOString().split('T')[0];

        // Get all unpaid/partially paid purchase invoices with supplier info
        const { data: invoices, error } = await supabase
            .from('purchase_invoices')
            .select(`
                id, invoice_number, invoice_date, due_date, total, paid_amount,
                supplier:suppliers(id, code, name, name_ar, phone, balance)
            `)
            .in('status', ['confirmed', 'partially_paid'])
            .lte('invoice_date', asOfDate)
            .order('supplier_id')
            .order('invoice_date');

        if (error) {
            console.error('Error fetching invoices:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        const today = new Date(asOfDate);

        // Calculate aging for each invoice
        const agingData = invoices?.map(inv => {
            const remaining = (inv.total || 0) - (inv.paid_amount || 0);
            const invoiceDate = new Date(inv.invoice_date);
            const daysPastDue = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));

            let agingBucket: 'current' | '1-30' | '31-60' | '61-90' | 'over90';
            if (daysPastDue <= 0) agingBucket = 'current';
            else if (daysPastDue <= 30) agingBucket = '1-30';
            else if (daysPastDue <= 60) agingBucket = '31-60';
            else if (daysPastDue <= 90) agingBucket = '61-90';
            else agingBucket = 'over90';

            return {
                invoice_number: inv.invoice_number,
                invoice_date: inv.invoice_date,
                due_date: inv.due_date,
                supplier: inv.supplier,
                total: inv.total,
                paid: inv.paid_amount,
                remaining,
                days_past_due: daysPastDue,
                aging_bucket: agingBucket,
            };
        }) || [];

        // Group by supplier
        const supplierAging: Record<string, {
            supplier: { id: string; name: string; phone: string; balance: number };
            invoices: typeof agingData;
            totals: Record<string, number>;
            total_outstanding: number;
        }> = {};

        agingData.forEach(inv => {
            const supplierId = (inv.supplier as { id: string })?.id || 'unknown';

            if (!supplierAging[supplierId]) {
                supplierAging[supplierId] = {
                    supplier: {
                        id: (inv.supplier as { id: string })?.id || '',
                        name: (inv.supplier as { name_ar?: string; name?: string })?.name_ar || (inv.supplier as { name?: string })?.name || 'غير معروف',
                        phone: (inv.supplier as { phone?: string })?.phone || '',
                        balance: (inv.supplier as { balance?: number })?.balance || 0,
                    },
                    invoices: [],
                    totals: { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, 'over90': 0 },
                    total_outstanding: 0,
                };
            }

            supplierAging[supplierId].invoices.push(inv);
            supplierAging[supplierId].totals[inv.aging_bucket] += inv.remaining;
            supplierAging[supplierId].total_outstanding += inv.remaining;
        });

        // Calculate summary
        const summary = {
            current: 0,
            '1-30': 0,
            '31-60': 0,
            '61-90': 0,
            'over90': 0,
            total: 0,
        };

        Object.values(supplierAging).forEach(sa => {
            summary.current += sa.totals.current;
            summary['1-30'] += sa.totals['1-30'];
            summary['31-60'] += sa.totals['31-60'];
            summary['61-90'] += sa.totals['61-90'];
            summary['over90'] += sa.totals['over90'];
            summary.total += sa.total_outstanding;
        });

        return NextResponse.json({
            report: 'supplier_aging',
            as_of_date: asOfDate,
            suppliers: Object.values(supplierAging).sort((a, b) => b.total_outstanding - a.total_outstanding),
            summary,
            total_suppliers: Object.keys(supplierAging).length,
            aging_buckets: [
                { key: 'current', label: 'جاري', label_en: 'Current' },
                { key: '1-30', label: '1-30 يوم', label_en: '1-30 Days' },
                { key: '31-60', label: '31-60 يوم', label_en: '31-60 Days' },
                { key: '61-90', label: '61-90 يوم', label_en: '61-90 Days' },
                { key: 'over90', label: 'أكثر من 90', label_en: 'Over 90 Days' },
            ],
        });
    } catch (error) {
        console.error('Supplier aging error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
