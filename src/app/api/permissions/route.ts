import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

// GET: Get current user's permissions
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const cookieStore = await cookies();
        const userId = cookieStore.get('user_id')?.value;

        if (!userId) {
            return NextResponse.json({
                userId: null,
                roleName: null,
                permissions: [],
                modules: [],
            });
        }

        // Get user with role
        const { data: user, error: userError } = await supabase
            .from('app_users')
            .select('id, name, role_id')
            .eq('id', userId)
            .single();

        if (userError || !user?.role_id) {
            // Return default permissions for users without role
            return NextResponse.json({
                userId,
                roleName: 'admin', // Default to admin for now
                permissions: [],
                modules: ['dashboard', 'sales', 'purchases', 'inventory', 'products',
                    'customers', 'suppliers', 'accounting', 'shipping', 'reports',
                    'settings', 'users'],
            });
        }

        // Get role
        const { data: role } = await supabase
            .from('roles')
            .select('name, name_ar')
            .eq('id', user.role_id)
            .single();

        // Get role permissions
        const { data: rolePerms } = await supabase
            .from('role_permissions')
            .select(`
                permissions (
                    action,
                    modules (code)
                )
            `)
            .eq('role_id', user.role_id);

        const permissions: Array<{ module: string; action: string }> = [];
        const moduleSet = new Set<string>();

        rolePerms?.forEach((rp: any) => {
            if (rp.permissions?.modules?.code) {
                permissions.push({
                    module: rp.permissions.modules.code,
                    action: rp.permissions.action,
                });
                moduleSet.add(rp.permissions.modules.code);
            }
        });

        return NextResponse.json({
            userId: user.id,
            roleId: user.role_id,
            roleName: role?.name_ar || role?.name || 'unknown',
            permissions,
            modules: Array.from(moduleSet),
        });
    } catch (error) {
        console.error('Error getting permissions:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
