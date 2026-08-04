import { request } from './client';
import type { CreateSanctionScalePayload, SanctionScale } from '@/types/sanctions';
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

export async function getSanctionScales(filters: Record<string, string> = {}): Promise<SanctionScale[]> {
    const params = new URLSearchParams(filters);
    const res = await request(`/api/sanction_scales${params.toString() ? `?${params}` : ''}`);
    if (!res.ok) throw new Error('Impossible de charger les échelles de sanctions.');
    return norm<SanctionScale>(await res.json());
}

export async function getSanctionScaleById(id: string): Promise<SanctionScale> {
    const path = id.startsWith('/') ? id : `/api/sanction_scales/${extractId(id)}`;
    const res = await request(path);
    if (!res.ok) throw new Error('Échelle introuvable.');
    return res.json();
}

export async function createSanctionScale(data: CreateSanctionScalePayload): Promise<SanctionScale> {
    const res = await request('/api/sanction_scales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const e = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(apiErr(e));
    }
    return res.json();
}

export async function updateSanctionScale(id: string, data: Partial<CreateSanctionScalePayload>): Promise<SanctionScale> {
    const res = await request(`/api/sanction_scales/${extractId(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/merge-patch+json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const e = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(apiErr(e));
    }
    return res.json();
}
