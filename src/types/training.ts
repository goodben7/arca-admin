export const TRAINING_PRIORITY = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
} as const;

export type TrainingPriority = (typeof TRAINING_PRIORITY)[keyof typeof TRAINING_PRIORITY];

export const STATUS_PENDING = 'PENDING';
export const STATUS_APPROVED = 'APPROVED';
export const STATUS_REJECTED = 'REJECTED';

export const TRAINING_REQUEST_STATUS = {
    PENDING: STATUS_PENDING,
    APPROVED: STATUS_APPROVED,
    REJECTED: STATUS_REJECTED,
} as const;

export type TrainingRequestStatus =
    (typeof TRAINING_REQUEST_STATUS)[keyof typeof TRAINING_REQUEST_STATUS];

export interface TrainingRequest {
    id: string;
    department: string;
    requestedBy: string;
    title: string;
    description: string;
    numberOfParticipants: number;
    priority: TrainingPriority | string;
    status: TrainingRequestStatus | string;

    approvedBy?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    rejectionReason?: string;

    createdAt?: string;
    '@id'?: string;
}
