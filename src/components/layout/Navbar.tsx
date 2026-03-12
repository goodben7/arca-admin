'use client';

import {
    Menu,
    ChevronDown,
    User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { getAbout } from '@/lib/api/auth';
import { PERSON_TYPE_LABELS } from '@/types/profile';

export function Navbar() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        getAbout().then(data => setUser(data)).catch(() => setUser(null));
    }, []);

    const userLabel = user?.displayName || user?.email || 'Chargement...';
    const initals = userLabel !== 'Chargement...' ? userLabel.substring(0, 2).toUpperCase() : '..';

    return (
        <header className="h-16 bg-white border-b border-secondary-200 sticky top-0 z-30 px-6 flex items-center justify-between">
            {/* Mobile Toggle */}
            <button className="p-2 -ml-2 sm:hidden text-secondary-600">
                <Menu className="w-5 h-5" />
            </button>

            {/* Spacer to push user profile to the right */}
            <div className="flex-1" />

            {/* User Profile */}
            <div className="flex items-center gap-2">
                <button className="flex items-center gap-3 p-1.5 pl-2 hover:bg-secondary-50 rounded-xl transition-colors group">
                    <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 font-black flex items-center justify-center text-xs border border-primary-200 shadow-sm">
                        {initals}
                    </div>
                    <div className="text-left hidden lg:block">
                        <p className="text-sm font-black text-secondary-900 group-hover:text-primary-700 transition-colors leading-none tracking-tight">{userLabel}</p>
                        <p className="text-[10px] text-secondary-400 font-extrabold uppercase mt-1 tracking-widest">
                            {user?.profile?.label || (user?.personType ? PERSON_TYPE_LABELS[user.personType] : null) || (user?.roles?.includes('ROLE_SUPER_ADMIN') ? 'Super Admin' : (user?.roles?.includes('ROLE_ADMIN') ? 'Administrateur' : 'Utilisateur'))}
                        </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-secondary-400 group-hover:text-primary-700 transition-colors ml-1" />
                </button>
            </div>
        </header>
    );
}
