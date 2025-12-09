import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// GET: Get pending device approval requests
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('company_id');

        if (!companyId) {
            return NextResponse.json({ error: 'company_id required' }, { status: 400 });
        }

        // Get users in this company
        const { data: companyUsers } = await supabase
            .from('app_user_companies')
            .select('user_id')
            .eq('company_id', companyId);

        if (!companyUsers || companyUsers.length === 0) {
            return NextResponse.json([]);
        }

        const userIds = companyUsers.map(u => u.user_id);

        // Get pending requests
        const { data, error } = await supabase
            .from('device_approval_requests')
            .select(`
                id, device_fingerprint, device_info, ip_address, status, created_at,
                user:app_users (id, name, email)
            `)
            .in('user_id', userIds)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Get device requests error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Approve or reject device request
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const body = await request.json();

        const { request_id, action, reviewer_id } = body;

        if (!request_id || !action) {
            return NextResponse.json(
                { error: 'request_id and action are required' },
                { status: 400 }
            );
        }

        // Get the request
        const { data: req, error: reqError } = await supabase
            .from('device_approval_requests')
            .select('user_id, device_fingerprint, device_info, ip_address')
            .eq('id', request_id)
            .single();

        if (reqError || !req) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        // Update request status
        await supabase
            .from('device_approval_requests')
            .update({
                status: action === 'approve' ? 'approved' : 'rejected',
                reviewed_by: reviewer_id,
                reviewed_at: new Date().toISOString(),
            })
            .eq('id', request_id);

        // If approved, add to trusted devices
        if (action === 'approve') {
            // Check if device already exists
            const { data: existingDevice } = await supabase
                .from('user_devices')
                .select('id')
                .eq('user_id', req.user_id)
                .eq('device_fingerprint', req.device_fingerprint)
                .single();

            if (existingDevice) {
                // Update existing to trusted
                await supabase
                    .from('user_devices')
                    .update({ is_trusted: true })
                    .eq('id', existingDevice.id);
            } else {
                // Create new trusted device
                await supabase.from('user_devices').insert({
                    user_id: req.user_id,
                    device_fingerprint: req.device_fingerprint,
                    device_name: req.device_info?.browser
                        ? `${req.device_info.browser} على ${req.device_info.os}`
                        : 'جهاز موثوق',
                    device_info: req.device_info,
                    ip_address: req.ip_address,
                    is_trusted: true,
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: action === 'approve' ? 'تمت الموافقة على الجهاز' : 'تم رفض الجهاز',
        });
    } catch (error) {
        console.error('Process device request error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
