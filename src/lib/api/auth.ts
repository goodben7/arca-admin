import { request } from './client';
import { AuthUser, extractToken, LoginResponse } from '@/types/auth';

export async function login(username: string, password: string): Promise<{ token: string }> {
    const response = await request('/api/authentication_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        skipAuthRedirect: true,
        skipAuth: true,
    } as any);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            errorData.message
            || errorData['hydra:description']
            || errorData.detail
            || 'Identifiants invalides'
        );
    }

    const data: LoginResponse = await response.json();
    return { token: extractToken(data) };
}

export async function getAbout(): Promise<AuthUser> {
    const response = await request('/api/users/about');

    if (!response.ok) {
        throw new Error('Impossible de charger les infos utilisateur');
    }

    return response.json();
}

export async function getPermissions(): Promise<unknown[]> {
    const response = await request('/api/permissions');

    if (!response.ok) {
        throw new Error('Impossible de charger les permissions');
    }

    const data = await response.json();
    if (Array.isArray(data)) return data;
    const d = data as Record<string, unknown>;
    if (Array.isArray(d['hydra:member'])) return d['hydra:member'] as unknown[];
    if (Array.isArray(d.member)) return d.member as unknown[];
    return [];
}
