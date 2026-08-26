'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Users, UserPlus, GraduationCap, Calculator,
    CalendarDays, Target, FileBarChart, Settings, LogOut, Menu,
    LayoutGrid, Scale, type LucideIcon,
} from 'lucide-react';
import { getAbout } from '@/lib/api/auth';
import { clearToken } from '@/lib/auth-token';
import type { AuthUser } from '@/types/auth';
import { PERSON_TYPE_LABELS } from '@/types/profile';
import { AnchoredDropdown } from '@/components/ui/AnchoredDropdown';
import { cn } from '@/lib/utils';

function getRoleLabel(user: AuthUser | null): string {
    if (user?.profile?.label) return user.profile.label;
    if (user?.personType && PERSON_TYPE_LABELS[user.personType]) return PERSON_TYPE_LABELS[user.personType];
    if (user?.roles?.includes('ROLE_SUPER_ADMIN')) return 'Super Administrateur';
    if (user?.roles?.includes('ROLE_ADMIN')) return 'Administrateur RH';
    return 'Utilisateur';
}

type NavEntry = {
    label: string;
    href: string;
    icon: LucideIcon;
    match?: 'exact' | 'prefix';
};

const PRINCIPAL: NavEntry[] = [
    { label: 'Tableau de bord', href: '/apps', icon: LayoutDashboard, match: 'exact' },
    { label: 'Gestion des Employés', href: '/m/personnel/employees', icon: Users, match: 'prefix' },
    { label: 'Recrutement', href: '/m/recrutement', icon: UserPlus, match: 'prefix' },
    { label: 'Formation', href: '/m/formation', icon: GraduationCap, match: 'prefix' },
    { label: 'Paie & Rémunération', href: '/m/paie', icon: Calculator, match: 'prefix' },
    { label: 'Congés & Absences', href: '/m/temps', icon: CalendarDays, match: 'prefix' },
];

const PILOTAGE: NavEntry[] = [
    { label: 'Évaluation & Performance', href: '/m/performance', icon: Target, match: 'prefix' },
    { label: 'Rapports & BI', href: '/m/pilotage/reports', icon: FileBarChart, match: 'prefix' },
    { label: 'Sanctions et discipline', href: '/m/sanctions', icon: Scale, match: 'prefix' },
    { label: 'Administration', href: '/m/securite', icon: Settings, match: 'prefix' },
];

function isActive(pathname: string, item: NavEntry) {
    if (item.match === 'exact') return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + '/');
}

interface AppsSidebarProps {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
    onBrowseApps?: () => void;
    className?: string;
}

function AppsSidebarPanel({
    onNavigate,
    onBrowseApps,
    className,
}: {
    onNavigate?: () => void;
    onBrowseApps?: () => void;
    className?: string;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        getAbout().then(setUser).catch(() => setUser(null));
    }, []);

    const userLabel = user?.displayName || user?.email || '…';
    const initials = userLabel !== '…' ? userLabel.substring(0, 2).toUpperCase() : '..';
    const roleLabel = user ? getRoleLabel(user) : '';

    function handleLogout() {
        clearToken();
        router.push('/login');
    }

    return (
        <div className={cn('relative z-[1] flex h-full min-h-0 flex-col', className)}>
            {/* En-tête — même langage que ModuleSidebar */}
            <div className="shrink-0 border-b border-border-subtle/80 bg-surface/90 px-4 py-4">
                <Link href="/apps" onClick={onNavigate} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white shadow-sm ring-2 ring-white/50">
                        <LayoutDashboard className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-secondary-900">Tableau de bord</p>
                        <p className="truncate text-[11px] text-secondary-500">ARCA SIRH · Hub RH</p>
                    </div>
                </Link>
            </div>

            {/* Navigation + ambiance */}
            <div className="relative min-h-0 flex-1 overflow-hidden">
                <div className="module-sidebar-ambient" aria-hidden>
                    <div
                        className="absolute -left-8 top-8 h-32 w-32 rounded-full opacity-60"
                        style={{ background: 'radial-gradient(circle, rgba(0,115,152,0.18) 0%, transparent 70%)' }}
                    />
                    <div
                        className="absolute -right-6 bottom-16 h-24 w-24 rounded-full opacity-50"
                        style={{ background: 'radial-gradient(circle, rgba(253,185,19,0.2) 0%, transparent 70%)' }}
                    />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/logo_arca_nouveau-2.png"
                    alt=""
                    className="module-sidebar-watermark pointer-events-none"
                    aria-hidden
                />

                <nav className="relative z-[1] h-full overflow-y-auto px-3 py-3">
                    <NavSection title="Principal" items={PRINCIPAL} pathname={pathname} onNavigate={onNavigate} />
                    <NavSection title="Pilotage" items={PILOTAGE} pathname={pathname} onNavigate={onNavigate} className="mt-3" />
                </nav>
            </div>

            {/* Footer — profil + accès apps */}
            <div className="relative z-[2] shrink-0 space-y-1 border-t border-border-subtle bg-surface px-3 py-3">
                {onBrowseApps && (
                    <button
                        type="button"
                        onClick={() => { onNavigate?.(); onBrowseApps(); }}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[12px] font-medium text-secondary-500 transition-colors hover:bg-primary-50 hover:text-primary-700"
                    >
                        <LayoutGrid className="h-4 w-4 shrink-0" />
                        <span>Tous les modules</span>
                    </button>
                )}

                <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setMenuOpen(v => !v)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/70"
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[10px] font-semibold text-white">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-secondary-900">{userLabel}</p>
                        <p className="truncate text-[10px] text-secondary-500">{roleLabel}</p>
                    </div>
                </button>

                <AnchoredDropdown
                    open={menuOpen}
                    onClose={() => setMenuOpen(false)}
                    triggerRef={triggerRef}
                    width={220}
                    className="overflow-hidden"
                >
                    <div className="p-1.5">
                        <button
                            type="button"
                            onClick={() => { setMenuOpen(false); onNavigate?.(); router.push('/m/securite/settings'); }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] hover:bg-muted"
                        >
                            <Settings className="h-3.5 w-3.5 text-muted-foreground" /> Paramètres
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-accent-red-600 hover:bg-accent-red-50"
                        >
                            <LogOut className="h-3.5 w-3.5" /> Déconnexion
                        </button>
                    </div>
                </AnchoredDropdown>
            </div>
        </div>
    );
}

export function AppsSidebar({ mobileOpen, onMobileClose, onBrowseApps, className }: AppsSidebarProps) {
    const pathname = usePathname();

    useEffect(() => {
        onMobileClose?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    return (
        <>
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
                    onClick={onMobileClose}
                    aria-hidden
                />
            )}

            <aside
                className={cn(
                    'module-sidebar-shell relative hidden h-full w-56 shrink-0 flex-col overflow-hidden border-r border-border-subtle lg:flex',
                    className,
                )}
            >
                <AppsSidebarPanel onBrowseApps={onBrowseApps} />
            </aside>

            <aside
                className={cn(
                    'module-sidebar-shell fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-hidden border-r border-border-subtle shadow-float transition-transform duration-300 lg:hidden',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                <AppsSidebarPanel onNavigate={onMobileClose} onBrowseApps={onBrowseApps} />
            </aside>
        </>
    );
}

function NavSection({
    title,
    items,
    pathname,
    onNavigate,
    className,
}: {
    title: string;
    items: NavEntry[];
    pathname: string;
    onNavigate?: () => void;
    className?: string;
}) {
    return (
        <div className={cn('mb-2', className)}>
            <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-secondary-400">
                {title}
            </p>
            <ul className="space-y-0.5">
                {items.map(item => {
                    const active = isActive(pathname, item);
                    const Icon = item.icon;
                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                onClick={onNavigate}
                                className={cn(
                                    'relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition-colors',
                                    active
                                        ? 'bg-primary-50 font-semibold text-primary-700'
                                        : 'font-medium text-secondary-600 hover:bg-white/40 hover:text-secondary-900',
                                )}
                            >
                                {active && (
                                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary-500" />
                                )}
                                <Icon
                                    className={cn(
                                        'h-4 w-4 shrink-0',
                                        active ? 'text-primary-600' : 'text-secondary-400',
                                    )}
                                />
                                <span className="truncate">{item.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export function AppsSidebarToggle({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-secondary-600 hover:bg-muted lg:hidden"
            aria-label="Ouvrir le menu"
        >
            <Menu className="h-5 w-5" />
        </button>
    );
}
