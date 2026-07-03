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
    if (!value) return undefined;
    if (typeof value === 'object') {
        if (value.id) return value.id;
        if (value['@id']) return value['@id'].split('/').pop();
        return undefined;
    }
    if (value.startsWith('/')) return value.split('/').pop();
    return value;
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
