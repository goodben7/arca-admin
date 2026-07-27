'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronRight, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Settings } from 'lucide-react';
import type { AppModule } from '@/lib/modules/registry';
import { getAbout } from '@/lib/api/auth';
import { clearToken } from '@/lib/auth-token';
import { PERSON_TYPE_LABELS } from '@/types/profile';
import { AnchoredDropdown } from '@/components/ui/AnchoredDropdown';
import { GlobalSearch } from '@/components/apps/GlobalSearch';
import { ModuleBreadcrumbs } from '@/components/modules/ModuleBreadcrumbs';
import { useSidebar } from '@/components/layout/SidebarContext';
import { cn } from '@/lib/utils';

function getRoleLabel(user: any): string {
    if (user?.profile?.label) return user.profile.label;
    if (user?.personType && PERSON_TYPE_LABELS[user.personType]) return PERSON_TYPE_LABELS[user.personType];
    if (user?.roles?.includes('ROLE_SUPER_ADMIN')) return 'Super Administrateur';
    if (user?.roles?.includes('ROLE_ADMIN')) return 'Administrateur RH';
    return 'Utilisateur';
}

interface ModuleTopbarProps {
    module: AppModule;
}

export function ModuleTopbar({ module }: ModuleTopbarProps) {
    const router = useRouter();
    const { collapsed, toggle, openMobile } = useSidebar();
    const [user, setUser] = useState<any>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        getAbout().then(setUser).catch(() => setUser(null));
    }, []);

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
        <header className="relative z-20 shrink-0 border-b border-border-subtle bg-surface">
            <div className="flex h-14 items-center gap-2 px-3 md:gap-3 md:px-5">
                <button
                    type="button"
                    onClick={openMobile}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-secondary-500 hover:bg-muted lg:hidden"
                    aria-label="Ouvrir le menu"
                >
                    <Menu className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={toggle}
                    title={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
                    className="hidden h-9 w-9 items-center justify-center rounded-xl text-secondary-500 hover:bg-muted lg:flex"
                >
                    {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </button>

                <Link href="/apps" className="flex shrink-0 items-center gap-2.5">
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

                <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-secondary-300 sm:block" />
                <div className="hidden min-w-0 sm:block">
                    <ModuleBreadcrumbs module={module} className="text-[12px]" />
                </div>

                <div className="mx-auto hidden w-full max-w-sm md:block">
                    <GlobalSearch />
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

            <div className="flex h-1">
                <div className="flex-[3] bg-primary-500" />
                <div className="flex-1 bg-accent-red-500" />
                <div className="flex-1 bg-accent-yellow-500" />
            </div>

            <div className="border-b border-border-subtle px-3 py-2 sm:hidden">
                <ModuleBreadcrumbs module={module} />
            </div>
        </header>
    );
}
