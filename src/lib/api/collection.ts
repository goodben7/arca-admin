import { request } from './client';
import { normalizeCollection, type NormalizedCollection } from '@/lib/modules/dashboard/normalize';

const COLLECTION_ACCEPT = 'application/ld+json';

async function requestCollection<T>(pathWithQuery: string): Promise<NormalizedCollection<T>> {
    const res = await request(pathWithQuery, {
        headers: { Accept: COLLECTION_ACCEPT },
    });
    if (!res.ok) {
        throw new Error(`Impossible de charger ${pathWithQuery}`);
    }
    return normalizeCollection<T>(await res.json());
}

function withQuery(path: string, params: Record<string, string | number | boolean>) {
    const url = new URL(path, 'https://placeholder.local');
    const search = new URLSearchParams(url.search);
    Object.entries(params).forEach(([key, value]) => {
        search.set(key, String(value));
    });
    const qs = search.toString();
    return `${url.pathname}${qs ? `?${qs}` : ''}`;
}

/** Charge une collection API Platform au-delà de la page par défaut (max 30). */
export async function fetchAllCollection<T = any>(path: string): Promise<NormalizedCollection<T>> {
    const first = await requestCollection<T>(withQuery(path, { pagination: false }));
    if (first.total <= first.items.length) {
        return first;
    }

    const pageSize = Math.max(first.items.length, 30);
    const pages = Math.ceil(first.total / pageSize);
    const items = [...first.items];

    for (let page = 2; page <= pages; page += 1) {
        const next = await requestCollection<T>(withQuery(path, { page, itemsPerPage: pageSize }));
        items.push(...next.items);
    }

    return { items, total: Math.max(first.total, items.length) };
}
