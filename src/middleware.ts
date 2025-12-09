import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Protected routes - require login
    const protectedRoutes = ['/dashboard', '/setup'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // Auth routes - redirect to dashboard if logged in
    const authRoutes = ['/login', '/register', '/forgot-password'];
    const isAuthRoute = authRoutes.includes(pathname);

    // Check for user_id cookie (simple session check)
    const userId = request.cookies.get('user_id')?.value;
    const isLoggedIn = userId && userId !== 'undefined';

    if (isProtectedRoute && !isLoggedIn) {
        // Not logged in, redirect to login
        const url = new URL('/login', request.url);
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    if (isAuthRoute && isLoggedIn) {
        // Already logged in, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match protected and auth routes
        '/dashboard/:path*',
        '/setup/:path*',
        '/login',
        '/register',
        '/forgot-password',
    ],
};
