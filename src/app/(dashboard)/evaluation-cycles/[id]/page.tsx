'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Loader2, AlertCircle, BarChart3, CheckCircle2, XCircle, PlayCircle,
    Target, User, CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import {
    getEvaluationCycleById, openEvaluationCycle, closeEvaluationCycle,
    getPerformanceReviews, getObjectives, activateObjective, completeObjective, cancelObjective,
} from '@/lib/api/performance';
import { getAllEmployees } from '@/lib/api/employee';
import { extractId } from '@/lib/api-iri';
import { ObjectiveDetailDialog } from '@/components/performance/ObjectiveDetailDialog';
import {
    EvaluationCycle, PerformanceReview, Objective,
    EVALUATION_CYCLE_STATUS, EVALUATION_CYCLE_STATUS_LABELS, EvaluationCycleStatus,
    PERFORMANCE_REVIEW_STATUS_LABELS, PerformanceReviewStatus,
    OBJECTIVE_STATUS, OBJECTIVE_STATUS_LABELS, ObjectiveStatus,
} from '@/types/performance';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function cycleStatusVariant(s: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    switch (s) {
        case EVALUATION_CYCLE_STATUS.OPEN: return 'success';
        case EVALUATION_CYCLE_STATUS.CLOSED: return 'secondary';
        default: return 'default';
    }
}

function objectiveStatusVariant(s: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    switch (s) {
        case OBJECTIVE_STATUS.ACTIVE: return 'warning';
        case OBJECTIVE_STATUS.COMPLETED: return 'success';
        case OBJECTIVE_STATUS.CANCELLED: return 'destructive';
        default: return 'secondary';
    }
}

export default function EvaluationCycleDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [cycle, setCycle] = useState<EvaluationCycle | null>(null);
    const [reviews, setReviews] = useState<PerformanceReview[]>([]);
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [acting, setActing] = useState<string | null>(null);
    const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);

    const load = async () => {
        try {
            setIsLoading(true);
            const [c, r, allObjectives, emps] = await Promise.all([
                getEvaluationCycleById(id),
                getPerformanceReviews({ evaluationCycle: `/api/evaluation_cycles/${id}` }).catch(() => []),
                getObjectives({ evaluationCycle: id }).catch(() => getObjectives()),
                getAllEmployees({ itemsPerPage: 500 }).catch(() => []),
            ]);
            setCycle(c);
            setReviews(r);
            const arr = Array.isArray(emps) ? emps : (emps as any)['hydra:member'] || [];
            setEmployees(arr);
            const filtered = allObjectives.filter(o =>
                extractId(o.evaluationCycleId || o.evaluationCycle) === id
            );
            setObjectives(filtered);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, [id]);

    const empName = (ref: string) => {
        const eid = extractId(ref) || ref;
        const e = employees.find((x: any) => x.id === eid || x['@id'] === ref);
        return e ? `${e.firstName} ${e.lastName}` : eid;
    };

    const objStats = useMemo(() => ({
        total: objectives.length,
        active: objectives.filter(o => o.status === OBJECTIVE_STATUS.ACTIVE).length,
        completed: objectives.filter(o => o.status === OBJECTIVE_STATUS.COMPLETED).length,
        draft: objectives.filter(o => o.status === OBJECTIVE_STATUS.DRAFT).length,
    }), [objectives]);

    const handleCycleAction = async (action: 'open' | 'close') => {
        try {
            setActing(action);
            if (action === 'open') await openEvaluationCycle(id);
            else await closeEvaluationCycle(id);
            toast.success(action === 'open' ? 'Cycle ouvert.' : 'Cycle clôturé.');
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setActing(null);
        }
    };

    const handleObjectiveAction = async (obj: Objective, action: 'activate' | 'complete' | 'cancel') => {
        try {
            setActing(obj.id + action);
            if (action === 'activate') await activateObjective(obj.id);
            else if (action === 'complete') await completeObjective(obj.id);
            else await cancelObjective(obj.id);
            toast.success('Objectif mis à jour.');
            setSelectedObjective(null);
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setActing(null);
        }
    };

    if (isLoading) return <PageShell><div className="p-32 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div></PageShell>;
    if (error || !cycle) return <PageShell><div className="p-20 flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-rose-500" /><p>{error || 'Cycle introuvable.'}</p></div></PageShell>;

    return (
        <PageShell>
            <PageHeader
                title={cycle.name}
                description={`Cycle d'évaluation${cycle.year ? ` — ${cycle.year}` : ''}`}
                actions={
                    <div className="flex items-center gap-2">
                        <Link href="/objectives">
                            <Button variant="outline" size="sm" className="gap-2"><Target className="w-4 h-4" />Objectifs</Button>
                        </Link>
                        <Link href="/evaluation-cycles">
                            <Button variant="outline" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" />Retour</Button>
                        </Link>
                    </div>
                }
            />

            <PageKpiStrip items={[
                { label: 'Objectifs', value: objStats.total, icon: Target, tone: 'primary', detail: 'Dans ce cycle' },
                { label: 'Actifs', value: objStats.active, icon: PlayCircle, tone: 'warning', detail: 'En cours' },
                { label: 'Atteints', value: objStats.completed, icon: CheckCircle2, tone: 'success', detail: 'Réalisés' },
                { label: 'Évaluations', value: reviews.length, icon: BarChart3, tone: 'info', detail: 'Performance reviews' },
            ]} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="overflow-hidden">
                        <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
                            <h2 className="font-bold text-secondary-900 flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary-500" />
                                Objectifs du cycle ({objectives.length})
                            </h2>
                            <Link href="/objectives">
                                <Button variant="ghost" size="sm" className="text-primary-600">Voir tout</Button>
                            </Link>
                        </div>
                        {objectives.length === 0 ? (
                            <div className="p-12 text-center">
                                <Target className="w-10 h-10 text-secondary-200 mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm">Aucun objectif rattaché à ce cycle.</p>
                                <Link href="/objectives" className="inline-block mt-4">
                                    <Button variant="outline" size="sm">Créer un objectif</Button>
                                </Link>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="px-6">Titre</TableHead>
                                        <TableHead className="px-6">Employé</TableHead>
                                        <TableHead className="px-6">Statut</TableHead>
                                        <TableHead className="px-6">Échéance</TableHead>
                                        <TableHead className="px-6 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {objectives.map(o => (
                                        <TableRow
                                            key={o.id}
                                            className="cursor-pointer hover:bg-secondary-50/60"
                                            onClick={() => setSelectedObjective(o)}
                                        >
                                            <TableCell className="px-6">
                                                <p className="font-semibold text-secondary-900">{o.title}</p>
                                                {o.measurable && (
                                                    <p className="text-xs text-secondary-500 mt-0.5 truncate max-w-[200px]">M: {o.measurable}</p>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-secondary-100 flex items-center justify-center shrink-0">
                                                        <User className="w-3.5 h-3.5 text-secondary-500" />
                                                    </div>
                                                    <span className="text-sm text-secondary-700">{empName(o.employee)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6">
                                                <Badge variant={objectiveStatusVariant(o.status as string)}>
                                                    {OBJECTIVE_STATUS_LABELS[o.status as ObjectiveStatus] || o.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 text-secondary-500 tabular-nums text-sm">
                                                {o.dueDate ? (
                                                    <span className="inline-flex items-center gap-1">
                                                        <CalendarDays className="w-3.5 h-3.5" />
                                                        {format(new Date(o.dueDate), 'dd MMM yyyy', { locale: fr })}
                                                    </span>
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell className="px-6 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1.5">
                                                    {o.status === OBJECTIVE_STATUS.DRAFT && (
                                                        <Button size="sm" variant="outline" className="gap-1 text-xs h-8" onClick={() => handleObjectiveAction(o, 'activate')} disabled={!!acting}>
                                                            {acting === o.id + 'activate' ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                                                        </Button>
                                                    )}
                                                    {o.status === OBJECTIVE_STATUS.ACTIVE && (
                                                        <>
                                                            <Button size="sm" variant="outline" className="gap-1 text-xs h-8 text-emerald-600" onClick={() => handleObjectiveAction(o, 'complete')} disabled={!!acting}>
                                                                {acting === o.id + 'complete' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                                            </Button>
                                                            <Button size="sm" variant="outline" className="gap-1 text-xs h-8 text-rose-600" onClick={() => handleObjectiveAction(o, 'cancel')} disabled={!!acting}>
                                                                {acting === o.id + 'cancel' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </Card>

                    <Card className="p-6">
                        <h2 className="font-bold text-secondary-900 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary-500" />
                            Évaluations de performance ({reviews.length})
                        </h2>
                        {reviews.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-6">Aucune évaluation pour ce cycle.</p>
                        ) : (
                            <div className="space-y-2">
                                {reviews.map(r => (
                                    <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border border-secondary-100 bg-secondary-50">
                                        <div>
                                            <p className="font-medium text-secondary-900 text-sm">{empName(r.employee)}</p>
                                            {r.overallRating != null && <p className="text-xs text-secondary-500">Note : {r.overallRating}/5</p>}
                                        </div>
                                        <Badge variant="secondary">{PERFORMANCE_REVIEW_STATUS_LABELS[r.status as PerformanceReviewStatus] || r.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card className="p-6">
                        <h3 className="font-bold text-secondary-900 mb-4">Informations</h3>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-secondary-500">Statut</dt>
                                <dd className="mt-1"><Badge variant={cycleStatusVariant(cycle.status as string)}>{EVALUATION_CYCLE_STATUS_LABELS[cycle.status as EvaluationCycleStatus] || cycle.status}</Badge></dd>
                            </div>
                            {cycle.year != null && (
                                <div>
                                    <dt className="text-secondary-500">Année</dt>
                                    <dd className="font-medium text-secondary-800 mt-1">{cycle.year}</dd>
                                </div>
                            )}
                            {cycle.startDate && (
                                <div>
                                    <dt className="text-secondary-500">Début</dt>
                                    <dd className="font-medium text-secondary-800 mt-1">{format(new Date(cycle.startDate), 'dd MMMM yyyy', { locale: fr })}</dd>
                                </div>
                            )}
                            {cycle.endDate && (
                                <div>
                                    <dt className="text-secondary-500">Fin</dt>
                                    <dd className="font-medium text-secondary-800 mt-1">{format(new Date(cycle.endDate), 'dd MMMM yyyy', { locale: fr })}</dd>
                                </div>
                            )}
                            {cycle.description && (
                                <div>
                                    <dt className="text-secondary-500">Description</dt>
                                    <dd className="text-secondary-700 mt-1">{cycle.description}</dd>
                                </div>
                            )}
                        </dl>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-bold text-secondary-900 mb-4">Actions</h3>
                        <div className="space-y-3">
                            {cycle.status === EVALUATION_CYCLE_STATUS.DRAFT && (
                                <Button variant="pill" size="sm" className="w-full gap-2" onClick={() => handleCycleAction('open')} disabled={!!acting}>
                                    {acting === 'open' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                                    Ouvrir le cycle
                                </Button>
                            )}
                            {cycle.status === EVALUATION_CYCLE_STATUS.OPEN && (
                                <Button variant="outline" size="sm" className="w-full gap-2 text-secondary-700" onClick={() => handleCycleAction('close')} disabled={!!acting}>
                                    {acting === 'close' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Clôturer le cycle
                                </Button>
                            )}
                            {cycle.status === EVALUATION_CYCLE_STATUS.CLOSED && (
                                <div className="flex items-center gap-2 text-emerald-600 text-sm">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Cycle clôturé</span>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            <ObjectiveDetailDialog
                objective={selectedObjective}
                onClose={() => setSelectedObjective(null)}
                empName={empName}
                cycleName={() => cycle.name}
                onAction={handleObjectiveAction}
                acting={acting}
            />
        </PageShell>
    );
}
