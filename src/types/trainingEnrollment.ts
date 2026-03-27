export const ENROLLMENT_STATUS_ENROLLED  = 'ENROLLED';
export const ENROLLMENT_STATUS_COMPLETED = 'COMPLETED';
export const ENROLLMENT_STATUS_ABSENT    = 'ABSENT';

export type TrainingEnrollmentStatus =
    | typeof ENROLLMENT_STATUS_ENROLLED
    | typeof ENROLLMENT_STATUS_COMPLETED
    | typeof ENROLLMENT_STATUS_ABSENT;

export interface TrainingEnrollment {
    id: string;
    employee: string;
    trainingSession: string;
    status: TrainingEnrollmentStatus | string;
    enrolledAt: string;
    enrolledBy: string;
    completedAt?: string;
    completedBy?: string;
    absentAt?: string;
    absentBy?: string;
    createdAt: string;
}
