'use client';

import Link from 'next/link';
import { AlertTriangle, Scale, ShieldAlert } from 'lucide-react';
import type { DisciplinarySummary } from '@/types/sanctions';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DisciplinarySummaryCardProps {
    summary: DisciplinarySummary | null;
    loading?: boolean;
    className?: string;
}

export function DisciplinarySummaryCard({ summary, loading, className }: DisciplinarySummaryCardProps) {
    if (loading) {
        return (
            <div className={cn('rounded-xl border border-border-subtle bg-surface p-5 animate-pulse h-28', className)} />
        );
    }

    if (!summary) {
        return (
            <div className={cn('rounded-xl border border-border-subtle bg-surface p-5 text-sm text-secondary-500', className)}>
                Synthèse disciplinaire indisponible.
            </div>
        );
    }

    return (
        <div className={cn('rounded-xl border border-border-subtle bg-surface p-5 space-y-4', className)}>
            {summary.hasActiveCase && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Une affaire disciplinaire est déjà en cours — nouvelle création bloquée.</span>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat
                    icon={<Scale className="h-4 w-4" />}
                    label="Sanctions appliquées"
                    value={String(summary.appliedSanctionCount)}
                />
                <Stat
                    icon={<ShieldAlert className="h-4 w-4" />}
                    label="Gravité max"
                    value={summary.maxSeverityLevel != null ? String(summary.maxSeverityLevel) : '—'}
                />
                <Stat
                    label="Dernière échelle"
                    value={summary.lastSanctionLabel || summary.lastSanctionCode || '—'}
                />
                <Stat
                    label="Dernière application"
                    value={
                        summary.lastAppliedAt
                            ? format(new Date(summary.lastAppliedAt), 'd MMM yyyy', { locale: fr })
                            : '—'
                    }
                />
            </div>

            {summary.isRepeatOffender && (
                <p className="text-xs font-medium text-rose-700">
                    Récidive signalée — historique disciplinaire non vide.
                </p>
            )}
        </div>
    );
}

function Stat({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: React.ReactNode;
}) {
    return (
        <div className="rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary-400 flex items-center gap-1">
                {icon}{label}
            </p>
            <p className="mt-1 text-sm font-semibold text-secondary-900 truncate">{value}</p>
        </div>
    );
}

export function DisciplinarySummaryLink({ href }: { href: string }) {
    return (
        <Link href={href} className="text-xs font-medium text-primary-600 hover:text-primary-700">
            Voir les affaires →
        </Link>
    );
}
