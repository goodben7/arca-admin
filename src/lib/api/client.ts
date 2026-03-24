
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.arca.ereborhub.cloud';

function getToken() {
    if (typeof window === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
    if (match) return match[2];
    return null;
}

function handleLogout() {
    if (typeof window === 'undefined') return;

    // Supprimer le cookie de session
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

    // Rediriger vers login
    window.location.href = '/login';
}

interface RequestOptions extends RequestInit {
    skipAuthRedirect?: boolean;
}

export async function request(path: string, options: RequestOptions = {}) {
    const { skipAuthRedirect = false, ...fetchOptions } = options;
    const token = getToken();

    const headers = new Headers(fetchOptions.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }

    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

    const response = await fetch(url, {
        ...fetchOptions,
        headers,
    });

    if (response.status === 401 && !skipAuthRedirect) {
        handleLogout();
        throw new Error('Session expirée');
    }

    return response;
}
