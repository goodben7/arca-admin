const TOKEN_KEY = 'arca_token';
const SESSION_COOKIE = 'session';

export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && !hasSession()) {
        const isSecure = window.location.protocol === 'https:';
        document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=86400; samesite=lax${isSecure ? '; secure' : ''}`;
    }
    return token;
}

export function setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=86400; samesite=lax${isSecure ? '; secure' : ''}`;
}

export function clearToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = `${SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}

export function hasSession(): boolean {
    if (typeof window === 'undefined') return false;
    return document.cookie.split(';').some((c) => c.trim().startsWith(`${SESSION_COOKIE}=`));
}
