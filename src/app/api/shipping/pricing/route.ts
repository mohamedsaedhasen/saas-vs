import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const carrierId = searchParams.get('carrier');
        const zoneId = searchParams.get('zone');
        const serviceCode = searchParams.get('service') || 'DELIVERY';

        if (!carrierId || !zoneId) {
            return NextResponse.json({ price: 0 });
        }

        const supabase = await createSupabaseServerClient();

        // Get service type ID
        const { data: serviceType } = await supabase
            .from('shipping_service_types')
            .select('id')
            .eq('code', serviceCode)
            .single();

        if (!serviceType) {
            return NextResponse.json({ price: 0 });
        }

        // Get pricing
        const { data: pricing } = await supabase
            .from('carrier_pricing')
            .select('price')
            .eq('carrier_id', carrierId)
            .eq('zone_id', zoneId)
            .eq('service_type_id', serviceType.id)
            .single();

        return NextResponse.json({ price: pricing?.price || 0 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ price: 0 });
    }
}
