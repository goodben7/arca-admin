import { JobOffer } from '@/types/jobOffer';
import { BASE_URL, request } from './client';

function normalizeArray(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.['hydra:member'])) return data['hydra:member'];
    if (Array.isArray(data?.member)) return data.member;
    return [];
}

export async function getPublishedJobOffers(): Promise<JobOffer[]> {
    const response = await fetch(`${BASE_URL}/api/job_offers?status=PUBLISHED`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
    });
    if (!response.ok) throw new Error('Impossible de charger les offres publiées.');
    return normalizeArray(await response.json()) as JobOffer[];
}

export async function getPublicDepartments(): Promise<{ id: string; name: string; '@id'?: string }[]> {
    const response = await fetch(`${BASE_URL}/api/departments`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
    });
    if (!response.ok) return [];
    return normalizeArray(await response.json());
}

export async function getAllJobOffers(): Promise<any> {
    const response = await request('/api/job_offers');
    if (!response.ok) throw new Error('Impossible de charger les offres d’emploi.');
    return response.json();
}

export async function getJobOfferById(id: string): Promise<JobOffer> {
    const path = id.startsWith('/') ? id : `/api/job_offers/${id}`;
    const response = await request(path);
    if (!response.ok) throw new Error(`Impossible de charger l’offre d’emploi ${id}.`);
    return response.json();
}

export async function updateJobOffer(id: string, data: { title: string; description?: string }): Promise<JobOffer> {
    const path = id.startsWith('/') ? id : `/api/job_offers/${id}`;
    const response = await request(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || "Erreur lors de la mise à jour de l'offre.");
    }
    return response.json();
}

/** @deprecated use updateJobOffer */
export const updateJobOfferTitle = updateJobOffer;

export async function closeJobOffer(jobOfferId: string): Promise<void> {
    const response = await request('/api/job_offers/closures', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobOfferId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || "Erreur lors de la clôture de l'offre.");
    }
}

export async function createDraftJobOffer(jobOfferId: string): Promise<void> {
    const response = await request('/api/job_offers/drafts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobOfferId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || "Erreur lors du passage en brouillon.");
    }
}

export async function publishJobOffer(jobOfferId: string): Promise<void> {
    const response = await request('/api/job_offers/publications', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobOfferId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || "Erreur lors de la publication de l'offre.");
    }
}

