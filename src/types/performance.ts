// ── Evaluation Cycles ────────────────────────────────────────────────────────

export const EVALUATION_CYCLE_STATUS = {
    DRAFT: 'DRAFT',
    OPEN: 'OPEN',
    CLOSED: 'CLOSED',
} as const;

export type EvaluationCycleStatus = typeof EVALUATION_CYCLE_STATUS[keyof typeof EVALUATION_CYCLE_STATUS];

export const EVALUATION_CYCLE_STATUS_LABELS: Record<EvaluationCycleStatus, string> = {
    DRAFT: 'Brouillon',
    OPEN: 'Ouvert',
    CLOSED: 'Clôturé',
};

export interface EvaluationCycle {
    '@id'?: string;
    id: string;
    name: string;
    description?: string;
    status: EvaluationCycleStatus | string;
    startDate?: string;
    endDate?: string;
    openedAt?: string;
    closedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

// ── Performance Reviews ───────────────────────────────────────────────────────

export const PERFORMANCE_REVIEW_STATUS = {
    DRAFT: 'DRAFT',
    SUBMITTED: 'SUBMITTED',
    VALIDATED: 'VALIDATED',
} as const;

export type PerformanceReviewStatus = typeof PERFORMANCE_REVIEW_STATUS[keyof typeof PERFORMANCE_REVIEW_STATUS];

export const PERFORMANCE_REVIEW_STATUS_LABELS: Record<PerformanceReviewStatus, string> = {
    DRAFT: 'Brouillon',
    SUBMITTED: 'Soumise',
    VALIDATED: 'Validée',
};

export interface PerformanceReview {
    '@id'?: string;
    id: string;
    employee: string;
    evaluationCycle: string;
    reviewer?: string;
    status: PerformanceReviewStatus | string;
    overallRating?: number;
    comments?: string;
    submittedAt?: string;
    validatedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

// ── Objectives ────────────────────────────────────────────────────────────────

export const OBJECTIVE_STATUS = {
    DRAFT: 'DRAFT',
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

export type ObjectiveStatus = typeof OBJECTIVE_STATUS[keyof typeof OBJECTIVE_STATUS];

export const OBJECTIVE_STATUS_LABELS: Record<ObjectiveStatus, string> = {
    DRAFT: 'Brouillon',
    ACTIVE: 'Actif',
    COMPLETED: 'Atteint',
    CANCELLED: 'Annulé',
};

export interface Objective {
    '@id'?: string;
    id: string;
    employee: string;
    evaluationCycle?: string;
    title: string;
    description?: string;
    status: ObjectiveStatus | string;
    dueDate?: string;
    completedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

// ── Promotion Eligibility ─────────────────────────────────────────────────────

export interface PromotionEligibility {
    eligible: boolean;
    reasons: string[];
}
