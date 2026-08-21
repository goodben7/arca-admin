'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, Route } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { getEmployeeJourney } from '@/lib/api/employee';
import type { EmployeeJourneyEntry } from '@/types/onboarding';
import {
    journeyEventLabel,
    journeyStageLabel,
    sourceEntityHref,
} from '@/lib/employees/journeyLabels';

interface EmployeeJourneyTimelineProps {
    employeeId: string;
    refreshKey?: number;
}

export function EmployeeJourneyTimeline({ employeeId, refreshKey = 0 }: EmployeeJourneyTimelineProps) {
    const [entries, setEntries] = useState<EmployeeJourneyEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        // Pour satisfaire la règle ESLint "set-state-in-effect", on pousse le setLoading
        // après le premier tick (microtask).
        (async () => {
            await Promise.resolve();
            if (cancelled) return;
            setLoading(true);

            getEmployeeJourney(employeeId)
                .then((data) => {
                    if (!cancelled) {
                        setEntries(Array.isArray(data) ? data : []);
                        setError(null);
                    }
                })
                .catch((e: unknown) => {
                    if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur');
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        })();
        return () => { cancelled = true; };
    }, [employeeId, refreshKey]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (error) {
        return <p className="py-8 text-center text-sm text-rose-600">{error}</p>;
    }

    if (entries.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 py-12 text-secondary-500">
                <Route className="h-8 w-8 opacity-40" />
                <p className="text-sm">Aucun événement dans le parcours collaborateur.</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-border">
            {entries.map((ev) => {
                const href = sourceEntityHref(ev.sourceEntityType, ev.sourceEntityId);
                return (
                    <div key={ev.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 justify-between">
                                <p className="text-sm font-medium text-foreground">
                                    {journeyEventLabel(ev.eventType)}
                                </p>
                                <Badge variant="secondary" size="sm">
                                    {journeyStageLabel(ev.stage)}
                                </Badge>
                            </div>
                            {ev.description && (
                                <p className="text-sm text-muted-foreground mt-0.5">{ev.description}</p>
                            )}
                            {href && (
                                <Link href={href} className="text-xs font-medium text-primary-600 hover:underline mt-1 inline-block">
                                    Voir la ressource liée →
                                </Link>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                                {ev.occurredAt
                                    ? format(new Date(ev.occurredAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })
                                    : '—'}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
