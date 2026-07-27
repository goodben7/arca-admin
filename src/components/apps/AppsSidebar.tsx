'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Grid3X3, LogOut, Search, Settings, ChevronDown } from 'lucide-react';
import { getAbout } from '@/lib/api/auth';
import { clearToken } from '@/lib/auth-token';
import { PERSON_TYPE_LABELS } from '@/types/profile';
import { AnchoredDropdown } from '@/components/ui/AnchoredDropdown';
import { cn } from '@/lib/utils';

function getRoleLabel(user: any): string {
    if (user?.profile?.label) return user.profile.label;
    if (user?.personType && PERSON_TYPE_LABELS[user.personType]) return PERSON_TYPE_LABELS[user.personType];
    if (user?.roles?.includes('ROLE_SUPER_ADMIN')) return 'Super Administrateur';
    if (user?.roles?.includes('ROLE_ADMIN')) return 'Administrateur RH';
    return 'Utilisateur';
}

interface AppsSidebarProps {
    query: string;
    onQueryChange: (q: string) => void;
    className?: string;
}

export function AppsSidebar({ query, onQueryChange, className }: AppsSidebarProps) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [open, setOpen] = useState(false);
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
        <aside className={cn(
            'flex flex-col w-64 shrink-0 h-full rounded-xl bg-surface border border-border-subtle shadow-card overflow-hidden',
            className
        )}>
            <div className="h-1 bg-primary-500 shrink-0" />

            <div className="p-4 border-b border-border-subtle">
                <Link href="/apps" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface border border-border-subtle shadow-sm overflow-hidden p-1.5 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo_arca_nouveau-2.png" alt="ARCA" className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold tracking-tight">
                            <span className="text-primary-600">AR</span>
                            <span className="text-accent-red-500">CA</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">SIRH · Modules</p>
                    </div>
                </Link>
            </div>

            <div className="p-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                        type="search"
                        value={query}
                        onChange={e => onQueryChange(e.target.value)}
                        placeholder="Rechercher…"
                        className="w-full h-10 pl-9 pr-3 bg-muted/60 border border-transparent focus:border-primary-300 focus:bg-surface rounded-xl text-sm outline-none transition-colors"
                    />
                </div>
            </div>

            <nav className="flex-1 px-3 py-1 space-y-0.5">
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold shadow-sm">
                    <Grid3X3 className="w-4 h-4" />
                    Applications
                </div>
                <Link
                    href="/m/securite/settings"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-secondary-700 hover:bg-muted transition-colors"
                >
                    <Settings className="w-4 h-4 text-secondary-500" />
                    Paramètres
                </Link>
            </nav>

            <div className="p-3 border-t border-border-subtle mt-auto">
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setOpen(v => !v)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted transition-colors text-left"
                >
                    <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs border border-primary-200 shrink-0">
                        {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">{userLabel}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{roleLabel}</p>
                    </div>
                    <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform', open && 'rotate-180')} />
                </button>

                <AnchoredDropdown
                    open={open}
                    onClose={() => setOpen(false)}
                    triggerRef={triggerRef}
                    width={220}
                    className="overflow-hidden"
                >
                    <div className="p-2">
                        <button
                            type="button"
                            onClick={() => { setOpen(false); router.push('/m/securite/settings'); }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted"
                        >
                            <Settings className="w-4 h-4 text-muted-foreground" />
                            Paramètres
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-accent-red-600 hover:bg-accent-red-50"
                        >
                            <LogOut className="w-4 h-4" />
                            Déconnexion
                        </button>
                    </div>
                </AnchoredDropdown>
            </div>
        </aside>
    );
}
