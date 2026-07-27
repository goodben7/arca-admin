/**
 * Convertit un identifiant brut ou une IRI partielle en IRI API Platform valide.
 * Ex: "JFAZXU0629170831" → "/api/job_families/JFAZXU0629170831"
 */
export function toIri(resource: string, value?: string | null): string | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith('/api/')) return trimmed;
    if (trimmed.startsWith('/')) return `/api${trimmed}`;
    return `/api/${resource}/${trimmed}`;
}

/**
 * Extrait l'identifiant brut d'une relation (objet imbriqué, IRI ou id).
 */
export function extractId(value?: string | { id?: string; '@id'?: string } | null): string | undefined {
    if (value == null || value === '') return undefined;
    if (typeof value === 'object') {
        const raw = value.id ?? (value as { uuid?: string }).uuid;
        if (typeof raw === 'string' && raw.trim()) return raw.trim();
        if (typeof raw === 'number') return String(raw);
        const atId = value['@id'];
        if (typeof atId === 'string' && atId) {
            return atId.split('/').filter(Boolean).pop();
        }
        return undefined;
    }
    const str = String(value).trim();
    if (!str || str === '[object Object]') return undefined;
    if (str.startsWith('/') || str.includes('/api/')) {
        return str.split('/').filter(Boolean).pop();
    }
    return str;
}

/** Référence cycle d'un objectif / évaluation (lecture API). */
export function cycleRefOf(item: {
    cycle?: unknown;
    evaluationCycleId?: unknown;
    evaluationCycle?: unknown;
}): unknown {
    return item.cycle ?? item.evaluationCycleId ?? item.evaluationCycle;
}

/** Compare une référence cycle (objet, IRI ou id) à un id de cycle. */
export function matchesCycleId(ref: unknown, cycleId?: string | null): boolean {
    if (!ref || !cycleId) return false;
    const target = String(cycleId).trim();
    if (typeof ref === 'object' && ref !== null) {
        return matchesCycleId(extractId(ref as { id?: string; '@id'?: string }), target);
    }
    const str = String(ref).trim();
    const extracted = extractId(str);
    return (
        extracted === target ||
        str === target ||
        str === `/api/evaluation_cycles/${target}` ||
        str.endsWith(`/${target}`)
    );
}

type LookupItem = { id: string; '@id'?: string; name?: string; title?: string; code?: string };

/**
 * Résout le libellé d'une relation API (objet imbriqué ou IRI) via un référentiel local.
 */
export function resolveRelationLabel(
    value: unknown,
    lookup: LookupItem[] = [],
): string {
    if (!value) return '—';
    if (typeof value === 'object' && value !== null) {
        const obj = value as LookupItem;
        return obj.title || obj.name || '—';
    }
    const str = value as string;
    const id = extractId(str);
    const item = lookup.find(i =>
        i.id === id ||
        i.id === str ||
        i['@id'] === str ||
        i['@id'] === `/api/job_roles/${id}`
    );
    return item?.title || item?.name || id || str;
}

/**
 * Extrait le nom d'une relation API Platform (objet imbriqué ou IRI).
 */
export function relationName(
    value?: string | { name?: string; title?: string; id?: string; '@id'?: string } | null
): string {
    if (!value) return '—';
    if (typeof value === 'object') return value.name || value.title || '—';
    if (value.startsWith('/api/')) return value.split('/').pop() || value;
    return value;
}

/**
 * Résout un libellé via une map id/IRI → label (départements, postes, etc.).
 */
export function resolveFromMap(
    value: unknown,
    map: Record<string, string>,
    fallback = '—',
): string {
    if (!value) return fallback;
    if (typeof value === 'object' && value !== null) {
        return relationName(value as { name?: string; title?: string });
    }
    const str = value as string;
    const id = extractId(str);
    const resolved = map[str] || (id ? map[id] : undefined);
    if (resolved) return resolved;
    if (str.startsWith('/api/')) return fallback;
    return str || fallback;
}
