import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// GET: Check if role has specific permission
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ roleId: string }> }
) {
    try {
        const { roleId } = await params;
        const { searchParams } = new URL(request.url);
        const moduleCode = searchParams.get('module');
        const action = searchParams.get('action');

        if (!moduleCode || !action) {
            return NextResponse.json({ hasPermission: false });
        }

        const supabase = await createSupabaseServerClient();

        // Get module
        const { data: module } = await supabase
            .from('modules')
            .select('id')
            .eq('code', moduleCode)
            .single();

        if (!module) {
            return NextResponse.json({ hasPermission: false });
        }

        // Get permission
        const { data: permission } = await supabase
            .from('permissions')
            .select('id')
            .eq('module_id', module.id)
            .eq('action', action)
            .single();

        if (!permission) {
            return NextResponse.json({ hasPermission: false });
        }

        // Check if role has this permission
        const { data: rolePermission } = await supabase
            .from('role_permissions')
            .select('id')
            .eq('role_id', roleId)
            .eq('permission_id', permission.id)
            .single();

        return NextResponse.json({ hasPermission: !!rolePermission });
    } catch (error) {
        console.error('Error checking permission:', error);
        return NextResponse.json({ hasPermission: false });
    }
}

// POST: Add permission to role
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ roleId: string }> }
) {
    try {
        const { roleId } = await params;
        const { module: moduleCode, action } = await request.json();

        const supabase = await createSupabaseServerClient();

        // Get module
        const { data: module } = await supabase
            .from('modules')
            .select('id')
            .eq('code', moduleCode)
            .single();

        if (!module) {
            return NextResponse.json({ error: 'Module not found' }, { status: 404 });
        }

        // Get permission
        const { data: permission } = await supabase
            .from('permissions')
            .select('id')
            .eq('module_id', module.id)
            .eq('action', action)
            .single();

        if (!permission) {
            return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
        }

        // Add permission to role
        await supabase.from('role_permissions').insert({
            role_id: roleId,
            permission_id: permission.id,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error adding permission:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove permission from role
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ roleId: string }> }
) {
    try {
        const { roleId } = await params;
        const { module: moduleCode, action } = await request.json();

        const supabase = await createSupabaseServerClient();

        // Get module
        const { data: module } = await supabase
            .from('modules')
            .select('id')
            .eq('code', moduleCode)
            .single();

        if (!module) {
            return NextResponse.json({ error: 'Module not found' }, { status: 404 });
        }

        // Get permission
        const { data: permission } = await supabase
            .from('permissions')
            .select('id')
            .eq('module_id', module.id)
            .eq('action', action)
            .single();

        if (!permission) {
            return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
        }

        // Remove permission from role
        await supabase
            .from('role_permissions')
            .delete()
            .eq('role_id', roleId)
            .eq('permission_id', permission.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing permission:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
