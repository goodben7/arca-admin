export const READINESS_LEVEL = {
    READY_NOW: 'READY_NOW',
    WITHIN_1_YEAR: 'WITHIN_1_YEAR',
    WITHIN_2_YEARS: 'WITHIN_2_YEARS',
    WITHIN_3_YEARS: 'WITHIN_3_YEARS',
    NOT_READY: 'NOT_READY',
} as const;

export type ReadinessLevel = typeof READINESS_LEVEL[keyof typeof READINESS_LEVEL];

export const READINESS_LEVEL_LABELS: Record<ReadinessLevel, string> = {
    READY_NOW: 'Prêt maintenant',
    WITHIN_1_YEAR: 'Dans 1 an',
    WITHIN_2_YEARS: 'Dans 2 ans',
    WITHIN_3_YEARS: 'Dans 3 ans',
    NOT_READY: 'Pas encore prêt',
};

export interface SuccessionPlan {
    '@id'?: string;
    id: string;
    criticalJobRole: string;
    candidate: string;
    readinessLevel: ReadinessLevel | string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface HrDashboard {
    headcount: number;
    departuresLast12Months: number;
    turnoverRatePercent: number;
    promotionsLast12Months: number;
    trainingsInProgress: number;
    trainingsCertifiedLast12Months: number;
    criticalJobRolesTotal: number;
    criticalJobRolesCovered: number;
    successionCoveragePercent: number;
    criticalSkillGaps: number;
    periodMonths: number;
    computedAt: string;
}

export interface Activity {
    '@id'?: string;
    id: string;
    user?: string;
    activity: string;
    ressourceName?: string;
    ressourceIdentifier?: string;
    metadata?: Record<string, unknown>;
    occurredAt?: string;
    createdAt?: string;
}
