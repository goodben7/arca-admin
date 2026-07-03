import { PersonType } from '@/types/profile';

export interface AuthUserProfile {
    id?: string;
    label?: string;
    personType?: PersonType | string;
    permission?: string[];
    active?: boolean;
}

export interface AuthUser {
    id?: string;
    email?: string;
    displayName?: string;
    roles?: string[];
    personType?: PersonType | string;
    profile?: AuthUserProfile;
    permissions?: string[];
    mustChangePassword?: boolean;
    locked?: boolean;
    confirmed?: boolean;
}

export interface LoginResponse {
    token?: string;
    access_token?: string;
    accessToken?: string;
}

export function extractToken(data: LoginResponse): string {
    const token = data.token ?? data.access_token ?? data.accessToken;
    if (!token || typeof token !== 'string') {
        throw new Error('Réponse d\'authentification invalide : token manquant.');
    }
    return token;
}
