'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Settings, LogOut, LayoutGrid, type LucideIcon,
} from 'lucide-react';
import { ACTIVE_MODULES, getModuleFromPath, type AppModule, type ModuleMenuItem } from '@/lib/modules/registry';
import { splitModuleMenu } from '@/lib/modules/menu';
import { getAbout } from '@/lib/api/auth';
import { clearToken } from '@/lib/auth-token';
import type { AuthUser } from '@/types/auth';
import { PERSON_TYPE_LABELS } from '@/types/profile';
import { cn } from '@/lib/utils';

function getRoleLabel(user: AuthUser | null): string {
    if (user?.profile?.label) return user.profile.label;
    if (user?.personType && PERSON_TYPE_LABELS[user.personType]) return PERSON_TYPE_LABELS[user.personType];
    if (user?.roles?.includes('ROLE_SUPER_ADMIN')) return 'Super Administrateur';
    if (user?.roles?.includes('ROLE_ADMIN')) return 'Administrateur RH';
    return 'Utilisateur';
}

function isModuleItemActive(pathname: string, module: AppModule, item: ModuleMenuItem) {
    if (item.href === module.href) return pathname === module.href || pathname === `${module.href}/`;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

interface AppDualNavProps {
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

export function AppDualNav({ mobileOpen, onMobileClose }: AppDualNavProps) {
    const pathname = usePathname();
    const router = useRouter();
    const module = getModuleFromPath(pathname);
    const isHub = pathname === '/apps' || pathname.startsWith('/apps/');
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        getAbout().then(setUser).catch(() => setUser(null));
    }, []);

    useEffect(() => {
        onMobileClose?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    const userLabel = user?.displayName || user?.email || '…';
    const initials = userLabel !== '…' ? userLabel.substring(0, 2).toUpperCase() : '..';
    const roleLabel = user ? getRoleLabel(user) : '';

    function handleLogout() {
        clearToken();
        router.push('/login');
    }

    const panel = (
        <AppNavPanel
            isHub={isHub}
            module={module}
            pathname={pathname}
            onNavigate={onMobileClose}
            onLogout={handleLogout}
        />
    );

    const rail = (
        <AppIconRail
            pathname={pathname}
            module={module}
            isHub={isHub}
            initials={initials}
            userLabel={userLabel}
            roleLabel={roleLabel}
            onLogout={handleLogout}
            onNavigate={onMobileClose}
        />
    );

    return (
        <>
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
                    onClick={onMobileClose}
                    aria-hidden
                />
            )}

            <div className="relative hidden h-full shrink-0 lg:flex">
                {rail}
                {!isHub && panel}
            </div>

            <div
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex h-full shadow-float transition-transform duration-300 lg:hidden',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                {rail}
                {!isHub && panel}
            </div>
        </>
    );
}

function AppIconRail({
    pathname,
    module,
    isHub,
    initials,
    userLabel,
    onLogout,
    onNavigate,
}: {
    pathname: string;
    module?: AppModule;
    isHub: boolean;
    initials: string;
    userLabel: string;
    roleLabel: string;
    onLogout: () => void;
    onNavigate?: () => void;
}) {
    return (
        <aside className="flex h-full w-[68px] shrink-0 flex-col items-center border-r border-border-subtle/70 bg-[#f4f7f9] py-3">
            <Link
                href="/apps"
                onClick={onNavigate}
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04]"
                title="ARCA SIRH"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo_arca_nouveau-2.png" alt="ARCA" className="h-7 w-7 object-contain" />
            </Link>

            <nav className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto px-2">
                <RailIcon
                    href="/apps"
                    title="Tableau de bord"
                    icon={LayoutGrid}
                    active={isHub}
                    onNavigate={onNavigate}
                />
                {ACTIVE_MODULES.map((item) => {
                    const Icon = item.icon;
                    const active = module?.slug === item.slug;
                    return (
                        <RailIcon
                            key={item.slug}
                            href={item.href}
                            title={item.shortName}
                            icon={Icon}
                            active={active}
                            onNavigate={onNavigate}
                        />
                    );
                })}
            </nav>

            <div className="mt-auto flex flex-col items-center gap-1 px-2 pt-3">
                <div className="mb-1 h-px w-8 bg-secondary-200" />
                <RailIcon
                    href="/m/securite/settings"
                    title="Paramètres"
                    icon={Settings}
                    active={pathname.startsWith('/m/securite/settings')}
                    onNavigate={onNavigate}
                />
                <button
                    type="button"
                    onClick={onLogout}
                    title="Déconnexion"
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-secondary-500 hover:bg-white hover:text-accent-red-600"
                >
                    <LogOut className="h-4 w-4" />
                </button>
                <Link
                    href="/m/securite/settings"
                    onClick={onNavigate}
                    title={userLabel}
                    className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white"
                >
                    {initials}
                </Link>
            </div>
        </aside>
    );
}

function RailIcon({
    href,
    title,
    icon: Icon,
    active,
    onNavigate,
}: {
    href: string;
    title: string;
    icon: LucideIcon;
    active: boolean;
    onNavigate?: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            title={title}
            className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                active
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-secondary-500 hover:bg-white hover:text-secondary-800',
            )}
        >
            <Icon className="h-4 w-4" />
        </Link>
    );
}

function AppNavPanel({
    isHub,
    module,
    pathname,
    onNavigate,
    onLogout,
}: {
    isHub: boolean;
    module?: AppModule;
    pathname: string;
    onNavigate?: () => void;
    onLogout: () => void;
}) {
    const title = isHub ? 'ARCA SIRH' : (module?.shortName || 'Module');
    const subtitle = isHub ? 'Hub ressources humaines' : (module?.name || '');

    return (
        <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border-subtle bg-white">
            <div className="shrink-0 px-4 py-4">
                <p className="truncate text-[15px] font-semibold text-secondary-900">{title}</p>
                <p className="mt-0.5 truncate text-[12px] text-secondary-500">{subtitle}</p>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
                {isHub ? (
                    <HubMenu onNavigate={onNavigate} />
                ) : module ? (
                    <ModuleMenu module={module} pathname={pathname} onNavigate={onNavigate} />
                ) : null}
            </nav>

            <div className="shrink-0 px-3 py-3">
                <button
                    type="button"
                    onClick={onLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-secondary-600 hover:bg-accent-red-50 hover:text-accent-red-600"
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Déconnexion
                </button>
            </div>
        </aside>
    );
}

function HubMenu({ onNavigate }: { onNavigate?: () => void }) {
    return (
        <NavLink
            href="/apps"
            label="Tableau de bord"
            icon={LayoutDashboard}
            active
            onNavigate={onNavigate}
        />
    );
}

function ModuleMenu({
    module,
    pathname,
    onNavigate,
}: {
    module: AppModule;
    pathname: string;
    onNavigate?: () => void;
}) {
    const { overviewItems, sections } = splitModuleMenu(module);

    return (
        <div>
            {overviewItems.map((item) => {
                const Icon = item.icon ?? LayoutGrid;
                return (
                    <NavLink
                        key={item.href}
                        href={item.href}
                        label={item.title}
                        icon={Icon}
                        active={isModuleItemActive(pathname, module, item)}
                        onNavigate={onNavigate}
                    />
                );
            })}
            {sections.map((section) => (
                <div key={section.label} className="mt-3">
                    <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-400">
                        {section.label}
                    </p>
                    {section.items.map((item) => {
                        const Icon = item.icon ?? LayoutGrid;
                        return (
                            <NavLink
                                key={item.href}
                                href={item.href}
                                label={item.title}
                                icon={Icon}
                                active={isModuleItemActive(pathname, module, item)}
                                onNavigate={onNavigate}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

function NavLink({
    href,
    label,
    icon: Icon,
    active,
    onNavigate,
}: {
    href: string;
    label: string;
    icon: LucideIcon;
    active: boolean;
    onNavigate?: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={cn(
                'relative mb-0.5 flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition-colors',
                active
                    ? 'bg-primary-50 font-semibold text-primary-700'
                    : 'font-medium text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900',
            )}
        >
            {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary-500" />
            )}
            <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary-600' : 'text-secondary-400')} />
            <span className="truncate">{label}</span>
        </Link>
    );
}
