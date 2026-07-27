'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Loader2, AlertCircle, UserCheck, CheckCircle2, XCircle,
    PlayCircle, Clock, CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { getOnboardingProcessById, getOnboardingTasks, startOnboardingTask, completeOnboardingTask, cancelOnboardingTask, completeOnboardingProcess, cancelOnboardingProcess } from '@/lib/api/onboarding';
import { getEmployeeById } from '@/lib/api/employee';
import { OnboardingProcess, OnboardingTask, ONBOARDING_PROCESS_STATUS, ONBOARDING_PROCESS_STATUS_LABELS, ONBOARDING_TASK_STATUS, ONBOARDING_TASK_STATUS_LABELS, OnboardingProcessStatus, OnboardingTaskStatus, ONBOARDING_TASK_TYPE_LABELS, OnboardingTaskType } from '@/types/onboarding';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { OnboardingStatusBar } from '@/components/personnel/OnboardingStatusBar';
import { extractId } from '@/lib/api-iri';

function statusVariant(s: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    switch (s) {
        case ONBOARDING_PROCESS_STATUS.IN_PROGRESS: return 'warning';
        case ONBOARDING_PROCESS_STATUS.COMPLETED: return 'success';
        case ONBOARDING_PROCESS_STATUS.CANCELLED: return 'destructive';
        default: return 'secondary';
    }
}

function taskStatusVariant(s: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    switch (s) {
        case ONBOARDING_TASK_STATUS.IN_PROGRESS: return 'warning';
        case ONBOARDING_TASK_STATUS.COMPLETED: return 'success';
        case ONBOARDING_TASK_STATUS.CANCELLED: return 'destructive';
        default: return 'secondary';
    }
}

export default function OnboardingDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [process, setProcess] = useState<OnboardingProcess | null>(null);
    const [tasks, setTasks] = useState<OnboardingTask[]>([]);
    const [employeeName, setEmployeeName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [acting, setActing] = useState<string | null>(null);

    const load = async () => {
        try {
            setIsLoading(true);
            const p = await getOnboardingProcessById(id);
            setProcess(p);
            const [t] = await Promise.all([
                getOnboardingTasks(id),
                getEmployeeById(extractId(p.employee) || p.employee).then(e => setEmployeeName(`${e.firstName} ${e.lastName}`)).catch(() => {}),
            ]);
            setTasks(t);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur de chargement.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, [id]);

    const handleTaskAction = async (taskId: string, action: 'start' | 'complete' | 'cancel') => {
        try {
            setActing(taskId + action);
            if (action === 'start') await startOnboardingTask(taskId);
            else if (action === 'complete') await completeOnboardingTask(taskId);
            else await cancelOnboardingTask(taskId);
            toast.success('Tâche mise à jour.');
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setActing(null);
        }
    };

    const handleProcessAction = async (action: 'complete' | 'cancel') => {
        try {
            setActing('process' + action);
            if (action === 'complete') await completeOnboardingProcess(id);
            else await cancelOnboardingProcess(id);
            toast.success(action === 'complete' ? 'Processus terminé.' : 'Processus annulé.');
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setActing(null);
        }
    };

    if (isLoading) return <PageShell><div className="p-32 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div></PageShell>;
    if (error || !process) return <PageShell><div className="p-20 flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-rose-500" /><p>{error || 'Processus introuvable.'}</p></div></PageShell>;

    const completed = tasks.filter(t => t.status === ONBOARDING_TASK_STATUS.COMPLETED).length;
    const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    return (
        <PageShell>
            <PageHeader
                title={`Intégration — ${employeeName || process.employee}`}
                description="Détail du processus d'intégration"
                actions={
                    <Link href="/m/personnel/onboarding">
                        <Button variant="outline" size="sm" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />Retour
                        </Button>
                    </Link>
                }
            />

            <div className="p-4 bg-white rounded-2xl border border-secondary-100 shadow-sm">
                <OnboardingStatusBar
                    status={process.status}
                    loading={!!acting?.startsWith('process')}
                    onComplete={
                        process.status === ONBOARDING_PROCESS_STATUS.PENDING || process.status === ONBOARDING_PROCESS_STATUS.IN_PROGRESS
                            ? () => handleProcessAction('complete')
                            : undefined
                    }
                    onCancel={
                        process.status === ONBOARDING_PROCESS_STATUS.PENDING || process.status === ONBOARDING_PROCESS_STATUS.IN_PROGRESS
                            ? () => handleProcessAction('cancel')
                            : undefined
                    }
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-secondary-900">Tâches ({tasks.length})</h2>
                            <div className="flex items-center gap-2 text-sm text-secondary-600">
                                <span>{completed}/{tasks.length} terminées</span>
                                <div className="w-24 h-2 bg-secondary-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="font-semibold text-emerald-600">{progress}%</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {tasks.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-8">Aucune tâche dans ce processus.</p>
                            ) : tasks.map(t => (
                                <div key={t.id} className={cn('flex items-start gap-4 p-4 rounded-xl border transition-colors', t.status === ONBOARDING_TASK_STATUS.COMPLETED ? 'bg-emerald-50 border-emerald-100' : t.status === ONBOARDING_TASK_STATUS.CANCELLED ? 'bg-secondary-50 border-secondary-100 opacity-60' : 'bg-white border-secondary-200')}>
                                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', t.status === ONBOARDING_TASK_STATUS.COMPLETED ? 'bg-emerald-500 text-white' : t.status === ONBOARDING_TASK_STATUS.IN_PROGRESS ? 'bg-amber-500 text-white' : 'bg-secondary-200 text-secondary-500')}>
                                        {t.status === ONBOARDING_TASK_STATUS.COMPLETED ? <CheckCircle2 className="w-4 h-4" /> : t.status === ONBOARDING_TASK_STATUS.IN_PROGRESS ? <Clock className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-secondary-900">{t.title}</p>
                                            <Badge variant={taskStatusVariant(t.status as string)} className="text-xs">
                                                {ONBOARDING_TASK_STATUS_LABELS[t.status as OnboardingTaskStatus] || t.status}
                                            </Badge>
                                            {t.type && <span className="text-xs text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded-full">{ONBOARDING_TASK_TYPE_LABELS[t.type as OnboardingTaskType] || t.type}</span>}
                                        </div>
                                        {t.description && <p className="text-sm text-secondary-500 mt-1">{t.description}</p>}
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        {t.status === ONBOARDING_TASK_STATUS.PENDING && (
                                            <Button size="sm" variant="outline" onClick={() => handleTaskAction(t.id, 'start')} disabled={acting === t.id + 'start'}>
                                                {acting === t.id + 'start' ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                                            </Button>
                                        )}
                                        {t.status === ONBOARDING_TASK_STATUS.IN_PROGRESS && (
                                            <>
                                                <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleTaskAction(t.id, 'complete')} disabled={!!acting}>
                                                    {acting === t.id + 'complete' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => handleTaskAction(t.id, 'cancel')} disabled={!!acting}>
                                                    {acting === t.id + 'cancel' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card className="p-6">
                        <h3 className="font-bold text-secondary-900 mb-4 flex items-center gap-2"><UserCheck className="w-5 h-5 text-primary-500" />Informations</h3>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-secondary-500">Statut</dt>
                                <dd className="mt-1"><Badge variant={statusVariant(process.status as string)}>{ONBOARDING_PROCESS_STATUS_LABELS[process.status as OnboardingProcessStatus] || process.status}</Badge></dd>
                            </div>
                            <div>
                                <dt className="text-secondary-500">Employé</dt>
                                <dd className="font-semibold text-secondary-900 mt-1">{employeeName || process.employee}</dd>
                            </div>
                            {process.startedAt && (
                                <div>
                                    <dt className="text-secondary-500">Démarré le</dt>
                                    <dd className="font-medium text-secondary-800 mt-1">{format(new Date(process.startedAt), 'dd MMMM yyyy', { locale: fr })}</dd>
                                </div>
                            )}
                            {process.completedAt && (
                                <div>
                                    <dt className="text-secondary-500">Terminé le</dt>
                                    <dd className="font-medium text-secondary-800 mt-1">{format(new Date(process.completedAt), 'dd MMMM yyyy', { locale: fr })}</dd>
                                </div>
                            )}
                        </dl>
                    </Card>

                    {(process.status === ONBOARDING_PROCESS_STATUS.IN_PROGRESS || process.status === ONBOARDING_PROCESS_STATUS.PENDING) && (
                        <Card className="p-6">
                            <h3 className="font-bold text-secondary-900 mb-2">Astuce</h3>
                            <p className="text-sm text-secondary-500 leading-relaxed">
                                Démarrez et validez les tâches ci-contre. Utilisez la barre fléchée en haut pour <strong>terminer</strong> ou <strong>annuler</strong> tout le parcours.
                            </p>
                        </Card>
                    )}
                </div>
            </div>
        </PageShell>
    );
}
