import { request } from './client';
import { extractId } from '@/lib/api-iri';
import { SkillCategory, Skill, EmployeeSkill, JobRoleRequiredSkill } from '@/types/skill';

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

// ── Skill Categories ──────────────────────────────────────────────────────────

export async function getSkillCategories(): Promise<SkillCategory[]> {
    const res = await request('/api/skill_categories');
    if (!res.ok) throw new Error('Impossible de charger les catégories de compétences.');
    return norm<SkillCategory>(await res.json());
}

export async function createSkillCategory(data: Partial<SkillCategory>): Promise<SkillCategory> {
    const res = await request('/api/skill_categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function updateSkillCategory(id: string, data: Partial<SkillCategory>): Promise<SkillCategory> {
    const path = id.startsWith('/') ? id : `/api/skill_categories/${id}`;
    const res = await request(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/merge-patch+json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

// ── Skills ────────────────────────────────────────────────────────────────────

export async function getSkills(filters: Record<string, string> = {}): Promise<Skill[]> {
    const params = new URLSearchParams(filters);
    const res = await request(`/api/skills${params.toString() ? `?${params}` : ''}`);
    if (!res.ok) throw new Error('Impossible de charger les compétences.');
    return norm<Skill>(await res.json());
}

export async function getSkillById(id: string): Promise<Skill> {
    const path = id.startsWith('/') ? id : `/api/skills/${id}`;
    const res = await request(path);
    if (!res.ok) throw new Error('Compétence introuvable.');
    return res.json();
}

export async function createSkill(data: Partial<Skill>): Promise<Skill> {
    const res = await request('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function updateSkill(id: string, data: Partial<Skill>): Promise<Skill> {
    const path = id.startsWith('/') ? id : `/api/skills/${id}`;
    const res = await request(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/merge-patch+json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

// ── Employee Skills ───────────────────────────────────────────────────────────

export async function getEmployeeSkills(employeeId: string): Promise<EmployeeSkill[]> {
    const res = await request(`/api/employee_skills?employee=${employeeId}`);
    if (!res.ok) throw new Error('Impossible de charger les compétences employé.');
    return norm<EmployeeSkill>(await res.json());
}

export interface CreateEmployeeSkillPayload {
    employee: string;
    skill: string;
    level: string;
}

export async function createEmployeeSkill(data: CreateEmployeeSkillPayload): Promise<EmployeeSkill> {
    const body = {
        employee: extractId(data.employee) || data.employee,
        skill: extractId(data.skill) || data.skill,
        level: data.level,
    };
    const res = await request('/api/employee_skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function validateEmployeeSkill(employeeSkillId: string): Promise<void> {
    const id = extractId(employeeSkillId) || employeeSkillId;
    const res = await request('/api/employee_skills/validations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeSkillId: id }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
}

export async function updateEmployeeSkill(id: string, data: Partial<EmployeeSkill>): Promise<EmployeeSkill> {
    const path = id.startsWith('/') ? id : `/api/employee_skills/${id}`;
    const res = await request(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/merge-patch+json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

// ── Job Role Required Skills ──────────────────────────────────────────────────

export async function getJobRoleRequiredSkills(jobRoleId?: string): Promise<JobRoleRequiredSkill[]> {
    const url = jobRoleId ? `/api/job_role_required_skills?jobRole=${jobRoleId}` : '/api/job_role_required_skills';
    const res = await request(url);
    if (!res.ok) throw new Error('Impossible de charger les compétences requises.');
    return norm<JobRoleRequiredSkill>(await res.json());
}

export async function createJobRoleRequiredSkill(data: Partial<JobRoleRequiredSkill>): Promise<JobRoleRequiredSkill> {
    const res = await request('/api/job_role_required_skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}
