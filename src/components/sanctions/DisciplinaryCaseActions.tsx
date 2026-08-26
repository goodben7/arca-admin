'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Loader2,
    CheckCircle2,
    XCircle,
    PlayCircle,
    CalendarClock,
    Gavel,
    FileCheck,
    Ban,
    MessageSquare,
    ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Input';
import {
    applyDisciplinaryCase,
    cancelDisciplinaryCase,
    closeDisciplinaryCase,
    decideDisciplinaryCase,
    getDisciplinarySummary,
    openDisciplinaryCase,
    rejectDisciplinaryCase,
    requestExplanation,
    scheduleHearing,
} from '@/lib/api/disciplinaryCase';
import {
    DISCIPLINARY_STATUS,
    evaluateSanctionChoice,
    isLetterSanctionCode,
    nextDisciplinaryHint,
    sanctionScaleCodeLabel,
    translateDisciplinaryReason,
    type DisciplinaryCase,
    type DisciplinarySummary,
    type SanctionScale,
} from '@/types/sanctions';
import { toast } from '@/lib/toast';
import { getAbout } from '@/lib/api/auth';
import type { AuthUser } from '@/types/auth';
import { canActOnDisciplinaryCase } from '@/lib/permissions';
import { extractId } from '@/lib/api-iri';

interface DisciplinaryCaseActionsProps {
    caseData: DisciplinaryCase;
    scale: SanctionScale | null;
    onUpdated: () => void;
}

function employeeIdOf(caseData: DisciplinaryCase): string {
    if (typeof caseData.employee === 'string') {
        return extractId(caseData.employee) || '';
    }
    return caseData.employee?.id || extractId(caseData.employee) || '';
}

function toLocalInput(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function plusDaysLocal(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return toLocalInput(d);
}

export function DisciplinaryCaseActions({ caseData, scale, onUpdated }: DisciplinaryCaseActionsProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [acting, setActing] = useState<string | null>(null);
    const [reason, setReason] = useState('');
    const [hearingAt, setHearingAt] = useState('');
    const [explanationDueAt, setExplanationDueAt] = useState('');
    const [explanationText, setExplanationText] = useState('');
    const [panel, setPanel] = useState<'explain' | 'reply' | 'hearing' | 'decide' | 'apply' | 'cancel' | 'reject' | null>(null);
    const [ackRecidivism, setAckRecidivism] = useState(false);
    const [applyAck, setApplyAck] = useState(false);
    const [summary, setSummary] = useState<DisciplinarySummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const status = caseData.status;
    const requiresHearing = scale?.requiresHearing ?? false;
    const code = scale?.code?.toUpperCase() ?? '';
    const employeeId = employeeIdOf(caseData);
    const verdict = evaluateSanctionChoice(summary, scale);
    const appealDeadline = caseData.appealDeadlineAt ? new Date(caseData.appealDeadlineAt) : null;
    const appealPending = Boolean(appealDeadline && appealDeadline.getTime() > Date.now());
    const hint = nextDisciplinaryHint(status, requiresHearing);
    const severeApply = code === 'SUSPEND' || code === 'DISMISS';

    useEffect(() => {
        getAbout().then(setUser).catch(() => setUser(null));
    }, []);

    useEffect(() => {
        if (!employeeId) return;
        if (status !== DISCIPLINARY_STATUS.EXPLANATION_REQUESTED && status !== DISCIPLINARY_STATUS.HEARING_SCHEDULED) {
            return;
        }
        setSummaryLoading(true);
        setSummaryError(false);
        getDisciplinarySummary(employeeId)
            .then(s => {
                setSummary(s);
                setSummaryError(false);
            })
            .catch(() => {
                setSummary(null);
                setSummaryError(true);
            })
            .finally(() => setSummaryLoading(false));
    }, [employeeId, status]);

    const can = (action: string) => canActOnDisciplinaryCase(user, action);

    const canCancel = useMemo(
        () => can('cancel') && [
            DISCIPLINARY_STATUS.DRAFT,
            DISCIPLINARY_STATUS.OPENED,
            DISCIPLINARY_STATUS.EXPLANATION_REQUESTED,
            DISCIPLINARY_STATUS.HEARING_SCHEDULED,
            DISCIPLINARY_STATUS.DECISION_PENDING,
        ].includes(status as typeof DISCIPLINARY_STATUS.DRAFT),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [status, user],
    );

    const canReject = useMemo(
        () => can('reject') && [
            DISCIPLINARY_STATUS.EXPLANATION_REQUESTED,
            DISCIPLINARY_STATUS.HEARING_SCHEDULED,
            DISCIPLINARY_STATUS.DECISION_PENDING,
        ].includes(status as typeof DISCIPLINARY_STATUS.EXPLANATION_REQUESTED),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [status, user],
    );

    function openPanel(next: typeof panel) {
        setPanel(next);
        setReason('');
        setAckRecidivism(false);
        setApplyAck(false);
        if (next === 'explain') {
            setExplanationDueAt(plusDaysLocal(8));
            setExplanationText('');
        } else if (next === 'reply') {
            setExplanationText(caseData.explanationText || '');
        }
    }

    async function run(key: string, fn: () => Promise<unknown>, successMsg: string) {
        try {
            setActing(key);
            await fn();
            toast.success(successMsg);
            setPanel(null);
            onUpdated();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setActing(null);
        }
    }

    function submitDecision() {
        if (verdict === 'blocked') {
            toast.error('Décision impossible : niveau inférieur à la dernière sanction. Annulez ou rejetez.');
            return;
        }
        if (verdict === 'needsAck' && !ackRecidivism) {
            toast.error('Confirmez que vous restez au même niveau de sanction (récidive).');
            return;
        }
        const sendAck = verdict === 'needsAck' || (summaryError && ackRecidivism);
        run(
            'decide',
            () => decideDisciplinaryCase(caseData.id, {
                reason: reason || undefined,
                acknowledgeRecidivism: sendAck || undefined,
            }),
            'Décision enregistrée.',
        );
    }

    if ([DISCIPLINARY_STATUS.CLOSED, DISCIPLINARY_STATUS.CANCELLED, DISCIPLINARY_STATUS.REJECTED].includes(status as typeof DISCIPLINARY_STATUS.CLOSED)) {
        return (
            <div className="flex flex-col items-center text-center py-4 px-2">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-500">
                    <CheckCircle2 className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">Aucune action</p>
                <p className="mt-1 text-xs text-secondary-500">Procédure terminée : plus aucune action possible.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {hint && (
                <div className="flex items-start gap-2.5 rounded-xl bg-amber-100 border border-amber-300 px-3.5 py-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
                        <ArrowRight className="h-4 w-4" />
                    </span>
                    <p className="text-xs font-medium leading-relaxed text-amber-950">{hint}</p>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                {status === DISCIPLINARY_STATUS.DRAFT && can('open') && (
                    <Button
                        size="sm"
                        className="gap-1.5"
                        disabled={!!acting}
                        onClick={() => run('open', () => openDisciplinaryCase(caseData.id), 'Affaire ouverte.')}
                    >
                        {acting === 'open' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                        Ouvrir l’affaire
                    </Button>
                )}

                {status === DISCIPLINARY_STATUS.OPENED && can('explain') && (
                    <Button size="sm" className="gap-1.5" disabled={!!acting} onClick={() => openPanel('explain')}>
                        <MessageSquare className="h-4 w-4" />
                        Demander des explications
                    </Button>
                )}

                {status === DISCIPLINARY_STATUS.EXPLANATION_REQUESTED && (
                    <>
                        {can('explain') && (
                            <Button size="sm" variant="outline" className="gap-1.5" disabled={!!acting} onClick={() => openPanel('reply')}>
                                <MessageSquare className="h-4 w-4" />
                                {caseData.explanationText ? 'Modifier la réponse' : 'Saisir la réponse'}
                            </Button>
                        )}
                        {requiresHearing && can('hearing') && (
                            <Button size="sm" className="gap-1.5" disabled={!!acting} onClick={() => openPanel('hearing')}>
                                <CalendarClock className="h-4 w-4" />
                                Planifier l’audience
                            </Button>
                        )}
                        {!requiresHearing && can('decide') && (
                            <Button size="sm" className="gap-1.5" disabled={!!acting} onClick={() => openPanel('decide')}>
                                <Gavel className="h-4 w-4" />
                                Passer en décision
                            </Button>
                        )}
                    </>
                )}

                {status === DISCIPLINARY_STATUS.HEARING_SCHEDULED && can('decide') && (
                    <Button size="sm" className="gap-1.5" disabled={!!acting} onClick={() => openPanel('decide')}>
                        <Gavel className="h-4 w-4" />
                        Enregistrer la décision
                    </Button>
                )}

                {status === DISCIPLINARY_STATUS.DECISION_PENDING && can('apply') && (
                    <Button size="sm" className="gap-1.5" onClick={() => openPanel('apply')}>
                        <FileCheck className="h-4 w-4" /> Appliquer la sanction
                    </Button>
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

            {(canCancel || canReject) && (
                <div className="flex flex-wrap gap-2 pt-1 border-t border-border-subtle">
                    {canCancel && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-rose-600 hover:bg-rose-50"
                            disabled={!!acting}
                            onClick={() => openPanel('cancel')}
                        >
                            <Ban className="h-4 w-4" />
                            Annuler
                        </Button>
                    )}
                    {canReject && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-rose-600 hover:bg-rose-50"
                            onClick={() => openPanel('reject')}
                        >
                            <XCircle className="h-4 w-4" /> Rejeter
                        </Button>
                    )}
                </div>
            )}

            {status === DISCIPLINARY_STATUS.SANCTION_APPLIED && (
                <p className="text-xs text-secondary-500 leading-relaxed">
                    {appealDeadline
                        ? `Délai de recours : ${appealDeadline.toLocaleString('fr-FR')}${appealPending ? ' (encore ouvert).' : ' (écoulé).'} Vous pouvez clôturer maintenant.`
                        : 'Délai de recours : 8 jours à compter de l’application. La clôture n’est pas bloquée.'}
                </p>
            )}

            {panel === 'explain' && (
                <div className="rounded-xl border border-border-subtle bg-muted/40 p-4 space-y-3">
                    <p className="text-sm font-medium text-secondary-800">Demande d’explications</p>
                    <Label>Échéance de réponse</Label>
                    <input
                        type="datetime-local"
                        value={explanationDueAt}
                        onChange={e => setExplanationDueAt(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm"
                    />
                    <p className="text-xs text-secondary-500">Prérempli à +8 jours (délai légal). Vous pouvez le modifier.</p>
                    <Label>Texte de la demande (facultatif)</Label>
                    <Textarea
                        value={explanationText}
                        onChange={e => setExplanationText(e.target.value)}
                        rows={3}
                        placeholder="Ce qui est demandé à l’employé…"
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPanel(null)}>Retour</Button>
                        <Button
                            size="sm"
                            disabled={!!acting}
                            onClick={() => run(
                                'explain',
                                () => requestExplanation(caseData.id, {
                                    explanationDueAt: explanationDueAt ? new Date(explanationDueAt).toISOString() : undefined,
                                    explanationText: explanationText.trim() || undefined,
                                }),
                                'Explications demandées.',
                            )}
                        >
                            {acting === 'explain' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Envoyer la demande
                        </Button>
                    </div>
                </div>
            )}

            {panel === 'reply' && (
                <div className="rounded-xl border border-border-subtle bg-muted/40 p-4 space-y-3">
                    <p className="text-sm font-medium text-secondary-800">Réponse de l’employé</p>
                    <p className="text-xs text-secondary-500">Cela n’avance pas la procédure : vous pourrez ensuite planifier l’audience ou décider.</p>
                    <Label>Réponse</Label>
                    <Textarea
                        value={explanationText}
                        onChange={e => setExplanationText(e.target.value)}
                        rows={4}
                        placeholder="Saisir la réponse…"
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPanel(null)}>Retour</Button>
                        <Button
                            size="sm"
                            disabled={!explanationText.trim() || !!acting}
                            onClick={() => run(
                                'reply',
                                () => requestExplanation(caseData.id, { explanationText: explanationText.trim() }),
                                'Réponse enregistrée.',
                            )}
                        >
                            {acting === 'reply' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Enregistrer
                        </Button>
                    </div>
                </div>
            )}

            {panel === 'hearing' && (
                <div className="rounded-xl border border-border-subtle bg-muted/40 p-4 space-y-3">
                    <p className="text-sm font-medium text-secondary-800">Entretien préalable</p>
                    <Label>Date et heure</Label>
                    <input
                        type="datetime-local"
                        value={hearingAt}
                        onChange={e => setHearingAt(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm"
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPanel(null)}>Retour</Button>
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

            {panel === 'decide' && (
                <div className="rounded-xl border border-border-subtle bg-muted/40 p-4 space-y-3">
                    <p className="text-sm font-medium text-secondary-800">Valider la décision</p>
                    <p className="text-xs text-secondary-500 leading-relaxed">
                        Sanction retenue : {scale?.label || sanctionScaleCodeLabel(code) || '—'}. La décision confirme ce niveau ; elle ne le change pas.
                    </p>
                    {summaryLoading && <p className="text-xs text-secondary-500">Vérification de la récidive…</p>}
                    {summaryError && (
                        <p className="text-xs text-amber-800">
                            Synthèse indisponible. Cochez la confirmation si vous restez au même niveau — l’enregistrement pourra sinon être refusé.
                        </p>
                    )}
                    {verdict === 'blocked' && (
                        <p className="text-xs font-medium text-rose-700">
                            Niveau inférieur à la dernière sanction — décision impossible. Annulez ou rejetez.
                        </p>
                    )}
                    {(verdict === 'needsAck' || summaryError) && verdict !== 'blocked' && (
                        <label className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 cursor-pointer">
                            <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 accent-amber-700"
                                checked={ackRecidivism}
                                onChange={e => setAckRecidivism(e.target.checked)}
                            />
                            <span>
                                Je confirme rester au même niveau de sanction (récidive).
                                {summary?.suggestedNextCode && (
                                    <> Pour une prochaine affaire, le niveau recommandé est {summary.suggestedNextLabel || sanctionScaleCodeLabel(summary.suggestedNextCode)}.</>
                                )}
                            </span>
                        </label>
                    )}
                    {(summary?.reasons?.length ?? 0) > 0 && (
                        <ul className="text-xs text-secondary-600 list-disc pl-4 space-y-0.5">
                            {summary!.reasons!.map((r, i) => <li key={i}>{translateDisciplinaryReason(r)}</li>)}
                        </ul>
                    )}
                    <Label>Motif (facultatif)</Label>
                    <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Commentaire de décision…" />
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPanel(null)}>Retour</Button>
                        <Button
                            size="sm"
                            disabled={!!acting || summaryLoading || verdict === 'blocked' || (verdict === 'needsAck' && !ackRecidivism)}
                            onClick={submitDecision}
                        >
                            {acting === 'decide' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />}
                            Confirmer la décision
                        </Button>
                    </div>
                </div>
            )}

            {panel === 'cancel' && (
                <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 space-y-3">
                    <p className="text-sm font-medium text-rose-900">Annuler cette affaire ?</p>
                    <p className="text-xs text-rose-800">Irréversible. Possible uniquement avant l’application de la sanction.</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPanel(null)}>Retour</Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            disabled={!!acting}
                            onClick={() => run('cancel', () => cancelDisciplinaryCase(caseData.id), 'Affaire annulée.')}
                        >
                            {acting === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                            Confirmer l’annulation
                        </Button>
                    </div>
                </div>
            )}

            {panel === 'reject' && (
                <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 space-y-3">
                    <Label>Motif du rejet</Label>
                    <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Pourquoi la procédure s’arrête…" />
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPanel(null)}>Retour</Button>
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

            {panel === 'apply' && (
                <div className="rounded-xl border border-border-subtle bg-muted/40 p-4 space-y-3">
                    <p className="text-sm font-medium text-secondary-800">Appliquer {sanctionScaleCodeLabel(code) || 'la sanction'}</p>
                    <p className="text-sm text-secondary-600">
                        {code === 'SUSPEND' && 'L’employé passera au statut Suspendu.'}
                        {code === 'DISMISS' && 'Un processus de sortie (licenciement) sera créé et démarré immédiatement.'}
                        {isLetterSanctionCode(code) && 'Une lettre d’avertissement sera créée. Vous pouvez joindre un PDF ou une image.'}
                        {!code && 'Les effets dépendent de l’échelle retenue.'}
                        {' '}Le délai de recours sera fixé à +8 jours.
                    </p>
                    {(isLetterSanctionCode(code) || !code) && (
                        <div>
                            <Label>Lettre (facultatif)</Label>
                            <input ref={fileRef} type="file" accept=".pdf,image/*" className="mt-1 block w-full text-sm" />
                        </div>
                    )}
                    {severeApply && (
                        <label className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-950 cursor-pointer">
                            <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 accent-rose-700"
                                checked={applyAck}
                                onChange={e => setApplyAck(e.target.checked)}
                            />
                            <span>
                                {code === 'DISMISS'
                                    ? 'Je confirme le licenciement et le démarrage du processus de sortie.'
                                    : 'Je confirme la suspension de l’employé.'}
                            </span>
                        </label>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPanel(null)}>Retour</Button>
                        <Button
                            size="sm"
                            disabled={!!acting || (severeApply && !applyAck)}
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
    if (code === 'SUSPEND') return 'Sanction appliquée. L’employé est suspendu — le statut est visible sur sa fiche.';
    if (code === 'DISMISS') return 'Sanction appliquée. Le processus de sortie a démarré — le lien apparaît ci-dessous.';
    if (isLetterSanctionCode(code)) return 'Sanction appliquée. La lettre d’avertissement est disponible ci-dessous si le fichier a été joint.';
    return 'Sanction appliquée.';
}
