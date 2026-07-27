'use client';

import Link from 'next/link';
import {
    AlertCircle, ArrowRight, CheckCircle2, Circle, Loader2, RefreshCw,
    Shield, Users, Building2, Rocket,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSetupProgress, type SetupStep } from '@/hooks/useSetupProgress';
import { cn } from '@/lib/utils';

const JOURNEYS = [
    {
        title: 'Recrutement',
        steps: ['Créer une demande', 'Approuver → offre générée', 'Publier l’offre', 'Traiter les candidatures', 'Embaucher'],
        href: '/m/recrutement/demandes/create',
    },
    {
        title: 'Congés',
        steps: ['Créer une demande', 'Valider ou refuser', 'Suivi dans Absences'],
        href: '/m/temps/leave/create',
    },
    {
        title: 'Formation',
        steps: ['Alimenter le référentiel', 'Planifier une séance', 'Inscrire des participants', 'Valider les demandes'],
        href: '/m/formation/catalog',
    },
    {
        title: 'Carrière',
        steps: ['Ouvrir un cycle d’évaluation', 'Créer des objectifs', 'Soumettre / valider les entretiens'],
        href: '/m/performance/cycles',
    },
    {
        title: 'Parcours collaborateur',
        steps: ['Créer l’employé', 'Contrat + documents', 'Intégration (backend)', 'Mobilité / sortie'],
        href: '/m/personnel/employees/create',
    },
];

function PhaseBlock({
    title,
    subtitle,
    icon: Icon,
    done,
    steps,
}: {
    title: string;
    subtitle: string;
    icon: typeof Building2;
    done: boolean;
    steps: SetupStep[];
}) {
    return (
        <Card className="p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-start gap-3">
                    <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        done ? 'bg-emerald-50 text-emerald-600' : 'bg-primary-50 text-primary-600',
                    )}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-secondary-900">{title}</h2>
                        <p className="text-sm text-secondary-500 mt-0.5">{subtitle}</p>
                    </div>
                </div>
                {done ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Terminé
                    </span>
                ) : (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                        À configurer
                    </span>
                )}
            </div>

            <div className="space-y-2">
                {steps.map(step => (
                    <Link
                        key={step.id}
                        href={step.href}
                        className={cn(
                            'flex items-center gap-3 p-3 rounded-xl border transition-colors group',
                            step.done
                                ? 'border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50'
                                : 'border-secondary-100 bg-white hover:border-primary-200 hover:bg-primary-50/30',
                        )}
                    >
                        {step.done ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                            <Circle className="w-5 h-5 text-secondary-300 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-secondary-900">{step.title}</p>
                            <p className="text-xs text-secondary-500 truncate">{step.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className={cn(
                                'text-sm font-semibold tabular-nums',
                                step.done ? 'text-emerald-700' : 'text-secondary-600',
                            )}>
                                {step.count}/{step.minCount}
                            </p>
                            <ArrowRight className="w-4 h-4 text-secondary-300 group-hover:text-primary-500 ml-auto mt-1" />
                        </div>
                    </Link>
                ))}
            </div>
        </Card>
    );
}

export default function ConfigurationPage() {
    const {
        loading, error, steps, foundationDone, securityDone, peopleDone,
        allDone, progressPercent, reload,
    } = useSetupProgress();

    const foundationSteps = steps.filter(s => s.phase === 'foundation');
    const securitySteps = steps.filter(s => s.phase === 'security');
    const peopleSteps = steps.filter(s => s.phase === 'people');

    return (
        <PageShell>
            <PageHeader
                title="Configuration initiale"
                description="Guide pas à pas pour paramétrer ARCA SIRH sur une instance vierge."
                actions={
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => reload()} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Actualiser
                    </Button>
                }
            />

            {error && (
                <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                </div>
            )}

            <Card className="p-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-secondary-900">
                            {allDone ? 'Plateforme prête pour les parcours opérationnels' : 'Configuration en cours'}
                        </p>
                        <p className="text-sm text-secondary-500 mt-1">
                            {allDone
                                ? 'Référentiels, sécurité et premiers dossiers sont en place.'
                                : 'Suivez les étapes dans l’ordre : référentiels → sécurité → collaborateurs.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-32 h-2 rounded-full bg-secondary-100 overflow-hidden">
                            <div
                                className="h-full bg-primary-500 transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <span className="text-sm font-bold text-primary-700 tabular-nums">{progressPercent}%</span>
                    </div>
                </div>
            </Card>

            {loading && steps.length === 0 ? (
                <div className="py-24 flex flex-col items-center gap-3 text-secondary-400">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                    <p className="text-sm">Analyse de la configuration…</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
                    <PhaseBlock
                        title="Phase 1 — Référentiels"
                        subtitle="Structure RH de base"
                        icon={Building2}
                        done={foundationDone}
                        steps={foundationSteps}
                    />
                    <PhaseBlock
                        title="Phase 2 — Sécurité"
                        subtitle="Accès et gouvernance"
                        icon={Shield}
                        done={securityDone}
                        steps={securitySteps}
                    />
                    <PhaseBlock
                        title="Phase 3 — Collaborateurs"
                        subtitle="Premiers dossiers RH"
                        icon={Users}
                        done={peopleDone}
                        steps={peopleSteps}
                    />
                </div>
            )}

            <div className="mb-4 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-secondary-900">Parcours opérationnels à tester</h2>
            </div>
            <p className="text-sm text-secondary-500 mb-6">
                Une fois la configuration de base terminée, enchaînez ces scénarios métier pour valider la plateforme.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {JOURNEYS.map(j => (
                    <Card key={j.title} className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <h3 className="font-semibold text-secondary-900">{j.title}</h3>
                            <Link href={j.href}>
                                <Button variant="ghost" size="sm" className="gap-1 text-primary-600">
                                    Démarrer <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                            </Link>
                        </div>
                        <ol className="space-y-1.5">
                            {j.steps.map((s, i) => (
                                <li key={s} className="flex items-start gap-2 text-sm text-secondary-600">
                                    <span className="text-xs font-bold text-secondary-400 mt-0.5 w-4">{i + 1}.</span>
                                    {s}
                                </li>
                            ))}
                        </ol>
                    </Card>
                ))}
            </div>
        </PageShell>
    );
}
