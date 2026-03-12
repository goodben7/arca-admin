import { Profile, Permission, AppUser } from '@/types/profile';
import { request } from './client';

// ─── Profiles ─────────────────────────────────────────────────────────────────
export async function getAllProfiles(): Promise<{ member: Profile[] } | Profile[]> {
    const res = await request('/api/profiles?pagination=false&itemsPerPage=1000');
    if (!res.ok) throw new Error('Impossible de charger les profils.');
    return res.json();
}

export async function createProfile(data: { label: string; personType: string; permission: string[]; active: boolean }): Promise<Profile> {
    const res = await request('/api/profiles', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || 'Erreur lors de la création du profil.');
    }
    return res.json();
}

export async function updateProfile(id: string, data: Partial<{ label: string; personType: string; permission: string[]; active: boolean }>): Promise<Profile> {
    const res = await request(`/api/profiles/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || 'Erreur lors de la mise à jour.');
    }
    return res.json();
}

// ─── Permissions ──────────────────────────────────────────────────────────────
export async function getAllPermissions(): Promise<{ member: Permission[] }> {
    const res = await request('/api/permissions?pagination=false&itemsPerPage=1000');
    if (!res.ok) throw new Error('Impossible de charger les permissions.');
    return res.json();
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function getAllUsers(): Promise<{ member: AppUser[] } | AppUser[]> {
    const res = await request('/api/users?pagination=false&itemsPerPage=1000');
    if (!res.ok) throw new Error('Impossible de charger les utilisateurs.');
    return res.json();
}
