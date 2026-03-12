import { Contract } from '@/types/contract';
import { request } from './client';

export async function getAllContracts(params: Record<string, any> = {}): Promise<{ 'hydra:member': Contract[] } | Contract[]> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
        }
    });

    const queryString = queryParams.toString();
    const response = await request(`/api/contracts${queryString ? `?${queryString}` : ''}`);

    if (!response.ok) {
        throw new Error('Impossible de charger la liste des contrats.');
    }

    return response.json();
}

export async function createContract(data: Partial<Contract>): Promise<Contract> {
    const response = await request('/api/contracts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la création du contrat.');
    }

    return response.json();
}

export async function getContractsByEmployee(employeeId: string): Promise<{ 'hydra:member': Contract[] } | Contract[]> {
    const response = await request(`/api/contracts?employee=${employeeId}`);

    if (!response.ok) {
        throw new Error('Impossible de charger les contrats de l\'employé.');
    }

    return response.json();
}

export async function getContractById(id: string): Promise<Contract> {
    const path = id.startsWith('/') ? id : `/api/contracts/${id}`;

    const response = await request(path);

    if (!response.ok) {
        throw new Error('Impossible de charger les détails du contrat.');
    }

    return response.json();
}
