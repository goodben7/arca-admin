'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, Loader2, Plus, Scale } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { DisciplinarySummaryCard } from '@/components/sanctions/DisciplinarySummaryCard';
import { getDisciplinaryCases, getDisciplinarySummary } from '@/lib/api/disciplinaryCase';
import { getSanctionScales } from '@/lib/api/sanctionScale';
import { getEmployeeJourney } from '@/lib/api/onboarding';
import { getAbout } from '@/lib/api/auth';
import { extractId } from '@/lib/api-iri';
import { canActOnDisciplinaryCase } from '@/lib/permissions';
import type { AuthUser } from '@/types/auth';
import type { EmployeeJourneyEntry } from '@/types/onboarding';
import {
    DISCIPLINARY_ACTIVE_STATUSES,
    DISCIPLINARY_STATUS_LABELS,
    disciplinaryStatusBadgeVariant,
    sanctionScaleCodeLabel,
    type DisciplinaryCase,
    type DisciplinaryStatus,
    type DisciplinarySummary,
    type SanctionScale,
} from '@/types/sanctions';

const JOURNEY_LABELS: Record<string, string> = {
    DISCIPLINARY_STARTED: 'Procédure disciplinaire ouverte',
    SANCTION_APPLIED: 'Sanction appliquée',
    DISCIPLINARY: 'Discipline',
};

interface EmployeeDisciplineTabProps {
    employeeId: string;
}

export function EmployeeDisciplineTab({ employeeId }: EmployeeDisciplineTabProps) {
    const [summary, setSummary] = useState<DisciplinarySummary | null>(null);
    const [cases, setCases] = useState<DisciplinaryCase[]>([]);
    const [scales, setScales] = useState<SanctionScale[]>([]);
    const [journey, setJourney] = useState<EmployeeJourneyEntry[]>([]);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAbout().then(setUser).catch(() => setUser(null));
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        Promise.all([
            getDisciplinarySummary(employeeId).catch(() => null),
            getDisciplinaryCases({ employee: employeeId }).catch(() => []),
            getSanctionScales().catch(() => []),
            getEmployeeJourney(employeeId).catch(() => []),
        ]).then(([s, c, scalesList, j]) => {
            if (cancelled) return;
            setSummary(s);
            setCases(c);
            setScales(scalesList);
            setJourney(
                (j || []).filter(
                    e =>
                        e.stage === 'DISCIPLINARY' ||
                        e.eventType === 'DISCIPLINARY_STARTED' ||
                        e.eventType === 'SANCTION_APPLIED',
                ).slice(0, 5),
            );
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [employeeId]);

    const scaleLabel = (ref: DisciplinaryCase['sanctionScale']) => {
        if (typeof ref === 'object' && ref?.label) return ref.label;
        const id = typeof ref === 'string' ? extractId(ref) : ref?.id;
        const s = scales.find(x => x.id === id);
        return s?.label || (s?.code ? sanctionScaleCodeLabel(s.code) : id) || '—';
    };

    const canCreate = canActOnDisciplinaryCase(user, 'create');
    const activeCase = cases.find(c =>
        DISCIPLINARY_ACTIVE_STATUSES.includes(c.status as DisciplinaryStatus),
    );
    const createBlocked = !canCreate || !!summary?.hasActiveCase;
    const createTitle = !canCreate
        ? 'Permission insuffisante pour créer une affaire'
        : summary?.hasActiveCase
            ? 'Une affaire active existe déjà'
            : undefined;

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold text-secondary-900 flex items-center gap-2">
                        <Scale className="h-4 w-4 text-rose-600" />
                        Discipline
                    </h3>
                    <p className="text-sm text-secondary-500 mt-0.5">
                        Synthèse et historique des affaires disciplinaires
                    </p>
                </div>
                {activeCase ? (
                    <Link href={`/m/sanctions/affaires/${activeCase.id}`}>
                        <Button size="sm" variant="outline" className="gap-1.5">
                            <Eye className="h-4 w-4" /> Voir l’affaire en cours
                        </Button>
                    </Link>
                ) : (
                    <Link
                        href={createBlocked ? '#' : `/m/sanctions/affaires/create?employee=${employeeId}`}
                        onClick={e => {
                            if (createBlocked) e.preventDefault();
                        }}
                    >
                        <Button
                            size="sm"
                            className="gap-1.5"
                            disabled={createBlocked}
                            title={createTitle}
                        >
                            <Plus className="h-4 w-4" /> Nouvelle affaire
                        </Button>
                    </Link>
                )}
            </div>

            <DisciplinarySummaryCard summary={summary} />

            {journey.length > 0 && (
                <div className="rounded-xl border border-border-subtle bg-surface p-5">
                    <p className="text-sm font-semibold text-secondary-900 mb-3">Chronologie disciplinaire</p>
                    <ul className="space-y-3">
                        {journey.map(ev => (
                            <li key={ev.id} className="flex gap-3 text-sm">
                                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                                <div className="min-w-0">
                                    <p className="font-medium text-secondary-900">
                                        {JOURNEY_LABELS[ev.eventType] || ev.eventType}
                                    </p>
                                    <p className="text-xs text-secondary-500 mt-0.5">
                                        {ev.occurredAt
                                            ? format(new Date(ev.occurredAt), "d MMM yyyy 'à' HH:mm", { locale: fr })
                                            : '—'}
                                        {ev.sourceEntityId ? (
                                            <>
                                                {' · '}
                                                <Link
                                                    href={`/m/sanctions/affaires/${extractId(ev.sourceEntityId)}`}
                                                    className="text-primary-600 hover:underline"
                                                >
                                                    {extractId(ev.sourceEntityId)}
                                                </Link>
                                            </>
                                        ) : null}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden">
                <div className="border-b border-border-subtle px-5 py-3">
                    <p className="text-sm font-semibold text-secondary-900">
                        Affaires ({cases.length})
                    </p>
                </div>
                {cases.length === 0 ? (
                    <p className="py-12 text-center text-sm text-secondary-500">
                        Aucune affaire disciplinaire pour cet employé.
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Référence</TableHead>
                                <TableHead>Échelle</TableHead>
                                <TableHead>Faits</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cases.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-mono text-xs text-primary-700">{c.id}</TableCell>
                                    <TableCell className="text-sm">{scaleLabel(c.sanctionScale)}</TableCell>
                                    <TableCell className="text-sm text-secondary-600">
                                        {c.occurredAt
                                            ? format(new Date(c.occurredAt), 'd MMM yyyy', { locale: fr })
                                            : '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={disciplinaryStatusBadgeVariant(c.status)}>
                                            {DISCIPLINARY_STATUS_LABELS[c.status as DisciplinaryStatus] ?? c.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/m/sanctions/affaires/${c.id}`}>
                                            <Button variant="ghost" size="sm" className="gap-1">
                                                <Eye className="h-3.5 w-3.5" /> Voir
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}
