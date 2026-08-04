'use client';

import Link from 'next/link';
import {
    Calendar, GraduationCap, Target, DollarSign, Gift, UserCheck, LogOut, ArrowRightLeft, FileText, Scale,
} from 'lucide-react';

interface Employee360HubProps {
    employeeId: string;
}

const LINKS = [
    { label: 'Congés', href: (id: string) => `/m/temps/leave?employee=${id}`, icon: Calendar, module: 'Temps' },
    { label: 'Formations', href: () => `/m/formation/sessions`, icon: GraduationCap, module: 'Formation' },
    { label: 'Objectifs', href: () => `/m/performance/objectifs`, icon: Target, module: 'Carrière' },
    { label: 'Rémunération', href: () => `/m/paie/compensation`, icon: DollarSign, module: 'Paie' },
    { label: 'Avantages', href: () => `/m/paie/benefits`, icon: Gift, module: 'Paie' },
    { label: 'Intégration', href: () => `/m/personnel/onboarding`, icon: UserCheck, module: 'Parcours' },
    { label: 'Sortie', href: () => `/m/personnel/offboarding`, icon: LogOut, module: 'Parcours' },
    { label: 'Mobilité', href: () => `/m/personnel/mobility`, icon: ArrowRightLeft, module: 'Parcours' },
    { label: 'Discipline', href: (id: string) => `/m/sanctions/affaires?employee=${id}`, icon: Scale, module: 'Sanctions' },
    { label: 'Contrats', href: (id: string) => `/m/personnel/contracts?employee=${id}`, icon: FileText, module: 'Personnel' },
];

export function Employee360Hub({ employeeId }: Employee360HubProps) {
    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-sm font-semibold text-foreground">Dossier collaborateur 360°</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Accès rapide aux modules liés à ce collaborateur</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LINKS.map(link => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.label}
                            href={link.href(employeeId)}
                            className="flex items-center gap-2.5 rounded-xl border border-border-subtle bg-muted/40 hover:bg-primary-50 hover:border-primary-200 px-3 py-2.5 transition-colors group"
                        >
                            <Icon className="w-4 h-4 text-primary-600 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground group-hover:text-primary-700 truncate">{link.label}</p>
                                <p className="text-[10px] text-muted-foreground">{link.module}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
