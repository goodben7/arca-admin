import { request } from './client';
import { CareerPlan } from '@/types/careerPlan';
import { extractId } from '@/lib/api-iri';

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

export interface CreateCareerPlanPayload {
    employee: string;
    targetJobRoleId: string;
    targetGradeId?: string;
    targetDate?: string;
    notes?: string;
}

export async function getCareerPlans(filters: Record<string, string> = {}): Promise<CareerPlan[]> {
    const params = new URLSearchParams(filters);
    const res = await request(`/api/career_plans${params.toString() ? `?${params}` : ''}`);
    if (!res.ok) throw new Error('Impossible de charger les plans de carrière.');
    return norm<CareerPlan>(await res.json());
}

export async function getCareerPlanById(id: string): Promise<CareerPlan> {
    const path = id.startsWith('/') ? id : `/api/career_plans/${id}`;
    const res = await request(path);
    if (!res.ok) throw new Error('Plan de carrière introuvable.');
    return res.json();
}

export async function createCareerPlan(data: CreateCareerPlanPayload): Promise<CareerPlan> {
    const payload = {
        employee: extractId(data.employee),
        targetJobRoleId: extractId(data.targetJobRoleId),
        targetGradeId: data.targetGradeId ? extractId(data.targetGradeId) : undefined,
        targetDate: data.targetDate || undefined,
        notes: data.notes || undefined,
    };
    const res = await request('/api/career_plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function updateCareerPlan(id: string, data: Partial<CareerPlan>): Promise<CareerPlan> {
    const path = id.startsWith('/') ? id : `/api/career_plans/${id}`;
    const res = await request(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/merge-patch+json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}
