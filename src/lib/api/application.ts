import { Application, CreateApplicationPayload } from '@/types/application';
import { buildApiUrl, request } from './client';

function normalizeList(data: any): Application[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.['hydra:member'])) return data['hydra:member'];
    if (Array.isArray(data?.member)) return data.member;
    return [];
}

// ── Public (sans auth) ────────────────────────────────────────────────────────

export async function createApplicationPublic(payload: CreateApplicationPayload): Promise<Application> {
    const response = await fetch(buildApiUrl('/api/applications'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err.message || err.detail || err['hydra:description'] || err.error || `Erreur ${response.status}`;
        throw new Error(msg);
    }
    return response.json();
}

export async function uploadDocumentPublic(formData: FormData): Promise<{ id: string; contentUrl?: string }> {
    const response = await fetch(buildApiUrl('/api/documents'), {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.detail || 'Erreur lors de l\'envoi du document.');
    }
    return response.json();
}

// ── Admin (avec auth) ─────────────────────────────────────────────────────────

export async function getAllApplications(filters: { jobOffer?: string; status?: string } = {}): Promise<Application[]> {
    const params = new URLSearchParams();
    if (filters.jobOffer) params.append('jobOffer', filters.jobOffer);
    if (filters.status) params.append('status', filters.status);
    const response = await request(`/api/applications${params.toString() ? `?${params}` : ''}`);
    if (!response.ok) throw new Error('Impossible de charger les candidatures.');
    return normalizeList(await response.json());
}

export async function getApplicationById(id: string): Promise<Application> {
    const response = await request(`/api/applications/${id}`);
    if (!response.ok) throw new Error('Impossible de charger la candidature.');
    return response.json();
}

export async function markApplicationApplied(applicationId: string): Promise<void> {
    const response = await request('/api/applications/applied', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.detail || 'Erreur lors du passage en candidature reçue.');
    }
}

export async function shortlistApplication(applicationId: string): Promise<void> {
    const response = await request('/api/applications/shortlistings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.detail || 'Erreur lors de la présélection.');
    }
}

export async function scheduleInterview(applicationId: string): Promise<void> {
    const response = await request('/api/applications/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.detail || 'Erreur lors de la planification de l\'entretien.');
    }
}

export async function rejectApplication(applicationId: string, reason: string): Promise<void> {
    const response = await request('/api/applications/rejections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, reason }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.detail || 'Erreur lors du rejet.');
    }
}

export async function hireApplication(applicationId: string): Promise<void> {
    const response = await request('/api/applications/hirings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.detail || 'Erreur lors du recrutement.');
    }
}
