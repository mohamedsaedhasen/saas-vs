import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// GET: Get all permissions
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const { data, error } = await supabase
            .from('permissions')
            .select(`
                id, action, description,
                module:modules (id, code, name, name_ar)
            `);

        if (error) {
            console.error('Error fetching permissions:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Permissions API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
