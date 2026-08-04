'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { LayoutGrid, X } from 'lucide-react';
import { APP_MODULES, getModule, type AppModule } from '@/lib/modules/registry';
import { AppTile } from './AppTile';

export const APP_CATEGORIES: { id: string; label: string; hint: string; slugs: string[] }[] = [
    {
        id: 'ops',
        label: 'Opérations RH',
        hint: 'Personnel, absences et recrutement',
        slugs: ['personnel', 'temps', 'recrutement'],
    },
    {
        id: 'talent',
        label: 'Développement des talents',
        hint: 'Formation et carrière',
        slugs: ['formation', 'performance'],
    },
    {
        id: 'finance',
        label: 'Paie & rémunération',
        hint: 'Bulletins et avantages sociaux',
        slugs: ['paie'],
    },
    {
        id: 'gov',
        label: 'Gouvernance & conformité',
        hint: 'Pilotage, sécurité, sanctions',
        slugs: ['pilotage', 'securite', 'sanctions'],
    },
];

interface AppsLauncherModalProps {
    open: boolean;
    onClose: () => void;
    favorites: string[];
    onToggleFavorite: (slug: string) => void;
    query?: string;
}

export function AppsLauncherModal({
    open,
    onClose,
    favorites,
    onToggleFavorite,
    query = '',
}: AppsLauncherModalProps) {
    const q = query.trim().toLowerCase();

    const filtered = q
        ? APP_MODULES.filter(m =>
            m.name.toLowerCase().includes(q) ||
            m.shortName.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q) ||
            m.menu.some(i => i.title.toLowerCase().includes(q)),
        )
        : null;

    const favoriteModules = favorites
        .map(s => getModule(s))
        .filter((m): m is AppModule => !!m);

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-[80]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-secondary-950/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto p-4 md:p-8">
                    <div className="flex min-h-full items-start justify-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95 translate-y-2"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-5xl rounded-3xl border border-border-subtle bg-[#eef5f9] shadow-2xl overflow-hidden">
                                <div className="flex items-center justify-between gap-3 border-b border-border-subtle bg-surface px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                                            <LayoutGrid className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <Dialog.Title className="text-base font-semibold text-secondary-900">
                                                Applications
                                            </Dialog.Title>
                                            <p className="text-xs text-secondary-500">
                                                Choisissez un module pour y accéder
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex h-9 w-9 items-center justify-center rounded-xl text-secondary-500 hover:bg-muted"
                                        aria-label="Fermer"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="max-h-[min(78vh,720px)] overflow-y-auto px-5 py-6 md:px-7">
                                    {filtered ? (
                                        <section>
                                            <SectionHead title={`Résultats (${filtered.length})`} />
                                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                {filtered.map(m => (
                                                    <AppTile
                                                        key={m.slug}
                                                        module={m}
                                                        favorite={favorites.includes(m.slug)}
                                                        onToggleFavorite={onToggleFavorite}
                                                    />
                                                ))}
                                            </div>
                                            {filtered.length === 0 && (
                                                <p className="py-12 text-center text-sm text-secondary-500">
                                                    Aucun module ne correspond.
                                                </p>
                                            )}
                                        </section>
                                    ) : (
                                        <>
                                            {favoriteModules.length > 0 && (
                                                <section className="mb-8">
                                                    <SectionHead title="Favoris" subtitle="Vos modules épinglés" />
                                                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                        {favoriteModules.map(m => (
                                                            <AppTile
                                                                key={m.slug}
                                                                module={m}
                                                                favorite
                                                                onToggleFavorite={onToggleFavorite}
                                                            />
                                                        ))}
                                                    </div>
                                                </section>
                                            )}

                                            {APP_CATEGORIES.map(cat => {
                                                const mods = cat.slugs
                                                    .map(s => getModule(s))
                                                    .filter((m): m is AppModule => !!m);
                                                if (!mods.length) return null;
                                                return (
                                                    <section key={cat.id} className="mb-8 last:mb-0">
                                                        <SectionHead title={cat.label} subtitle={cat.hint} />
                                                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                            {mods.map(m => (
                                                                <AppTile
                                                                    key={m.slug}
                                                                    module={m}
                                                                    favorite={favorites.includes(m.slug)}
                                                                    onToggleFavorite={onToggleFavorite}
                                                                />
                                                            ))}
                                                        </div>
                                                    </section>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

function SectionHead({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="flex items-end justify-between gap-3 border-b border-border-subtle/80 pb-2.5">
            <div className="flex items-start gap-2.5">
                <span
                    className="mt-1 h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-primary-500 via-accent-red-500 to-accent-yellow-500"
                    aria-hidden
                />
                <div>
                    <h2 className="text-[13px] font-semibold text-secondary-900">{title}</h2>
                    {subtitle && <p className="text-[11px] text-secondary-400 mt-0.5">{subtitle}</p>}
                </div>
            </div>
        </div>
    );
}
