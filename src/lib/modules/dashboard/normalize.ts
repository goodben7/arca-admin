export interface NormalizedCollection<T = unknown> {
    items: T[];
    total: number;
}

export function normalizeCollection<T = unknown>(data: unknown): NormalizedCollection<T> {
    if (Array.isArray(data)) {
        return { items: data as T[], total: data.length };
    }

    if (!data || typeof data !== 'object') {
        return { items: [], total: 0 };
    }

    const d = data as Record<string, unknown>;
    const rawItems = d['hydra:member'] ?? d.member ?? d.data ?? d.items ?? d.results;
    const items = Array.isArray(rawItems) ? (rawItems as T[]) : [];
    const rawTotal = d['hydra:totalItems'] ?? d.totalItems ?? d.total ?? d.count;
    const total = typeof rawTotal === 'number' && Number.isFinite(rawTotal) ? rawTotal : items.length;

    return { items, total: Math.max(total, items.length) };
}

export function normalizeList<T = unknown>(data: unknown): T[] {
    return normalizeCollection<T>(data).items;
}
