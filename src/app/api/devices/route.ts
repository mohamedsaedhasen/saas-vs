import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

// POST: Register/verify device for a user
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const body = await request.json();

        const { user_id, fingerprint, device_info, ip_address } = body;

        if (!user_id || !fingerprint) {
            return NextResponse.json(
                { error: 'user_id and fingerprint are required' },
                { status: 400 }
            );
        }

        // Check if user has device restriction enabled
        const { data: user } = await supabase
            .from('app_users')
            .select('device_restriction_enabled')
            .eq('id', user_id)
            .single();

        // If device restriction is not enabled, allow access
        if (!user?.device_restriction_enabled) {
            return NextResponse.json({
                allowed: true,
                reason: 'device_restriction_disabled',
            });
        }

        // Check if this device is already trusted
        const { data: existingDevice } = await supabase
            .from('user_devices')
            .select('id, is_trusted, device_name')
            .eq('user_id', user_id)
            .eq('device_fingerprint', fingerprint)
            .single();

        if (existingDevice) {
            if (existingDevice.is_trusted) {
                // Update last used
                await supabase
                    .from('user_devices')
                    .update({ last_used_at: new Date().toISOString() })
                    .eq('id', existingDevice.id);

                return NextResponse.json({
                    allowed: true,
                    device_name: existingDevice.device_name,
                });
            } else {
                // Device exists but not trusted yet
                return NextResponse.json({
                    allowed: false,
                    reason: 'device_pending_approval',
                    message: 'هذا الجهاز في انتظار الموافقة من المدير',
                });
            }
        }

        // New device - check if user has any trusted devices
        const { data: trustedDevices } = await supabase
            .from('user_devices')
            .select('id')
            .eq('user_id', user_id)
            .eq('is_trusted', true);

        // If no trusted devices exist, auto-trust the first device
        const isFirstDevice = !trustedDevices || trustedDevices.length === 0;

        // Register the new device
        const { data: newDevice, error: deviceError } = await supabase
            .from('user_devices')
            .insert({
                user_id,
                device_fingerprint: fingerprint,
                device_name: device_info?.browser ? `${device_info.browser} على ${device_info.os}` : 'جهاز جديد',
                device_info,
                ip_address,
                is_trusted: isFirstDevice, // Auto-trust first device
                is_current: true,
            })
            .select()
            .single();

        if (deviceError) {
            console.error('Device registration error:', deviceError);
            return NextResponse.json(
                { error: 'Failed to register device' },
                { status: 400 }
            );
        }

        if (isFirstDevice) {
            return NextResponse.json({
                allowed: true,
                message: 'تم تسجيل الجهاز الأول تلقائياً',
                device_name: newDevice.device_name,
            });
        }

        // Create approval request for new device
        await supabase.from('device_approval_requests').insert({
            user_id,
            device_fingerprint: fingerprint,
            device_info,
            ip_address,
            status: 'pending',
        });

        return NextResponse.json({
            allowed: false,
            reason: 'new_device_needs_approval',
            message: 'تم اكتشاف جهاز جديد. يحتاج موافقة المدير للسماح بالدخول.',
        });
    } catch (error) {
        console.error('Device verification error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET: Get user's devices
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json(
                { error: 'user_id is required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('user_devices')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Get devices error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Remove a device
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { searchParams } = new URL(request.url);
        const deviceId = searchParams.get('device_id');

        if (!deviceId) {
            return NextResponse.json(
                { error: 'device_id is required' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('user_devices')
            .delete()
            .eq('id', deviceId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete device error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
