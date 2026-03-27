import { TrainingSession } from '@/types/trainingSession';
import { request } from './client';

function normalizeArray(data: unknown): TrainingSession[] {
    if (Array.isArray(data)) return data as TrainingSession[];
    const d = data as Record<string, unknown>;
    if (Array.isArray(d?.['hydra:member'])) return d['hydra:member'] as TrainingSession[];
    if (Array.isArray(d?.member)) return d.member as TrainingSession[];
    return [];
}

export async function getAllTrainingSessions(): Promise<TrainingSession[]> {
    const res = await request('/api/training_sessions');
    if (!res.ok) throw new Error('Impossible de charger les sessions de formation.');
    return normalizeArray(await res.json());
}

export async function getTrainingSessionById(id: string): Promise<TrainingSession> {
    const path = id.startsWith('/') ? id : `/api/training_sessions/${id}`;
    const res = await request(path);
    if (!res.ok) throw new Error(`Impossible de charger la session ${id}.`);
    return res.json();
}

export async function createTrainingSession(payload: {
    title: string;
    trainer: string;
    startDate: string;
    endDate: string;
    location: string;
    capacity: number;
    trainingRequest: string;
}): Promise<TrainingSession> {
    const res = await request('/api/training_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, string>;
        throw new Error(err.message || err.detail || 'Erreur lors de la création de la session.');
    }
    return res.json();
}

export async function startTrainingSession(trainingSessionId: string): Promise<void> {
    const res = await request('/api/training_sessions/startings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainingSessionId }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, string>;
        throw new Error(err.message || err.detail || 'Erreur lors du démarrage.');
    }
}

export async function completeTrainingSession(trainingSessionId: string): Promise<void> {
    const res = await request('/api/training_sessions/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainingSessionId }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, string>;
        throw new Error(err.message || err.detail || 'Erreur lors de la complétion.');
    }
}

export async function cancelTrainingSession(trainingSessionId: string, reason: string): Promise<void> {
    const res = await request('/api/training_sessions/cancellations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainingSessionId, reason }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, string>;
        throw new Error(err.message || err.detail || "Erreur lors de l'annulation.");
    }
}
