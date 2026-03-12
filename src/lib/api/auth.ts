import { request } from './client';

export async function login(username: string, password: string) {
    const response = await request('/api/authentication_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        skipAuthRedirect: true,
    } as any);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData['hydra:description'] || 'Identifiants invalides');
    }

    return response.json();
}

export async function getAbout() {
    const response = await request('/api/users/about');

    if (!response.ok) {
        throw new Error('Impossible de charger les infos utilisateur');
    }

    return response.json();
}
