export const DISCIPLINARY_STATUS = {
    DRAFT: 'DRAFT',
    OPENED: 'OPENED',
    HEARING_SCHEDULED: 'HEARING_SCHEDULED',
    DECISION_PENDING: 'DECISION_PENDING',
    SANCTION_APPLIED: 'SANCTION_APPLIED',
    CLOSED: 'CLOSED',
    CANCELLED: 'CANCELLED',
    REJECTED: 'REJECTED',
} as const;

export type DisciplinaryStatus = typeof DISCIPLINARY_STATUS[keyof typeof DISCIPLINARY_STATUS];

export const DISCIPLINARY_STATUS_LABELS: Record<DisciplinaryStatus, string> = {
    DRAFT: 'Brouillon',
    OPENED: 'Ouverte',
    HEARING_SCHEDULED: 'Audience planifiée',
    DECISION_PENDING: 'Décision en attente',
    SANCTION_APPLIED: 'Sanction appliquée',
    CLOSED: 'Clôturée',
    CANCELLED: 'Annulée',
    REJECTED: 'Rejetée',
};

export const DISCIPLINARY_ACTIVE_STATUSES: DisciplinaryStatus[] = [
    DISCIPLINARY_STATUS.DRAFT,
    DISCIPLINARY_STATUS.OPENED,
    DISCIPLINARY_STATUS.HEARING_SCHEDULED,
    DISCIPLINARY_STATUS.DECISION_PENDING,
    DISCIPLINARY_STATUS.SANCTION_APPLIED,
];

export const DISCIPLINARY_TERMINAL_STATUSES: DisciplinaryStatus[] = [
    DISCIPLINARY_STATUS.CLOSED,
    DISCIPLINARY_STATUS.CANCELLED,
    DISCIPLINARY_STATUS.REJECTED,
];

export interface SanctionScale {
    '@id'?: string;
    id: string;
    code: string;
    label: string;
    severityLevel: number;
    requiresHearing: boolean;
    maxDurationDays?: number | null;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
}

/** Codes standard du référentiel (seed backend). */
export const SANCTION_SCALE_CODES = {
    WARN: 'WARN',
    BLAME: 'BLAME',
    SUSPEND: 'SUSPEND',
    DISMISS: 'DISMISS',
} as const;

export type SanctionScaleCode = typeof SANCTION_SCALE_CODES[keyof typeof SANCTION_SCALE_CODES];

export const SANCTION_SCALE_CODE_LABELS: Record<SanctionScaleCode, string> = {
    WARN: 'Avertissement',
    BLAME: 'Blâme',
    SUSPEND: 'Suspension',
    DISMISS: 'Licenciement',
};

export const SANCTION_SCALE_PRESETS: Record<
    SanctionScaleCode,
    { label: string; severityLevel: number; requiresHearing: boolean; maxDurationDays: number | null }
> = {
    WARN: { label: 'Avertissement', severityLevel: 1, requiresHearing: false, maxDurationDays: null },
    BLAME: { label: 'Blâme', severityLevel: 2, requiresHearing: false, maxDurationDays: null },
    SUSPEND: { label: 'Suspension', severityLevel: 3, requiresHearing: true, maxDurationDays: 15 },
    DISMISS: { label: 'Licenciement', severityLevel: 4, requiresHearing: true, maxDurationDays: null },
};

export function sanctionScaleCodeLabel(code: string): string {
    const key = code?.toUpperCase() as SanctionScaleCode;
    return SANCTION_SCALE_CODE_LABELS[key] || code;
}

export interface DisciplinaryCase {
    '@id'?: string;
    id: string;
    employee: string | { id: string; firstName?: string; lastName?: string };
    sanctionScale: string | SanctionScale;
    facts: string;
    occurredAt?: string;
    reason?: string | null;
    status: DisciplinaryStatus | string;
    hearingAt?: string | null;
    openedAt?: string;
    decidedAt?: string;
    appliedAt?: string;
    closedAt?: string;
    cancelledAt?: string;
    rejectedAt?: string;
    exitProcess?: string | { id: string } | null;
    warningDocument?: string | { id: string } | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface DisciplinarySummary {
    employeeId: string;
    appliedSanctionCount: number;
    maxSeverityLevel?: number | null;
    lastSanctionCode?: string | null;
    lastSanctionLabel?: string | null;
    lastAppliedAt?: string | null;
    hasActiveCase: boolean;
    isRepeatOffender: boolean;
}

export interface CreateDisciplinaryCasePayload {
    employee: string;
    sanctionScale: string;
    facts: string;
    occurredAt: string;
    reason?: string | null;
}

export interface CreateSanctionScalePayload {
    code: string;
    label: string;
    severityLevel: number;
    requiresHearing: boolean;
    maxDurationDays?: number | null;
    active?: boolean;
}

export function disciplinaryStatusBadgeVariant(
    status: string,
): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    switch (status) {
        case DISCIPLINARY_STATUS.DRAFT:
            return 'secondary';
        case DISCIPLINARY_STATUS.OPENED:
        case DISCIPLINARY_STATUS.HEARING_SCHEDULED:
        case DISCIPLINARY_STATUS.DECISION_PENDING:
            return 'warning';
        case DISCIPLINARY_STATUS.SANCTION_APPLIED:
        case DISCIPLINARY_STATUS.CLOSED:
            return 'success';
        case DISCIPLINARY_STATUS.CANCELLED:
        case DISCIPLINARY_STATUS.REJECTED:
            return 'destructive';
        default:
            return 'default';
    }
}

export function getWorkflowSteps(requiresHearing: boolean): DisciplinaryStatus[] {
    if (requiresHearing) {
        return [
            DISCIPLINARY_STATUS.DRAFT,
            DISCIPLINARY_STATUS.OPENED,
            DISCIPLINARY_STATUS.HEARING_SCHEDULED,
            DISCIPLINARY_STATUS.DECISION_PENDING,
            DISCIPLINARY_STATUS.SANCTION_APPLIED,
            DISCIPLINARY_STATUS.CLOSED,
        ];
    }
    return [
        DISCIPLINARY_STATUS.DRAFT,
        DISCIPLINARY_STATUS.OPENED,
        DISCIPLINARY_STATUS.DECISION_PENDING,
        DISCIPLINARY_STATUS.SANCTION_APPLIED,
        DISCIPLINARY_STATUS.CLOSED,
    ];
}
