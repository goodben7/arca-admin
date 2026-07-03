'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/navigation';
import { Users, LogOut, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAbout } from '@/lib/api/auth';
import { clearToken } from '@/lib/auth-token';
import { PERSON_TYPE_LABELS } from '@/types/profile';
import { useSidebar } from './SidebarContext';
import { SidebarAmbient } from './SidebarAmbient';

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { collapsed } = useSidebar();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        getAbout().then(data => setUser(data)).catch(() => setUser(null));
    }, []);

    const handleLogout = () => {
        clearToken();
        router.push('/login');
    };

    const userLabel = user?.displayName || user?.email || '…';
    const initials = userLabel !== '…' ? userLabel.substring(0, 2).toUpperCase() : '..';
    const roleLabel = user?.profile?.label
        || (user?.personType ? PERSON_TYPE_LABELS[user.personType] : null)
        || (user?.roles?.includes('ROLE_SUPER_ADMIN') ? 'Super Admin' : (user?.roles?.includes('ROLE_ADMIN') ? 'Administrateur' : 'Utilisateur'))
        || '';

  const isCollapsed = collapsed && !onNavigate;

    return (
        <>
            <div className={cn('flex items-center gap-3 border-b border-border-subtle shrink-0', isCollapsed ? 'p-3 justify-center h-16' : 'p-5 h-16')}>
                <div className="w-9 h-9 bg-surface rounded-xl flex items-center justify-center shadow-card overflow-hidden border border-border-subtle p-1 shrink-0">
                    <img src="/logo_arca_nouveau-2.png" alt="ARCA Logo" className="w-full h-full object-contain" />
                </div>
                {!isCollapsed && (
                    <div className="overflow-hidden">
                        <h1 className="font-bold leading-none tracking-tight text-lg whitespace-nowrap">
                            <span className="text-primary-600">AR</span>
                            <span className="text-accent-red-500">CA</span>
                        </h1>
                        <p className="text-[10px] text-muted-foreground font-medium mt-1 whitespace-nowrap">
                            Administration RH
                        </p>
                    </div>
                )}
            </div>

            <nav className={cn('flex-1 py-4 space-y-5 overflow-y-auto', isCollapsed ? 'px-2' : 'px-3')}>
                {NAV_ITEMS.map((section, idx) => (
                    <div key={idx} className="space-y-1">
                        {section.title && !section.href && !isCollapsed && (
                            <h2 className="px-3 pb-1 text-[11px] font-semibold text-muted-foreground">
                                {section.title}
                            </h2>
                        )}
                        {section.title && !section.href && isCollapsed && (
                            <div className="h-px bg-border-subtle mx-1 mb-2" />
                        )}

                        {section.href ? (
                            <NavItem
                                href={section.href}
                                icon={section.icon}
                                label={section.title || ''}
                                isActive={pathname === section.href}
                                collapsed={isCollapsed}
                                onNavigate={onNavigate}
                            />
                        ) : (
                            <div className="space-y-0.5">
                                {section.items?.map((item, itemIdx) => {
                                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                                    return (
                                        <NavItem
                                            key={itemIdx}
                                            href={item.href}
                                            icon={item.icon}
                                            label={item.title}
                                            isActive={isActive}
                                            collapsed={isCollapsed}
                                            soon={item.status === 'under-construction'}
                                            onNavigate={onNavigate}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            <div className={cn('mt-auto border-t border-border-subtle bg-muted/30 shrink-0', isCollapsed ? 'p-2' : 'p-3')}>
                {isCollapsed ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs border border-primary-200 shrink-0 dark:bg-primary-950 dark:text-primary-300">
                            {initials}
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Déconnexion"
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-accent-red-500 hover:bg-accent-red-50 dark:hover:bg-accent-red-950/30 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 px-2 py-1 rounded-2xl bg-surface/60">
                            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center border border-border-subtle shrink-0">
                                <Users className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{userLabel}</p>
                                <p className="text-[10px] font-medium text-primary-600 truncate dark:text-primary-400">{roleLabel}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-accent-red-600 hover:bg-accent-red-50 dark:hover:bg-accent-red-950/30 rounded-xl transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Déconnexion
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

export function Sidebar() {
    const { collapsed, mobileOpen, closeMobile } = useSidebar();
    const pathname = usePathname();

    useEffect(() => {
        closeMobile();
    }, [pathname, closeMobile]);

    return (
        <>
            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
                    onClick={closeMobile}
                    aria-hidden
                />
            )}

            {/* Desktop sidebar — dans le flux, collée au bord gauche */}
            <aside
                className={cn(
                    'hidden lg:flex flex-col shrink-0 h-full z-30 transition-all duration-300 ease-in-out',
                    'rounded-xl panel-surface panel-accent-top overflow-hidden shadow-float',
                    collapsed ? 'w-[72px]' : 'w-64'
                )}
            >
                <SidebarAmbient />
                <div className="relative z-10 flex flex-col h-full min-h-0">
                    <SidebarContent />
                </div>
            </aside>

            {/* Mobile drawer */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex flex-col w-72 panel-surface panel-accent-top shadow-float transition-transform duration-300 lg:hidden relative overflow-hidden',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <SidebarAmbient />
                <div className="relative z-10 flex flex-col h-full min-h-0">
                <button
                    onClick={closeMobile}
                    className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-foreground"
                    aria-label="Fermer le menu"
                >
                    <X className="w-4 h-4" />
                </button>
                <SidebarContent onNavigate={closeMobile} />
                </div>
            </aside>
        </>
    );
}

interface NavItemProps {
    href: string;
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    collapsed: boolean;
    soon?: boolean;
    onNavigate?: () => void;
}

function NavItem({ href, icon: Icon, label, isActive, collapsed, soon, onNavigate }: NavItemProps) {
    const content = (
        <div
            className={cn(
                'relative flex items-center gap-3 rounded-2xl transition-all duration-200 group',
                collapsed ? 'justify-center w-11 h-11 mx-auto' : 'px-3 py-2.5',
                isActive
                    ? 'bg-primary-500 text-white shadow-sm'
                    : soon
                        ? 'text-muted-foreground opacity-50 cursor-not-allowed'
                        : 'text-secondary-700 hover:bg-primary-50 hover:text-primary-700'
            )}
            title={collapsed ? label : undefined}
        >
            {isActive && !collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-yellow-500 rounded-r-full" />
            )}
            <Icon className={cn(
                'shrink-0',
                collapsed ? 'w-5 h-5' : 'w-4 h-4',
                isActive ? 'text-white' : 'text-secondary-500 group-hover:text-primary-600'
            )} />
            {!collapsed && (
                <>
                    <span className={cn('text-sm flex-1 truncate', isActive ? 'font-semibold' : 'font-medium')}>{label}</span>
                    {soon && (
                        <span className="text-[9px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            Bientôt
                        </span>
                    )}
                </>
            )}
            {collapsed && (
                <div className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-secondary-900 text-white text-xs font-medium rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-float">
                    {label}
                </div>
            )}
        </div>
    );

    if (soon) return content;

    return <Link href={href} onClick={onNavigate}>{content}</Link>;
}
