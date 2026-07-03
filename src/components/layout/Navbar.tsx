'use client';

import { PanelLeftClose, PanelLeftOpen, Menu, ChevronDown, LogOut, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAbout } from '@/lib/api/auth';
import { clearToken } from '@/lib/auth-token';
import { PERSON_TYPE_LABELS } from '@/types/profile';
import { useSidebar } from './SidebarContext';
import { AnchoredDropdown } from '@/components/ui/AnchoredDropdown';
import { cn } from '@/lib/utils';

function getRoleLabel(user: any): string {
    if (user?.profile?.label) return user.profile.label;
    if (user?.personType && PERSON_TYPE_LABELS[user.personType]) return PERSON_TYPE_LABELS[user.personType];
    if (user?.roles?.includes('ROLE_SUPER_ADMIN')) return 'Super Administrateur Plateforme';
    if (user?.roles?.includes('ROLE_ADMIN')) return 'Administrateur';
    return 'Utilisateur';
}

export function Navbar() {
    const router = useRouter();
    const { collapsed, toggle, openMobile } = useSidebar();
    const [user, setUser] = useState<any>(null);
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        getAbout().then(setUser).catch(() => setUser(null));
    }, []);

    function handleLogout() {
        clearToken();
        router.push('/login');
    }

    const userLabel = user?.displayName || user?.email || 'Chargement...';
    const initials = userLabel !== 'Chargement...' ? userLabel.substring(0, 2).toUpperCase() : '..';
    const roleLabel = user ? getRoleLabel(user) : '';

    return (
        <header className="h-16 glass-panel px-4 md:px-6 flex items-center justify-between gap-4 rounded-2xl shadow-card border border-primary-100/40 shrink-0">
            <div className="flex items-center gap-2">
                <button
                    onClick={openMobile}
                    className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                    aria-label="Ouvrir le menu"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <button
                    onClick={toggle}
                    title={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
                    className="hidden lg:flex w-9 h-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                >
                    {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                </button>
            </div>

            <div className="flex-1" />

            <div>
                <button
                    ref={triggerRef}
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-haspopup="menu"
                    className="flex items-center gap-3 p-1.5 pl-2 hover:bg-muted rounded-2xl transition-colors group"
                >
                    <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs border border-primary-200 shadow-card dark:bg-primary-950 dark:text-primary-300 dark:border-primary-800">
                        {initials}
                    </div>
                    <div className="text-left hidden lg:block">
                        <p className="text-sm font-semibold text-foreground leading-none">{userLabel}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-1 truncate max-w-[180px]">{roleLabel}</p>
                    </div>
                    <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-all', open && 'rotate-180')} />
                </button>

                <AnchoredDropdown
                    open={open}
                    onClose={() => setOpen(false)}
                    triggerRef={triggerRef}
                    width={256}
                    className="overflow-hidden"
                >
                    <div className="px-4 py-4 border-b border-border-subtle bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm border border-primary-200 shrink-0 dark:bg-primary-950 dark:text-primary-300">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{userLabel}</p>
                                <p className="text-[10px] text-muted-foreground font-medium mt-0.5 truncate">{roleLabel}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-2">
                        <button
                            onClick={() => { setOpen(false); router.push('/profiles'); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors text-left"
                            role="menuitem"
                        >
                            <User className="w-4 h-4 text-muted-foreground" />
                            Mon profil
                        </button>
                    </div>
                    <div className="p-2 border-t border-border-subtle">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-accent-red-600 hover:bg-accent-red-50 dark:hover:bg-accent-red-950/30 transition-colors text-left"
                            role="menuitem"
                        >
                            <LogOut className="w-4 h-4" />
                            Se déconnecter
                        </button>
                    </div>
                </AnchoredDropdown>
            </div>
        </header>
    );
}
