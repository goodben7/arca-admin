import { request } from './client';
import { extractId } from '@/lib/api-iri';
import { CompensationHistory, RecordCompensationDto } from '@/types/compensation';

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

export async function getCompensationHistories(employeeId?: string): Promise<CompensationHistory[]> {
    const id = employeeId ? extractId(employeeId) || employeeId : undefined;
    const url = id ? `/api/compensation_histories?employee=${id}` : '/api/compensation_histories';
    const res = await request(url);
    if (!res.ok) throw new Error('Impossible de charger l\'historique de compensation.');
    return norm<CompensationHistory>(await res.json());
}

export async function recordCompensation(data: RecordCompensationDto): Promise<CompensationHistory> {
    const toIso = (d: string) => {
        if (!d) return d;
        if (d.includes('T')) return new Date(d).toISOString();
        return new Date(`${d}T00:00:00`).toISOString();
    };
    const payload = {
        employee: extractId(data.employee) || data.employee,
        newSalary: String(data.newSalary).trim(),
        effectiveDate: toIso(data.effectiveDate),
        reason: data.reason?.trim() || undefined,
    };
    const res = await request('/api/compensation_histories/recordings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}
