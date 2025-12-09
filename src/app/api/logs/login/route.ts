import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getCompanyId } from '@/lib/company-utils';

// Helper to get client IP
function getClientIP(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    const realIP = request.headers.get('x-real-ip');
    if (realIP) return realIP;
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) return cfConnectingIP;
    return '127.0.0.1';
}

// Helper to parse user agent
function parseUserAgent(userAgent: string | null) {
    if (!userAgent) return { device_type: 'unknown', browser: 'unknown', os: 'unknown' };

    let device_type = 'desktop';
    if (/mobile/i.test(userAgent)) device_type = 'mobile';
    else if (/tablet|ipad/i.test(userAgent)) device_type = 'tablet';

    let browser = 'unknown';
    if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) browser = 'Chrome';
    else if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
    else if (/edge/i.test(userAgent)) browser = 'Edge';

    let os = 'unknown';
    if (/windows/i.test(userAgent)) os = 'Windows';
    else if (/mac/i.test(userAgent)) os = 'macOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';
    else if (/android/i.test(userAgent)) os = 'Android';
    else if (/ios|iphone|ipad/i.test(userAgent)) os = 'iOS';

    return { device_type, browser, os };
}

// GET: Fetch login logs
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const companyId = getCompanyId(request);
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabase
            .from('login_logs')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (userId) query = query.eq('user_id', userId);

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Log a login event
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const companyId = getCompanyId(request);
        const body = await request.json();

        const ip = getClientIP(request);
        const userAgent = request.headers.get('user-agent');
        const { device_type, browser, os } = parseUserAgent(userAgent);

        const { data, error } = await supabase
            .from('login_logs')
            .insert({
                company_id: companyId,
                user_id: body.user_id || null,
                user_email: body.user_email,
                user_name: body.user_name,
                event_type: body.event_type || 'login',
                status: body.status || 'success',
                failure_reason: body.failure_reason || null,
                ip_address: ip,
                user_agent: userAgent,
                device_type,
                browser,
                os,
                metadata: body.metadata || null,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
