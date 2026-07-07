import { request } from './client';
import { extractId } from '@/lib/api-iri';
import { Benefit, EmployeeBenefit, CreateBenefitDto, CreateEmployeeBenefitDto } from '@/types/benefit';

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

function toIso(d?: string) {
    if (!d) return undefined;
    if (d.includes('T')) return new Date(d).toISOString();
    return new Date(`${d}T00:00:00`).toISOString();
}

export async function getBenefits(): Promise<Benefit[]> {
    const res = await request('/api/benefits');
    if (!res.ok) throw new Error('Impossible de charger les avantages.');
    return norm<Benefit>(await res.json());
}

export async function createBenefit(data: CreateBenefitDto): Promise<Benefit> {
    const payload = {
        code: data.code.trim(),
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        type: data.type,
    };
    const res = await request('/api/benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function updateBenefit(id: string, data: Partial<CreateBenefitDto>): Promise<Benefit> {
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
    const id = employeeId ? extractId(employeeId) || employeeId : undefined;
    const url = id ? `/api/employee_benefits?employee=${id}` : '/api/employee_benefits';
    const res = await request(url);
    if (!res.ok) throw new Error('Impossible de charger les avantages employé.');
    return norm<EmployeeBenefit>(await res.json());
}

export async function createEmployeeBenefit(data: CreateEmployeeBenefitDto): Promise<EmployeeBenefit> {
    const payload = {
        employee: extractId(data.employee) || data.employee,
        benefitId: extractId(data.benefitId) || data.benefitId,
        startDate: toIso(data.startDate),
        endDate: data.endDate ? toIso(data.endDate) : undefined,
    };
    const res = await request('/api/employee_benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
