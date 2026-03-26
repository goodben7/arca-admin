export const STATUS_DRAFT = 'DRAFT';
export const STATUS_PUBLISHED = 'PUBLISHED';
export const STATUS_CLOSED = 'CLOSED';

export const JOB_OFFER_STATUS = {
    DRAFT: STATUS_DRAFT,
    PUBLISHED: STATUS_PUBLISHED,
    CLOSED: STATUS_CLOSED,
} as const;

export type JobOfferStatus = typeof JOB_OFFER_STATUS[keyof typeof JOB_OFFER_STATUS];

export interface JobOffer {
    id: string;
    title: string;
    description?: string;
    department: string;
    recruitmentRequest: string;

    status: JobOfferStatus | string;

    publishedAt?: string;
    publishedBy?: string;
    closedAt?: string;
    closedBy?: string;
    createdAt?: string;
}

