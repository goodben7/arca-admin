export const PERSON_TYPE = {
    SUPER_ADMIN: 'SPADM',
    ADMIN: 'ADM',
    HR_ADMIN: 'HRADM',
    HR_STAFF: 'HRSTF',
    EXECUTIVE: 'EXEC',
    MANAGER: 'MGR',
    HR_PROVINCE: 'HRPRV',
    EMPLOYEE: 'EMP',
    CONSULTANT: 'CNS',
    INTERN: 'INT',
    CANDIDATE: 'CND',
} as const;

export const PERSON_TYPE_LABELS: Record<string, string> = {
    SPADM: 'Super Administrateur Plateforme',
    ADM: 'Administrateur Système',
    HRADM: 'DRH / Administrateur RH',
    HRSTF: 'Équipe RH Siège',
    EXEC: 'DG / DGA / Directeur',
    MGR: 'Responsable Département / N+1',
    HRPRV: 'RH en Province',
    EMP: 'Employé Standard',
    CNS: 'Consultant Externe',
    INT: 'Stagiaire',
    CND: 'Candidat Recrutement',
};

export type PersonType = typeof PERSON_TYPE[keyof typeof PERSON_TYPE];

export interface Profile {
    id: string;
    label: string;
    personType: PersonType;
    permission: string[];
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Permission {
    '@id': string;
    '@type': string;
    role: string;
    label: string;
}

export interface AppUser {
    '@id'?: string;
    id: string;
    email: string;
    roles: string[];
    deleted: boolean;
    locked: boolean;
    mustChangePassword: boolean;
    personType: PersonType;
    createdAt: string;
    confirmed: boolean;
}
