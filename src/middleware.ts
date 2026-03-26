import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token');

    if (!token) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Protéger uniquement les routes du dashboard.
         * Sont exclues automatiquement :
         * - / (landing)
         * - /login (auth)
         * - /offres-emploi (public)
         * - _next/*, api/*, fichiers statiques
         */
        '/((?!$|login|offres-emploi|api|_next/static|_next/image|favicon.ico).*)',
    ],
};
