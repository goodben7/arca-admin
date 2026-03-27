import { RecruitmentRequest } from '@/types/recruitment';
import { request } from './client';

export async function getAllRecruitmentRequests(): Promise<any> {
    const response = await request('/api/recruitment_requests');
    if (!response.ok) throw new Error('Impossible de charger les demandes de recrutement.');
    return response.json();
}

export async function getRecruitmentRequestById(id: string): Promise<RecruitmentRequest> {
    const path = id.startsWith('/') ? id : `/api/recruitment_requests/${id}`;
    const response = await request(path);
    if (!response.ok) throw new Error(`Impossible de charger la demande de recrutement ${id}.`);
    return response.json();
}

export async function approveRecruitmentRequest(recruitmentRequestId: string): Promise<void> {
    const response = await request('/api/recruitment_requests/approvals', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recruitmentRequestId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || "Erreur lors de l'approbation.");
    }
}

export async function rejectRecruitmentRequest(recruitmentRequestId: string, reason: string): Promise<void> {
    const response = await request('/api/recruitment_requests/rejections', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recruitmentRequestId, reason }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || "Erreur lors du refus.");
    }
}

export async function updateRecruitmentRequest(id: string, data: { description?: string; justification?: string }): Promise<RecruitmentRequest> {
    const path = id.startsWith('/') ? id : `/api/recruitment_requests/${id}`;
    const response = await request(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || 'Erreur lors de la mise à jour.');
    }
    return response.json();
}

export async function createRecruitmentRequest(payload: {
    department: string;
    position: string;
    numberOfPositions: number;
    justification: string;
    description: string;
}): Promise<RecruitmentRequest> {
    const response = await request('/api/recruitment_requests', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || "Erreur lors de la création de la demande de recrutement.");
    }

    return response.json();
}

