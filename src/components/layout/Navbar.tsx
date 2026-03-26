'use client';

import { Menu, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAbout } from '@/lib/api/auth';
import { PERSON_TYPE_LABELS } from '@/types/profile';

function getRoleLabel(user: any): string {
    if (user?.profile?.label) return user.profile.label;
    if (user?.personType && PERSON_TYPE_LABELS[user.personType]) return PERSON_TYPE_LABELS[user.personType];
    if (user?.roles?.includes('ROLE_SUPER_ADMIN')) return 'Super Administrateur Plateforme';
    if (user?.roles?.includes('ROLE_ADMIN')) return 'Administrateur';
    return 'Utilisateur';
}

export function Navbar() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getAbout().then(setUser).catch(() => setUser(null));
    }, []);

    // Fermer en cliquant dehors
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleLogout() {
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        router.push('/login');
    }

    const userLabel = user?.displayName || user?.email || 'Chargement...';
    const initials = userLabel !== 'Chargement...' ? userLabel.substring(0, 2).toUpperCase() : '..';
    const roleLabel = user ? getRoleLabel(user) : '';

    return (
        <header className="h-16 bg-white border-b border-secondary-200 sticky top-0 z-30 px-6 flex items-center justify-between">
            {/* Mobile Toggle */}
            <button className="p-2 -ml-2 sm:hidden text-secondary-600">
                <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1" />

            {/* User Profile + Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="flex items-center gap-3 p-1.5 pl-2 hover:bg-secondary-50 rounded-xl transition-colors group"
                >
                    <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 font-black flex items-center justify-center text-xs border border-primary-200 shadow-sm">
                        {initials}
                    </div>
                    <div className="text-left hidden lg:block">
                        <p className="text-sm font-black text-secondary-900 group-hover:text-primary-700 transition-colors leading-none tracking-tight">
                            {userLabel}
                        </p>
                        <p className="text-[10px] text-secondary-400 font-extrabold uppercase mt-1 tracking-widest">
                            {roleLabel}
                        </p>
                    </div>
                    <ChevronDown
                        className={`w-4 h-4 text-secondary-400 group-hover:text-primary-700 transition-all ml-1 ${open ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* Dropdown */}
                {open && (
                    <div className="absolute right-0 top-[calc(100%+8px)] w-64 bg-white rounded-2xl border border-secondary-100 shadow-2xl shadow-secondary-200/60 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        {/* En-tête utilisateur */}
                        <div className="px-4 py-4 border-b border-secondary-100 bg-secondary-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 font-black flex items-center justify-center text-sm border border-primary-200 shrink-0">
                                    {initials}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-secondary-900 truncate tracking-tight">
                                        {userLabel}
                                    </p>
                                    <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest mt-0.5 truncate">
                                        {roleLabel}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-2">
                            <button
                                onClick={() => { setOpen(false); router.push('/profiles'); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900 transition-colors text-left"
                            >
                                <User className="w-4 h-4 text-secondary-400" />
                                Mon profil
                            </button>
                            <button
                                onClick={() => { setOpen(false); router.push('/settings'); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900 transition-colors text-left"
                            >
                                <Settings className="w-4 h-4 text-secondary-400" />
                                Paramètres
                            </button>
                        </div>

                        {/* Séparateur + Déconnexion */}
                        <div className="p-2 border-t border-secondary-100">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-black text-accent-red-600 hover:bg-accent-red-50 transition-colors text-left"
                            >
                                <LogOut className="w-4 h-4" />
                                Se déconnecter
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
