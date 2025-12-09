import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { BostaAPI } from '@/lib/shipping/bosta';

/**
 * Bosta Webhook Handler
 * Receives tracking updates from Bosta
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const supabase = await createSupabaseServerClient();

        // Extract data from webhook
        const trackingNumber = body.trackingNumber || body.TrackingNumber;
        const stateCode = body.state?.code || body.State?.Code;
        const timestamp = body.timestamp || body.Timestamp || new Date().toISOString();

        if (!trackingNumber || !stateCode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Map Bosta status to our status
        const status = BostaAPI.mapStatus(stateCode);

        // Update shipment
        const updateData: Record<string, string | boolean> = {
            status,
            updated_at: new Date().toISOString(),
        };

        // Handle specific statuses
        if (status === 'delivered') {
            updateData.delivered_at = timestamp;
            updateData.cod_collected = true;
        } else if (status === 'picked_up') {
            updateData.picked_up_at = timestamp;
        }

        const { data: shipment, error } = await supabase
            .from('shipments')
            .update(updateData)
            .eq('tracking_number', trackingNumber)
            .select('id, order_id, status')
            .single();

        if (error) {
            console.error('Error updating shipment:', error);
            return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
        }

        // Update order status if needed
        if (shipment && shipment.order_id) {
            let orderStatus = 'processing';
            if (status === 'delivered') {
                orderStatus = 'delivered';
            } else if (status === 'in_transit' || status === 'out_for_delivery') {
                orderStatus = 'shipped';
            } else if (status === 'returned' || status === 'rts' || status === 'rejected') {
                orderStatus = 'returned';
            }

            await supabase
                .from('sales_orders')
                .update({ status: orderStatus })
                .eq('id', shipment.order_id);
        }

        // Log webhook event
        console.log(`Webhook: ${trackingNumber} -> ${status}`);

        return NextResponse.json({ success: true, status });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Verification endpoint for webhook setup
export async function GET() {
    return NextResponse.json({ status: 'ok', service: 'bosta-webhook' });
}
