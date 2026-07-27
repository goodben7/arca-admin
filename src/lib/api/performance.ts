import { request } from './client';
import { EvaluationCycle, PerformanceReview, Objective, PromotionEligibility, CreateObjectiveDto, CreateEvaluationCycleDto, CreatePerformanceReviewDto } from '@/types/performance';
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

// ── Evaluation Cycles ────────────────────────────────────────────────────────

export async function getEvaluationCycles(): Promise<EvaluationCycle[]> {
    const res = await request('/api/evaluation_cycles');
    if (!res.ok) throw new Error('Impossible de charger les cycles d\'évaluation.');
    return norm<EvaluationCycle>(await res.json());
}

export async function getEvaluationCycleById(id: string): Promise<EvaluationCycle> {
    const path = id.startsWith('/') ? id : `/api/evaluation_cycles/${id}`;
    const res = await request(path);
    if (!res.ok) throw new Error('Cycle d\'évaluation introuvable.');
    return res.json();
}

export async function createEvaluationCycle(data: CreateEvaluationCycleDto): Promise<EvaluationCycle> {
    const payload = {
        name: data.name,
        year: data.year,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description,
    };
    const res = await request('/api/evaluation_cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function openEvaluationCycle(cycleId: string): Promise<void> {
    const res = await request('/api/evaluation_cycles/opens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluationCycleId: extractId(cycleId) || cycleId }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
}

export async function closeEvaluationCycle(cycleId: string): Promise<void> {
    const res = await request('/api/evaluation_cycles/closures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluationCycleId: extractId(cycleId) || cycleId }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
}

// ── Performance Reviews ───────────────────────────────────────────────────────

export async function getPerformanceReviews(filters: Record<string, string> = {}): Promise<PerformanceReview[]> {
    const params = new URLSearchParams(filters);
    const res = await request(`/api/performance_reviews${params.toString() ? `?${params}` : ''}`);
    if (!res.ok) throw new Error('Impossible de charger les évaluations.');
    return norm<PerformanceReview>(await res.json());
}

export async function getPerformanceReviewById(id: string): Promise<PerformanceReview> {
    const path = id.startsWith('/') ? id : `/api/performance_reviews/${id}`;
    const res = await request(path);
    if (!res.ok) throw new Error('Évaluation introuvable.');
    return res.json();
}

export async function createPerformanceReview(data: CreatePerformanceReviewDto): Promise<PerformanceReview> {
    const payload: Record<string, unknown> = {
        employee: extractId(data.employee) || data.employee,
        evaluationCycleId: extractId(data.evaluationCycleId) || data.evaluationCycleId,
    };
    if (data.reviewer) payload.reviewer = extractId(data.reviewer) || data.reviewer;
    if (data.score != null) payload.score = data.score;
    if (data.comment) payload.comment = data.comment;

    const res = await request('/api/performance_reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function updatePerformanceReview(
    id: string,
    data: Partial<Pick<CreatePerformanceReviewDto, 'reviewer' | 'score' | 'comment'>>,
): Promise<PerformanceReview> {
    const path = id.startsWith('/') ? id : `/api/performance_reviews/${id}`;
    const payload: Record<string, unknown> = {};
    if (data.reviewer !== undefined) {
        payload.reviewer = data.reviewer ? (extractId(data.reviewer) || data.reviewer) : null;
    }
    if (data.score !== undefined) payload.score = data.score;
    if (data.comment !== undefined) payload.comment = data.comment;

    const res = await request(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/merge-patch+json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function submitPerformanceReview(performanceReviewId: string): Promise<void> {
    const res = await request('/api/performance_reviews/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performanceReviewId: extractId(performanceReviewId) || performanceReviewId }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
}

export async function validatePerformanceReview(performanceReviewId: string): Promise<void> {
    const res = await request('/api/performance_reviews/validations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performanceReviewId: extractId(performanceReviewId) || performanceReviewId }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
}

// ── Objectives ────────────────────────────────────────────────────────────────

export async function getObjectives(filters: Record<string, string> = {}): Promise<Objective[]> {
    const params = new URLSearchParams(filters);
    const res = await request(`/api/objectives${params.toString() ? `?${params}` : ''}`);
    if (!res.ok) throw new Error('Impossible de charger les objectifs.');
    return norm<Objective>(await res.json());
}

export async function getObjectiveById(id: string): Promise<Objective> {
    const path = id.startsWith('/') ? id : `/api/objectives/${id}`;
    const res = await request(path);
    if (!res.ok) throw new Error('Objectif introuvable.');
    return res.json();
}

export async function createObjective(data: CreateObjectiveDto): Promise<Objective> {
    const payload = {
        employee: extractId(data.employee) || data.employee,
        evaluationCycleId: extractId(data.evaluationCycleId) || data.evaluationCycleId,
        title: data.title,
        description: data.description || undefined,
        specific: data.specific,
        measurable: data.measurable,
        targetValue: data.targetValue || undefined,
        achievable: data.achievable || undefined,
        relevant: data.relevant || undefined,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
    };
    const res = await request('/api/objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
    return res.json();
}

export async function activateObjective(objectiveId: string): Promise<void> {
    const res = await request('/api/objectives/activations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectiveId }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
}

export async function completeObjective(objectiveId: string): Promise<void> {
    const res = await request('/api/objectives/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectiveId }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
}

export async function cancelObjective(objectiveId: string): Promise<void> {
    const res = await request('/api/objectives/cancellations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectiveId }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})) as Record<string, unknown>; throw new Error(apiErr(e)); }
}

// ── Promotion Eligibility ─────────────────────────────────────────────────────

export async function checkPromotionEligibility(employeeId: string, targetJobRole: string): Promise<PromotionEligibility> {
    const res = await request(`/api/employees/${employeeId}/promotion-eligibility?targetJobRole=${targetJobRole}`);
    if (!res.ok) throw new Error('Impossible de vérifier l\'éligibilité à la promotion.');
    return res.json();
}
