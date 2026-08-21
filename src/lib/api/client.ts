import { getToken, clearToken } from '@/lib/auth-token';

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.arca.digisafrica.tech/api';
export const ASSET_BASE_URL = (() => {
    try {
        return new URL(BASE_URL).origin;
    } catch {
        return BASE_URL.replace(/\/api\/?$/, '');
    }
})();

export function buildApiUrl(path: string) {
    if (path.startsWith('http')) return path;

    const base = BASE_URL.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    if (base.endsWith('/api') && normalizedPath.startsWith('/api/')) {
        return `${base}${normalizedPath.slice(4)}`;
    }

    return `${base}${normalizedPath}`;
}

export function buildAssetUrl(path: string) {
    if (path.startsWith('http')) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${ASSET_BASE_URL}${normalizedPath}`;
}

function handleLogout(errorMessage?: string) {
    if (typeof window === 'undefined') return;

    clearToken();

    const url = errorMessage
        ? `/login?error=${encodeURIComponent(errorMessage)}`
        : '/login';
    window.location.href = url;
}

interface RequestOptions extends RequestInit {
    skipAuthRedirect?: boolean;
    skipAuth?: boolean;
}

export async function request(path: string, options: RequestOptions = {}) {
    const { skipAuthRedirect = false, skipAuth = false, ...fetchOptions } = options;
    const token = getToken();

    const headers = new Headers(fetchOptions.headers);
    if (token && !skipAuth) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }

    const url = buildApiUrl(path);

    const response = await fetch(url, {
        ...fetchOptions,
        headers,
    });

    if (response.status === 401 && !skipAuthRedirect) {
        let errorMessage = 'Session expirée';
        try {
            const errorData = await response.clone().json();
            if (errorData.message) errorMessage = errorData.message;
        } catch {}
        handleLogout(errorMessage);
        throw new Error(errorMessage);
    }

    return response;
}
