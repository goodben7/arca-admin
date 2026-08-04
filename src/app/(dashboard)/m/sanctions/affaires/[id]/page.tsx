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
import { extractId } from '@/lib/api-iri';
import { cn } from '@/lib/utils';
import {
    DISCIPLINARY_STATUS,
    DISCIPLINARY_STATUS_LABELS,
    disciplinaryStatusBadgeVariant,
    sanctionScaleCodeLabel,
    type DisciplinaryCase,
    type DisciplinaryStatus,
    type SanctionScale,
} from '@/types/sanctions';

function MetaTile({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/30 px-3.5 py-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-border text-primary-600">
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary-400">{label}</p>
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const c = await getDisciplinaryCaseById(id);
            setCaseData(c);
            const empId = typeof c.employee === 'string' ? extractId(c.employee) : c.employee?.id;
            setEmployeeId(empId || '');
            if (empId) {
                getEmployeeById(empId)
                    .then(e => setEmployeeName(`${e.firstName} ${e.lastName}`))
                    .catch(() => setEmployeeName(empId));
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

    return (
        <PageShell className="max-w-6xl mx-auto">
            <PageHeader
                title={`Affaire ${caseData.id}`}
                description={employeeName ? `Procédure disciplinaire — ${employeeName}` : 'Procédure disciplinaire'}
                backHref="/m/sanctions/affaires"
                actions={
                    employeeId ? (
                        <Link href={`/m/personnel/employees/${employeeId}`}>
                            <Button variant="outline" size="sm" className="gap-1.5">
                                <User className="h-4 w-4" /> Fiche employé
                            </Button>
                        </Link>
                    ) : undefined
                }
            />

            {/* Bandeau statut + échelle */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-stretch">
                <div className="flex-1 rounded-2xl border border-border bg-white/80 backdrop-blur-sm px-5 py-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3">
                        <Badge
                            variant={disciplinaryStatusBadgeVariant(caseData.status)}
                            className="text-[11px] tracking-wide"
                        >
                            {statusLabel}
                        </Badge>
                        {scale && (
                            <span className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50/70 px-3 py-1 text-xs font-semibold text-primary-800">
                                <Scale className="h-3.5 w-3.5" />
                                {scale.code} · {sanctionScaleCodeLabel(scale.code)}
                            </span>
                        )}
                        {scale?.requiresHearing && (
                            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-1">
                                Audience requise
                            </span>
                        )}
                    </div>
                    {scale && (
                        <p className="mt-2.5 text-sm text-secondary-600 leading-relaxed">
                            {scale.label}
                            {typeof scale.severityLevel === 'number' && (
                                <span className="text-secondary-400">
                                    {' '}· gravité {scale.severityLevel}/4
                                </span>
                            )}
                        </p>
                    )}
                </div>
                {employeeName && (
                    <div className="sm:w-64 rounded-2xl border border-border bg-white/80 backdrop-blur-sm px-5 py-4 shadow-sm flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-100 text-secondary-700">
                            <User className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary-400">Collaborateur</p>
                            <p className="text-sm font-semibold text-foreground truncate">{employeeName}</p>
                            {employeeId && (
                                <Link
                                    href={`/m/personnel/employees/${employeeId}`}
                                    className="text-xs font-medium text-primary-600 hover:underline"
                                >
                                    Voir le dossier
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Progression */}
            <Card className="mb-6 border-border/80 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/60 bg-muted/20 py-4">
                    <div className="flex items-center gap-2">
                        <Gavel className="h-4 w-4 text-primary-600" />
                        <CardTitle className="text-sm font-semibold tracking-tight">Progression de la procédure</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 pb-5 px-4 sm:px-8">
                    <DisciplinaryStepper
                        status={caseData.status}
                        requiresHearing={scale?.requiresHearing ?? false}
                    />
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    {/* Faits */}
                    <Card className="border-border/80 shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-border/60 bg-muted/20 py-4">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary-600" />
                                <CardTitle className="text-sm font-semibold tracking-tight">Faits reprochés</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="px-6 py-5 space-y-5">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary-400 mb-2">
                                        Description
                                    </p>
                                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-secondary-800">
                                        {caseData.facts || '—'}
                                    </p>
                                </div>
                                {caseData.reason && (
                                    <div className="rounded-xl border border-border/70 bg-secondary-50/50 px-4 py-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary-400 mb-1">
                                            Motif
                                        </p>
                                        <p className="text-sm leading-relaxed text-secondary-700">
                                            {caseData.reason}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3 border-t border-border/60 bg-muted/15 px-6 py-4">
                                <MetaTile
                                    icon={CalendarDays}
                                    label="Date des faits"
                                    value={
                                        caseData.occurredAt
                                            ? format(new Date(caseData.occurredAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })
                                            : 'Non renseignée'
                                    }
                                />
                                <MetaTile
                                    icon={CalendarDays}
                                    label="Audience"
                                    value={
                                        caseData.hearingAt
                                            ? format(new Date(caseData.hearingAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })
                                            : scale?.requiresHearing
                                                ? 'À planifier'
                                                : 'Non requise'
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {(exitId || caseData.warningDocument) && (
                        <Card className="border-border/80 shadow-sm overflow-hidden">
                            <CardHeader className="border-b border-border/60 bg-muted/20 py-4">
                                <div className="flex items-center gap-2">
                                    <ExternalLink className="h-4 w-4 text-primary-600" />
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
                                    <div className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 bg-muted/20">
                                        <FileText className="h-4 w-4 text-secondary-500 shrink-0" />
                                        <div>
                                            <p className="font-semibold text-foreground">Lettre d’avertissement</p>
                                            <p className="text-xs text-secondary-500 font-mono mt-0.5">
                                                {typeof caseData.warningDocument === 'string'
                                                    ? extractId(caseData.warningDocument)
                                                    : caseData.warningDocument.id}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Actions */}
                <Card className={cn('border-border/80 shadow-sm overflow-hidden h-fit lg:sticky lg:top-24')}>
                    <CardHeader className="border-b border-border/60 bg-muted/20 py-4">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary-600" />
                            <CardTitle className="text-sm font-semibold tracking-tight">Actions</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5">
                        {isTerminal ? (
                            <div className="flex flex-col items-center text-center py-6 px-2">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600">
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
                                onUpdated={load}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageShell>
    );
}
