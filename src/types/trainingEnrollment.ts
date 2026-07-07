export const ENROLLMENT_STATUS_ASSIGNED    = 'ASSIGNED';
export const ENROLLMENT_STATUS_IN_PROGRESS = 'IN_PROGRESS';
export const ENROLLMENT_STATUS_COMPLETED   = 'COMPLETED';
export const ENROLLMENT_STATUS_CERTIFIED   = 'CERTIFIED';
export const ENROLLMENT_STATUS_ABSENT      = 'ABSENT';
/** @deprecated alias backend historique */
export const ENROLLMENT_STATUS_ENROLLED    = 'ENROLLED';

export type TrainingEnrollmentStatus =
    | typeof ENROLLMENT_STATUS_ASSIGNED
    | typeof ENROLLMENT_STATUS_IN_PROGRESS
    | typeof ENROLLMENT_STATUS_COMPLETED
    | typeof ENROLLMENT_STATUS_CERTIFIED
    | typeof ENROLLMENT_STATUS_ABSENT
    | typeof ENROLLMENT_STATUS_ENROLLED;

export const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
    ASSIGNED: 'Assigné',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Complété',
    CERTIFIED: 'Certifié',
    ABSENT: 'Absent',
    ENROLLED: 'Enrollé',
};

export interface TrainingEnrollment {
    id: string;
    employee: string;
    trainingSession: string;
    status: TrainingEnrollmentStatus | string;
    enrolledAt?: string;
    enrolledBy?: string;
    startedAt?: string;
    completedAt?: string;
    completedBy?: string;
    certifiedAt?: string;
    score?: number;
    certificate?: string;
    absentAt?: string;
    absentBy?: string;
    createdAt?: string;
}
