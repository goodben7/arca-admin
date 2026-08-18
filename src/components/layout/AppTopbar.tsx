'use client';

import { Bell, LayoutGrid, Menu } from 'lucide-react';
import { GlobalSearch } from '@/components/apps/GlobalSearch';
import { getModuleFromPath } from '@/lib/modules/registry';
import { usePathname } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AppTopbarProps {
    onOpenNav?: () => void;
    onBrowseApps?: () => void;
}

export function AppTopbar({ onOpenNav, onBrowseApps }: AppTopbarProps) {
    const pathname = usePathname();
    const module = getModuleFromPath(pathname);
    const isHub = pathname === '/apps' || pathname.startsWith('/apps/');
    const todayLabel = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr });
    const title = isHub ? 'Tableau de bord' : (module?.shortName || 'ARCA SIRH');

    return (
        <header className="relative z-20 shrink-0 border-b border-white/70 bg-white/90 backdrop-blur-md">
            <div className="flex h-16 items-center gap-2 px-3 md:gap-4 md:px-6">
                {onOpenNav && (
                <button
                    type="button"
                    onClick={onOpenNav}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-secondary-600 hover:bg-muted lg:hidden"
                    aria-label="Ouvrir le menu"
                >
                    <Menu className="h-5 w-5" />
                </button>
                )}

                <div className="min-w-0">
                    <h1 className="truncate text-base font-bold tracking-tight text-secondary-900">
                        {title}
                    </h1>
                    <p className="hidden truncate text-[11px] capitalize text-secondary-400 sm:block">
                        ARCA SIRH — {todayLabel}
                    </p>
                </div>

                <div className="mx-auto hidden w-full max-w-xl md:block">
                    <GlobalSearch />
                </div>

                <div className="ml-auto flex items-center gap-1.5">
                    {onBrowseApps && (
                        <>
                            <button
                                type="button"
                                onClick={onBrowseApps}
                                className="hidden sm:inline-flex h-10 items-center gap-2 rounded-2xl bg-primary-600 px-4 text-[13px] font-semibold text-white shadow-sm shadow-primary-900/15 hover:bg-primary-700 transition-colors"
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                                Applications
                            </button>
                            <button
                                type="button"
                                onClick={onBrowseApps}
                                className="flex sm:hidden h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white"
                                aria-label="Applications"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                        </>
                    )}
                    <button type="button" className="relative flex h-9 w-9 items-center justify-center rounded-xl text-secondary-500 hover:bg-muted" aria-label="Notifications">
                        <Bell className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </header>
    );
}
