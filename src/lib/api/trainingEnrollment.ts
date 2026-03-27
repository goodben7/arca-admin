import { TrainingEnrollment } from '@/types/trainingEnrollment';
import { request } from './client';

function normalizeArray(data: unknown): TrainingEnrollment[] {
    if (Array.isArray(data)) return data as TrainingEnrollment[];
    const d = data as Record<string, unknown>;
    if (Array.isArray(d?.['hydra:member'])) return d['hydra:member'] as TrainingEnrollment[];
    if (Array.isArray(d?.member)) return d.member as TrainingEnrollment[];
    return [];
}

export async function getEnrollmentsBySession(trainingSessionId: string): Promise<TrainingEnrollment[]> {
    const res = await request(`/api/training_enrollments?trainingSession=${trainingSessionId}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        const detail = (err['hydra:description'] as string) || (err.detail as string) || (err.message as string) || 'Impossible de charger les enrollements.';
        throw new Error(detail);
    }
    return normalizeArray(await res.json());
}

function parseApiError(err: Record<string, unknown>): string {
    if (err['violations'] && Array.isArray(err['violations'])) {
        return (err['violations'] as Array<{ message: string }>)
            .map((v) => v.message)
            .join(', ');
    }
    return (err['hydra:description'] as string)
        || (err.detail as string)
        || (err.message as string)
        || "Une erreur est survenue.";
}

export async function createEnrollment(payload: {
    employee: string;
    trainingSession: string;
}): Promise<TrainingEnrollment> {
    const res = await request('/api/training_enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(parseApiError(err));
    }
    return res.json();
}

export async function completeEnrollment(trainingEnrollmentId: string): Promise<void> {
    const res = await request('/api/training_enrollments/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainingEnrollmentId }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(parseApiError(err));
    }
}

export async function markEnrollmentAbsent(trainingEnrollmentId: string): Promise<void> {
    const res = await request('/api/training_enrollments/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainingEnrollmentId }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(parseApiError(err));
    }
}
