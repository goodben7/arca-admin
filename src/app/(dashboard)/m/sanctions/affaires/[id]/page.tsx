'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    AlertCircle,
    CalendarDays,
    ExternalLink,
    FileText,
    Gavel,
    Loader2,
    Scale,
    ShieldCheck,
    User,
    Download,
    type LucideIcon,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DisciplinaryStepper } from '@/components/sanctions/DisciplinaryStepper';
import { DisciplinaryCaseActions } from '@/components/sanctions/DisciplinaryCaseActions';
import { getDisciplinaryCaseById } from '@/lib/api/disciplinaryCase';
import { getSanctionScaleById } from '@/lib/api/sanctionScale';
import { getEmployeeById } from '@/lib/api/employee';
import { getDocumentById } from '@/lib/api/document';
import { buildAssetUrl } from '@/lib/api/client';
import { extractId } from '@/lib/api-iri';
import { cn } from '@/lib/utils';
import { STATUS, type Employee } from '@/types/employee';
import type { DocumentRecord } from '@/types/document';
import {
    DISCIPLINARY_STATUS,
    DISCIPLINARY_STATUS_LABELS,
    disciplinaryStatusBadgeVariant,
    nextDisciplinaryHint,
    sanctionScaleCodeLabel,
    type DisciplinaryCase,
    type DisciplinaryStatus,
    type SanctionScale,
} from '@/types/sanctions';

function employeeStatusLabel(status: string): string {
    switch (status) {
        case STATUS.SUSPENDED: return 'Suspendu';
        case STATUS.TERMINATED: return 'Licencié';
        case STATUS.ACTIVE: return 'Actif';
        case STATUS.ON_LEAVE: return 'En congé';
        case STATUS.PROBATION: return 'Période d’essai';
        case STATUS.RETIRED: return 'Retraité';
        case STATUS.INACTIVE: return 'Inactif';
        default: return status;
    }
}

function initialsOf(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase() ?? '')
        .join('');
}

function statusWash(status: string): string {
    switch (status) {
        case DISCIPLINARY_STATUS.DRAFT:
            return 'border-slate-200 bg-gradient-to-br from-slate-50 via-white to-primary-50/40';
        case DISCIPLINARY_STATUS.OPENED:
        case DISCIPLINARY_STATUS.EXPLANATION_REQUESTED:
            return 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50/70';
        case DISCIPLINARY_STATUS.HEARING_SCHEDULED:
            return 'border-violet-200 bg-gradient-to-br from-violet-50 via-white to-primary-50/50';
        case DISCIPLINARY_STATUS.DECISION_PENDING:
            return 'border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50/80';
        case DISCIPLINARY_STATUS.SANCTION_APPLIED:
        case DISCIPLINARY_STATUS.CLOSED:
            return 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50/70';
        case DISCIPLINARY_STATUS.CANCELLED:
        case DISCIPLINARY_STATUS.REJECTED:
            return 'border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50/50';
        default:
            return 'border-primary-200 bg-gradient-to-br from-primary-50 via-white to-sky-50';
    }
}

function severityTone(level?: number): { chip: string; bar: string[] } {
    if (!level || level <= 1) {
        return {
            chip: 'border-sky-200 bg-sky-50 text-sky-800',
            bar: ['bg-sky-400', 'bg-secondary-200', 'bg-secondary-200', 'bg-secondary-200', 'bg-secondary-200'],
        };
    }
    if (level === 2) {
        return {
            chip: 'border-amber-200 bg-amber-50 text-amber-900',
            bar: ['bg-sky-400', 'bg-amber-400', 'bg-secondary-200', 'bg-secondary-200', 'bg-secondary-200'],
        };
    }
    if (level === 3) {
        return {
            chip: 'border-orange-200 bg-orange-50 text-orange-900',
            bar: ['bg-sky-400', 'bg-amber-400', 'bg-orange-500', 'bg-secondary-200', 'bg-secondary-200'],
        };
    }
    if (level === 4) {
        return {
            chip: 'border-rose-200 bg-rose-50 text-rose-900',
            bar: ['bg-sky-400', 'bg-amber-400', 'bg-orange-500', 'bg-rose-500', 'bg-secondary-200'],
        };
    }
    return {
        chip: 'border-red-300 bg-red-50 text-red-900',
        bar: ['bg-sky-400', 'bg-amber-400', 'bg-orange-500', 'bg-rose-500', 'bg-red-600'],
    };
}

function MetaTile({
    icon: Icon,
    label,
    value,
    tone = 'primary',
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    tone?: 'primary' | 'violet' | 'amber';
}) {
    const iconWrap = {
        primary: 'bg-primary-100 text-primary-700 ring-1 ring-primary-200/80',
        violet: 'bg-violet-100 text-violet-700 ring-1 ring-violet-200/80',
        amber: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200/80',
    }[tone];
    const tile = {
        primary: 'border-primary-100 bg-gradient-to-br from-primary-50/80 to-white',
        violet: 'border-violet-100 bg-gradient-to-br from-violet-50/80 to-white',
        amber: 'border-amber-100 bg-gradient-to-br from-amber-50/80 to-white',
    }[tone];

    return (
        <div className={cn('flex items-start gap-3 rounded-xl border px-3.5 py-3', tile)}>
            <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', iconWrap)}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary-500">{label}</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground leading-snug">{value}</p>
            </div>
        </div>
    );
}

export default function DisciplinaryCaseDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [caseData, setCaseData] = useState<DisciplinaryCase | null>(null);
    const [scale, setScale] = useState<SanctionScale | null>(null);
    const [employeeName, setEmployeeName] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [employeeStatus, setEmployeeStatus] = useState<string>('');
    const [warningDoc, setWarningDoc] = useState<DocumentRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async (opts?: { silent?: boolean }) => {
        try {
            if (!opts?.silent) setLoading(true);
            const c = await getDisciplinaryCaseById(id);
            setCaseData(c);
            const empId = typeof c.employee === 'string' ? extractId(c.employee) : c.employee?.id;
            setEmployeeId(empId || '');
            if (empId) {
                getEmployeeById(empId)
                    .then((e: Employee) => {
                        setEmployeeName(`${e.firstName} ${e.lastName}`);
                        setEmployeeStatus(e.status || '');
                    })
                    .catch(() => setEmployeeName(empId));
            }
            const warningId = c.warningDocument
                ? (typeof c.warningDocument === 'string'
                    ? extractId(c.warningDocument)
                    : c.warningDocument.id)
                : null;
            if (warningId) {
                getDocumentById(warningId)
                    .then(setWarningDoc)
                    .catch(() => setWarningDoc(null));
            } else {
                setWarningDoc(null);
            }
            const scaleId = typeof c.sanctionScale === 'string'
                ? extractId(c.sanctionScale)
                : c.sanctionScale?.id;
            if (typeof c.sanctionScale === 'object' && c.sanctionScale?.code) {
                setScale(c.sanctionScale as SanctionScale);
            } else if (scaleId) {
                setScale(await getSanctionScaleById(scaleId).catch(() => null));
            }
            setError(null);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <PageShell>
                <div className="flex justify-center p-24">
                    <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
                </div>
            </PageShell>
        );
    }

    if (error || !caseData) {
        return (
            <PageShell>
                <div className="flex flex-col items-center gap-3 p-20">
                    <AlertCircle className="h-10 w-10 text-rose-500" />
                    <p>{error || 'Affaire introuvable.'}</p>
                    <Link href="/m/sanctions/affaires"><Button variant="outline">Retour</Button></Link>
                </div>
            </PageShell>
        );
    }

    const exitId = caseData.exitProcess
        ? (typeof caseData.exitProcess === 'string' ? extractId(caseData.exitProcess) : caseData.exitProcess.id)
        : null;

    const statusLabel = DISCIPLINARY_STATUS_LABELS[caseData.status as DisciplinaryStatus] ?? caseData.status;
    const isTerminal = [
        DISCIPLINARY_STATUS.CLOSED,
        DISCIPLINARY_STATUS.CANCELLED,
        DISCIPLINARY_STATUS.REJECTED,
    ].includes(caseData.status as typeof DISCIPLINARY_STATUS.CLOSED);

    const severity = severityTone(scale?.severityLevel);

    return (
        <PageShell ambient className="max-w-6xl mx-auto">
            <PageHeader
                className="panel-accent-top border-primary-100/80 bg-gradient-to-r from-primary-50/90 via-white to-amber-50/70"
                title={`Affaire ${caseData.id}`}
                description={employeeName ? `Procédure disciplinaire — ${employeeName}` : 'Procédure disciplinaire'}
                backHref="/m/sanctions/affaires"
                leading={
                    <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-sm shadow-primary-300/50">
                        <Scale className="h-5 w-5" />
                    </div>
                }
                actions={
                    employeeId ? (
                        <Link href={`/m/personnel/employees/${employeeId}`}>
                            <Button variant="outline" size="sm" className="gap-1.5 border-primary-200 bg-white text-primary-800 hover:bg-primary-50">
                                <User className="h-4 w-4" /> Fiche employé
                            </Button>
                        </Link>
                    ) : undefined
                }
            />

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-stretch">
                <div className={cn('flex-1 rounded-2xl border px-5 py-4 shadow-sm', statusWash(caseData.status))}>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <Badge
                            variant={disciplinaryStatusBadgeVariant(caseData.status)}
                            className="text-[11px] tracking-wide shadow-sm"
                        >
                            {statusLabel}
                        </Badge>
                        {scale && (
                            <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold', severity.chip)}>
                                <Scale className="h-3.5 w-3.5" />
                                {scale.code && sanctionScaleCodeLabel(scale.code) !== scale.code
                                    ? sanctionScaleCodeLabel(scale.code)
                                    : scale.label || scale.code}
                            </span>
                        )}
                        {scale?.requiresHearing && (
                            <span className="text-xs font-medium text-violet-800 bg-violet-100 border border-violet-200 rounded-full px-2.5 py-1">
                                Audience requise
                            </span>
                        )}
                    </div>
                    {scale && (
                        <div className="mt-3">
                            <p className="text-sm text-secondary-700 leading-relaxed">
                                {scale.label}
                                {typeof scale.severityLevel === 'number' && (
                                    <span className="text-secondary-500">
                                        {' '}· niveau {scale.severityLevel} sur 5
                                    </span>
                                )}
                            </p>
                            <div className="mt-2.5 flex max-w-xs gap-1">
                                {severity.bar.map((bar, i) => (
                                    <span key={i} className={cn('h-1.5 flex-1 rounded-full', bar)} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {employeeName && (
                    <div className="sm:w-72 rounded-2xl border border-primary-200/80 bg-gradient-to-br from-primary-600 via-primary-700 to-teal-800 px-5 py-4 shadow-sm flex items-center gap-3 text-white">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-sm font-bold tracking-wide ring-1 ring-white/25">
                            {initialsOf(employeeName) || <User className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-100">Collaborateur</p>
                            <p className="text-sm font-semibold truncate">{employeeName}</p>
                            {employeeStatus && (
                                <p className="text-xs text-primary-100/90 mt-0.5">
                                    {employeeStatusLabel(employeeStatus)}
                                </p>
                            )}
                            {employeeId && (
                                <Link
                                    href={`/m/personnel/employees/${employeeId}`}
                                    className="text-xs font-medium text-amber-200 hover:text-white hover:underline"
                                >
                                    Voir le dossier
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <Card className="mb-6 border-primary-100/80 shadow-sm overflow-hidden panel-surface panel-accent-top">
                <CardHeader className="border-b border-primary-100/60 panel-header-wash py-4">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                            <Gavel className="h-4 w-4" />
                        </span>
                        <CardTitle className="text-sm font-semibold tracking-tight">Progression de la procédure</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 pb-5 px-4 sm:px-8 bg-gradient-to-b from-primary-50/40 to-transparent">
                    <DisciplinaryStepper
                        status={caseData.status}
                        requiresHearing={scale?.requiresHearing ?? false}
                    />
                    {!isTerminal && nextDisciplinaryHint(caseData.status, scale?.requiresHearing ?? false) && (
                        <div className="mt-5 flex justify-center">
                            <p className="text-center text-xs font-medium text-primary-800 bg-primary-50 border border-primary-200 rounded-full px-3.5 py-1.5">
                                {nextDisciplinaryHint(caseData.status, scale?.requiresHearing ?? false)}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* Faits */}
                    <Card className="border-amber-100/80 shadow-sm overflow-hidden panel-surface panel-accent-top">
                        <CardHeader className="border-b border-amber-100/70 bg-gradient-to-r from-amber-50 to-orange-50/40 py-4">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                                    <FileText className="h-4 w-4" />
                                </span>
                                <CardTitle className="text-sm font-semibold tracking-tight">Faits reprochés</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="px-6 py-5 space-y-4">
                                <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3.5 border-l-4 border-l-amber-500">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 mb-1.5">
                                        Description
                                    </p>
                                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-secondary-900">
                                        {caseData.facts || '—'}
                                    </p>
                                </div>
                                {caseData.reason && (
                                    <div className="rounded-xl border border-primary-100 bg-primary-50/50 px-4 py-3 border-l-4 border-l-primary-500">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-700 mb-1">
                                            Motif
                                        </p>
                                        <p className="text-sm leading-relaxed text-secondary-800">
                                            {caseData.reason}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {(caseData.explanationDueAt || caseData.explanationText) && (
                                <div className="mx-6 mb-5 rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 space-y-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-800">
                                        Explications
                                    </p>
                                    {caseData.explanationDueAt && (
                                        <p className="text-sm text-sky-950">
                                            Échéance : {format(new Date(caseData.explanationDueAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                                        </p>
                                    )}
                                    {caseData.explanationText && (
                                        <p className="text-sm leading-relaxed text-secondary-800 whitespace-pre-wrap">
                                            {caseData.explanationText}
                                        </p>
                                    )}
                                </div>
                            )}
                            <div className="grid sm:grid-cols-2 gap-3 border-t border-amber-100/80 bg-gradient-to-r from-amber-50/50 to-primary-50/30 px-6 py-4">
                                <MetaTile
                                    icon={CalendarDays}
                                    tone="amber"
                                    label="Date des faits"
                                    value={
                                        caseData.occurredAt
                                            ? format(new Date(caseData.occurredAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })
                                            : 'Non renseignée'
                                    }
                                />
                                <MetaTile
                                    icon={CalendarDays}
                                    tone="violet"
                                    label="Audience"
                                    value={
                                        caseData.hearingAt
                                            ? format(new Date(caseData.hearingAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })
                                            : scale?.requiresHearing
                                                ? 'À planifier'
                                                : 'Non requise'
                                    }
                                />
                                {caseData.appealDeadlineAt && (
                                    <MetaTile
                                        icon={CalendarDays}
                                        tone="primary"
                                        label="Délai de recours"
                                        value={format(new Date(caseData.appealDeadlineAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {(exitId || caseData.warningDocument) && (
                        <Card className="border-sky-100/80 shadow-sm overflow-hidden panel-surface panel-accent-top">
                            <CardHeader className="border-b border-sky-100/70 bg-gradient-to-r from-sky-50 to-primary-50/40 py-4">
                                <div className="flex items-center gap-2.5">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
                                        <ExternalLink className="h-4 w-4" />
                                    </span>
                                    <CardTitle className="text-sm font-semibold tracking-tight">Effets transverses</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 p-5 text-sm">
                                {exitId && (
                                    <Link
                                        href={`/m/personnel/offboarding/${exitId}`}
                                        className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 hover:bg-primary-50/40 hover:border-primary-200 transition-colors"
                                    >
                                        <ExternalLink className="h-4 w-4 text-primary-600 shrink-0" />
                                        <div>
                                            <p className="font-semibold text-foreground">Processus de sortie</p>
                                            <p className="text-xs text-secondary-500 font-mono mt-0.5">{exitId}</p>
                                        </div>
                                    </Link>
                                )}
                                {caseData.warningDocument && (
                                    warningDoc?.contentUrl ? (
                                        <a
                                            href={buildAssetUrl(warningDoc.contentUrl)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 hover:bg-primary-50/40 hover:border-primary-200 transition-colors"
                                        >
                                            <Download className="h-4 w-4 text-primary-600 shrink-0" />
                                            <div>
                                                <p className="font-semibold text-foreground">Lettre d’avertissement</p>
                                                <p className="text-xs text-secondary-500 mt-0.5">
                                                    {warningDoc.title || warningDoc.id} — ouvrir / télécharger
                                                </p>
                                            </div>
                                        </a>
                                    ) : (
                                        <div className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 bg-muted/20">
                                            <FileText className="h-4 w-4 text-secondary-500 shrink-0" />
                                            <div>
                                                <p className="font-semibold text-foreground">Lettre d’avertissement</p>
                                                <p className="text-xs text-secondary-500 font-mono mt-0.5">
                                                    {typeof caseData.warningDocument === 'string'
                                                        ? extractId(caseData.warningDocument)
                                                        : caseData.warningDocument.id}
                                                    {warningDoc ? ' — fichier non exposé' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Actions */}
                <Card className="border-primary-200/80 shadow-sm overflow-hidden h-fit lg:sticky lg:top-24">
                    <CardHeader className="border-b-0 bg-gradient-to-r from-primary-600 to-teal-700 py-4">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white">
                                <ShieldCheck className="h-4 w-4" />
                            </span>
                            <CardTitle className="text-sm font-semibold tracking-tight text-white">Actions</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 bg-gradient-to-b from-primary-50/50 to-white">
                        {isTerminal ? (
                            <div className="flex flex-col items-center text-center py-6 px-2">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-semibold text-foreground">Affaire terminée</p>
                                <p className="mt-1 text-xs text-secondary-500 leading-relaxed max-w-[14rem]">
                                    Aucune action disponible — statut « {statusLabel} ».
                                </p>
                            </div>
                        ) : (
                            <DisciplinaryCaseActions
                                caseData={caseData}
                                scale={scale}
                                onUpdated={() => load({ silent: true })}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageShell>
    );
}
