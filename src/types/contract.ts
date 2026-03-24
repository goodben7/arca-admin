export const CONTRACT_TYPE = {
    CDI: 'CDI',
    CDD: 'CDD',
    INTERNSHIP: 'INTERNSHIP',
    CONSULTANT: 'CONSULTANT'
} as const;

export const CONTRACT_STATUS = {
    PENDING: 'PENDING',
    ACTIVE: 'ACTIVE',
    ENDED: 'ENDED',
    CANCELLED: 'CANCELLED'
} as const;

export interface Contract {
    id: string;
    employee: string; // This might be an ID or an object depending on the API, usually it's an IRI or ID
    type: string;
    startDate: string;
    endDate?: string | null;
    salary: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    activatedAt?: string | null;
    activatedBy?: string | null;
    endedAt?: string | null;
    endedBy?: string | null;
    cancelledAt?: string | null;
    cancelledBy?: string | null;
    pendingAt?: string | null;
    pendingBy?: string | null;
}
