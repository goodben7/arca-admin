import { MobilityRequest } from '@/types/mobilityRequest';
import { extractId } from '@/lib/api-iri';
import { request } from './client';

function normalizeList(data: unknown): MobilityRequest[] {
    if (Array.isArray(data)) return data as MobilityRequest[];
    const d = data as Record<string, unknown>;
    if (Array.isArray(d?.['hydra:member'])) return d['hydra:member'] as MobilityRequest[];
    if (Array.isArray(d?.member)) return d.member as MobilityRequest[];
    return [];
}

function parseApiError(err: Record<string, unknown>): string {
    if (Array.isArray(err['violations'])) {
        return (err['violations'] as Array<{ message: string }>)
            .map((v) => v.message)
            .join(', ');
    }
    return (
        (err['hydra:description'] as string) ||
        (err.detail as string) ||
        (err.message as string) ||
        'Une erreur est survenue.'
    );
}

export async function getAllMobilityRequests(
    filters: { employee?: string; type?: string; status?: string } = {}
): Promise<MobilityRequest[]> {
    const params = new URLSearchParams();
    if (filters.employee) params.append('employee', filters.employee);
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);

    const res = await request(`/api/mobility_requests${params.toString() ? `?${params}` : ''}`);
    if (!res.ok) throw new Error('Impossible de charger les demandes de mobilité.');
    return normalizeList(await res.json());
}

export async function getMobilityRequestById(id: string): Promise<MobilityRequest> {
    const path = id.startsWith('/') ? id : `/api/mobility_requests/${id}`;
    const res = await request(path);
    if (!res.ok) throw new Error(`Impossible de charger la demande de mobilité ${id}.`);
    return res.json();
}

export interface CreateMobilityRequestPayload {
    employee: string;
    type: string;
    reason: string;
    targetDepartment?: string;
    targetJobRoleId?: string;
    targetGradeId?: string;
}

export async function createMobilityRequest(payload: CreateMobilityRequestPayload): Promise<MobilityRequest> {
    const body: Record<string, string> = {
        employee: extractId(payload.employee) || payload.employee,
        type: payload.type,
        reason: payload.reason,
    };
    if (payload.targetDepartment) {
        body.targetDepartment = extractId(payload.targetDepartment) || payload.targetDepartment;
    }
    if (payload.targetJobRoleId) {
        body.targetJobRoleId = extractId(payload.targetJobRoleId) || payload.targetJobRoleId;
    }
    if (payload.targetGradeId) {
        body.targetGradeId = extractId(payload.targetGradeId) || payload.targetGradeId;
    }

    const res = await request('/api/mobility_requests', {
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

export async function submitMobilityRequest(mobilityRequestId: string): Promise<void> {
    const res = await request('/api/mobility_requests/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobilityRequestId }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(parseApiError(err));
    }
}

export async function approveMobilityRequest(mobilityRequestId: string): Promise<void> {
    const res = await request('/api/mobility_requests/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobilityRequestId }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(parseApiError(err));
    }
}

export async function rejectMobilityRequest(
    mobilityRequestId: string,
    reason: string
): Promise<void> {
    const res = await request('/api/mobility_requests/rejections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobilityRequestId, reason }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(parseApiError(err));
    }
}

export async function cancelMobilityRequest(mobilityRequestId: string): Promise<void> {
    const res = await request('/api/mobility_requests/cancellations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobilityRequestId }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(parseApiError(err));
    }
}
