'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, LogOut, CheckCircle2, XCircle, PlayCircle, CheckSquare, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { getExitProcessById, getExitTasks, startExitTask, completeExitTask, cancelExitTask, startExitProcess, completeExitProcess } from '@/lib/api/offboarding';
import { getEmployeeById } from '@/lib/api/employee';
import { ExitProcess, ExitTask, EXIT_PROCESS_STATUS, EXIT_PROCESS_STATUS_LABELS, EXIT_TASK_STATUS, EXIT_TASK_STATUS_LABELS, ExitProcessStatus, ExitTaskStatus, EXIT_REASON_LABELS, ExitReason } from '@/types/offboarding';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function statusVariant(s: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    switch (s) {
        case EXIT_PROCESS_STATUS.IN_PROGRESS: return 'warning';
        case EXIT_PROCESS_STATUS.COMPLETED: return 'success';
        case EXIT_PROCESS_STATUS.CANCELLED: return 'destructive';
        default: return 'secondary';
    }
}

export default function OffboardingDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [process, setProcess] = useState<ExitProcess | null>(null);
    const [tasks, setTasks] = useState<ExitTask[]>([]);
    const [employeeName, setEmployeeName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [acting, setActing] = useState<string | null>(null);

    const load = async () => {
        try {
            setIsLoading(true);
            const p = await getExitProcessById(id);
            setProcess(p);
            const [t] = await Promise.all([
                getExitTasks(id),
                getEmployeeById(p.employee.replace('/api/employees/', '')).then(e => setEmployeeName(`${e.firstName} ${e.lastName}`)).catch(() => {}),
            ]);
            setTasks(t);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, [id]);

    const handleTaskAction = async (taskId: string, action: 'start' | 'complete' | 'cancel') => {
        try {
            setActing(taskId + action);
            if (action === 'start') await startExitTask(taskId);
            else if (action === 'complete') await completeExitTask(taskId);
            else await cancelExitTask(taskId);
            toast.success('Tâche mise à jour.');
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setActing(null);
        }
    };

    const handleProcessAction = async (action: 'start' | 'complete') => {
        try {
            setActing('process' + action);
            if (action === 'start') await startExitProcess(id);
            else await completeExitProcess(id);
            toast.success(action === 'start' ? 'Processus démarré.' : 'Processus terminé.');
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setActing(null);
        }
    };

    if (isLoading) return <PageShell><div className="p-32 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div></PageShell>;
    if (error || !process) return <PageShell><div className="p-20 flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-rose-500" /><p>{error || 'Processus introuvable.'}</p></div></PageShell>;

    const completed = tasks.filter(t => t.status === EXIT_TASK_STATUS.COMPLETED).length;
    const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    return (
        <PageShell>
            <PageHeader
                title={`Départ — ${employeeName || process.employee}`}
                description="Gestion du processus de sortie"
                actions={<Link href="/offboarding"><Button variant="outline" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" />Retour</Button></Link>}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-secondary-900">Tâches ({tasks.length})</h2>
                            {tasks.length > 0 && (
                                <div className="flex items-center gap-2 text-sm text-secondary-600">
                                    <span>{completed}/{tasks.length}</span>
                                    <div className="w-24 h-2 bg-secondary-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
                                    </div>
                                    <span className="font-semibold text-emerald-600">{progress}%</span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-3">
                            {tasks.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-8">Aucune tâche.</p>
                            ) : tasks.map(t => (
                                <div key={t.id} className={cn('flex items-start gap-4 p-4 rounded-xl border', t.status === EXIT_TASK_STATUS.COMPLETED ? 'bg-emerald-50 border-emerald-100' : t.status === EXIT_TASK_STATUS.CANCELLED ? 'bg-secondary-50 border-secondary-100 opacity-60' : 'bg-white border-secondary-200')}>
                                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', t.status === EXIT_TASK_STATUS.COMPLETED ? 'bg-emerald-500 text-white' : t.status === EXIT_TASK_STATUS.IN_PROGRESS ? 'bg-amber-500 text-white' : 'bg-secondary-200 text-secondary-500')}>
                                        {t.status === EXIT_TASK_STATUS.COMPLETED ? <CheckCircle2 className="w-4 h-4" /> : t.status === EXIT_TASK_STATUS.IN_PROGRESS ? <Clock className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-secondary-900">{t.title}</p>
                                            <Badge variant={statusVariant(t.status as string)} className="text-xs">
                                                {EXIT_TASK_STATUS_LABELS[t.status as ExitTaskStatus] || t.status}
                                            </Badge>
                                        </div>
                                        {t.description && <p className="text-sm text-secondary-500 mt-1">{t.description}</p>}
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        {t.status === EXIT_TASK_STATUS.PENDING && (
                                            <Button size="sm" variant="outline" onClick={() => handleTaskAction(t.id, 'start')} disabled={!!acting}>
                                                {acting === t.id + 'start' ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                                            </Button>
                                        )}
                                        {t.status === EXIT_TASK_STATUS.IN_PROGRESS && (
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
                        <h3 className="font-bold text-secondary-900 mb-4 flex items-center gap-2"><LogOut className="w-5 h-5 text-rose-500" />Informations</h3>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-secondary-500">Statut</dt>
                                <dd className="mt-1"><Badge variant={statusVariant(process.status as string)}>{EXIT_PROCESS_STATUS_LABELS[process.status as ExitProcessStatus] || process.status}</Badge></dd>
                            </div>
                            <div>
                                <dt className="text-secondary-500">Motif</dt>
                                <dd className="font-medium text-secondary-800 mt-1">{EXIT_REASON_LABELS[process.reason as ExitReason] || process.reason}</dd>
                            </div>
                            {process.departureDate && (
                                <div>
                                    <dt className="text-secondary-500">Date de départ</dt>
                                    <dd className="font-medium text-secondary-800 mt-1">{format(new Date(process.departureDate), 'dd MMMM yyyy', { locale: fr })}</dd>
                                </div>
                            )}
                        </dl>
                    </Card>

                    {process.status !== EXIT_PROCESS_STATUS.COMPLETED && process.status !== EXIT_PROCESS_STATUS.CANCELLED && (
                        <Card className="p-6">
                            <h3 className="font-bold text-secondary-900 mb-4">Actions</h3>
                            <div className="space-y-3">
                                {process.status === EXIT_PROCESS_STATUS.PENDING && (
                                    <Button variant="pill" size="sm" className="w-full gap-2" onClick={() => handleProcessAction('start')} disabled={!!acting}>
                                        {acting === 'processstart' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                                        Démarrer le processus
                                    </Button>
                                )}
                                {process.status === EXIT_PROCESS_STATUS.IN_PROGRESS && (
                                    <Button variant="pill" size="sm" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleProcessAction('complete')} disabled={!!acting}>
                                        {acting === 'processcomplete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Terminer le processus
                                    </Button>
                                )}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </PageShell>
    );
}
