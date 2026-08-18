import { request } from './client';
import type {
    CreateDisciplinaryCasePayload,
    DisciplinaryCase,
    DisciplinarySummary,
} from '@/types/sanctions';
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
    const raw = (e['hydra:description'] as string) || (e.detail as string) || (e.message as string) || 'Une erreur est survenue.';
    const lower = raw.toLowerCase();
    if (lower.includes('disciplinary case can only be created for an active, on-leave or probation employee')) {
        return 'Une affaire disciplinaire ne peut être créée que pour un employé actif, en congé ou en période d’essai.';
    }
    if (lower.includes('active case')) {
        return 'Une affaire disciplinaire active existe déjà pour cet employé.';
    }
    return raw;
}

async function postAction(path: string, body: Record<string, unknown> | FormData): Promise<DisciplinaryCase | void> {
    const isForm = body instanceof FormData;
    const res = await request(path, {
        method: 'POST',
        headers: isForm ? undefined : { 'Content-Type': 'application/json' },
        body: isForm ? body : JSON.stringify(body),
    });
    if (!res.ok) {
        const e = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(apiErr(e));
    }
    const text = await res.text();
    if (!text) return;
    try {
        return JSON.parse(text) as DisciplinaryCase;
    } catch {
        return;
    }
}

export async function getDisciplinaryCases(filters: Record<string, string> = {}): Promise<DisciplinaryCase[]> {
    const params = new URLSearchParams(filters);
    const res = await request(`/api/disciplinary_cases${params.toString() ? `?${params}` : ''}`);
    if (!res.ok) throw new Error('Impossible de charger les affaires disciplinaires.');
    return norm<DisciplinaryCase>(await res.json());
}

export async function getDisciplinaryCaseById(id: string): Promise<DisciplinaryCase> {
    const path = id.startsWith('/') ? id : `/api/disciplinary_cases/${extractId(id)}`;
    const res = await request(path);
    if (!res.ok) throw new Error('Affaire disciplinaire introuvable.');
    return res.json();
}

export async function createDisciplinaryCase(data: CreateDisciplinaryCasePayload): Promise<DisciplinaryCase> {
    const res = await request('/api/disciplinary_cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            employee: extractId(data.employee),
            sanctionScale: extractId(data.sanctionScale),
            facts: data.facts,
            occurredAt: data.occurredAt,
            reason: data.reason || null,
        }),
    });
    if (!res.ok) {
        const e = await res.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(apiErr(e));
    }
    return res.json();
}

export async function openDisciplinaryCase(disciplinaryCaseId: string): Promise<DisciplinaryCase | void> {
    return postAction('/api/disciplinary_cases/openings', {
        disciplinaryCaseId: extractId(disciplinaryCaseId),
    });
}

export async function scheduleHearing(
    disciplinaryCaseId: string,
    hearingAt: string,
): Promise<DisciplinaryCase | void> {
    return postAction('/api/disciplinary_cases/hearings', {
        disciplinaryCaseId: extractId(disciplinaryCaseId),
        hearingAt,
    });
}

export async function decideDisciplinaryCase(
    disciplinaryCaseId: string,
    reason?: string,
): Promise<DisciplinaryCase | void> {
    return postAction('/api/disciplinary_cases/decisions', {
        disciplinaryCaseId: extractId(disciplinaryCaseId),
        ...(reason ? { reason } : {}),
    });
}

export async function applyDisciplinaryCase(
    disciplinaryCaseId: string,
    file?: File | null,
): Promise<DisciplinaryCase | void> {
    const id = extractId(disciplinaryCaseId) || disciplinaryCaseId;
    if (file) {
        const form = new FormData();
        form.append('disciplinaryCaseId', id);
        form.append('file', file);
        return postAction('/api/disciplinary_cases/applications', form);
    }
    return postAction('/api/disciplinary_cases/applications', { disciplinaryCaseId: id });
}

export async function cancelDisciplinaryCase(disciplinaryCaseId: string): Promise<DisciplinaryCase | void> {
    return postAction('/api/disciplinary_cases/cancellations', {
        disciplinaryCaseId: extractId(disciplinaryCaseId),
    });
}

export async function rejectDisciplinaryCase(
    disciplinaryCaseId: string,
    reason?: string,
): Promise<DisciplinaryCase | void> {
    return postAction('/api/disciplinary_cases/rejections', {
        disciplinaryCaseId: extractId(disciplinaryCaseId),
        ...(reason ? { reason } : {}),
    });
}

export async function closeDisciplinaryCase(disciplinaryCaseId: string): Promise<DisciplinaryCase | void> {
    return postAction('/api/disciplinary_cases/closures', {
        disciplinaryCaseId: extractId(disciplinaryCaseId),
    });
}

export async function getDisciplinarySummary(employeeId: string): Promise<DisciplinarySummary> {
    const res = await request(`/api/employees/${extractId(employeeId)}/disciplinary-summary`);
    if (!res.ok) throw new Error('Impossible de charger la synthèse disciplinaire.');
    return res.json();
}
