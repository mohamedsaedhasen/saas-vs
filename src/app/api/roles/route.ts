import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// GET: Get all roles for a company
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('company_id');

        if (!companyId) {
            return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('roles')
            .select('id, name, name_ar, description, is_system, is_active')
            .eq('company_id', companyId)
            .eq('is_active', true)
            .order('name');

        if (error) {
            console.error('Error fetching roles:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Roles API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create new role
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const body = await request.json();

        const { company_id, name, name_ar, description, permissions } = body;

        if (!company_id || !name) {
            return NextResponse.json(
                { error: 'company_id and name are required' },
                { status: 400 }
            );
        }

        // Create role
        const { data: role, error: roleError } = await supabase
            .from('roles')
            .insert({
                company_id,
                name,
                name_ar,
                description,
                is_system: false,
            })
            .select()
            .single();

        if (roleError) {
            return NextResponse.json({ error: roleError.message }, { status: 400 });
        }

        // Add permissions if provided
        if (permissions && permissions.length > 0) {
            const rolePerms = permissions.map((permId: string) => ({
                role_id: role.id,
                permission_id: permId,
            }));

            await supabase.from('role_permissions').insert(rolePerms);
        }

        return NextResponse.json(role);
    } catch (error) {
        console.error('Create role error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
