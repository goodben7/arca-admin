import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Paths that are always accessible
    const isAuthPage = pathname.startsWith('/login');
    const isPublicFile = pathname.includes('.') || pathname.startsWith('/_next');

    if (isAuthPage || isPublicFile) {
        return NextResponse.next();
    }

    // Check for the presence of a session/token cookie
    // For now, we simulation the check. In production, use your actual auth token cookie name.
    const token = request.cookies.get('token');

    if (!token) {
        // Redirect to login if not authenticated
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
