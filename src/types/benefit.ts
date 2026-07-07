export const BENEFIT_TYPE = {
    HEALTH: 'HEALTH',
    TRANSPORT: 'TRANSPORT',
    MEAL: 'MEAL',
    OTHER: 'OTHER',
} as const;

export type BenefitType = typeof BENEFIT_TYPE[keyof typeof BENEFIT_TYPE];

export const BENEFIT_TYPE_LABELS: Record<BenefitType, string> = {
    HEALTH: 'Santé',
    TRANSPORT: 'Transport',
    MEAL: 'Repas',
    OTHER: 'Autre',
};

export const EMPLOYEE_BENEFIT_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
} as const;

export type EmployeeBenefitStatus = typeof EMPLOYEE_BENEFIT_STATUS[keyof typeof EMPLOYEE_BENEFIT_STATUS];

export const EMPLOYEE_BENEFIT_STATUS_LABELS: Record<EmployeeBenefitStatus, string> = {
    ACTIVE: 'Actif',
    INACTIVE: 'Inactif',
    SUSPENDED: 'Suspendu',
};

export interface Benefit {
    '@id'?: string;
    id: string;
    code: string;
    name: string;
    type: BenefitType | string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateBenefitDto {
    code: string;
    name: string;
    description?: string;
    type: BenefitType | string;
}

export interface EmployeeBenefit {
    '@id'?: string;
    id: string;
    employee: string;
    benefit?: string;
    benefitId?: string;
    status?: EmployeeBenefitStatus | string;
    startDate?: string;
    endDate?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateEmployeeBenefitDto {
    employee: string;
    benefitId: string;
    startDate?: string;
    endDate?: string;
}
