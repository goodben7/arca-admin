'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { LayoutGrid, Search, X } from 'lucide-react';
import { APP_MODULES, type AppModule } from '@/lib/modules/registry';
import { cn } from '@/lib/utils';

interface SearchHit {
    type: 'app' | 'menu' | 'action';
    label: string;
    href?: string;
    module?: AppModule;
    section?: string;
    action?: 'browse-apps';
}

interface AppsCommandPaletteProps {
    open: boolean;
    onClose: () => void;
    onBrowseApps: () => void;
}

export function AppsCommandPalette({ open, onClose, onBrowseApps }: AppsCommandPaletteProps) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setQuery('');
            setTimeout(() => inputRef.current?.focus(), 40);
        }
    }, [open]);

    const hits = useMemo(() => {
        const q = query.trim().toLowerCase();
        const results: SearchHit[] = [];

        if (!q || 'applications'.includes(q) || 'modules'.includes(q) || 'apps'.includes(q) || 'parcourir'.includes(q)) {
            results.push({
                type: 'action',
                label: 'Parcourir les applications',
                action: 'browse-apps',
            });
        }

        for (const mod of APP_MODULES) {
            if (mod.status === 'soon' && !q) continue;
            if (!q || mod.name.toLowerCase().includes(q) || mod.shortName.toLowerCase().includes(q) || mod.description.toLowerCase().includes(q)) {
                results.push({ type: 'app', label: mod.name, href: mod.href, module: mod });
            }
            if (q) {
                for (const item of mod.menu) {
                    if (item.href === mod.href) continue;
                    if (
                        item.title.toLowerCase().includes(q) ||
                        (item.section || '').toLowerCase().includes(q)
                    ) {
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

        return results.slice(0, 14);
    }, [query]);

    function selectHit(hit: SearchHit) {
        if (hit.action === 'browse-apps') {
            onClose();
            onBrowseApps();
            return;
        }
        if (hit.href) {
            onClose();
            router.push(hit.href);
        }
    }

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-[90]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-150"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-secondary-950/45 backdrop-blur-[2px]" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto p-4 pt-[12vh]">
                    <div className="mx-auto flex max-w-xl justify-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-150"
                            enterFrom="opacity-0 scale-95 -translate-y-1"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-100"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-2xl">
                                <div className="flex items-center gap-2 border-b border-border-subtle px-3 h-12">
                                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <input
                                        ref={inputRef}
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && hits[0]) {
                                                e.preventDefault();
                                                selectHit(hits[0]);
                                            }
                                        }}
                                        placeholder="Rechercher un module ou une fonction…"
                                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-secondary-400"
                                    />
                                    <kbd className="hidden sm:inline rounded border border-border-subtle bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-secondary-400">
                                        esc
                                    </kbd>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <ul className="max-h-80 overflow-y-auto py-1">
                                    {hits.length === 0 ? (
                                        <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                                            Aucun résultat
                                        </li>
                                    ) : (
                                        hits.map((hit, i) => {
                                            if (hit.type === 'action') {
                                                return (
                                                    <li key={`action-${i}`}>
                                                        <button
                                                            type="button"
                                                            onClick={() => selectHit(hit)}
                                                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
                                                        >
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                                                                <LayoutGrid className="h-4 w-4" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium text-foreground truncate">
                                                                    {hit.label}
                                                                </p>
                                                                <p className="text-[11px] text-muted-foreground">
                                                                    Ouvrir la grille des modules
                                                                </p>
                                                            </div>
                                                        </button>
                                                    </li>
                                                );
                                            }

                                            const Icon = hit.module!.icon;
                                            return (
                                                <li key={`${hit.href}-${i}`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectHit(hit)}
                                                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
                                                    >
                                                        <div className={cn(
                                                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white',
                                                            hit.module!.accent.bg,
                                                        )}>
                                                            <Icon className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-foreground truncate">
                                                                {hit.label}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground truncate">
                                                                {hit.type === 'app'
                                                                    ? 'Application'
                                                                    : `${hit.module!.shortName}${hit.section ? ` · ${hit.section}` : ''}`}
                                                            </p>
                                                        </div>
                                                    </button>
                                                </li>
                                            );
                                        })
                                    )}
                                </ul>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
