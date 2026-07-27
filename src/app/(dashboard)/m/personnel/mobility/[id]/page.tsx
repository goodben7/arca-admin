'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    AlertCircle,
    ArrowRightLeft,
    Building2,
    CheckCircle2,
    Clock,
    FileText,
    Loader2,
    MessageSquare,
    SendHorizonal,
    User,
    XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Input';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from '@/lib/toast';
import { getEmployeeById, getDepartments } from '@/lib/api/employee';
import { getJobRoles, getGrades } from '@/lib/api/jobArchitecture';
import { extractId } from '@/lib/api-iri';
import {
    getMobilityRequestById,
    submitMobilityRequest,
    approveMobilityRequest,
    rejectMobilityRequest,
    cancelMobilityRequest,
} from '@/lib/api/mobilityRequest';
import {
    MobilityRequest,
    MOBILITY_STATUS,
    MOBILITY_STATUS_LABELS,
    MOBILITY_TYPE_LABELS,
    MOBILITY_WORKFLOW_STEPS,
    MobilityStatus,
    MobilityType,
} from '@/types/mobilityRequest';

const APPROVAL_STATUSES: string[] = [
    MOBILITY_STATUS.MANAGER_APPROVAL,
    MOBILITY_STATUS.HR_APPROVAL,
    MOBILITY_STATUS.EXECUTIVE_APPROVAL,
];

const TERMINAL_STATUSES: string[] = [
    MOBILITY_STATUS.IMPLEMENTED,
    MOBILITY_STATUS.REJECTED,
    MOBILITY_STATUS.CANCELLED,
];

function getStatusBadgeClass(status: string): string {
    switch (status) {
        case MOBILITY_STATUS.DRAFT: return 'bg-secondary-50 text-secondary-600 border-secondary-100';
        case MOBILITY_STATUS.MANAGER_APPROVAL:
        case MOBILITY_STATUS.HR_APPROVAL:
        case MOBILITY_STATUS.EXECUTIVE_APPROVAL: return 'bg-amber-50 text-amber-700 border-amber-100';
        case MOBILITY_STATUS.IMPLEMENTED: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        case MOBILITY_STATUS.REJECTED: return 'bg-rose-50 text-rose-700 border-rose-100';
        case MOBILITY_STATUS.CANCELLED: return 'bg-secondary-50 text-secondary-400 border-secondary-100';
        default: return 'bg-secondary-50 text-secondary-600 border-secondary-100';
    }
}

function SubmitModal({
    open, onClose, onConfirm, isLoading
}: {
    open: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-secondary-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-md border-none shadow-3xl bg-white rounded-xl overflow-hidden">
                <CardHeader className="p-8 bg-primary-50/50 border-b border-primary-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-100 shrink-0">
                            <SendHorizonal className="w-5 h-5 text-white" />
                        </div>
                        <CardTitle className="text-base font-black text-secondary-900 uppercase tracking-tighter">
                            Soumettre la demande
                        </CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-9 w-9">
                        <XCircle className="w-4 h-4 text-secondary-500" />
                    </Button>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <p className="text-sm font-medium text-secondary-600">
                        La demande sera transmise pour validation par le manager. Cette action est irréversible.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose} disabled={isLoading}
                            className="flex-1 py-6 rounded-2xl font-bold uppercase tracking-widest text-xs border-secondary-200">
                            Annuler
                        </Button>
                        <Button onClick={onConfirm} disabled={isLoading}
                            className="flex-1 py-6 rounded-2xl font-black uppercase tracking-widest text-xs bg-primary-600 hover:bg-primary-700 shadow-xl shadow-primary-100 gap-2 text-white">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizonal className="w-4 h-4" />}
                            {isLoading ? 'Envoi...' : 'Soumettre'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ApproveModal({
    open, onClose, onConfirm, isLoading
}: {
    open: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-secondary-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-md border-none shadow-3xl bg-white rounded-xl overflow-hidden">
                <CardHeader className="p-8 bg-emerald-50/50 border-b border-emerald-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <CardTitle className="text-base font-black text-secondary-900 uppercase tracking-tighter">
                            Approuver la demande
                        </CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-9 w-9">
                        <XCircle className="w-4 h-4 text-secondary-500" />
                    </Button>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <p className="text-sm font-medium text-secondary-600">
                        Confirmer l&apos;approbation de cette étape. La demande progressera vers l&apos;étape suivante.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose} disabled={isLoading}
                            className="flex-1 py-6 rounded-2xl font-bold uppercase tracking-widest text-xs border-secondary-200">
                            Annuler
                        </Button>
                        <Button onClick={onConfirm} disabled={isLoading}
                            className="flex-1 py-6 rounded-2xl font-black uppercase tracking-widest text-xs bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 gap-2 text-white">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            {isLoading ? 'Traitement...' : 'Confirmer'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function RejectModal({
    open, onClose, onConfirm, isLoading
}: {
    open: boolean; onClose: () => void; onConfirm: (reason: string) => void; isLoading: boolean;
}) {
    const [reason, setReason] = useState('');
    useEffect(() => { if (open) setReason(''); }, [open]);
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-secondary-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-md border-none shadow-3xl bg-white rounded-xl overflow-hidden">
                <CardHeader className="p-8 bg-rose-50/50 border-b border-rose-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-100 shrink-0">
                            <XCircle className="w-5 h-5 text-white" />
                        </div>
                        <CardTitle className="text-base font-black text-secondary-900 uppercase tracking-tighter">
                            Refuser la demande
                        </CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-9 w-9">
                        <XCircle className="w-4 h-4 text-secondary-500" />
                    </Button>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                        <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400 flex items-center gap-1.5">
                            Motif du refus <span className="text-rose-500">*</span>
                        </Label>
                        <Textarea
                            rows={5}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Expliquez le motif du refus..."
                            className="bg-secondary-50/30"
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose} disabled={isLoading}
                            className="flex-1 py-6 rounded-2xl font-bold uppercase tracking-widest text-xs border-secondary-200">
                            Annuler
                        </Button>
                        <Button onClick={() => onConfirm(reason)} disabled={isLoading || !reason.trim()}
                            className="flex-1 py-6 rounded-2xl font-black uppercase tracking-widest text-xs bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-100 gap-2 text-white">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                            {isLoading ? 'Traitement...' : 'Confirmer le refus'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function WorkflowTimeline({ status }: { status: string }) {
    const currentIdx = MOBILITY_WORKFLOW_STEPS.indexOf(status as MobilityStatus);
    const isRejected = status === MOBILITY_STATUS.REJECTED;
    const isCancelled = status === MOBILITY_STATUS.CANCELLED;
    const isTerminal = TERMINAL_STATUSES.includes(status);

    return (
        <div className="relative">
            <div className="flex items-center gap-0">
                {MOBILITY_WORKFLOW_STEPS.map((step, i) => {
                    const isDone = i < currentIdx || status === MOBILITY_STATUS.IMPLEMENTED;
                    const isCurrent = i === currentIdx && !isTerminal;
                    const label = MOBILITY_STATUS_LABELS[step];

                    return (
                        <div key={step} className="flex items-center flex-1 min-w-0">
                            <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                                <div className={`
                                    w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all shrink-0
                                    ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' :
                                    isCurrent ? 'bg-primary-500 border-primary-500 text-white animate-pulse' :
                                    isRejected && i === currentIdx ? 'bg-rose-500 border-rose-500 text-white' :
                                    'bg-secondary-100 border-secondary-200 text-secondary-300'}
                                `}>
                                    {isDone ? (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    ) : isCurrent ? (
                                        <Clock className="w-3.5 h-3.5" />
                                    ) : (
                                        <span className="text-[9px] font-black">{i + 1}</span>
                                    )}
                                </div>
                                <p className={`text-[9px] font-black uppercase tracking-wide text-center leading-tight truncate w-full px-1
                                    ${isDone ? 'text-emerald-600' : isCurrent ? 'text-primary-600' : 'text-secondary-300'}
                                `}>
                                    {label}
                                </p>
                            </div>
                            {i < MOBILITY_WORKFLOW_STEPS.length - 1 && (
                                <div className={`h-0.5 w-4 shrink-0 mx-0.5 rounded-full transition-all
                                    ${isDone ? 'bg-emerald-300' : 'bg-secondary-200'}
                                `} />
                            )}
                        </div>
                    );
                })}
            </div>

            {(isRejected || isCancelled) && (
                <div className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold border
                    ${isRejected ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-secondary-50 text-secondary-500 border-secondary-100'}
                `}>
                    <XCircle className="w-4 h-4 shrink-0" />
                    {isRejected ? 'Demande refusée' : 'Demande annulée'}
                </div>
            )}
        </div>
    );
}

export default function MobilityDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = (params?.id || '') as string;

    const [request, setRequest] = useState<MobilityRequest | null>(null);
    const [employeeName, setEmployeeName] = useState('');
    const [departmentName, setDepartmentName] = useState('');
    const [jobRoleName, setJobRoleName] = useState('');
    const [gradeName, setGradeName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [submitOpen, setSubmitOpen] = useState(false);
    const [approveOpen, setApproveOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    function showToast(msg: string, type: 'success' | 'error') {
        if (type === 'success') toast.success(msg);
        else toast.error(msg);
    }

    async function refresh() {
        const refreshed = await getMobilityRequestById(id);
        setRequest(refreshed);
    }

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                setError(null);

                const req = await getMobilityRequestById(id);
                setRequest(req);

                const empId = extractId(req.employee);
                const roleId = extractId(req.targetJobRoleId || req.targetJobRole);
                const gradeId = extractId(req.targetGradeId || req.targetGrade);
                const deptId = extractId(req.targetDepartment);

                const [emp, deptsData, roles, gradeList] = await Promise.all([
                    empId ? getEmployeeById(empId).catch(() => null) : Promise.resolve(null),
                    deptId ? getDepartments().catch(() => []) : Promise.resolve([]),
                    roleId ? getJobRoles().catch(() => []) : Promise.resolve([]),
                    gradeId ? getGrades().catch(() => []) : Promise.resolve([]),
                ]);

                if (emp) setEmployeeName(`${emp.firstName} ${emp.lastName}`.trim());

                if (deptId) {
                    const depts = Array.isArray(deptsData) ? deptsData : (deptsData as { 'hydra:member'?: { id: string; code: string; name: string; '@id'?: string }[] })['hydra:member'] || [];
                    const d = depts.find(x => x.id === deptId || x['@id'] === req.targetDepartment);
                    if (d) setDepartmentName(`${d.code} — ${d.name}`);
                }

                if (roleId) {
                    const role = roles.find(r => r.id === roleId);
                    if (role) setJobRoleName(role.title);
                }

                if (gradeId) {
                    const grade = gradeList.find(g => g.id === gradeId);
                    if (grade) setGradeName(grade.name);
                }
            } catch (e: any) {
                setError(e?.message || 'Impossible de charger la demande.');
            } finally {
                setIsLoading(false);
            }
        }

        if (id) fetchData();
    }, [id]);

    async function handleSubmit() {
        if (!request) return;
        setActionLoading(true);
        try {
            await submitMobilityRequest(request.id);
            showToast('Demande soumise avec succès.', 'success');
            setSubmitOpen(false);
            await refresh();
        } catch (e: any) {
            showToast(e?.message || 'Erreur lors de la soumission.', 'error');
        } finally {
            setActionLoading(false);
        }
    }

    async function handleApprove() {
        if (!request) return;
        setActionLoading(true);
        try {
            await approveMobilityRequest(request.id);
            showToast('Demande approuvée.', 'success');
            setApproveOpen(false);
            await refresh();
        } catch (e: any) {
            showToast(e?.message || "Erreur lors de l'approbation.", 'error');
        } finally {
            setActionLoading(false);
        }
    }

    async function handleReject(reason: string) {
        if (!request) return;
        setActionLoading(true);
        try {
            await rejectMobilityRequest(request.id, reason);
            showToast('Demande refusée.', 'success');
            setRejectOpen(false);
            await refresh();
        } catch (e: any) {
            showToast(e?.message || 'Erreur lors du refus.', 'error');
        } finally {
            setActionLoading(false);
        }
    }

    async function handleCancel() {
        if (!request) return;
        setActionLoading(true);
        try {
            await cancelMobilityRequest(request.id);
            showToast('Demande annulée.', 'success');
            await refresh();
        } catch (e: any) {
            showToast(e?.message || "Erreur lors de l'annulation.", 'error');
        } finally {
            setActionLoading(false);
        }
    }

    const createdAtLabel = useMemo(
        () => request?.createdAt ? format(new Date(request.createdAt), 'dd MMM yyyy', { locale: fr }) : '—',
        [request?.createdAt]
    );

    if (isLoading) {
        return (
            <div className="p-10 flex flex-col items-center justify-center gap-4 text-secondary-400">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                <p className="font-bold uppercase tracking-widest text-[10px]">Chargement...</p>
            </div>
        );
    }

    if (error || !request) {
        return (
            <div className="p-10 flex flex-col items-center justify-center gap-4 text-center">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-secondary-500 font-medium">{error || 'Demande introuvable.'}</p>
                <Button variant="outline" onClick={() => router.push('/m/personnel/mobility')}>Retour</Button>
            </div>
        );
    }

    const statusLabel = MOBILITY_STATUS_LABELS[request.status as MobilityStatus] || request.status;
    const statusBadgeClass = getStatusBadgeClass(request.status as string);
    const typeLabel = MOBILITY_TYPE_LABELS[request.type as MobilityType] || request.type;

    const isDraft = request.status === MOBILITY_STATUS.DRAFT;
    const isApprovalStep = APPROVAL_STATUSES.includes(request.status as string);
    const isTerminal = TERMINAL_STATUSES.includes(request.status as string);

    return (
        <PageShell>
            <PageHeader
                title="Détail de la demande"
                description="Mobilité RH — suivi et validation"
                backHref="/m/personnel/mobility"
                actions={
                    <Badge
                        variant="outline"
                        className={`font-black text-[10px] uppercase py-2 px-3 rounded-xl border shadow-sm ${statusBadgeClass}`}
                    >
                        {statusLabel}
                    </Badge>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2/3 — Detail card */}
                <Card className="lg:col-span-2 border-none shadow-sm-200/40 bg-white rounded-xl">
                    <CardHeader className="p-8 border-b border-secondary-50">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-black text-secondary-900 uppercase tracking-tight">
                                    Demande de mobilité
                                </CardTitle>
                                <CardDescription className="text-sm font-medium italic">
                                    Créée le {createdAtLabel}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <ArrowRightLeft className="w-4 h-4 text-secondary-300" />
                                <Badge variant="outline" className="bg-primary-50 text-primary-600 border-primary-100 font-black text-[10px]">
                                    {typeLabel}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8 space-y-6">
                        {/* Employee + Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">
                                    Employé
                                </Label>
                                <div className="flex items-center gap-2 rounded-2xl border border-secondary-100 bg-secondary-50/30 px-4 py-3">
                                    <User className="w-4 h-4 text-secondary-400" />
                                    <p className="font-black text-secondary-900 truncate">
                                        {employeeName || extractId(request.employee)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">
                                    Type de mobilité
                                </Label>
                                <div className="flex items-center gap-2 rounded-2xl border border-secondary-100 bg-secondary-50/30 px-4 py-3">
                                    <ArrowRightLeft className="w-4 h-4 text-secondary-400" />
                                    <p className="font-black text-secondary-900">{typeLabel}</p>
                                </div>
                            </div>
                        </div>

                        {/* Target fields */}
                        {(request.targetDepartment || request.targetJobRole || request.targetJobRoleId || request.targetGrade || request.targetGradeId) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {request.targetDepartment && (
                                    <div className="space-y-2">
                                        <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">
                                            Département cible
                                        </Label>
                                        <div className="flex items-center gap-2 rounded-2xl border border-secondary-100 bg-secondary-50/30 px-4 py-3">
                                            <Building2 className="w-4 h-4 text-secondary-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-black text-secondary-900 truncate">
                                                    {departmentName || extractId(request.targetDepartment)}
                                                </p>
                                                <p className="text-[10px] font-mono text-secondary-400">{extractId(request.targetDepartment)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {(request.targetJobRole || request.targetJobRoleId) && (
                                    <div className="space-y-2">
                                        <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">
                                            Fiche métier cible
                                        </Label>
                                        <div className="flex items-center gap-2 rounded-2xl border border-secondary-100 bg-secondary-50/30 px-4 py-3">
                                            <FileText className="w-4 h-4 text-secondary-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-black text-secondary-900 truncate">
                                                    {jobRoleName || extractId(request.targetJobRoleId || request.targetJobRole)}
                                                </p>
                                                <p className="text-[10px] font-mono text-secondary-400">
                                                    {extractId(request.targetJobRoleId || request.targetJobRole)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {(request.targetGrade || request.targetGradeId) && (
                                    <div className="space-y-2">
                                        <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">
                                            Grade cible
                                        </Label>
                                        <div className="flex items-center gap-2 rounded-2xl border border-secondary-100 bg-secondary-50/30 px-4 py-3">
                                            <FileText className="w-4 h-4 text-secondary-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-black text-secondary-900 truncate">
                                                    {gradeName || extractId(request.targetGradeId || request.targetGrade)}
                                                </p>
                                                <p className="text-[10px] font-mono text-secondary-400">
                                                    {extractId(request.targetGradeId || request.targetGrade)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">
                                Motif / justification
                            </Label>
                            <div className="rounded-2xl border border-secondary-100 bg-secondary-50/30 p-4">
                                <p className="text-sm font-medium text-secondary-700 whitespace-pre-wrap">
                                    {request.reason || request.justification || '—'}
                                </p>
                            </div>
                        </div>

                        {/* Rejection reason */}
                        {request.rejectionReason && (
                            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 mb-2">
                                    Motif du refus
                                </p>
                                <p className="text-sm font-medium text-rose-700 whitespace-pre-wrap">
                                    {request.rejectionReason}
                                </p>
                            </div>
                        )}

                        {/* Workflow timeline */}
                        <div className="space-y-3">
                            <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">
                                Progression du circuit
                            </Label>
                            <WorkflowTimeline status={request.status as string} />
                        </div>
                    </CardContent>
                </Card>

                {/* 1/3 — Actions */}
                <Card className="border-none shadow-sm-200/40 bg-white rounded-xl">
                    <CardHeader className="p-8 border-b border-secondary-50">
                        <CardTitle className="text-lg font-black text-secondary-900 uppercase tracking-tight">
                            Actions
                        </CardTitle>
                        <CardDescription className="text-sm font-medium italic">
                            Opérations disponibles
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        {/* Statut pill */}
                        <div className={`rounded-2xl border px-4 py-3 space-y-1 ${statusBadgeClass}`}>
                            <p className="text-[10px] font-black uppercase tracking-widest">Statut actuel</p>
                            <p className="font-black text-sm">{statusLabel}</p>
                        </div>

                        {isDraft && (
                            <>
                                <Button
                                    onClick={() => setSubmitOpen(true)}
                                    disabled={actionLoading}
                                    className="w-full py-6 rounded-2xl font-black uppercase tracking-widest bg-primary-600 hover:bg-primary-700 shadow-xl shadow-primary-100 text-white gap-2"
                                >
                                    <SendHorizonal className="w-4 h-4" />
                                    Soumettre
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={actionLoading}
                                    className="w-full py-6 rounded-2xl font-black uppercase tracking-widest text-secondary-500 border-secondary-200 hover:bg-secondary-50 gap-2"
                                >
                                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Annuler
                                </Button>
                            </>
                        )}

                        {isApprovalStep && (
                            <>
                                <Button
                                    onClick={() => setApproveOpen(true)}
                                    disabled={actionLoading}
                                    className="w-full py-6 rounded-2xl font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 text-white gap-2"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Approuver
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setRejectOpen(true)}
                                    disabled={actionLoading}
                                    className="w-full py-6 rounded-2xl font-black uppercase tracking-widest text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white shadow-sm gap-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Refuser
                                </Button>
                            </>
                        )}

                        {isTerminal && (
                            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                                <FileText className="w-10 h-10 text-secondary-200" />
                                <p className="font-black uppercase tracking-widest text-[10px] text-secondary-400">
                                    État final
                                </p>
                                <p className="text-secondary-500 font-medium text-sm">
                                    Aucune action disponible.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <SubmitModal open={submitOpen} onClose={() => setSubmitOpen(false)} onConfirm={handleSubmit} isLoading={actionLoading} />
            <ApproveModal open={approveOpen} onClose={() => setApproveOpen(false)} onConfirm={handleApprove} isLoading={actionLoading} />
            <RejectModal open={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={handleReject} isLoading={actionLoading} />
        </PageShell>
    );
}
