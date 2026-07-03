import { request } from './client';
import { OnboardingProcess, OnboardingTask, EmployeeJourneyEntry } from '@/types/onboarding';
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

// ── Onboarding Processes ──────────────────────────────────────────────────────

export async function getOnboardingProcesses(filters: Record<string, string> = {}): Promise<OnboardingProcess[]> {
    const params = new URLSearchParams(filters);
    const res = await request(`/api/onboarding_processes${params.toString() ? `?${params}` : ''}`);
    if (!res.ok) throw new Error('Impossible de charger les processus d\'onboarding.');
    return norm<OnboardingProcess>(await res.json());
}

export async function getOnboardingProcessById(id: string): Promise<OnboardingProcess> {
    const path = id.startsWith('/') ? id : `/api/onboarding_processes/${id}`;
    const res = await request(path);
    if (!res.ok) throw new Error('Processus d\'onboarding introuvable.');
    return res.json();
}

export async function completeOnboardingProcess(processId: string): Promise<void> {
    const res = await request('/api/onboarding_processes/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingProcessId: extractId(processId) }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
}

export async function cancelOnboardingProcess(processId: string): Promise<void> {
    const res = await request('/api/onboarding_processes/cancellations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingProcessId: extractId(processId) }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
}

// ── Onboarding Tasks ──────────────────────────────────────────────────────────

export async function getOnboardingTasks(processId: string): Promise<OnboardingTask[]> {
    const id = extractId(processId);
    const res = await request(`/api/onboarding_tasks?process=${id}`);
    if (!res.ok) throw new Error('Impossible de charger les tâches d\'onboarding.');
    return norm<OnboardingTask>(await res.json());
}

export async function startOnboardingTask(taskId: string): Promise<void> {
    const res = await request('/api/onboarding_tasks/starts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingTaskId: extractId(taskId) }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
}

export async function completeOnboardingTask(taskId: string): Promise<void> {
    const res = await request('/api/onboarding_tasks/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingTaskId: extractId(taskId) }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
}

export async function cancelOnboardingTask(taskId: string): Promise<void> {
    const res = await request('/api/onboarding_tasks/cancellations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingTaskId: extractId(taskId) }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
}

// ── Employee Journey ──────────────────────────────────────────────────────────

export async function getEmployeeJourney(employeeId: string): Promise<EmployeeJourneyEntry[]> {
    const id = extractId(employeeId);
    const res = await request(`/api/employees/${id}/journey?order[occurredAt]=desc`);
    if (!res.ok) throw new Error('Impossible de charger le parcours employé.');
    return norm<EmployeeJourneyEntry>(await res.json());
}
