'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Scale, ShieldAlert, TrendingUp } from 'lucide-react';
import { sanctionScaleCodeLabel, translateDisciplinaryReason, type DisciplinarySummary } from '@/types/sanctions';
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

    const clean = (summary.appliedSanctionCount ?? 0) < 1 && !summary.hasActiveCase;

    if (clean) {
        return (
            <div className={cn('flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3.5', className)}>
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-emerald-900">Aucun historique disciplinaire</p>
                    <p className="text-xs text-emerald-800 mt-0.5">Tous les niveaux de sanction sont disponibles pour une première affaire.</p>
                </div>
            </div>
        );
    }

    const suggestedLabel = summary.suggestedNextLabel
        || (summary.suggestedNextCode ? sanctionScaleCodeLabel(summary.suggestedNextCode) : null);

    return (
        <div className={cn('rounded-xl border border-border-subtle bg-surface p-5 space-y-4', className)}>
            {summary.hasActiveCase && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Une affaire est déjà en cours — impossible d’en ouvrir une autre tant qu’elle n’est pas close.</span>
                </div>
            )}

            {summary.requiresAcknowledgement && !summary.hasActiveCase && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                        Récidive au même niveau : une confirmation vous sera demandée. Un niveau supérieur est recommandé.
                    </span>
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
                    label="Niveau le plus élevé"
                    value={
                        summary.maxSeverityLevel != null
                            ? `${summary.maxSeverityLevel} sur 5`
                            : '—'
                    }
                />
                <Stat
                    label="Dernière sanction"
                    value={
                        summary.lastSanctionLabel
                        || (summary.lastSanctionCode ? sanctionScaleCodeLabel(summary.lastSanctionCode) : '—')
                    }
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

            {suggestedLabel && !summary.hasActiveCase && (
                <div className="flex items-start gap-2 rounded-lg border border-primary-100 bg-primary-50/70 px-3 py-2.5 text-sm text-primary-900">
                    <TrendingUp className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Niveau recommandé : {suggestedLabel}.</span>
                </div>
            )}

            {summary.isRepeatOffender && (
                <p className="text-xs font-medium text-rose-700">
                    Une sanction a déjà été appliquée à ce collaborateur.
                </p>
            )}

            {(summary.reasons?.length ?? 0) > 0 && (
                <ul className="text-xs text-secondary-600 list-disc pl-4 space-y-0.5">
                    {[...new Set(
                        summary.reasons!
                            .map(translateDisciplinaryReason)
                            .filter(reason => !suggestedLabel || !/recommandé de passer/i.test(reason)),
                    )].map((reason, i) => (
                        <li key={i}>{reason}</li>
                    ))}
                </ul>
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
