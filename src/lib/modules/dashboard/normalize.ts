export function normalizeList(data: unknown): any[] {
    if (Array.isArray(data)) return data;
    const d = data as Record<string, unknown>;
    if (Array.isArray(d?.['hydra:member'])) return d['hydra:member'] as any[];
    if (Array.isArray(d?.member)) return d.member as any[];
    return [];
}
