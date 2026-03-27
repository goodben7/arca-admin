'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/navigation';
import { Users, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAbout } from '@/lib/api/auth';
import { PERSON_TYPE_LABELS } from '@/types/profile';
import { useSidebar } from './SidebarContext';

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { collapsed } = useSidebar();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        getAbout().then(data => setUser(data)).catch(() => setUser(null));
    }, []);

    const handleLogout = () => {
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/login');
    };

    const userLabel = user?.displayName || user?.email || '…';
    const initials = userLabel !== '…' ? userLabel.substring(0, 2).toUpperCase() : '..';
    const roleLabel = user?.profile?.label
        || (user?.personType ? PERSON_TYPE_LABELS[user.personType] : null)
        || (user?.roles?.includes('ROLE_SUPER_ADMIN') ? 'Super Admin' : (user?.roles?.includes('ROLE_ADMIN') ? 'Administrateur' : 'Utilisateur'))
        || '';

    return (
        <aside
            className={cn(
                'bg-white border-r border-secondary-200 flex flex-col h-screen sticky top-0 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out shrink-0',
                collapsed ? 'w-[68px]' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className={cn('flex items-center gap-3 border-b border-secondary-100 transition-all duration-300', collapsed ? 'p-3 justify-center h-16' : 'p-5 h-16')}>
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden border border-secondary-100 p-1 shrink-0">
                    <img src="/logo_arca_nouveau-2.png" alt="ARCA Logo" className="w-full h-full object-contain" />
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <h1 className="font-black leading-none tracking-tight text-xl whitespace-nowrap">
                            <span className="text-primary-600 tracking-tighter">AR</span>
                            <span className="text-accent-red-500 tracking-tighter">CA</span>
                        </h1>
                        <p className="text-[9px] text-primary-700 font-black uppercase tracking-[0.15em] mt-1 opacity-90 leading-tight whitespace-nowrap">
                            Administration RH
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className={cn('flex-1 py-4 space-y-6 transition-all duration-300', collapsed ? 'px-2' : 'px-3')}>
                {NAV_ITEMS.map((section, idx) => (
                    <div key={idx} className="space-y-1">
                        {/* Titre de section */}
                        {section.title && !section.href && !collapsed && (
                            <h2 className="px-3 pb-1 text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">
                                {section.title}
                            </h2>
                        )}
                        {section.title && !section.href && collapsed && (
                            <div className="h-px bg-secondary-100 mx-1 mb-2" />
                        )}

                        {/* Lien direct (section sans items) */}
                        {section.href ? (
                            <NavItem
                                href={section.href}
                                icon={section.icon}
                                label={section.title || ''}
                                isActive={pathname === section.href}
                                collapsed={collapsed}
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
                                            collapsed={collapsed}
                                            soon={item.status === 'under-construction'}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            {/* Footer utilisateur */}
            <div className={cn('mt-auto border-t border-secondary-100 bg-secondary-50/50 transition-all duration-300', collapsed ? 'p-2' : 'p-3')}>
                {collapsed ? (
                    /* Mode réduit : avatar centré + bouton logout */
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 font-black flex items-center justify-center text-xs border border-primary-200 shrink-0">
                            {initials}
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Déconnexion"
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-accent-red-500 hover:bg-accent-red-50 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    /* Mode étendu */
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 px-2 py-1">
                            <div className="w-8 h-8 rounded-full bg-secondary-200 overflow-hidden flex items-center justify-center border border-white shadow-sm shrink-0">
                                <Users className="w-4 h-4 text-secondary-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-secondary-900 truncate">{userLabel}</p>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-primary-600 truncate">{roleLabel}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-accent-red-600 hover:bg-accent-red-50 rounded-lg transition-colors group"
                        >
                            <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            DÉCONNEXION
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}

/* ── Composant item de navigation ── */
interface NavItemProps {
    href: string;
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    collapsed: boolean;
    soon?: boolean;
}

function NavItem({ href, icon: Icon, label, isActive, collapsed, soon }: NavItemProps) {
    const content = (
        <div
            className={cn(
                'relative flex items-center gap-3 rounded-xl transition-all duration-200 group',
                collapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2.5',
                isActive
                    ? 'bg-primary-50 text-primary-700'
                    : soon
                        ? 'text-secondary-400 opacity-60 cursor-not-allowed'
                        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
            )}
            title={collapsed ? label : undefined}
        >
            {/* Indicateur actif (barre gauche) */}
            {isActive && !collapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-600 rounded-r-full" />
            )}
            {isActive && collapsed && (
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-600 rounded-r-full" />
            )}

            <Icon className={cn('shrink-0 transition-colors', collapsed ? 'w-5 h-5' : 'w-4.5 h-4.5', isActive ? 'text-primary-600' : 'text-secondary-400 group-hover:text-secondary-600')} />

            {!collapsed && (
                <>
                    <span className="text-sm font-medium flex-1 truncate">{label}</span>
                    {soon && (
                        <span className="text-[9px] font-black bg-secondary-100 text-secondary-500 px-1.5 py-0.5 rounded leading-none">
                            SOON
                        </span>
                    )}
                </>
            )}

            {/* Tooltip en mode collapsed */}
            {collapsed && (
                <div className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-secondary-900 text-white text-xs font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                    {label}
                    {soon && <span className="ml-1.5 text-secondary-400">— bientôt</span>}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-secondary-900" />
                </div>
            )}
        </div>
    );

    if (soon) return content;

    return <Link href={href}>{content}</Link>;
}
