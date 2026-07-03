import { request } from './client';
import { ExitProcess, ExitTask } from '@/types/offboarding';
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

export async function getExitProcesses(filters: Record<string, string> = {}): Promise<ExitProcess[]> {
    const params = new URLSearchParams(filters);
    const res = await request(`/api/exit_processes${params.toString() ? `?${params}` : ''}`);
    if (!res.ok) throw new Error('Impossible de charger les processus de sortie.');
    return norm<ExitProcess>(await res.json());
}

export async function getExitProcessById(id: string): Promise<ExitProcess> {
    const path = id.startsWith('/') ? id : `/api/exit_processes/${id}`;
    const res = await request(path);
    if (!res.ok) throw new Error('Processus de sortie introuvable.');
    return res.json();
}

export async function createExitProcess(data: {
    employee: string;
    reason: string;
    departureDate?: string;
}): Promise<ExitProcess> {
    const res = await request('/api/exit_processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            employee: extractId(data.employee),
            reason: data.reason,
            departureDate: data.departureDate,
        }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function startExitProcess(processId: string): Promise<void> {
    const res = await request('/api/exit_processes/starts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exitProcessId: extractId(processId) }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
}

export async function completeExitProcess(processId: string): Promise<void> {
    const res = await request('/api/exit_processes/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exitProcessId: extractId(processId) }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
}

export async function getExitTasks(processId: string): Promise<ExitTask[]> {
    const id = extractId(processId);
    const res = await request(`/api/exit_tasks?process=${id}`);
    if (!res.ok) throw new Error('Impossible de charger les tâches de sortie.');
    return norm<ExitTask>(await res.json());
}

export async function startExitTask(taskId: string): Promise<void> {
    const res = await request('/api/exit_tasks/starts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exitTaskId: extractId(taskId) }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
}

export async function completeExitTask(taskId: string): Promise<void> {
    const res = await request('/api/exit_tasks/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exitTaskId: extractId(taskId) }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
}

export async function cancelExitTask(taskId: string): Promise<void> {
    const res = await request('/api/exit_tasks/cancellations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exitTaskId: extractId(taskId) }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
}
