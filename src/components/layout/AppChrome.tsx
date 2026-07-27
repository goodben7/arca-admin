'use client';

import { usePathname } from 'next/navigation';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { ModuleSidebar } from '@/components/modules/ModuleSidebar';
import { ModuleTopbar } from '@/components/modules/ModuleTopbar';
import { ShellAmbient } from '@/components/layout/ShellAmbient';
import { getModuleFromPath } from '@/lib/modules/registry';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { DashboardPreloader } from '@/components/layout/DashboardPreloader';
import { cn } from '@/lib/utils';

export function AppChrome({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const module = getModuleFromPath(pathname);
    const isAppsHome = pathname === '/apps' || pathname.startsWith('/apps/');

    return (
        <SidebarProvider>
            <DashboardPreloader />
            <ToastContainer />
            {isAppsHome ? (
                <div className="h-screen w-full overflow-hidden bg-background">
                    {children}
                </div>
            ) : module ? (
                <div className="flex h-screen w-full flex-col overflow-hidden bg-surface">
                    <ModuleTopbar module={module} />
                    <div className="flex min-h-0 flex-1 overflow-hidden">
                        <ModuleSidebar module={module} />
                        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#eef5f9]">
                            <ShellAmbient />
                            <div className="relative z-[1] h-full overflow-y-auto">
                                <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={cn('h-screen w-full overflow-hidden bg-background p-4 md:p-5 lg:p-6')}>
                    <div className="h-full overflow-y-auto">{children}</div>
                </div>
            )}
        </SidebarProvider>
    );
}
