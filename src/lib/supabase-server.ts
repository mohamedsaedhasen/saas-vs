import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { setTenantContext, getUserIdFromCookies, getCompanyIdFromCookies, getBranchIdFromCookies } from './tenant-context';

export async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // يمكن تجاهل هذا في Server Components
                    }
                },
            },
        }
    );
}

/**
 * Creates a Supabase client with tenant context automatically set
 * This should be used for ALL API routes that need RLS protection
 */
export async function createSupabaseServerClientWithContext() {
    const cookieStore = await cookies();
    const supabase = await createSupabaseServerClient();

    // Get tenant context from cookies
    const userId = getUserIdFromCookies(cookieStore);
    const companyId = getCompanyIdFromCookies(cookieStore);
    const branchId = getBranchIdFromCookies(cookieStore);

    // Set tenant context for RLS
    await setTenantContext(supabase, userId, companyId, branchId);

    return {
        supabase,
        userId,
        companyId,
        branchId,
        cookieStore
    };
}

// Supabase Admin Client (للعمليات الحساسة)
import { createClient } from '@supabase/supabase-js';

export function createSupabaseAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}
