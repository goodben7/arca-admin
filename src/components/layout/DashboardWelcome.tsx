'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UserPlus, GraduationCap, ChevronRight, Umbrella } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PERSON_TYPE_LABELS } from '@/types/profile';

interface DashboardWelcomeProps {
    user: any;
    pendingCount: number;
    pendingLeaves?: number;
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
}

function getFirstName(user: any): string {
    if (user?.displayName) {
        const name = user.displayName.trim().split(/\s+/)[0];
        if (name) return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }
    if (user?.email) {
        const local = user.email.split('@')[0];
        const part = local.split(/[._-]/)[0];
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }
    return 'collègue';
}

function getRoleLabel(user: any): string {
    if (user?.profile?.label) return user.profile.label;
    if (user?.personType && PERSON_TYPE_LABELS[user.personType]) return PERSON_TYPE_LABELS[user.personType];
    if (user?.roles?.includes('ROLE_SUPER_ADMIN')) return 'Super Administrateur';
    if (user?.roles?.includes('ROLE_ADMIN')) return 'Administrateur RH';
    return '';
}

export function DashboardWelcome({ user, pendingCount, pendingLeaves = 0 }: DashboardWelcomeProps) {
    const firstName = getFirstName(user);
    const roleLabel = user ? getRoleLabel(user) : '';
    const dateLabel = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr });

    return (
        <header className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
                <div className="min-w-0 space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-primary-500">
                        Pilotage RH
                    </p>
                    <h1 className="text-2xl md:text-[1.75rem] font-semibold text-foreground tracking-tight leading-tight">
                        {getGreeting()}, {firstName}
                    </h1>
                    <p className="text-sm text-muted-foreground capitalize">
                        {dateLabel}
                        {roleLabel && (
                            <>
                                <span className="mx-2 text-border">·</span>
                                {roleLabel}
                            </>
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Link href="/m/personnel/employees/create">
                        <Button variant="pill" size="sm" className="gap-2">
                            <UserPlus className="w-4 h-4" />
                            Nouvel employé
                        </Button>
                    </Link>
                    <Link href="/m/formation/sessions/create">
                        <Button variant="outline" size="sm" className="gap-2">
                            <GraduationCap className="w-4 h-4" />
                            Nouvelle session
                        </Button>
                    </Link>
                </div>
            </div>

            {pendingCount > 0 && (
                <Link
                    href={pendingLeaves > 0 ? '/m/temps/leave' : '#priorites'}
                    className="flex items-center gap-4 rounded-lg border border-amber-200/80 bg-amber-50/60 px-4 py-3 hover:bg-amber-100/50 transition-colors group"
                >
                    {pendingLeaves > 0 ? (
                        <span className="shrink-0 flex items-center justify-center w-14 h-14 rounded-lg bg-primary-500 text-white shadow-sm">
                            <Umbrella className="w-9 h-9 stroke-[1.75]" aria-hidden />
                        </span>
                    ) : null}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                            {pendingCount} élément{pendingCount > 1 ? 's' : ''} à traiter aujourd&apos;hui
                        </p>
                        {pendingLeaves > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                                dont {pendingLeaves} demande{pendingLeaves > 1 ? 's' : ''} de congé
                            </p>
                        )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-primary-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>
            )}
        </header>
    );
}
