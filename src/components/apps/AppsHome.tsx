'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Search, LogOut, Settings, Bell, Rocket, ArrowRight,
} from 'lucide-react';
import { APP_MODULES, getModule, type AppModule } from '@/lib/modules/registry';
import { getFavoriteSlugs, toggleFavorite } from '@/lib/modules/prefs';
import { AppTile } from './AppTile';
import { getAbout } from '@/lib/api/auth';
import { getHrDashboard } from '@/lib/api/hrDashboard';
import type { HrDashboard } from '@/types/succession';
import { clearToken } from '@/lib/auth-token';
import { PERSON_TYPE_LABELS } from '@/types/profile';
import { AnchoredDropdown } from '@/components/ui/AnchoredDropdown';
import { ShellAmbient } from '@/components/layout/ShellAmbient';
import { cn } from '@/lib/utils';
import { useSetupProgress } from '@/hooks/useSetupProgress';

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
}

function getRoleLabel(user: any): string {
    if (user?.profile?.label) return user.profile.label;
    if (user?.personType && PERSON_TYPE_LABELS[user.personType]) return PERSON_TYPE_LABELS[user.personType];
    if (user?.roles?.includes('ROLE_SUPER_ADMIN')) return 'Super Administrateur';
    if (user?.roles?.includes('ROLE_ADMIN')) return 'Administrateur RH';
    return 'Utilisateur';
}

const CATEGORIES: { id: string; label: string; hint: string; slugs: string[] }[] = [
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

/**
 * Portail modules ARCA — cartes apps classiques + charte bleu / rouge / jaune.
 */
export function AppsHome() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [favorites, setFavorites] = useState<string[]>([]);
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<HrDashboard | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const { allDone, progressPercent, loading: setupLoading } = useSetupProgress();

    useEffect(() => {
        setFavorites(getFavoriteSlugs());
        getAbout().then(setUser).catch(() => setUser(null));
        getHrDashboard().then(setStats).catch(() => setStats(null));
    }, []);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return APP_MODULES;
        return APP_MODULES.filter(m =>
            m.name.toLowerCase().includes(q) ||
            m.shortName.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q) ||
            m.menu.some(i => i.title.toLowerCase().includes(q))
        );
    }, [query]);

    const favoriteModules = favorites
        .map(s => getModule(s))
        .filter((m): m is AppModule => !!m);

    const handleToggleFavorite = (slug: string) => {
        setFavorites(toggleFavorite(slug));
    };

    const userLabel = user?.displayName || user?.email || '…';
    const firstName =
        user?.displayName?.split(/\s+/)[0] ||
        user?.email?.split('@')[0] ||
        'collègue';
    const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    const initials = userLabel !== '…' ? userLabel.substring(0, 2).toUpperCase() : '..';
    const roleLabel = user ? getRoleLabel(user) : '';

    function handleLogout() {
        clearToken();
        router.push('/login');
    }

    return (
        <div className="h-full">
            <div className="flex h-full flex-col overflow-hidden bg-surface">
                {/* Topbar claire + bandeau charte */}
                <header className="shrink-0 border-b border-border-subtle">
                    <div className="flex h-14 items-center gap-3 px-4 md:px-5">
                        <Link href="/apps" className="flex items-center gap-2.5 shrink-0">
                            <div className="h-8 w-8 overflow-hidden rounded-lg border border-border-subtle bg-white p-1 shadow-sm">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/logo_arca_nouveau-2.png" alt="ARCA" className="h-full w-full object-contain" />
                            </div>
                            <div className="hidden leading-tight sm:block">
                                <p className="text-[13px] font-semibold tracking-tight">
                                    <span className="text-primary-600">AR</span>
                                    <span className="text-accent-red-500">CA</span>
                                    <span className="mx-1.5 text-secondary-300">·</span>
                                    <span className="font-medium text-secondary-600">SIRH</span>
                                </p>
                            </div>
                        </Link>

                        <div className="mx-auto hidden w-full max-w-sm sm:block">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-secondary-400" />
                                <input
                                    ref={searchRef}
                                    type="search"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Rechercher un module ou une fonction…"
                                    className="h-9 w-full rounded-xl border border-transparent bg-muted/80 pl-9 pr-12 text-[13px] outline-none transition-all placeholder:text-secondary-400 focus:border-primary-200 focus:bg-surface focus:ring-2 focus:ring-primary-500/10"
                                />
                                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border-subtle bg-surface px-1.5 py-px text-[9px] font-medium text-secondary-400">
                                    ⌘K
                                </kbd>
                            </div>
                        </div>

                        <div className="ml-auto flex items-center gap-1">
                            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-xl text-secondary-500 hover:bg-muted" aria-label="Notifications">
                                <Bell className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push('/m/securite/settings')}
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-secondary-500 hover:bg-muted"
                                aria-label="Paramètres"
                            >
                                <Settings className="h-4 w-4" />
                            </button>
                            <div className="mx-1 hidden h-6 w-px bg-border-subtle sm:block" />
                            <div className="relative">
                                <button
                                    ref={triggerRef}
                                    type="button"
                                    onClick={() => setMenuOpen(v => !v)}
                                    className="flex h-9 items-center gap-2 rounded-xl pl-1 pr-2 hover:bg-muted"
                                >
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-[10px] font-semibold text-white">
                                        {initials}
                                    </div>
                                    <span className="hidden text-[13px] font-medium text-secondary-800 md:inline">{displayName}</span>
                                </button>
                                <AnchoredDropdown open={menuOpen} onClose={() => setMenuOpen(false)} triggerRef={triggerRef} width={240} className="overflow-hidden">
                                    <div className="border-b border-border-subtle bg-muted/40 px-3 py-2.5">
                                        <p className="truncate text-sm font-semibold">{userLabel}</p>
                                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{roleLabel}</p>
                                    </div>
                                    <div className="p-1.5">
                                        <button type="button" onClick={() => { setMenuOpen(false); router.push('/m/securite/settings'); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] hover:bg-muted">
                                            <Settings className="h-3.5 w-3.5 text-muted-foreground" /> Paramètres
                                        </button>
                                        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-accent-red-600 hover:bg-accent-red-50">
                                            <LogOut className="h-3.5 w-3.5" /> Déconnexion
                                        </button>
                                    </div>
                                </AnchoredDropdown>
                            </div>
                        </div>
                    </div>
                    {/* Bandeau charte ARCA */}
                    <div className="flex h-1">
                        <div className="flex-[3] bg-primary-500" />
                        <div className="flex-1 bg-accent-red-500" />
                        <div className="flex-1 bg-accent-yellow-500" />
                    </div>
                    <div className="border-b border-border-subtle px-4 py-2 sm:hidden">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-secondary-400" />
                            <input
                                type="search"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Rechercher…"
                                className="h-9 w-full rounded-xl bg-muted/80 pl-9 pr-3 text-[13px] outline-none"
                            />
                        </div>
                    </div>
                </header>

                <div className="relative min-h-0 flex-1 overflow-hidden bg-[#eef5f9]">
                    <ShellAmbient />

                    <div className="relative z-[1] h-full overflow-y-auto">
                        <div className="mx-auto max-w-6xl px-4 py-7 md:px-8 md:py-9 page-enter-stack">
                            {/* Intro */}
                            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h1 className="text-2xl font-semibold tracking-tight text-secondary-900 md:text-[1.65rem]">
                                        {greeting()}, {displayName}
                                    </h1>
                                    <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-secondary-500">
                                        Choisissez un module pour accéder à ses fonctions.
                                    </p>
                                </div>
                                <div className="flex gap-2 shrink-0 kpi-enter-stack">
                                    <MetaPill
                                        tone="blue"
                                        label="Effectif"
                                        value={stats ? stats.headcount : '—'}
                                    />
                                    <MetaPill
                                        tone="red"
                                        label="Rotation"
                                        value={stats ? `${Math.round(stats.turnoverRatePercent)}%` : '—'}
                                    />
                                    <MetaPill
                                        tone="yellow"
                                        label="Formations"
                                        value={stats ? stats.trainingsInProgress : '—'}
                                    />
                                </div>
                            </div>

                            {!setupLoading && !allDone && (
                                <Link
                                    href="/m/pilotage/configuration"
                                    className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 to-white hover:border-primary-300 transition-colors group"
                                >
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                                            <Rocket className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-secondary-900">Configuration initiale en cours</p>
                                            <p className="text-sm text-secondary-500 mt-0.5">
                                                Paramétrez les référentiels, les accès et vos premiers dossiers collaborateurs.
                                            </p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="w-24 h-1.5 rounded-full bg-primary-100 overflow-hidden">
                                                    <div className="h-full bg-primary-500" style={{ width: `${progressPercent}%` }} />
                                                </div>
                                                <span className="text-xs font-bold text-primary-700">{progressPercent}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 shrink-0 group-hover:gap-2 transition-all">
                                        Continuer <ArrowRight className="w-4 h-4" />
                                    </span>
                                </Link>
                            )}

                            {query.trim() ? (
                                <section>
                                    <SectionHead title={`Résultats (${filtered.length})`} />
                                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 apps-tile-grid">
                                        {filtered.map(m => (
                                            <AppTile key={m.slug} module={m} favorite={favorites.includes(m.slug)} onToggleFavorite={handleToggleFavorite} />
                                        ))}
                                    </div>
                                    {filtered.length === 0 && (
                                        <p className="py-16 text-center text-sm text-secondary-500">Aucun module ne correspond.</p>
                                    )}
                                </section>
                            ) : (
                                <>
                                    {favoriteModules.length > 0 && (
                                        <section className="mb-9">
                                            <SectionHead title="Favoris" subtitle="Vos modules épinglés" />
                                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 apps-tile-grid">
                                                {favoriteModules.map(m => (
                                                    <AppTile key={m.slug} module={m} favorite onToggleFavorite={handleToggleFavorite} />
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {CATEGORIES.map(cat => {
                                        const mods = cat.slugs.map(s => getModule(s)).filter((m): m is AppModule => !!m);
                                        if (!mods.length) return null;
                                        return (
                                            <section key={cat.id} className="mb-9 last:mb-2">
                                                <SectionHead title={cat.label} subtitle={cat.hint} />
                                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 apps-tile-grid">
                                                    {mods.map(m => (
                                                        <AppTile
                                                            key={m.slug}
                                                            module={m}
                                                            favorite={favorites.includes(m.slug)}
                                                            onToggleFavorite={handleToggleFavorite}
                                                        />
                                                    ))}
                                                </div>
                                            </section>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetaPill({ tone, label, value }: { tone: 'blue' | 'red' | 'yellow'; label: string; value: number | string }) {
    const styles = {
        blue: 'border-primary-100 bg-primary-50 text-primary-800',
        red: 'border-accent-red-100 bg-accent-red-50 text-accent-red-700',
        yellow: 'border-[#FDE9B0] bg-[#FFF8E7] text-[#9A7200]',
    };
    return (
        <div className={cn('rounded-xl border px-3 py-2 min-w-[72px]', styles[tone])}>
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
            <p className="text-lg font-semibold tabular-nums leading-none mt-0.5">{value}</p>
        </div>
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
