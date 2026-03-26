// Constantes (alignées avec les constantes côté back)
export const STATUS_PENDING = 'PENDING';
export const STATUS_APPROVED = 'APPROVED';
export const STATUS_REJECTED = 'REJECTED';
export const STATUS_CANCELLED = 'CANCELLED';

export const RECRUITMENT_REQUEST_STATUS = {
    PENDING: STATUS_PENDING,
    APPROVED: STATUS_APPROVED,
    REJECTED: STATUS_REJECTED,
    CANCELLED: STATUS_CANCELLED,
} as const;

export type RecruitmentRequestStatus =
    typeof RECRUITMENT_REQUEST_STATUS[keyof typeof RECRUITMENT_REQUEST_STATUS];

export interface RecruitmentRequest {
    id: string;
    department: string;
    requestedBy: string;
    position: string;
    numberOfPositions: number;
    justification: string;
    status: RecruitmentRequestStatus | string;

    approvedBy?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    rejectionReason?: string;

    createdAt?: string;

    // Sometimes the API can return JSON-LD IDs (depending on the endpoint)
    '@id'?: string;
}

