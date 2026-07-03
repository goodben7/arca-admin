import { request } from './client';
import { JobFamily, Grade, JobRole, CareerPath } from '@/types/jobArchitecture';

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

// ── Job Families ─────────────────────────────────────────────────────────────

export async function getJobFamilies(): Promise<JobFamily[]> {
    const res = await request('/api/job_families');
    if (!res.ok) throw new Error('Impossible de charger les familles de métiers.');
    return norm<JobFamily>(await res.json());
}

export async function getJobFamilyById(id: string): Promise<JobFamily> {
    const path = id.startsWith('/') ? id : `/api/job_families/${id}`;
    const res = await request(path);
    if (!res.ok) throw new Error('Famille de métier introuvable.');
    return res.json();
}

export async function createJobFamily(data: Partial<JobFamily>): Promise<JobFamily> {
    const res = await request('/api/job_families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function updateJobFamily(id: string, data: Partial<JobFamily>): Promise<JobFamily> {
    const path = id.startsWith('/') ? id : `/api/job_families/${id}`;
    const res = await request(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/merge-patch+json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

// ── Grades ───────────────────────────────────────────────────────────────────

export async function getGrades(): Promise<Grade[]> {
    const res = await request('/api/grades');
    if (!res.ok) throw new Error('Impossible de charger les grades.');
    return norm<Grade>(await res.json());
}

export async function getGradeById(id: string): Promise<Grade> {
    const path = id.startsWith('/') ? id : `/api/grades/${id}`;
    const res = await request(path);
    if (!res.ok) throw new Error('Grade introuvable.');
    return res.json();
}

export async function createGrade(data: Partial<Grade>): Promise<Grade> {
    const res = await request('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function updateGrade(id: string, data: Partial<Grade>): Promise<Grade> {
    const path = id.startsWith('/') ? id : `/api/grades/${id}`;
    const res = await request(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/merge-patch+json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

// ── Job Roles ─────────────────────────────────────────────────────────────────

export async function getJobRoles(filters: Record<string, string> = {}): Promise<JobRole[]> {
    const params = new URLSearchParams(filters);
    const res = await request(`/api/job_roles${params.toString() ? `?${params}` : ''}`);
    if (!res.ok) throw new Error('Impossible de charger les fiches métiers.');
    return norm<JobRole>(await res.json());
}

export async function getJobRoleById(id: string): Promise<JobRole> {
    const path = id.startsWith('/') ? id : `/api/job_roles/${id}`;
    const res = await request(path);
    if (!res.ok) throw new Error('Fiche métier introuvable.');
    return res.json();
}

export async function createJobRole(data: Partial<JobRole>): Promise<JobRole> {
    const res = await request('/api/job_roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function updateJobRole(id: string, data: Partial<JobRole>): Promise<JobRole> {
    const path = id.startsWith('/') ? id : `/api/job_roles/${id}`;
    const res = await request(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/merge-patch+json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

// ── Career Paths ──────────────────────────────────────────────────────────────

export async function getCareerPaths(filters: Record<string, string> = {}): Promise<CareerPath[]> {
    const params = new URLSearchParams(filters);
    const res = await request(`/api/career_paths${params.toString() ? `?${params}` : ''}`);
    if (!res.ok) throw new Error('Impossible de charger les parcours de carrière.');
    return norm<CareerPath>(await res.json());
}

export async function createCareerPath(data: Partial<CareerPath>): Promise<CareerPath> {
    const res = await request('/api/career_paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}
