import { TrainingEnrollment } from '@/types/trainingEnrollment';
import { extractId } from '@/lib/api-iri';
import { request } from './client';

function normalizeArray(data: unknown): TrainingEnrollment[] {
    if (Array.isArray(data)) return data as TrainingEnrollment[];
    const d = data as Record<string, unknown>;
    if (Array.isArray(d?.['hydra:member'])) return d['hydra:member'] as TrainingEnrollment[];
    if (Array.isArray(d?.member)) return d.member as TrainingEnrollment[];
    return [];
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
        || 'Une erreur est survenue.';
}

function enrollmentId(id: string): string {
    return extractId(id) || id;
}

async function postEnrollmentAction(path: string, trainingEnrollmentId: string, extra: Record<string, unknown> = {}) {
    const res = await request(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainingEnrollmentId: enrollmentId(trainingEnrollmentId), ...extra }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(parseApiError(err));
    }
    const text = await res.text();
    return text ? JSON.parse(text) : {};
}

export async function getEnrollmentsBySession(trainingSessionId: string): Promise<TrainingEnrollment[]> {
    const sid = enrollmentId(trainingSessionId);
    const res = await request(`/api/training_enrollments?trainingSession=${sid}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(parseApiError(err));
    }
    return normalizeArray(await res.json());
}

export async function createEnrollment(payload: {
    employee: string;
    trainingSession: string;
}): Promise<TrainingEnrollment> {
    const body = {
        employee: enrollmentId(payload.employee),
        trainingSession: enrollmentId(payload.trainingSession),
    };
    const res = await request('/api/training_enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(parseApiError(err));
    }
    return res.json();
}

/** Confirme l'inscription (ASSIGNED → …) */
export async function confirmEnrollment(trainingEnrollmentId: string): Promise<void> {
    await postEnrollmentAction('/api/training_enrollments/enrollments', trainingEnrollmentId);
}

/** Démarre la participation (→ IN_PROGRESS) */
export async function startEnrollment(trainingEnrollmentId: string): Promise<void> {
    await postEnrollmentAction('/api/training_enrollments/starts', trainingEnrollmentId);
}

/** Marque comme complété (→ COMPLETED) */
export async function completeEnrollment(trainingEnrollmentId: string): Promise<void> {
    await postEnrollmentAction('/api/training_enrollments/completions', trainingEnrollmentId);
}

/** Certifie la formation (→ CERTIFIED) */
export async function certifyEnrollment(data: {
    trainingEnrollmentId: string;
    score: number;
    certificate?: string;
}): Promise<void> {
    await postEnrollmentAction('/api/training_enrollments/certifications', data.trainingEnrollmentId, {
        score: data.score,
        certificate: data.certificate || undefined,
    });
}

/** Marque comme absent (→ ABSENT) */
export async function markEnrollmentAbsent(trainingEnrollmentId: string): Promise<void> {
    await postEnrollmentAction('/api/training_enrollments/absences', trainingEnrollmentId);
}
