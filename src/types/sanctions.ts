export const DISCIPLINARY_STATUS = {
    DRAFT: 'DRAFT',
    OPENED: 'OPENED',
    EXPLANATION_REQUESTED: 'EXPLANATION_REQUESTED',
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
    EXPLANATION_REQUESTED: 'Explications demandées',
    HEARING_SCHEDULED: 'Audience planifiée',
    DECISION_PENDING: 'Décision en attente',
    SANCTION_APPLIED: 'Sanction appliquée',
    CLOSED: 'Clôturée',
    CANCELLED: 'Annulée',
    REJECTED: 'Rejetée',
};

export const DISCIPLINARY_STEPPER_LABELS: Record<DisciplinaryStatus, string> = {
    DRAFT: 'Brouillon',
    OPENED: 'Ouverture',
    EXPLANATION_REQUESTED: 'Explications',
    HEARING_SCHEDULED: 'Audience',
    DECISION_PENDING: 'Décision',
    SANCTION_APPLIED: 'Application',
    CLOSED: 'Clôture',
    CANCELLED: 'Annulée',
    REJECTED: 'Rejetée',
};

export function nextDisciplinaryHint(status: string, requiresHearing: boolean): string | null {
    switch (status) {
        case DISCIPLINARY_STATUS.DRAFT:
            return 'Prochaine étape : ouvrir l’affaire (constat de la faute).';
        case DISCIPLINARY_STATUS.OPENED:
            return 'Prochaine étape : demander des explications (délai légal 8 jours).';
        case DISCIPLINARY_STATUS.EXPLANATION_REQUESTED:
            return requiresHearing
                ? 'Prochaine étape : enregistrer la réponse, puis planifier l’entretien préalable.'
                : 'Prochaine étape : enregistrer la réponse, puis passer en décision.';
        case DISCIPLINARY_STATUS.HEARING_SCHEDULED:
            return 'Prochaine étape : enregistrer la décision après l’entretien.';
        case DISCIPLINARY_STATUS.DECISION_PENDING:
            return 'Prochaine étape : notifier et appliquer la sanction.';
        case DISCIPLINARY_STATUS.SANCTION_APPLIED:
            return 'Prochaine étape : clôturer l’affaire (le délai de recours est informatif).';
        default:
            return null;
    }
}

export const DISCIPLINARY_ACTIVE_STATUSES: DisciplinaryStatus[] = [
    DISCIPLINARY_STATUS.DRAFT,
    DISCIPLINARY_STATUS.OPENED,
    DISCIPLINARY_STATUS.EXPLANATION_REQUESTED,
    DISCIPLINARY_STATUS.HEARING_SCHEDULED,
    DISCIPLINARY_STATUS.DECISION_PENDING,
    DISCIPLINARY_STATUS.SANCTION_APPLIED,
];

export const DISCIPLINARY_TERMINAL_STATUSES: DisciplinaryStatus[] = [
    DISCIPLINARY_STATUS.CLOSED,
    DISCIPLINARY_STATUS.CANCELLED,
    DISCIPLINARY_STATUS.REJECTED,
];

/** Statuts où annulation / rejet sont encore possibles (avant application). */
export const DISCIPLINARY_PRE_APPLY_STATUSES: DisciplinaryStatus[] = [
    DISCIPLINARY_STATUS.DRAFT,
    DISCIPLINARY_STATUS.OPENED,
    DISCIPLINARY_STATUS.EXPLANATION_REQUESTED,
    DISCIPLINARY_STATUS.HEARING_SCHEDULED,
    DISCIPLINARY_STATUS.DECISION_PENDING,
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
    REPRIMAND: 'REPRIMAND',
    WARN: 'WARN',
    BLAME: 'BLAME',
    SUSPEND: 'SUSPEND',
    DISMISS: 'DISMISS',
} as const;

export type SanctionScaleCode = typeof SANCTION_SCALE_CODES[keyof typeof SANCTION_SCALE_CODES];

export const SANCTION_SCALE_CODE_LABELS: Record<SanctionScaleCode, string> = {
    REPRIMAND: 'Réprimande',
    WARN: 'Avertissement',
    BLAME: 'Blâme',
    SUSPEND: 'Suspension',
    DISMISS: 'Licenciement',
};

export const SANCTION_SCALE_PRESETS: Record<
    SanctionScaleCode,
    { label: string; severityLevel: number; requiresHearing: boolean; maxDurationDays: number | null }
> = {
    REPRIMAND: { label: 'Réprimande', severityLevel: 1, requiresHearing: false, maxDurationDays: null },
    WARN: { label: 'Avertissement', severityLevel: 2, requiresHearing: false, maxDurationDays: null },
    BLAME: { label: 'Blâme', severityLevel: 3, requiresHearing: false, maxDurationDays: null },
    SUSPEND: { label: 'Suspension', severityLevel: 4, requiresHearing: true, maxDurationDays: 15 },
    DISMISS: { label: 'Licenciement', severityLevel: 5, requiresHearing: true, maxDurationDays: null },
};

export const LETTER_SANCTION_CODES: SanctionScaleCode[] = [
    SANCTION_SCALE_CODES.REPRIMAND,
    SANCTION_SCALE_CODES.WARN,
    SANCTION_SCALE_CODES.BLAME,
];

export function sanctionScaleCodeLabel(code: string): string {
    const key = code?.toUpperCase() as SanctionScaleCode;
    return SANCTION_SCALE_CODE_LABELS[key] || code;
}

/** Messages métier à partir des motifs renvoyés (souvent en anglais). */
export function translateDisciplinaryReason(reason: string): string {
    const trimmed = reason.trim();
    const lower = trimmed.toLowerCase();

    const escalate = trimmed.match(/^escalate to\s+([A-Za-z_]+)\s*(?:\(severity\s*\d+\))?\.?$/i);
    if (escalate) {
        return `Il est recommandé de passer au niveau « ${sanctionScaleCodeLabel(escalate[1])} ».`;
    }

    const exact: Record<string, string> = {
        'de-escalation is not allowed': 'Il n’est pas possible de choisir un niveau inférieur à la dernière sanction.',
        'de-escalation not allowed': 'Il n’est pas possible de choisir un niveau inférieur à la dernière sanction.',
        'same level requires acknowledgement': 'Rester au même niveau nécessite une confirmation, car une sanction a déjà été appliquée.',
        'repeat offender': 'Une sanction a déjà été appliquée à ce collaborateur.',
        'active case exists': 'Une affaire est déjà en cours pour ce collaborateur.',
        'acknowledgement required': 'Une confirmation est nécessaire pour rester au même niveau de sanction.',
    };
    if (exact[lower]) return exact[lower];

    return trimmed
        .replace(/\bseverity\b/gi, 'niveau')
        .replace(/\bescalate to\b/gi, 'passer à')
        .replace(/\bde-escalation\b/gi, 'niveau inférieur')
        .replace(/\backnowledg(e|ement)\b/gi, 'confirmation')
        .replace(/\brepeat offender\b/gi, 'récidive')
        .replace(/\bREPRIMAND\b/g, 'réprimande')
        .replace(/\bWARN\b/g, 'avertissement')
        .replace(/\bBLAME\b/g, 'blâme')
        .replace(/\bSUSPEND\b/g, 'suspension')
        .replace(/\bDISMISS\b/g, 'licenciement');
}

export function isLetterSanctionCode(code: string | undefined | null): boolean {
    if (!code) return false;
    return LETTER_SANCTION_CODES.includes(code.toUpperCase() as SanctionScaleCode);
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
    explanationDueAt?: string | null;
    explanationText?: string | null;
    appealDeadlineAt?: string | null;
    openedAt?: string;
    decidedAt?: string;
    appliedAt?: string;
    closedAt?: string;
    cancelledAt?: string;
    rejectedAt?: string;
    exitProcess?: string | { id: string } | null;
    warningDocument?: string | { id: string; contentUrl?: string } | null;
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
    requiresAcknowledgement?: boolean;
    suggestedNextSeverity?: number | null;
    suggestedNextCode?: string | null;
    suggestedNextLabel?: string | null;
    reasons?: string[];
}

export type SanctionChoiceVerdict = 'allowed' | 'needsAck' | 'blocked';

/**
 * Règle de récidive (6.17.3) :
 * - aucune sanction appliquée → tout palier
 * - gravité > max → escalade autorisée
 * - gravité = max → même palier uniquement avec acknowledgeRecidivism
 * - gravité < max → désescalade toujours bloquée
 */
export function evaluateSanctionChoice(
    summary: DisciplinarySummary | null | undefined,
    scale: Pick<SanctionScale, 'severityLevel'> | null | undefined,
): SanctionChoiceVerdict {
    if (!summary || summary.maxSeverityLevel == null || summary.appliedSanctionCount < 1) {
        return 'allowed';
    }
    if (!scale) return 'allowed';
    if (scale.severityLevel > summary.maxSeverityLevel) return 'allowed';
    if (scale.severityLevel === summary.maxSeverityLevel) return 'needsAck';
    return 'blocked';
}

export interface CreateDisciplinaryCasePayload {
    employee: string;
    sanctionScale: string;
    facts: string;
    occurredAt: string;
    reason?: string | null;
    acknowledgeRecidivism?: boolean;
}

export interface RequestExplanationPayload {
    explanationDueAt?: string | null;
    explanationText?: string | null;
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
        case DISCIPLINARY_STATUS.EXPLANATION_REQUESTED:
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
            DISCIPLINARY_STATUS.EXPLANATION_REQUESTED,
            DISCIPLINARY_STATUS.HEARING_SCHEDULED,
            DISCIPLINARY_STATUS.DECISION_PENDING,
            DISCIPLINARY_STATUS.SANCTION_APPLIED,
            DISCIPLINARY_STATUS.CLOSED,
        ];
    }
    return [
        DISCIPLINARY_STATUS.DRAFT,
        DISCIPLINARY_STATUS.OPENED,
        DISCIPLINARY_STATUS.EXPLANATION_REQUESTED,
        DISCIPLINARY_STATUS.DECISION_PENDING,
        DISCIPLINARY_STATUS.SANCTION_APPLIED,
        DISCIPLINARY_STATUS.CLOSED,
    ];
}
