import { DocumentRecord } from '@/types/document';
import { request } from './client';

export async function uploadDocument(formData: FormData): Promise<DocumentRecord> {
    const response = await request('/api/documents', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de l\'envoi du document.');
    }

    return response.json();
}

export async function getDocumentsByHolder(holderType: string, holderId: string): Promise<{ 'hydra:member': DocumentRecord[] } | DocumentRecord[]> {
    const response = await request(`/api/documents?holderType=${holderType}&holderId=${holderId}`);

    if (!response.ok) {
        throw new Error('Impossible de charger les documents.');
    }

    return response.json();
}

export async function getAllDocuments(filters: { type?: string; holderType?: string } = {}): Promise<{ 'hydra:member': DocumentRecord[]; 'hydra:totalItems'?: number }> {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.holderType) params.append('holderType', filters.holderType);

    const response = await request(`/api/documents${params.toString() ? `?${params}` : ''}`);

    if (!response.ok) {
        throw new Error('Impossible de charger les documents.');
    }

    const data = await response.json();
    if (Array.isArray(data)) {
        return { 'hydra:member': data };
    }
    return data;
}

export async function deleteDocument(id: string): Promise<void> {
    const docId = id.includes('/') ? id.split('/').pop() : id;
    const response = await request(`/api/documents/${docId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Impossible de supprimer le document.');
    }
}
