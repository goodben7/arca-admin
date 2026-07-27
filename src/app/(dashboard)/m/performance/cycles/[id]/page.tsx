'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Loader2, AlertCircle, BarChart3, CheckCircle2, XCircle, PlayCircle,
    Target, Plus, X, Send, Star, ExternalLink,
} from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
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
    createObjective, createPerformanceReview,
    submitPerformanceReview, validatePerformanceReview,
} from '@/lib/api/performance';
import { getAllEmployees } from '@/lib/api/employee';
import { extractId, cycleRefOf, matchesCycleId } from '@/lib/api-iri';
import { ObjectiveDetailDialog } from '@/components/performance/ObjectiveDetailDialog';
import {
    EvaluationCycle, PerformanceReview, Objective,
    EVALUATION_CYCLE_STATUS, EVALUATION_CYCLE_STATUS_LABELS, EvaluationCycleStatus,
    PERFORMANCE_REVIEW_STATUS, PERFORMANCE_REVIEW_STATUS_LABELS, PerformanceReviewStatus,
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

function reviewStatusVariant(s: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    switch (s) {
        case PERFORMANCE_REVIEW_STATUS.SUBMITTED: return 'warning';
        case PERFORMANCE_REVIEW_STATUS.VALIDATED: return 'success';
        default: return 'secondary';
    }
}

function formatScore(score: unknown): string {
    if (score == null || score === '') return '—';
    const n = Number(score);
    if (Number.isNaN(n)) return String(score);
    return Number.isInteger(n) ? `${n} / 5` : `${n.toFixed(1)} / 5`;
}

const EMPTY_OBJ_FORM = {
    employee: '',
    title: '',
    specific: '',
    measurable: '',
    targetValue: '',
    dueDate: '',
};

export default function EvaluationCycleDetailPage() {
    const params = useParams();
    const id = String(Array.isArray(params.id) ? params.id[0] : params.id || '');
    const [cycle, setCycle] = useState<EvaluationCycle | null>(null);
    const [reviews, setReviews] = useState<PerformanceReview[]>([]);
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [acting, setActing] = useState<string | null>(null);
    const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);

    const [objModalOpen, setObjModalOpen] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [objForm, setObjForm] = useState(EMPTY_OBJ_FORM);
    const [reviewForm, setReviewForm] = useState({ employee: '', reviewer: '', score: '', comment: '' });

    const load = async () => {
        if (!id) return;
        try {
            setIsLoading(true);
            const [c, allReviews, allObjectives, emps] = await Promise.all([
                getEvaluationCycleById(id),
                getPerformanceReviews().catch(() => []),
                getObjectives().catch(() => []),
                getAllEmployees({ itemsPerPage: 500 }).catch(() => []),
            ]);
            setCycle(c);
            const arr = Array.isArray(emps) ? emps : (emps as any)['hydra:member'] || [];
            setEmployees(arr);
            const cycleKey = c.id || id;
            setReviews(allReviews.filter(r => matchesCycleId(cycleRefOf(r), cycleKey)));
            setObjectives(allObjectives.filter(o => matchesCycleId(cycleRefOf(o), cycleKey)));
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

    const handleReviewAction = async (review: PerformanceReview, action: 'submit' | 'validate') => {
        try {
            setActing(review.id + action);
            if (action === 'submit') await submitPerformanceReview(review.id);
            else await validatePerformanceReview(review.id);
            toast.success(action === 'submit' ? 'Entretien soumis.' : 'Entretien validé.');
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

    const handleCreateObjective = async () => {
        if (!objForm.employee || !objForm.title.trim() || !objForm.specific.trim() || !objForm.measurable.trim() || !objForm.dueDate) {
            return toast.error('Employé, titre, Spécifique, Mesurable et échéance sont obligatoires.');
        }
        try {
            setCreating(true);
            await createObjective({
                employee: objForm.employee,
                evaluationCycleId: id,
                title: objForm.title.trim(),
                specific: objForm.specific.trim(),
                measurable: objForm.measurable.trim(),
                targetValue: objForm.targetValue.trim() || undefined,
                dueDate: objForm.dueDate,
            });
            toast.success('Objectif créé.');
            setObjModalOpen(false);
            setObjForm(EMPTY_OBJ_FORM);
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setCreating(false);
        }
    };

    const handleCreateReview = async () => {
        if (!reviewForm.employee) return toast.error('Sélectionnez un employé.');
        try {
            setCreating(true);
            await createPerformanceReview({
                employee: reviewForm.employee,
                evaluationCycleId: id,
                reviewer: reviewForm.reviewer || undefined,
                score: reviewForm.score ? Number(reviewForm.score) : undefined,
                comment: reviewForm.comment.trim() || undefined,
            });
            toast.success('Évaluation créée.');
            setReviewModalOpen(false);
            setReviewForm({ employee: '', reviewer: '', score: '', comment: '' });
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setCreating(false);
        }
    };

    if (isLoading) return <PageShell><div className="p-32 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div></PageShell>;
    if (error || !cycle) return <PageShell><div className="p-20 flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-rose-500" /><p>{error || 'Cycle introuvable.'}</p></div></PageShell>;

    const selectClass = 'w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500';
    const inputClass = selectClass;

    return (
        <PageShell>
            <PageHeader
                title={cycle.name}
                description={`Cycle d'évaluation${cycle.year ? ` — ${cycle.year}` : ''}`}
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="pill" size="sm" className="gap-2" onClick={() => setObjModalOpen(true)}>
                            <Plus className="w-4 h-4" />Objectif
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => setReviewModalOpen(true)}>
                            <Plus className="w-4 h-4" />Évaluation
                        </Button>
                        <Link href="/m/performance/cycles">
                            <Button variant="outline" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" />Retour</Button>
                        </Link>
                    </div>
                }
            />

            <PageKpiStrip items={[
                { label: 'Objectifs', value: objStats.total, icon: Target, tone: 'primary', detail: `${objStats.draft} brouillon(s)` },
                { label: 'En cours', value: objStats.active, icon: PlayCircle, tone: 'warning', detail: 'Objectifs actifs' },
                { label: 'Atteints', value: objStats.completed, icon: CheckCircle2, tone: 'success', detail: 'Objectifs réalisés' },
                { label: 'Évaluations', value: reviews.length, icon: BarChart3, tone: 'info', detail: `${reviews.filter(r => r.status === PERFORMANCE_REVIEW_STATUS.VALIDATED).length} validée(s)` },
            ]} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="overflow-hidden border border-secondary-100 shadow-sm">
                        <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between gap-3 bg-white">
                            <div>
                                <h2 className="font-bold text-secondary-900 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-primary-500" />
                                    Objectifs
                                </h2>
                                <p className="text-xs text-secondary-400 mt-0.5">{objectives.length} objectif(s) rattaché(s) à ce cycle</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={`/m/performance/objectifs?cycle=${id}`}>
                                    <Button variant="ghost" size="sm" className="text-primary-600 gap-1.5">
                                        Voir tout <ExternalLink className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setObjModalOpen(true)}>
                                    <Plus className="w-3.5 h-3.5" />Ajouter
                                </Button>
                            </div>
                        </div>
                        {objectives.length === 0 ? (
                            <div className="p-14 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-secondary-50 flex items-center justify-center mx-auto mb-3">
                                    <Target className="w-6 h-6 text-secondary-300" />
                                </div>
                                <p className="font-medium text-secondary-700">Aucun objectif</p>
                                <p className="text-sm text-secondary-400 mt-1 mb-4">Créez le premier objectif SMART pour ce cycle.</p>
                                <Button variant="outline" size="sm" onClick={() => setObjModalOpen(true)}>Créer un objectif</Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-secondary-50/50">
                                        <TableHead className="px-6">Objectif</TableHead>
                                        <TableHead className="px-6">Collaborateur</TableHead>
                                        <TableHead className="px-6">Statut</TableHead>
                                        <TableHead className="px-6">Échéance</TableHead>
                                        <TableHead className="px-6 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {objectives.map(o => (
                                        <TableRow
                                            key={o.id}
                                            className="cursor-pointer hover:bg-primary-50/30 transition-colors"
                                            onClick={() => setSelectedObjective(o)}
                                        >
                                            <TableCell className="px-6">
                                                <p className="font-semibold text-secondary-900">{o.title}</p>
                                                {(o.targetValue || o.measurable) && (
                                                    <p className="text-xs text-secondary-500 mt-1">
                                                        {o.targetValue ? `Cible : ${o.targetValue}` : `Mesurable : ${o.measurable}`}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-6">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center shrink-0 text-xs font-bold">
                                                        {empName(o.employee).split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-medium text-secondary-800">{empName(o.employee)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6">
                                                <Badge variant={objectiveStatusVariant(o.status as string)}>
                                                    {OBJECTIVE_STATUS_LABELS[o.status as ObjectiveStatus] || o.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-6 text-secondary-600 tabular-nums text-sm">
                                                {o.dueDate ? format(new Date(o.dueDate), 'dd MMM yyyy', { locale: fr }) : '—'}
                                            </TableCell>
                                            <TableCell className="px-6 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1.5">
                                                    {o.status === OBJECTIVE_STATUS.DRAFT && (
                                                        <Button size="sm" variant="outline" className="gap-1 text-xs h-8" onClick={() => handleObjectiveAction(o, 'activate')} disabled={!!acting}>
                                                            {acting === o.id + 'activate' ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                                                            Activer
                                                        </Button>
                                                    )}
                                                    {o.status === OBJECTIVE_STATUS.ACTIVE && (
                                                        <>
                                                            <Button size="sm" variant="outline" className="gap-1 text-xs h-8 text-emerald-600 border-emerald-200" onClick={() => handleObjectiveAction(o, 'complete')} disabled={!!acting}>
                                                                {acting === o.id + 'complete' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                                                Atteint
                                                            </Button>
                                                            <Button size="sm" variant="outline" className="gap-1 text-xs h-8 text-rose-600 border-rose-200" onClick={() => handleObjectiveAction(o, 'cancel')} disabled={!!acting}>
                                                                {acting === o.id + 'cancel' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                                            </Button>
                                                        </>
                                                    )}
                                                    {o.status === OBJECTIVE_STATUS.COMPLETED && (
                                                        <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Terminé
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </Card>

                    <Card className="overflow-hidden border border-secondary-100 shadow-sm">
                        <div className="px-6 py-4 border-b border-secondary-100 flex items-center justify-between gap-3 bg-white">
                            <div>
                                <h2 className="font-bold text-secondary-900 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-primary-500" />
                                    Évaluations
                                </h2>
                                <p className="text-xs text-secondary-400 mt-0.5">{reviews.length} entretien(s) de performance</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={`/m/performance/evaluations?cycle=${id}`}>
                                    <Button variant="ghost" size="sm" className="text-primary-600 gap-1.5">
                                        Voir tout <ExternalLink className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setReviewModalOpen(true)}>
                                    <Plus className="w-3.5 h-3.5" />Ajouter
                                </Button>
                            </div>
                        </div>
                        {reviews.length === 0 ? (
                            <div className="p-14 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-secondary-50 flex items-center justify-center mx-auto mb-3">
                                    <BarChart3 className="w-6 h-6 text-secondary-300" />
                                </div>
                                <p className="font-medium text-secondary-700">Aucune évaluation</p>
                                <p className="text-sm text-secondary-400 mt-1 mb-4">Lancez un entretien de performance pour un collaborateur.</p>
                                <Button variant="outline" size="sm" onClick={() => setReviewModalOpen(true)}>Créer une évaluation</Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-secondary-50/50">
                                        <TableHead className="px-6">Collaborateur</TableHead>
                                        <TableHead className="px-6">Évaluateur</TableHead>
                                        <TableHead className="px-6">Note</TableHead>
                                        <TableHead className="px-6">Commentaire</TableHead>
                                        <TableHead className="px-6">Statut</TableHead>
                                        <TableHead className="px-6 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reviews.map(r => {
                                        const score = r.score ?? r.overallRating;
                                        const comment = r.comment || r.comments;
                                        return (
                                            <TableRow key={r.id} className="hover:bg-primary-50/30 transition-colors">
                                                <TableCell className="px-6">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 text-xs font-bold">
                                                            {empName(r.employee).split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-secondary-900">{empName(r.employee)}</p>
                                                            <p className="text-[10px] font-mono text-secondary-400">{r.id}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 text-sm text-secondary-600">
                                                    {r.reviewer ? empName(r.reviewer) : <span className="text-secondary-400">Non assigné</span>}
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary-900 tabular-nums">
                                                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                        {formatScore(score)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-6 max-w-[200px]">
                                                    <p className="text-sm text-secondary-600 truncate" title={comment || undefined}>
                                                        {comment || <span className="text-secondary-400">—</span>}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <Badge variant={reviewStatusVariant(r.status as string)}>
                                                        {PERFORMANCE_REVIEW_STATUS_LABELS[r.status as PerformanceReviewStatus] || r.status}
                                                    </Badge>
                                                    {r.validatedAt && (
                                                        <p className="text-[10px] text-secondary-400 mt-1">
                                                            {format(new Date(r.validatedAt), 'dd MMM yyyy', { locale: fr })}
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-6 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        {r.status === PERFORMANCE_REVIEW_STATUS.DRAFT && (
                                                            <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => handleReviewAction(r, 'submit')} disabled={!!acting}>
                                                                {acting === r.id + 'submit' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                                                Soumettre
                                                            </Button>
                                                        )}
                                                        {r.status === PERFORMANCE_REVIEW_STATUS.SUBMITTED && (
                                                            <Button size="sm" variant="pill" className="h-8 text-xs gap-1" onClick={() => handleReviewAction(r, 'validate')} disabled={!!acting}>
                                                                {acting === r.id + 'validate' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                                                Valider
                                                            </Button>
                                                        )}
                                                        {r.status === PERFORMANCE_REVIEW_STATUS.VALIDATED && (
                                                            <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
                                                                <CheckCircle2 className="w-3.5 h-3.5" /> Clôturée
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card className="p-6 border border-secondary-100 shadow-sm">
                        <h3 className="font-bold text-secondary-900 mb-4">Informations</h3>
                        <dl className="space-y-4 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <dt className="text-secondary-500">Statut</dt>
                                <dd><Badge variant={cycleStatusVariant(cycle.status as string)}>{EVALUATION_CYCLE_STATUS_LABELS[cycle.status as EvaluationCycleStatus] || cycle.status}</Badge></dd>
                            </div>
                            {cycle.year != null && (
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-secondary-500">Année</dt>
                                    <dd className="font-semibold text-secondary-900">{cycle.year}</dd>
                                </div>
                            )}
                            {cycle.startDate && (
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-secondary-500">Début</dt>
                                    <dd className="font-medium text-secondary-800 tabular-nums">{format(new Date(cycle.startDate), 'dd MMM yyyy', { locale: fr })}</dd>
                                </div>
                            )}
                            {cycle.endDate && (
                                <div className="flex items-center justify-between gap-3">
                                    <dt className="text-secondary-500">Fin</dt>
                                    <dd className="font-medium text-secondary-800 tabular-nums">{format(new Date(cycle.endDate), 'dd MMM yyyy', { locale: fr })}</dd>
                                </div>
                            )}
                            {cycle.description && (
                                <div className="pt-2 border-t border-secondary-100">
                                    <dt className="text-secondary-500 mb-1">Description</dt>
                                    <dd className="text-secondary-700 leading-relaxed">{cycle.description}</dd>
                                </div>
                            )}
                        </dl>
                    </Card>

                    <Card className="p-6 border border-secondary-100 shadow-sm">
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
                                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Cycle clôturé</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-secondary-100 space-y-2">
                                <Link href={`/m/performance/objectifs?cycle=${id}`} className="block">
                                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-secondary-600">
                                        <Target className="w-4 h-4" /> Tous les objectifs
                                    </Button>
                                </Link>
                                <Link href={`/m/performance/evaluations?cycle=${id}`} className="block">
                                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-secondary-600">
                                        <BarChart3 className="w-4 h-4" /> Toutes les évaluations
                                    </Button>
                                </Link>
                            </div>
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

            <Transition appear show={objModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => !creating && setObjModalOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="bg-white rounded-2xl shadow-float w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                                <div className="flex items-start justify-between gap-3">
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">Nouvel objectif</Dialog.Title>
                                    <button type="button" onClick={() => setObjModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-secondary-500">Rattaché au cycle <span className="font-semibold text-secondary-800">{cycle.name}</span></p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Employé *</label>
                                        <select value={objForm.employee} onChange={e => setObjForm(p => ({ ...p, employee: e.target.value }))} className={selectClass}>
                                            <option value="">Sélectionner...</option>
                                            {employees.map((e: any) => (
                                                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Titre *</label>
                                        <input value={objForm.title} onChange={e => setObjForm(p => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="Ex: Améliorer le reporting mensuel" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Spécifique (S) *</label>
                                        <textarea value={objForm.specific} onChange={e => setObjForm(p => ({ ...p, specific: e.target.value }))} className={`${inputClass} h-20 py-2`} rows={3} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Mesurable (M) *</label>
                                        <textarea value={objForm.measurable} onChange={e => setObjForm(p => ({ ...p, measurable: e.target.value }))} className={`${inputClass} h-20 py-2`} rows={3} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Valeur cible</label>
                                            <input value={objForm.targetValue} onChange={e => setObjForm(p => ({ ...p, targetValue: e.target.value }))} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Échéance *</label>
                                            <input type="date" value={objForm.dueDate} onChange={e => setObjForm(p => ({ ...p, dueDate: e.target.value }))} className={inputClass} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="outline" size="sm" onClick={() => setObjModalOpen(false)} disabled={creating}>Annuler</Button>
                                    <Button variant="pill" size="sm" onClick={handleCreateObjective} disabled={creating} className="gap-2">
                                        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        Créer
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>

            <Transition appear show={reviewModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => !creating && setReviewModalOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="bg-white rounded-2xl shadow-float w-full max-w-md p-6 space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">Nouvelle évaluation</Dialog.Title>
                                    <button type="button" onClick={() => setReviewModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Collaborateur *</label>
                                        <select value={reviewForm.employee} onChange={e => setReviewForm(p => ({ ...p, employee: e.target.value }))} className={selectClass}>
                                            <option value="">Sélectionner...</option>
                                            {employees.map((e: any) => (
                                                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Évaluateur</label>
                                        <select value={reviewForm.reviewer} onChange={e => setReviewForm(p => ({ ...p, reviewer: e.target.value }))} className={selectClass}>
                                            <option value="">Optionnel...</option>
                                            {employees.map((e: any) => (
                                                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Note</label>
                                        <input type="number" min={0} max={5} step={0.5} value={reviewForm.score} onChange={e => setReviewForm(p => ({ ...p, score: e.target.value }))} className={inputClass} placeholder="0 – 5" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Commentaire</label>
                                        <textarea value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))} className={`${inputClass} h-24 py-2`} rows={3} />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="outline" size="sm" onClick={() => setReviewModalOpen(false)} disabled={creating}>Annuler</Button>
                                    <Button variant="pill" size="sm" onClick={handleCreateReview} disabled={creating} className="gap-2">
                                        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        Créer
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </PageShell>
    );
}
