'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, BarChart3, CheckCircle2, XCircle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { getEvaluationCycleById, openEvaluationCycle, closeEvaluationCycle, getPerformanceReviews } from '@/lib/api/performance';
import { EvaluationCycle, PerformanceReview, EVALUATION_CYCLE_STATUS, EVALUATION_CYCLE_STATUS_LABELS, EvaluationCycleStatus, PERFORMANCE_REVIEW_STATUS_LABELS, PerformanceReviewStatus } from '@/types/performance';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function statusVariant(s: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    switch (s) {
        case EVALUATION_CYCLE_STATUS.OPEN: return 'success';
        case EVALUATION_CYCLE_STATUS.CLOSED: return 'secondary';
        default: return 'default';
    }
}

export default function EvaluationCycleDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [cycle, setCycle] = useState<EvaluationCycle | null>(null);
    const [reviews, setReviews] = useState<PerformanceReview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [acting, setActing] = useState<string | null>(null);

    const load = async () => {
        try {
            setIsLoading(true);
            const [c, r] = await Promise.all([
                getEvaluationCycleById(id),
                getPerformanceReviews({ evaluationCycle: `/api/evaluation_cycles/${id}` }).catch(() => []),
            ]);
            setCycle(c);
            setReviews(r);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, [id]);

    const handleAction = async (action: 'open' | 'close') => {
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

    if (isLoading) return <PageShell><div className="p-32 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div></PageShell>;
    if (error || !cycle) return <PageShell><div className="p-20 flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-rose-500" /><p>{error || 'Cycle introuvable.'}</p></div></PageShell>;

    return (
        <PageShell>
            <PageHeader
                title={cycle.name}
                description="Détail du cycle d'évaluation"
                actions={
                    <Link href="/evaluation-cycles">
                        <Button variant="outline" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" />Retour</Button>
                    </Link>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="p-6">
                        <h2 className="font-bold text-secondary-900 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary-500" />
                            Évaluations ({reviews.length})
                        </h2>
                        {reviews.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-8">Aucune évaluation pour ce cycle.</p>
                        ) : (
                            <div className="space-y-2">
                                {reviews.map(r => (
                                    <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border border-secondary-100 bg-secondary-50">
                                        <div>
                                            <p className="font-medium text-secondary-900 text-sm">{r.employee}</p>
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
                                <dd className="mt-1"><Badge variant={statusVariant(cycle.status as string)}>{EVALUATION_CYCLE_STATUS_LABELS[cycle.status as EvaluationCycleStatus] || cycle.status}</Badge></dd>
                            </div>
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
                                <Button variant="pill" size="sm" className="w-full gap-2" onClick={() => handleAction('open')} disabled={!!acting}>
                                    {acting === 'open' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                                    Ouvrir le cycle
                                </Button>
                            )}
                            {cycle.status === EVALUATION_CYCLE_STATUS.OPEN && (
                                <Button variant="outline" size="sm" className="w-full gap-2 text-secondary-700" onClick={() => handleAction('close')} disabled={!!acting}>
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
        </PageShell>
    );
}
