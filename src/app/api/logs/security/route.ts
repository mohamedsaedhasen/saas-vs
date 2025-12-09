import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getCompanyId } from '@/lib/company-utils';

// GET: Fetch security logs
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const companyId = getCompanyId(request);
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');
        const eventType = searchParams.get('event_type');
        const severity = searchParams.get('severity');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabase
            .from('security_logs')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (userId) query = query.eq('user_id', userId);
        if (eventType) query = query.eq('event_type', eventType);
        if (severity) query = query.eq('severity', severity);

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

// POST: Log a security event
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const companyId = getCompanyId(request);
        const body = await request.json();

        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() :
            request.headers.get('x-real-ip') || '127.0.0.1';

        const { data, error } = await supabase
            .from('security_logs')
            .insert({
                company_id: companyId,
                user_id: body.user_id || null,
                user_name: body.user_name,
                event_type: body.event_type,
                description: body.description,
                resource_type: body.resource_type,
                resource_id: body.resource_id,
                ip_address: ip,
                user_agent: request.headers.get('user-agent'),
                old_value: body.old_value,
                new_value: body.new_value,
                severity: body.severity || 'medium',
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
