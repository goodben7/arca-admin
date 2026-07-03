import { request } from './client';
import { SuccessionPlan } from '@/types/succession';

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

export interface CreateSuccessionPlanPayload {
    criticalJobRoleId: string;
    candidate: string;
    readinessLevel: string;
    notes?: string;
}

export async function getSuccessionPlans(filters: Record<string, string> = {}): Promise<SuccessionPlan[]> {
    const params = new URLSearchParams(filters);
    const res = await request(`/api/succession_plans${params.toString() ? `?${params}` : ''}`);
    if (!res.ok) throw new Error('Impossible de charger les plans de succession.');
    return norm<SuccessionPlan>(await res.json());
}

export async function createSuccessionPlan(data: CreateSuccessionPlanPayload): Promise<SuccessionPlan> {
    const res = await request('/api/succession_plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function updateSuccessionPlan(id: string, data: Partial<SuccessionPlan>): Promise<SuccessionPlan> {
    const path = id.startsWith('/') ? id : `/api/succession_plans/${id}`;
    const res = await request(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/merge-patch+json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}
