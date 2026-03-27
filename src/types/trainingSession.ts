export const STATUS_PLANNED   = 'PLANNED';
export const STATUS_ONGOING   = 'ONGOING';
export const STATUS_COMPLETED = 'COMPLETED';
export const STATUS_CANCELLED = 'CANCELLED';

export const TRAINING_SESSION_STATUS = {
    PLANNED:   STATUS_PLANNED,
    ONGOING:   STATUS_ONGOING,
    COMPLETED: STATUS_COMPLETED,
    CANCELLED: STATUS_CANCELLED,
} as const;

export type TrainingSessionStatus =
    (typeof TRAINING_SESSION_STATUS)[keyof typeof TRAINING_SESSION_STATUS];

export interface TrainingSession {
    id: string;
    title: string;
    trainer: string;
    startDate: string;
    endDate: string;
    location: string;
    capacity: number;
    trainingRequest: string;
    status: TrainingSessionStatus | string;

    startedAt?: string;
    startedBy?: string;
    completedAt?: string;
    completedBy?: string;
    cancelledAt?: string;
    cancelledBy?: string;

    '@id'?: string;
}
