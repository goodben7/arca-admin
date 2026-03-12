
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.arca.ereborhub.cloud';

function getToken() {
    if (typeof window === 'undefined') return null;
    return document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
}

function handleLogout() {
    if (typeof window === 'undefined') return;

    // Supprimer le cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

    // Rediriger vers login
    window.location.href = '/login';
}

export async function request(path: string, options: RequestInit = {}) {
    const token = getToken();

    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }

    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        handleLogout();
        throw new Error('Session expirée');
    }

    return response;
}
