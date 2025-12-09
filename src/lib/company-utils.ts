import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Default company ID (fallback)
const DEFAULT_COMPANY_ID = '33333333-3333-3333-3333-333333333333';

/**
 * Get the current company ID from request headers or cookies
 * APIs should call this to get the active company
 */
export function getCompanyId(request?: NextRequest): string {
    // Try to get from custom header first
    if (request) {
        const headerCompanyId = request.headers.get('x-company-id');
        if (headerCompanyId && headerCompanyId !== 'undefined') {
            return headerCompanyId;
        }

        // Try to get from request cookies
        const cookieHeader = request.headers.get('cookie');
        if (cookieHeader) {
            const match = cookieHeader.match(/company_id=([^;]+)/);
            if (match && match[1] && match[1] !== 'undefined') {
                return match[1];
            }
        }
    }

    // Try to get from Next.js cookies
    try {
        const cookieStore = cookies();
        const companyIdCookie = cookieStore.get('company_id');
        if (companyIdCookie?.value && companyIdCookie.value !== 'undefined') {
            return companyIdCookie.value;
        }
    } catch (error) {
        // cookies() might not be available in all contexts
    }

    return DEFAULT_COMPANY_ID;
}

/**
 * Utility to create API response with company context
 */
export function withCompanyId(companyId: string) {
    return {
        companyId,
        isDefault: companyId === DEFAULT_COMPANY_ID,
    };
}

/**
 * Get company ID from localStorage (client-side)
 */
export function getClientCompanyId(): string {
    if (typeof window === 'undefined') return DEFAULT_COMPANY_ID;
    const id = localStorage.getItem('selected_company_id');
    if (id && id !== 'undefined') return id;
    return DEFAULT_COMPANY_ID;
}

/**
 * Fetch wrapper that includes company ID header
 */
export async function fetchWithCompany(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const companyId = getClientCompanyId();

    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'x-company-id': companyId,
        },
    });
}
