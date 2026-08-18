'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { AppDualNav } from '@/components/layout/AppDualNav';
import { AppTopbar } from '@/components/layout/AppTopbar';
import { ShellAmbient } from '@/components/layout/ShellAmbient';
import { getModuleFromPath } from '@/lib/modules/registry';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { DashboardPreloader } from '@/components/layout/DashboardPreloader';
import { AppsLauncherModal } from '@/components/apps/AppsLauncherModal';
import { getFavoriteSlugs, toggleFavorite } from '@/lib/modules/prefs';
import { cn } from '@/lib/utils';

export function AppChrome({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const module = getModuleFromPath(pathname);
    const isAppsHome = pathname === '/apps' || pathname.startsWith('/apps/');
    const useDualNav = isAppsHome || Boolean(module);
    const [navOpen, setNavOpen] = useState(false);
    const [appsOpen, setAppsOpen] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        Promise.resolve().then(() => setFavorites(getFavoriteSlugs()));
    }, []);

    return (
        <SidebarProvider>
            <DashboardPreloader />
            <ToastContainer />
            {useDualNav ? (
                <div className="flex h-screen w-full overflow-hidden bg-surface">
                    <AppDualNav mobileOpen={navOpen} onMobileClose={() => setNavOpen(false)} />
                    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                        <AppTopbar
                            onOpenNav={() => setNavOpen(true)}
                            onBrowseApps={() => setAppsOpen(true)}
                        />
                        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#eef5f9]">
                            <ShellAmbient />
                            <div className="relative z-[1] h-full overflow-y-auto">
                                <div className={cn(
                                    'mx-auto px-4 py-6 md:px-8 md:py-8',
                                    isAppsHome ? 'max-w-[1360px]' : 'max-w-6xl',
                                )}>
                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>
                    <AppsLauncherModal
                        open={appsOpen}
                        onClose={() => setAppsOpen(false)}
                        favorites={favorites}
                        onToggleFavorite={(slug) => setFavorites(toggleFavorite(slug))}
                    />
                </div>
            ) : (
                <div className={cn('h-screen w-full overflow-hidden bg-background p-4 md:p-5 lg:p-6')}>
                    <div className="h-full overflow-y-auto">{children}</div>
                </div>
            )}
        </SidebarProvider>
    );
}
