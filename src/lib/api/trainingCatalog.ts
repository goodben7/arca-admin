import { request } from './client';
import { TrainingCatalog, JobRoleRequiredTraining } from '@/types/trainingCatalog';

function norm<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    const d = data as Record<string, unknown>;
    if (Array.isArray(d?.['hydra:member'])) return d['hydra:member'] as T[];
    if (Array.isArray(d?.member)) return d.member as T[];
    return [];
}

function apiErr(e: Record<string, unknown>): string {
    if (Array.isArray(e['violations'])) {
        return (e['violations'] as Array<{ message: string }>).map(v => v.message).join(', ');
    }
    return (e['hydra:description'] as string) || (e.detail as string) || (e.message as string) || 'Une erreur est survenue.';
}

export async function getTrainingCatalogs(filters: Record<string, string> = {}): Promise<TrainingCatalog[]> {
    const params = new URLSearchParams(filters);
    const res = await request(`/api/training_catalogs${params.toString() ? `?${params}` : ''}`);
    if (!res.ok) throw new Error('Impossible de charger le catalogue de formations.');
    return norm<TrainingCatalog>(await res.json());
}

export async function getTrainingCatalogById(id: string): Promise<TrainingCatalog> {
    const path = id.startsWith('/') ? id : `/api/training_catalogs/${id}`;
    const res = await request(path);
    if (!res.ok) throw new Error('Formation catalogue introuvable.');
    return res.json();
}

export async function createTrainingCatalog(data: Partial<TrainingCatalog>): Promise<TrainingCatalog> {
    const res = await request('/api/training_catalogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function updateTrainingCatalog(id: string, data: Partial<TrainingCatalog>): Promise<TrainingCatalog> {
    const path = id.startsWith('/') ? id : `/api/training_catalogs/${id}`;
    const res = await request(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/merge-patch+json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function getJobRoleRequiredTrainings(jobRoleId?: string): Promise<JobRoleRequiredTraining[]> {
    const url = jobRoleId ? `/api/job_role_required_trainings?jobRole=${jobRoleId}` : '/api/job_role_required_trainings';
    const res = await request(url);
    if (!res.ok) throw new Error('Impossible de charger les formations requises.');
    return norm<JobRoleRequiredTraining>(await res.json());
}

export async function createJobRoleRequiredTraining(data: Partial<JobRoleRequiredTraining>): Promise<JobRoleRequiredTraining> {
    const res = await request('/api/job_role_required_trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}
