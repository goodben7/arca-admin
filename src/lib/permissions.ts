import type { AuthUser } from '@/types/auth';

/** Vérifie un rôle effectif (roles JWT ou permissions profil). */
export function hasRole(user: AuthUser | null | undefined, role: string): boolean {
    if (!user) return false;
    if (user.roles?.includes('ROLE_SUPER_ADMIN') || user.roles?.includes('ROLE_ADMIN')) return true;
    if (user.roles?.includes(role)) return true;
    if (user.permissions?.includes(role)) return true;
    return false;
}

export function canManageDisciplinaryCases(user: AuthUser | null | undefined): boolean {
    return (
        hasRole(user, 'ROLE_DISCIPLINARY_CASE_CREATE') ||
        hasRole(user, 'ROLE_DISCIPLINARY_CASE_OPEN') ||
        hasRole(user, 'ROLE_DISCIPLINARY_CASE_LIST') ||
        hasRole(user, 'ROLE_DISCIPLINARY_CASE_DETAILS')
    );
}

export function canActOnDisciplinaryCase(user: AuthUser | null | undefined, action: string): boolean {
    const map: Record<string, string> = {
        open: 'ROLE_DISCIPLINARY_CASE_OPEN',
        hearing: 'ROLE_DISCIPLINARY_CASE_SCHEDULE_HEARING',
        decide: 'ROLE_DISCIPLINARY_CASE_DECIDE',
        apply: 'ROLE_DISCIPLINARY_CASE_APPLY',
        cancel: 'ROLE_DISCIPLINARY_CASE_CANCEL',
        reject: 'ROLE_DISCIPLINARY_CASE_REJECT',
        close: 'ROLE_DISCIPLINARY_CASE_CLOSE',
        create: 'ROLE_DISCIPLINARY_CASE_CREATE',
    };
    const role = map[action];
    return role ? hasRole(user, role) : false;
}

export function canManageSanctionScales(user: AuthUser | null | undefined): boolean {
    return (
        hasRole(user, 'ROLE_SANCTION_SCALE_CREATE') ||
        hasRole(user, 'ROLE_SANCTION_SCALE_UPDATE') ||
        hasRole(user, 'ROLE_SANCTION_SCALE_LIST')
    );
}
