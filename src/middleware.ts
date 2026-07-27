import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const session = request.cookies.get('session');

    if (!session) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Protéger les routes authentifiées (apps, modules /m/*, etc.).
         * Exclusions : landing, login, offres publiques, assets.
         */
        '/((?!$|login|offres-emploi|api|_next|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf|eot|css|js|map)).*)',
    ],
};
