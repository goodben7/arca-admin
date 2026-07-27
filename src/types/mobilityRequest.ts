export const MOBILITY_TYPE = {
    TRANSFER: 'TRANSFER',
    PROMOTION: 'PROMOTION',
    DEMOTION: 'DEMOTION',
    SECONDEMENT: 'SECONDEMENT',
} as const;

export type MobilityType = typeof MOBILITY_TYPE[keyof typeof MOBILITY_TYPE];

export const MOBILITY_TYPE_LABELS: Record<MobilityType, string> = {
    TRANSFER: 'Transfert',
    PROMOTION: 'Promotion',
    DEMOTION: 'Rétrogradation',
    SECONDEMENT: 'Détachement',
};

export const MOBILITY_STATUS = {
    DRAFT: 'DRAFT',
    MANAGER_APPROVAL: 'MANAGER_APPROVAL',
    HR_APPROVAL: 'HR_APPROVAL',
    EXECUTIVE_APPROVAL: 'EXECUTIVE_APPROVAL',
    IMPLEMENTED: 'IMPLEMENTED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED',
} as const;

export type MobilityStatus = typeof MOBILITY_STATUS[keyof typeof MOBILITY_STATUS];

export const MOBILITY_STATUS_LABELS: Record<MobilityStatus, string> = {
    DRAFT: 'Brouillon',
    MANAGER_APPROVAL: 'Validation responsable',
    HR_APPROVAL: 'Validation RH',
    EXECUTIVE_APPROVAL: 'Validation Direction',
    IMPLEMENTED: 'Implémentée',
    REJECTED: 'Refusée',
    CANCELLED: 'Annulée',
};

export const MOBILITY_WORKFLOW_STEPS: MobilityStatus[] = [
    MOBILITY_STATUS.DRAFT,
    MOBILITY_STATUS.MANAGER_APPROVAL,
    MOBILITY_STATUS.HR_APPROVAL,
    MOBILITY_STATUS.EXECUTIVE_APPROVAL,
    MOBILITY_STATUS.IMPLEMENTED,
];

export interface MobilityRequest {
    id: string;
    employee: string;
    type: MobilityType | string;
    status: MobilityStatus | string;

    targetDepartment?: string;
    targetJobRole?: string;
    targetJobRoleId?: string;
    targetGrade?: string;
    targetGradeId?: string;
    justification?: string;
    reason?: string;

    requestedBy?: string;
    submittedAt?: string;
    submittedBy?: string;

    managerApprovedAt?: string;
    managerApprovedBy?: string;
    hrApprovedAt?: string;
    hrApprovedBy?: string;
    executiveApprovedAt?: string;
    executiveApprovedBy?: string;

    implementedAt?: string;
    implementedBy?: string;

    rejectedAt?: string;
    rejectedBy?: string;
    rejectionReason?: string;

    cancelledAt?: string;
    cancelledBy?: string;

    createdAt?: string;
    updatedAt?: string;

    '@id'?: string;
}
