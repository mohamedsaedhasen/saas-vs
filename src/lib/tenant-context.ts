import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Sets the tenant context in PostgreSQL session for RLS policies
 * This MUST be called before any database operations that rely on RLS
 */
export async function setTenantContext(
    supabase: SupabaseClient,
    userId: string | null | undefined,
    companyId: string | null | undefined,
    branchId: string | null | undefined = null
): Promise<void> {
    try {
        // Call the set_tenant_context function in the database
        const { error } = await supabase.rpc('set_tenant_context', {
            p_user_id: userId || null,
            p_company_id: companyId || null,
            p_branch_id: branchId || null,
        });

        if (error) {
            console.error('Failed to set tenant context:', error);
            throw new Error('Failed to set tenant context');
        }
    } catch (err) {
        console.error('Error setting tenant context:', err);
        // Don't throw here to avoid breaking the app, but log it
        // In production, you might want to throw based on severity
    }
}

/**
 * Gets user ID from cookies (server-side)
 */
export function getUserIdFromCookies(cookieStore: any): string | null {
    return cookieStore.get('user_id')?.value || null;
}

/**
 * Gets company ID from cookies (server-side)
 */
export function getCompanyIdFromCookies(cookieStore: any): string | null {
    return cookieStore.get('company_id')?.value || null;
}

/**
 * Gets branch ID from cookies (server-side)
 */
export function getBranchIdFromCookies(cookieStore: any): string | null {
    return cookieStore.get('branch_id')?.value || null;
}

/**
 * Validates that tenant context is properly set
 */
export function validateTenantContext(
    userId: string | null,
    companyId: string | null
): boolean {
    if (!userId || !companyId) {
        console.warn('Tenant context validation failed:', { userId: !!userId, companyId: !!companyId });
        return false;
    }
    return true;
}
