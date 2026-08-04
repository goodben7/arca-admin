'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2, Plus, Scale, Gavel, ClipboardList, CheckCircle2 } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { Button } from '@/components/ui/Button';
import { getDisciplinaryCases } from '@/lib/api/disciplinaryCase';
import { DISCIPLINARY_STATUS, type DisciplinaryCase } from '@/types/sanctions';

export default function SanctionsOverviewPage() {
    const [cases, setCases] = useState<DisciplinaryCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getDisciplinaryCases()
            .then(setCases)
            .catch(e => setError(e instanceof Error ? e.message : 'Erreur'))
            .finally(() => setLoading(false));
    }, []);

    const stats = useMemo(() => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        return {
            opened: cases.filter(c => c.status === DISCIPLINARY_STATUS.OPENED).length,
            hearing: cases.filter(c => c.status === DISCIPLINARY_STATUS.HEARING_SCHEDULED).length,
            decision: cases.filter(c => c.status === DISCIPLINARY_STATUS.DECISION_PENDING).length,
            appliedMonth: cases.filter(c => {
                if (c.status !== DISCIPLINARY_STATUS.SANCTION_APPLIED && c.status !== DISCIPLINARY_STATUS.CLOSED) return false;
                if (!c.appliedAt) return false;
                const d = new Date(c.appliedAt);
                return d.getMonth() === month && d.getFullYear() === year;
            }).length,
        };
    }, [cases]);

    if (loading) {
        return (
            <PageShell>
                <div className="flex justify-center p-24">
                    <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <PageHeader
                title="Sanctions & Discipline"
                description="Procédures disciplinaires conformes au Code du travail"
                actions={
                    <Link href="/m/sanctions/affaires/create">
                        <Button size="sm" className="gap-1.5">
                            <Plus className="h-4 w-4" /> Nouvelle affaire
                        </Button>
                    </Link>
                }
            />

            {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    <AlertCircle className="h-4 w-4" /> {error}
                </div>
            )}

            <PageKpiStrip
                items={[
                    { label: 'Ouvertes', value: stats.opened, icon: Gavel },
                    { label: 'En audience', value: stats.hearing, icon: Scale },
                    { label: 'À décider', value: stats.decision, icon: ClipboardList },
                    { label: 'Appliquées (mois)', value: stats.appliedMonth, icon: CheckCircle2 },
                ]}
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link
                    href="/m/sanctions/affaires"
                    className="rounded-xl border border-border-subtle bg-surface p-5 hover:border-primary-200 transition-colors"
                >
                    <p className="font-semibold text-secondary-900">Affaires disciplinaires</p>
                    <p className="mt-1 text-sm text-secondary-500">{cases.length} affaire(s) au total</p>
                </Link>
                <Link
                    href="/m/sanctions/echelles"
                    className="rounded-xl border border-border-subtle bg-surface p-5 hover:border-primary-200 transition-colors"
                >
                    <p className="font-semibold text-secondary-900">Échelles de sanctions</p>
                    <p className="mt-1 text-sm text-secondary-500">
                        Référentiel : Avertissement · Blâme · Suspension · Licenciement
                    </p>
                </Link>
            </div>
        </PageShell>
    );
}
