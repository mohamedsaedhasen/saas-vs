'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

// ============================================
// Types
// ============================================

export interface Permission {
    module: string;
    action: 'read' | 'write' | 'delete' | 'export' | 'import';
}

export interface UserPermissions {
    userId: string;
    roleId: string;
    roleName: string;
    permissions: Permission[];
    modules: string[]; // قائمة الوحدات المسموح بها
}

// ============================================
// Get User Permissions
// ============================================

export async function getUserPermissions(): Promise<UserPermissions | null> {
    const supabase = await createSupabaseServerClient();
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) return null;

    // Get user with role
    const { data: user } = await supabase
        .from('app_users')
        .select('id, name, role_id')
        .eq('id', userId)
        .single();

    if (!user?.role_id) return null;

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

    // Get role name
    const { data: role } = await supabase
        .from('roles')
        .select('name, name_ar')
        .eq('id', user.role_id)
        .single();

    const permissions: Permission[] = [];
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

    return {
        userId: user.id,
        roleId: user.role_id,
        roleName: role?.name_ar || role?.name || 'Unknown',
        permissions,
        modules: Array.from(moduleSet),
    };
}

// ============================================
// Check Permission
// ============================================

export async function hasPermission(
    module: string,
    action: 'read' | 'write' | 'delete' | 'export' | 'import' = 'read'
): Promise<boolean> {
    const perms = await getUserPermissions();
    if (!perms) return false;

    // Admin has all permissions
    if (perms.roleName === 'admin' || perms.roleName === 'مدير النظام') {
        return true;
    }

    return perms.permissions.some(
        (p) => p.module === module && p.action === action
    );
}

// ============================================
// Check Module Access
// ============================================

export async function canAccessModule(module: string): Promise<boolean> {
    const perms = await getUserPermissions();
    if (!perms) return false;

    // Admin has all access
    if (perms.roleName === 'admin' || perms.roleName === 'مدير النظام') {
        return true;
    }

    return perms.modules.includes(module);
}

// ============================================
// Get Accessible Modules
// ============================================

export async function getAccessibleModules(): Promise<string[]> {
    const perms = await getUserPermissions();
    if (!perms) return [];

    // Admin has all modules
    if (perms.roleName === 'admin' || perms.roleName === 'مدير النظام') {
        return [
            'dashboard', 'sales', 'purchases', 'inventory', 'products',
            'customers', 'suppliers', 'accounting', 'shipping', 'reports',
            'settings', 'users'
        ];
    }

    return perms.modules;
}

// ============================================
// Log Activity
// ============================================

export async function logActivity(params: {
    action: string;
    module?: string;
    resourceType?: string;
    resourceId?: string;
    resourceName?: string;
    details?: Record<string, any>;
}) {
    const supabase = await createSupabaseServerClient();
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const companyId = cookieStore.get('company_id')?.value;

    // Get user info
    let userName = 'Unknown';
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

    await supabase.from('user_activity_logs').insert({
        company_id: companyId,
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        action: params.action,
        module: params.module,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        resource_name: params.resourceName,
        details: params.details,
    });
}
