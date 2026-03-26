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
         * Exclusions :
         * - / (landing)
         * - /login (auth)
         * - /offres-emploi (public)
         * - _next/* (assets Next.js)
         * - api/*
         * - Tous les fichiers statiques (png, jpg, svg, ico, webp, etc.)
         */
        '/((?!$|login|offres-emploi|api|_next|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf|eot|css|js|map)).*)',
    ],
};
