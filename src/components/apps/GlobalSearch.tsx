'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { APP_MODULES, type AppModule } from '@/lib/modules/registry';
import { cn } from '@/lib/utils';

interface SearchHit {
    type: 'app' | 'menu';
    label: string;
    href: string;
    module: AppModule;
    section?: string;
}

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen(true);
            }
            if (e.key === 'Escape') setOpen(false);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setQuery('');
        }
    }, [open]);

    useEffect(() => {
        function onClick(e: MouseEvent) {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        }
        if (open) document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const hits = useMemo(() => {
        const q = query.trim().toLowerCase();
        const results: SearchHit[] = [];
        for (const mod of APP_MODULES) {
            if (mod.status === 'soon' && !q) continue;
            if (!q || mod.name.toLowerCase().includes(q) || mod.shortName.toLowerCase().includes(q)) {
                results.push({ type: 'app', label: mod.name, href: mod.href, module: mod });
            }
            for (const item of mod.menu) {
                if (item.href === mod.href) continue;
                if (!q || item.title.toLowerCase().includes(q) || (item.section || '').toLowerCase().includes(q)) {
                    if (q) {
                        results.push({
                            type: 'menu',
                            label: item.title,
                            href: item.href,
                            module: mod,
                            section: item.section,
                        });
                    }
                }
            }
        }
        return results.slice(0, 12);
    }, [query]);

    return (
        <div ref={rootRef} className="relative flex-1 max-w-md">
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="w-full h-10 flex items-center gap-2.5 px-4 rounded-full bg-secondary-50 border border-secondary-100 hover:border-primary-200 hover:bg-white text-sm text-muted-foreground transition-colors"
            >
                <Search className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left truncate">Rechercher un module ou une fonction…</span>
                <kbd className="hidden sm:inline text-[10px] font-semibold bg-surface border border-border-subtle px-1.5 py-0.5 rounded-md">⌘K</kbd>
            </button>

            {open && (
                <div className="absolute top-0 left-0 right-0 z-50 rounded-2xl bg-surface border border-border-subtle shadow-float overflow-hidden">
                    <div className="flex items-center gap-2 px-3 h-12 border-b border-border-subtle">
                        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Modules, menus, fonctions…"
                            className="flex-1 bg-transparent text-sm outline-none"
                        />
                        <button type="button" onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <ul className="max-h-72 overflow-y-auto py-1">
                        {hits.length === 0 ? (
                            <li className="px-4 py-6 text-sm text-muted-foreground text-center">Aucun résultat</li>
                        ) : hits.map((hit, i) => {
                            const Icon = hit.module.icon;
                            return (
                                <li key={`${hit.href}-${i}`}>
                                    <Link
                                        href={hit.href}
                                        onClick={() => setOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors"
                                    >
                                        <div className={cn('w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0', hit.module.accent.bg)}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-foreground truncate">{hit.label}</p>
                                            <p className="text-[11px] text-muted-foreground truncate">
                                                {hit.type === 'app' ? 'Application' : `${hit.module.shortName}${hit.section ? ` · ${hit.section}` : ''}`}
                                            </p>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
