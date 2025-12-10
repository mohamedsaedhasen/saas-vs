import { cookies } from 'next/headers';

// Default company ID (fallback)
const DEFAULT_COMPANY_ID = '33333333-3333-3333-3333-333333333333';

/**
 * Get the current company ID from cookies (for Server Actions)
 * This should be called from server actions to get the active company
 */
export async function getServerCompanyId(): Promise<string> {
    try {
        const cookieStore = await cookies();
        const companyIdCookie = cookieStore.get('company_id');

        if (companyIdCookie?.value && companyIdCookie.value !== 'undefined') {
            return companyIdCookie.value;
        }
    } catch (error) {
        console.error('Error reading company_id cookie:', error);
    }

    return DEFAULT_COMPANY_ID;
}

/**
 * @deprecated Use getServerCompanyId() instead - cookies() is now async in Next.js 16
 */
export const getServerCompanyIdSync = getServerCompanyId;

