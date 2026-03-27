import { TrainingRequest } from '@/types/training';
import { request } from './client';

function normalizeArray(data: any): TrainingRequest[] {
    if (Array.isArray(data)) return data as TrainingRequest[];
    if (Array.isArray(data?.['hydra:member'])) return data['hydra:member'] as TrainingRequest[];
    if (Array.isArray(data?.member)) return data.member as TrainingRequest[];
    return [];
}

export async function getAllTrainingRequests(): Promise<TrainingRequest[]> {
    const response = await request('/api/training_requests');
    if (!response.ok) throw new Error('Impossible de charger les demandes de formation.');
    const json = await response.json();
    return normalizeArray(json);
}

export async function getTrainingRequestById(id: string): Promise<TrainingRequest> {
    const path = id.startsWith('/') ? id : `/api/training_requests/${id}`;
    const response = await request(path);
    if (!response.ok) throw new Error(`Impossible de charger la demande de formation ${id}.`);
    return response.json();
}

export async function createTrainingRequest(payload: {
    department: string;
    title: string;
    description: string;
    numberOfParticipants: number;
    priority: string;
}): Promise<TrainingRequest> {
    const response = await request('/api/training_requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.detail || 'Erreur lors de la création de la demande.');
    }
    return response.json();
}

export async function approveTrainingRequest(trainingRequestId: string): Promise<void> {
    const response = await request('/api/training_requests/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainingRequestId }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.detail || "Erreur lors de l'approbation.");
    }
}

export async function rejectTrainingRequest(trainingRequestId: string, reason: string): Promise<void> {
    const response = await request('/api/training_requests/rejections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainingRequestId, reason }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.detail || 'Erreur lors du refus.');
    }
}
