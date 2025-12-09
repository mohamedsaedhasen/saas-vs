import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// GET: Get all modules
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const { data, error } = await supabase
            .from('modules')
            .select('id, code, name, name_ar, icon, route, sort_order')
            .eq('is_active', true)
            .order('sort_order');

        if (error) {
            console.error('Error fetching modules:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Modules API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
