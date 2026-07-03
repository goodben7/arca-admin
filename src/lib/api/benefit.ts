import { request } from './client';
import { Benefit, EmployeeBenefit } from '@/types/benefit';

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

export async function getBenefits(): Promise<Benefit[]> {
    const res = await request('/api/benefits');
    if (!res.ok) throw new Error('Impossible de charger les avantages.');
    return norm<Benefit>(await res.json());
}

export async function createBenefit(data: Partial<Benefit>): Promise<Benefit> {
    const res = await request('/api/benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function updateBenefit(id: string, data: Partial<Benefit>): Promise<Benefit> {
    const path = id.startsWith('/') ? id : `/api/benefits/${id}`;
    const res = await request(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/merge-patch+json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function getEmployeeBenefits(employeeId?: string): Promise<EmployeeBenefit[]> {
    const url = employeeId ? `/api/employee_benefits?employee=${employeeId}` : '/api/employee_benefits';
    const res = await request(url);
    if (!res.ok) throw new Error('Impossible de charger les avantages employé.');
    return norm<EmployeeBenefit>(await res.json());
}

export async function createEmployeeBenefit(data: Partial<EmployeeBenefit>): Promise<EmployeeBenefit> {
    const res = await request('/api/employee_benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function updateEmployeeBenefit(id: string, data: Partial<EmployeeBenefit>): Promise<EmployeeBenefit> {
    const path = id.startsWith('/') ? id : `/api/employee_benefits/${id}`;
    const res = await request(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/merge-patch+json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}
