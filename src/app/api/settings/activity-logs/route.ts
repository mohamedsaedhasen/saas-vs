import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: List activity logs
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId, branchId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const userId = searchParams.get('user_id');
        const action = searchParams.get('action');
        const module = searchParams.get('module');
        const fromDate = searchParams.get('from_date');
        const toDate = searchParams.get('to_date');

        const offset = (page - 1) * limit;

        let query = supabase
            .from('user_activity_logs')
            .select('*', { count: 'exact' });

        if (branchId) query = query.eq('branch_id', branchId);
        if (userId) query = query.eq('user_id', userId);
        if (action) query = query.eq('action', action);
        if (module) query = query.eq('module', module);
        if (fromDate) query = query.gte('created_at', fromDate);
        if (toDate) query = query.lte('created_at', toDate);

        const { data: logs, count, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching logs:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Activity logs error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Log an activity (internal use)
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId, branchId, userId } = await createSupabaseServerClientWithContext();

        const body = await request.json();
        const {
            action,
            module,
            resource_type,
            resource_id,
            resource_name,
            old_values,
            new_values,
        } = body;

        // Get user info
        let userName = '';
        let userEmail = '';

        if (userId) {
            const { data: user } = await supabase
                .from('app_users')
                .select('name, email')
                .eq('id', userId)
                .single();
            if (user) {
                userName = user.name;
                userEmail = user.email;
            }
        }

        // Get IP from headers
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
        const userAgent = request.headers.get('user-agent') || '';

        const { data: log, error } = await supabase
            .from('user_activity_logs')
            .insert({
                company_id: companyId,
                branch_id: branchId,
                user_id: userId,
                user_name: userName,
                user_email: userEmail,
                action,
                module,
                resource_type,
                resource_id,
                resource_name,
                old_values,
                new_values,
                ip_address: ip,
                user_agent: userAgent,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating log:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(log, { status: 201 });
    } catch (error) {
        console.error('Create log error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
