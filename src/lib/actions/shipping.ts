'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getServerCompanyId } from '@/lib/server-company';

// ============================================
// Shipping Stats
// ============================================

export async function getShippingStats() {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    // Shipments count by status
    const { data: shipments } = await supabase
        .from('shipments')
        .select('id, status, cod_amount, cod_collected, cod_settled')
        .eq('company_id', COMPANY_ID);

    const totalShipments = shipments?.length || 0;
    const pendingShipments = shipments?.filter(s => s.status === 'pending').length || 0;
    const inTransitShipments = shipments?.filter(s => ['picked_up', 'in_transit', 'out_for_delivery'].includes(s.status)).length || 0;
    const deliveredShipments = shipments?.filter(s => s.status === 'delivered').length || 0;
    const returnedShipments = shipments?.filter(s => ['returned', 'rts', 'rejected'].includes(s.status)).length || 0;

    // Pending COD
    const pendingCOD = shipments
        ?.filter(s => s.status === 'delivered' && !s.cod_settled)
        .reduce((sum, s) => sum + (s.cod_amount || 0), 0) || 0;

    // Carriers count
    const { count: totalCarriers } = await supabase
        .from('shipping_carriers')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', COMPANY_ID)
        .eq('is_active', true);

    return {
        totalShipments,
        pendingShipments,
        inTransitShipments,
        deliveredShipments,
        returnedShipments,
        pendingCOD,
        totalCarriers: totalCarriers || 0
    };
}

// ============================================
// Carriers
// ============================================

export async function getCarriers() {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data, error } = await supabase
        .from('shipping_carriers')
        .select('*')
        .eq('company_id', COMPANY_ID)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching carriers:', error);
        return [];
    }

    return data || [];
}

export async function getCarrierById(carrierId: string) {
    const supabase = await createSupabaseServerClient();

    const { data: carrier } = await supabase
        .from('shipping_carriers')
        .select('*')
        .eq('id', carrierId)
        .single();

    if (!carrier) return null;

    // Get zones
    const { data: zones } = await supabase
        .from('shipping_zones')
        .select('*')
        .eq('carrier_id', carrierId);

    // Get pricing
    const { data: pricing } = await supabase
        .from('carrier_pricing')
        .select(`
            *,
            zone:shipping_zones(id, name, code),
            service_type:shipping_service_types(id, name, code)
        `)
        .eq('carrier_id', carrierId);

    return { ...carrier, zones: zones || [], pricing: pricing || [] };
}

// ============================================
// Zones
// ============================================

export async function getZonesByCarrier(carrierId: string) {
    const supabase = await createSupabaseServerClient();

    const { data } = await supabase
        .from('shipping_zones')
        .select('*')
        .eq('carrier_id', carrierId)
        .order('name', { ascending: true });

    return data || [];
}

// ============================================
// Service Types
// ============================================

export async function getServiceTypes() {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data } = await supabase
        .from('shipping_service_types')
        .select('*')
        .eq('company_id', COMPANY_ID)
        .eq('is_active', true)
        .order('code', { ascending: true });

    return data || [];
}

// ============================================
// Pricing
// ============================================

export async function getCarrierPricing(carrierId: string) {
    const supabase = await createSupabaseServerClient();

    const { data } = await supabase
        .from('carrier_pricing')
        .select(`
            *,
            zone:shipping_zones(id, name, code),
            service_type:shipping_service_types(id, name, code)
        `)
        .eq('carrier_id', carrierId);

    return data || [];
}

// ============================================
// Shipments
// ============================================

export async function getShipments(limit = 50) {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data, error } = await supabase
        .from('shipments')
        .select(`
            *,
            carrier:shipping_carriers(id, name, code),
            order:sales_orders(order_number, customer_name, total)
        `)
        .eq('company_id', COMPANY_ID)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching shipments:', error);
        return [];
    }

    return data || [];
}

export async function getShipmentsByStatus(status: string) {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data } = await supabase
        .from('shipments')
        .select(`
            *,
            carrier:shipping_carriers(id, name, code),
            order:sales_orders(order_number, customer_name, customer_phone, total)
        `)
        .eq('company_id', COMPANY_ID)
        .eq('status', status)
        .order('created_at', { ascending: false });

    return data || [];
}

// ============================================
// COD Settlements
// ============================================

export async function getCODSettlements() {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data } = await supabase
        .from('cod_settlements')
        .select(`
            *,
            carrier:shipping_carriers(id, name, code)
        `)
        .eq('company_id', COMPANY_ID)
        .order('settlement_date', { ascending: false });

    return data || [];
}

export async function getPendingCOD() {
    const supabase = await createSupabaseServerClient();
    const COMPANY_ID = await getServerCompanyId();

    const { data } = await supabase
        .from('shipments')
        .select(`
            id,
            tracking_number,
            cod_amount,
            delivered_at,
            carrier:shipping_carriers(id, name),
            order:sales_orders(order_number, customer_name)
        `)
        .eq('company_id', COMPANY_ID)
        .eq('status', 'delivered')
        .eq('cod_settled', false)
        .gt('cod_amount', 0)
        .order('delivered_at', { ascending: true });

    return data || [];
}
