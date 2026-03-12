'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/navigation';
import { ChevronRight, Users, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAbout } from '@/lib/api/auth';
import { PERSON_TYPE_LABELS } from '@/types/profile';

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        getAbout().then(data => setUser(data)).catch(() => setUser(null));
    }, []);

    const handleLogout = () => {
        // Supprimer le cookie
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push('/login');
    };

    return (
        <aside className="w-64 bg-white border-r border-secondary-200 flex flex-col h-screen sticky top-0 overflow-y-auto">
            <div className="p-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden border border-secondary-100 p-1">
                    <img src="/logo.png" alt="MCBS Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                    <h1 className="font-black leading-none tracking-tight text-lg">
                        <span className="text-[#2B59A1]">M</span>
                        <span className="text-[#E42E28]">C</span>
                        <span className="text-[#2B59A1]">B</span>
                        <span className="text-[#E42E28]">S</span>
                        <span className="text-[#808285] ml-1.5 px-1 font-extrabold border-l-2 border-secondary-200">AFRICA</span>
                    </h1>
                    <p className="text-[10px] text-[#2B59A1] font-black uppercase tracking-[0.2em] mt-1.5 opacity-80">HR Excellence</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-8">
                {NAV_ITEMS.map((section, idx) => (
                    <div key={idx} className="space-y-2">
                        {section.title && !section.href && (
                            <h2 className="px-3 text-xs font-semibold text-secondary-400 uppercase tracking-wider">
                                {section.title}
                            </h2>
                        )}

                        {section.href ? (
                            <Link
                                href={section.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                                    pathname === section.href
                                        ? "bg-primary-50 text-primary-700 font-semibold"
                                        : "text-secondary-600 hover:bg-secondary-50"
                                )}
                            >
                                <section.icon className={cn(
                                    "w-5 h-5 transition-colors",
                                    pathname === section.href ? "text-primary-600" : "text-secondary-400 group-hover:text-secondary-600"
                                )} />
                                <span className="text-sm">{section.title}</span>
                                {pathname === section.href && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-600 rounded-l-full" />
                                )}
                            </Link>
                        ) : (
                            <div className="space-y-1">
                                {section.items?.map((item, itemIdx) => {
                                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                                    const isUnderConstruction = item.status === 'under-construction';

                                    return (
                                        <div key={itemIdx} className="relative group">
                                            <Link
                                                href={isUnderConstruction ? '#' : item.href}
                                                className={cn(
                                                    "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group",
                                                    isActive
                                                        ? "bg-primary-50 text-primary-700 font-semibold"
                                                        : isUnderConstruction
                                                            ? "text-secondary-400 cursor-not-allowed opacity-60"
                                                            : "text-secondary-600 hover:bg-secondary-50"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon className={cn(
                                                        "w-5 h-5 transition-colors",
                                                        isActive ? "text-primary-600" : "text-secondary-400"
                                                    )} />
                                                    <span className="text-sm">{item.title}</span>
                                                </div>
                                                {isUnderConstruction ? (
                                                    <span className="text-[10px] font-bold bg-secondary-100 text-secondary-500 px-1.5 py-0.5 rounded leading-none">
                                                        SOON
                                                    </span>
                                                ) : (
                                                    <ChevronRight className={cn(
                                                        "w-4 h-4 opacity-0 transition-opacity",
                                                        isActive ? "opacity-100 text-primary-600" : "group-hover:opacity-100 text-secondary-300"
                                                    )} />
                                                )}
                                            </Link>
                                            {isActive && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-600 rounded-r-full" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            <div className="p-4 mt-auto border-t border-secondary-100 bg-secondary-50/50 space-y-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-secondary-200 overflow-hidden flex items-center justify-center border border-white shadow-sm">
                        <Users className="w-4 h-4 text-secondary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-secondary-900 truncate">
                            {user?.displayName || user?.email || 'Chargement...'}
                        </p>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-primary-600 truncate">
                            {user?.profile?.label || (user?.personType ? PERSON_TYPE_LABELS[user.personType] : null) || (user?.roles?.includes('ROLE_SUPER_ADMIN') ? 'Super Admin' : (user?.roles?.includes('ROLE_ADMIN') ? 'Administrateur' : 'Utilisateur'))}
                        </p>
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
        </aside>
    );
}
