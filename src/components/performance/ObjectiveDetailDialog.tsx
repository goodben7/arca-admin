'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2, PlayCircle, CheckCircle2, XCircle, Target, User, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Objective, OBJECTIVE_STATUS, OBJECTIVE_STATUS_LABELS, ObjectiveStatus } from '@/types/performance';
import { extractId } from '@/lib/api-iri';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function statusVariant(s: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    switch (s) {
        case OBJECTIVE_STATUS.ACTIVE: return 'warning';
        case OBJECTIVE_STATUS.COMPLETED: return 'success';
        case OBJECTIVE_STATUS.CANCELLED: return 'destructive';
        default: return 'secondary';
    }
}

interface ObjectiveDetailDialogProps {
    objective: Objective | null;
    onClose: () => void;
    empName: (ref: string) => string;
    cycleName: (ref?: string) => string;
    onAction?: (obj: Objective, action: 'activate' | 'complete' | 'cancel') => void;
    acting?: string | null;
}

function Field({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">{label}</dt>
            <dd className="text-sm text-secondary-800 mt-1">{value}</dd>
        </div>
    );
}

export function ObjectiveDetailDialog({
    objective,
    onClose,
    empName,
    cycleName,
    onAction,
    acting,
}: ObjectiveDetailDialogProps) {
    return (
        <Transition appear show={!!objective} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        {objective && (
                            <Dialog.Panel className="bg-white rounded-2xl shadow-float w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                                            <Target className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <Dialog.Title className="text-lg font-bold text-secondary-900 leading-tight">{objective.title}</Dialog.Title>
                                            <p className="text-xs font-mono text-secondary-400 mt-1">{objective.id}</p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center shrink-0">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant={statusVariant(objective.status as string)}>
                                        {OBJECTIVE_STATUS_LABELS[objective.status as ObjectiveStatus] || objective.status}
                                    </Badge>
                                    {objective.dueDate && (
                                        <span className="inline-flex items-center gap-1.5 text-xs text-secondary-500 bg-secondary-50 px-2.5 py-1 rounded-lg">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            {format(new Date(objective.dueDate), 'dd MMMM yyyy', { locale: fr })}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-xl border border-secondary-100 bg-secondary-50/60">
                                    <User className="w-4 h-4 text-secondary-400 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-secondary-900">{empName(objective.employee)}</p>
                                        <p className="text-xs text-secondary-500">{extractId(objective.employee)}</p>
                                    </div>
                                </div>

                                <dl className="grid grid-cols-1 gap-4 p-4 rounded-xl border border-secondary-100 bg-white">
                                    <Field label="Cycle d'évaluation" value={cycleName(objective.evaluationCycleId || objective.evaluationCycle)} />
                                    <Field label="Spécifique (S)" value={objective.specific} />
                                    <Field label="Mesurable (M)" value={objective.measurable} />
                                    <Field label="Valeur cible" value={objective.targetValue} />
                                    <Field label="Atteignable (A)" value={objective.achievable} />
                                    <Field label="Pertinent (R)" value={objective.relevant} />
                                    <Field label="Description" value={objective.description} />
                                </dl>

                                {onAction && (
                                    <div className="flex justify-end gap-2 pt-2 border-t border-secondary-100">
                                        {objective.status === OBJECTIVE_STATUS.DRAFT && (
                                            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onAction(objective, 'activate')} disabled={!!acting}>
                                                {acting === objective.id + 'activate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                                                Activer
                                            </Button>
                                        )}
                                        {objective.status === OBJECTIVE_STATUS.ACTIVE && (
                                            <>
                                                <Button size="sm" variant="outline" className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => onAction(objective, 'complete')} disabled={!!acting}>
                                                    {acting === objective.id + 'complete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                                    Marquer atteint
                                                </Button>
                                                <Button size="sm" variant="outline" className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => onAction(objective, 'cancel')} disabled={!!acting}>
                                                    {acting === objective.id + 'cancel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                                    Annuler
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </Dialog.Panel>
                        )}
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
