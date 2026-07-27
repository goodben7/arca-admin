const FAVORITES_KEY = 'arca.apps.favorites';
const RECENTS_KEY = 'arca.apps.recents';
const MAX_RECENTS = 8;

function readJson<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function writeJson(key: string, value: unknown) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
}

export function getFavoriteSlugs(): string[] {
    return readJson<string[]>(FAVORITES_KEY, []);
}

export function toggleFavorite(slug: string): string[] {
    const current = getFavoriteSlugs();
    const next = current.includes(slug)
        ? current.filter(s => s !== slug)
        : [...current, slug];
    writeJson(FAVORITES_KEY, next);
    return next;
}

export function getRecentSlugs(): string[] {
    return readJson<string[]>(RECENTS_KEY, []);
}

export function pushRecent(slug: string): string[] {
    const current = getRecentSlugs().filter(s => s !== slug);
    const next = [slug, ...current].slice(0, MAX_RECENTS);
    writeJson(RECENTS_KEY, next);
    return next;
}

const SIDEBAR_SECTIONS_KEY = 'arca.sidebar.sections';

export function getExpandedSidebarSections(moduleSlug: string): string[] | null {
    const all = readJson<Record<string, string[]>>(SIDEBAR_SECTIONS_KEY, {});
    return all[moduleSlug] ?? null;
}

export function saveExpandedSidebarSections(moduleSlug: string, sections: string[]) {
    const all = readJson<Record<string, string[]>>(SIDEBAR_SECTIONS_KEY, {});
    all[moduleSlug] = sections;
    writeJson(SIDEBAR_SECTIONS_KEY, all);
}
