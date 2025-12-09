'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getServerCompanyId } from '@/lib/server-company';

// ============================================
// Purchase Stats
// ============================================

export async function getPurchaseStats() {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    // Purchase invoices this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);

    const { data: invoices } = await supabase
        .from('invoices')
        .select('id, total, paid_amount, remaining_amount, status, payment_status')
        .eq('company_id', COMPANY_ID)
        .eq('invoice_type', 'purchase')
        .gte('invoice_date', startOfMonth.toISOString().split('T')[0]);

    const totalPurchases = invoices?.reduce((sum, i) => sum + (i.total || 0), 0) || 0;
    const unpaidAmount = invoices?.reduce((sum, i) => sum + (i.remaining_amount || 0), 0) || 0;
    const invoicesCount = invoices?.length || 0;

    // Suppliers count
    const { count: suppliersCount } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', COMPANY_ID)
        .eq('contact_type', 'supplier');

    return {
        totalPurchases,
        unpaidAmount,
        invoicesCount,
        suppliersCount: suppliersCount || 0
    };
}

// ============================================
// Suppliers
// ============================================

export async function getSuppliers(limit = 50) {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data, error } = await supabase
        .from('contacts')
        .select(`
            id,
            code,
            name,
            name_en,
            phone,
            email,
            city,
            balance:current_balance,
            credit_balance,
            credit_limit,
            is_active
        `)
        .eq('company_id', COMPANY_ID)
        .eq('contact_type', 'supplier')
        .order('name', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching suppliers:', error);
        return [];
    }

    return data || [];
}

export async function getSupplierById(supplierId: string) {
    const supabase = await createSupabaseServerClient();

    const { data: supplier } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', supplierId)
        .single();

    if (!supplier) return null;

    // Get supplier invoices
    const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, invoice_date, total, status, payment_status')
        .eq('contact_id', supplierId)
        .eq('invoice_type', 'purchase')
        .order('invoice_date', { ascending: false })
        .limit(10);

    return { ...supplier, invoices: invoices || [] };
}

export async function getSupplierStats() {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data } = await supabase
        .from('contacts')
        .select('id, balance:current_balance')
        .eq('company_id', COMPANY_ID)
        .eq('contact_type', 'supplier');

    const total = data?.length || 0;
    const totalBalance = data?.reduce((sum, s) => sum + ((s as { balance?: number }).balance || 0), 0) || 0;

    return { total, totalBalance };
}
