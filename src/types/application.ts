export const APPLICATION_STATUS = {
    APPLIED: 'APPLIED',
    SHORTLISTED: 'SHORTLISTED',
    INTERVIEW: 'INTERVIEW',
    REJECTED: 'REJECTED',
    HIRED: 'HIRED',
} as const;

export type ApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
    APPLIED: 'Candidature reçue',
    SHORTLISTED: 'Présélectionné(e)',
    INTERVIEW: 'Entretien',
    REJECTED: 'Rejeté(e)',
    HIRED: 'Recruté(e)',
};

export const APPLICATION_STATUS_STYLES: Record<ApplicationStatus, string> = {
    APPLIED: 'bg-primary-50 text-primary-700 border-primary-100',
    SHORTLISTED: 'bg-amber-50 text-amber-700 border-amber-100',
    INTERVIEW: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-100',
    HIRED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

export interface Application {
    id: string;
    firstName: string;
    lastName: string;
    gender: 'M' | 'F' | string;
    email: string;
    phone: string;
    jobOffer: string;
    status: ApplicationStatus | string;
    notes?: string;
    appliedAt?: string;
    shortlistedAt?: string;
    shortlistedBy?: string;
    interviewAt?: string;
    interviewBy?: string;
    rejectedAt?: string;
    rejectedBy?: string;
    rejectionReason?: string;
    hiredAt?: string;
    hiredBy?: string;
    createdAt?: string;
}

export interface CreateApplicationPayload {
    firstName: string;
    lastName: string;
    gender: 'M' | 'F';
    email: string;
    phone: string;
    jobOffer: string;
    notes?: string;
}
