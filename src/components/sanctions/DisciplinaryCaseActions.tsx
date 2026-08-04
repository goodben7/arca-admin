'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, PlayCircle, CalendarClock, Gavel, FileCheck, Ban } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Input';
import {
    applyDisciplinaryCase,
    cancelDisciplinaryCase,
    closeDisciplinaryCase,
    decideDisciplinaryCase,
    openDisciplinaryCase,
    rejectDisciplinaryCase,
    scheduleHearing,
} from '@/lib/api/disciplinaryCase';
import {
    DISCIPLINARY_STATUS,
    type DisciplinaryCase,
    type SanctionScale,
} from '@/types/sanctions';
import { toast } from '@/lib/toast';
import { getAbout } from '@/lib/api/auth';
import type { AuthUser } from '@/types/auth';
import { canActOnDisciplinaryCase } from '@/lib/permissions';

interface DisciplinaryCaseActionsProps {
    caseData: DisciplinaryCase;
    scale: SanctionScale | null;
    onUpdated: () => void;
}

export function DisciplinaryCaseActions({ caseData, scale, onUpdated }: DisciplinaryCaseActionsProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [acting, setActing] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [hearingAt, setHearingAt] = useState('');
    const [showReject, setShowReject] = useState(false);
    const [showHearing, setShowHearing] = useState(false);
    const [showApply, setShowApply] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const status = caseData.status;
    const requiresHearing = scale?.requiresHearing ?? false;
    const code = scale?.code?.toUpperCase() ?? '';

    useEffect(() => {
        getAbout().then(setUser).catch(() => setUser(null));
    }, []);

    const can = (action: string) => canActOnDisciplinaryCase(user, action);

    async function run(key: string, fn: () => Promise<unknown>, successMsg: string) {
        try {
            setActing(key);
            await fn();
            toast.success(successMsg);
            setShowReject(false);
            setShowHearing(false);
            setShowApply(false);
            setReason('');
            onUpdated();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setActing(null);
        }
    }

    if ([DISCIPLINARY_STATUS.CLOSED, DISCIPLINARY_STATUS.CANCELLED, DISCIPLINARY_STATUS.REJECTED].includes(status as any)) {
        return (
            <div className="flex flex-col items-center text-center py-4 px-2">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-500">
                    <CheckCircle2 className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">Aucune action</p>
                <p className="mt-1 text-xs text-secondary-500">Affaire terminale — workflow clos.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {status === DISCIPLINARY_STATUS.DRAFT && (
                    <>
                        {can('open') && (
                            <Button
                                size="sm"
                                className="gap-1.5"
                                disabled={!!acting}
                                onClick={() => run('open', () => openDisciplinaryCase(caseData.id), 'Affaire ouverte. Événement journey enregistré.')}
                            >
                                {acting === 'open' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                                Ouvrir
                            </Button>
                        )}
                        {can('cancel') && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                                disabled={!!acting}
                                onClick={() => run('cancel', () => cancelDisciplinaryCase(caseData.id), 'Affaire annulée.')}
                            >
                                {acting === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                                Annuler
                            </Button>
                        )}
                    </>
                )}

                {status === DISCIPLINARY_STATUS.OPENED && requiresHearing && can('hearing') && (
                    <Button size="sm" className="gap-1.5" disabled={!!acting} onClick={() => setShowHearing(true)}>
                        <CalendarClock className="h-4 w-4" />
                        Planifier l’audience
                    </Button>
                )}

                {status === DISCIPLINARY_STATUS.OPENED && !requiresHearing && can('decide') && (
                    <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={!!acting}
                        onClick={() => run('decide', () => decideDisciplinaryCase(caseData.id), 'Décision enregistrée.')}
                    >
                        {acting === 'decide' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />}
                        Passer en décision
                    </Button>
                )}

                {status === DISCIPLINARY_STATUS.HEARING_SCHEDULED && (
                    <>
                        {can('decide') && (
                            <Button
                                size="sm"
                                className="gap-1.5"
                                disabled={!!acting}
                                onClick={() => run('decide', () => decideDisciplinaryCase(caseData.id, reason || undefined), 'Décision enregistrée.')}
                            >
                                {acting === 'decide' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />}
                                Décider
                            </Button>
                        )}
                        {can('reject') && (
                            <Button size="sm" variant="outline" className="gap-1.5 text-rose-600" onClick={() => setShowReject(true)}>
                                <XCircle className="h-4 w-4" /> Rejeter
                            </Button>
                        )}
                    </>
                )}

                {status === DISCIPLINARY_STATUS.DECISION_PENDING && (
                    <>
                        {can('apply') && (
                            <Button size="sm" className="gap-1.5" onClick={() => setShowApply(true)}>
                                <FileCheck className="h-4 w-4" /> Appliquer la sanction
                            </Button>
                        )}
                        {can('reject') && (
                            <Button size="sm" variant="outline" className="gap-1.5 text-rose-600" onClick={() => setShowReject(true)}>
                                <XCircle className="h-4 w-4" /> Rejeter
                            </Button>
                        )}
                    </>
                )}

                {status === DISCIPLINARY_STATUS.SANCTION_APPLIED && can('close') && (
                    <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={!!acting}
                        onClick={() => run('close', () => closeDisciplinaryCase(caseData.id), 'Affaire clôturée.')}
                    >
                        {acting === 'close' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Clôturer
                    </Button>
                )}
            </div>

            {showHearing && (
                <div className="rounded-xl border border-border-subtle bg-muted/40 p-4 space-y-3">
                    <Label>Date et heure de l’audience</Label>
                    <input
                        type="datetime-local"
                        value={hearingAt}
                        onChange={e => setHearingAt(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm"
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowHearing(false)}>Annuler</Button>
                        <Button
                            size="sm"
                            disabled={!hearingAt || !!acting}
                            onClick={() => {
                                const iso = new Date(hearingAt).toISOString();
                                run('hearing', () => scheduleHearing(caseData.id, iso), 'Audience planifiée.');
                            }}
                        >
                            {acting === 'hearing' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Confirmer
                        </Button>
                    </div>
                </div>
            )}

            {showReject && (
                <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 space-y-3">
                    <Label>Motif du rejet</Label>
                    <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Raison…" />
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowReject(false)}>Annuler</Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            disabled={!!acting}
                            onClick={() => run('reject', () => rejectDisciplinaryCase(caseData.id, reason || undefined), 'Affaire rejetée.')}
                        >
                            {acting === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            Confirmer le rejet
                        </Button>
                    </div>
                </div>
            )}

            {showApply && (
                <div className="rounded-xl border border-border-subtle bg-muted/40 p-4 space-y-3">
                    <p className="text-sm text-secondary-600">
                        L’application déclenchera les effets liés à l’échelle
                        {code ? ` (${code})` : ''}
                        {code === 'SUSPEND' && ' — suspension de l’employé'}
                        {code === 'DISMISS' && ' — processus de sortie automatique'}
                        {(code === 'WARN' || code === 'BLAME') && ' — lettre d’avertissement'}
                        .
                    </p>
                    {(code === 'WARN' || code === 'BLAME' || !code) && (
                        <div>
                            <Label>Lettre (optionnel)</Label>
                            <input ref={fileRef} type="file" accept=".pdf,image/*" className="mt-1 block w-full text-sm" />
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowApply(false)}>Annuler</Button>
                        <Button
                            size="sm"
                            disabled={!!acting}
                            onClick={() => {
                                const file = fileRef.current?.files?.[0] ?? null;
                                run('apply', () => applyDisciplinaryCase(caseData.id, file), applyToast(code));
                            }}
                        >
                            {acting === 'apply' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
                            Appliquer
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function applyToast(code: string): string {
    const parts = ['Sanction appliquée.'];
    if (code === 'SUSPEND') parts.push('L’employé a été suspendu.');
    if (code === 'DISMISS') parts.push('Processus de sortie (licenciement) démarré.');
    if (code === 'WARN' || code === 'BLAME') parts.push('Lettre d’avertissement enregistrée.');
    parts.push('Consultez le journey employé pour la timeline.');
    return parts.join(' ');
}
