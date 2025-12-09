import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getCompanyId } from '@/lib/company-utils';

// GET: Fetch activity logs
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const companyId = getCompanyId(request);
        const { searchParams } = new URL(request.url);
        const modelType = searchParams.get('model_type');
        const modelId = searchParams.get('model_id');

        let query = supabase
            .from('activity_logs')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (modelType) query = query.eq('model_type', modelType);
        if (modelId) query = query.eq('model_id', modelId);

        const { data, error } = await query.limit(50);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create activity log
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const companyId = getCompanyId(request);
        const body = await request.json();

        const { data, error } = await supabase
            .from('activity_logs')
            .insert({
                company_id: companyId,
                user_id: body.user_id || null,
                user_name: body.user_name || 'النظام',
                model_type: body.model_type,
                model_id: body.model_id,
                model_name: body.model_name,
                action_type: body.action_type,
                title: body.title,
                description: body.description,
                changes: body.changes,
                importance: body.importance || 'normal',
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
