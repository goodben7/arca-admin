'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    FileText,
    Loader2,
    MessageSquare,
    XCircle,
    ArrowLeft,
    Building2,
    Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Input';
import { Input } from '@/components/ui/Input';
import { getDepartments, getEmployeeById } from '@/lib/api/employee';
import { getAllPositions } from '@/lib/api/position';
import {
    approveRecruitmentRequest,
    getRecruitmentRequestById,
    rejectRecruitmentRequest
} from '@/lib/api/recruitment';
import { RecruitmentRequest, RECRUITMENT_REQUEST_STATUS, STATUS_APPROVED, STATUS_PENDING, STATUS_REJECTED } from '@/types/recruitment';

function normalizeId(v?: string) {
    if (!v) return '';
    const parts = v.split('/').filter(Boolean);
    return parts[parts.length - 1] || v;
}

function getStatusVariant(status: string) {
    switch (status) {
        case STATUS_PENDING:
            return { variant: 'warning' as const, className: 'bg-amber-50 text-amber-700 border-amber-100' };
        case STATUS_APPROVED:
            return { variant: 'success' as const, className: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
        case STATUS_REJECTED:
            return { variant: 'destructive' as const, className: 'bg-rose-50 text-rose-700 border-rose-100' };
        default:
            return { variant: 'outline' as const, className: 'bg-secondary-50 text-secondary-600 border-secondary-100' };
    }
}

function ApproveModal({
    open,
    onClose,
    onConfirm,
    isLoading,
    request
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
    request: RecruitmentRequest | null;
}) {
    if (!open || !request) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-secondary-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-md border-none shadow-3xl bg-white rounded-[40px] overflow-hidden">
                <CardHeader className="p-8 bg-emerald-50/50 border-b border-emerald-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-black text-secondary-900 uppercase tracking-tighter">
                                Approuver la demande
                            </CardTitle>
                            <p className="text-xs font-medium text-secondary-500 truncate">
                                {request.department}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-9 w-9">
                        <XCircle className="w-4 h-4 text-secondary-500" />
                    </Button>
                </CardHeader>

                <CardContent className="p-8 space-y-6">
                    <div className="space-y-2 rounded-2xl border border-secondary-100 bg-secondary-50/40 p-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary-400">
                            <Briefcase className="w-3.5 h-3.5" />
                            Poste
                        </div>
                        <div className="font-black text-secondary-900 text-sm">
                            {request.position}
                        </div>
                        <div className="text-[11px] font-black text-secondary-600">
                            {request.numberOfPositions} poste(s)
                        </div>
                    </div>

                    <div className="text-sm text-secondary-600 font-medium">
                        Confirmer l’approbation de cette demande de recrutement.
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-6 rounded-2xl font-bold uppercase tracking-widest text-xs border-secondary-200"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 py-6 rounded-2xl font-black uppercase tracking-widest text-xs bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 gap-2 text-white"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4" />
                            )}
                            {isLoading ? 'Traitement...' : 'Confirmer'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function RejectModal({
    open,
    onClose,
    onConfirm,
    isLoading,
    request
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    isLoading: boolean;
    request: RecruitmentRequest | null;
}) {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (open) setReason('');
    }, [open]);

    if (!open || !request) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-secondary-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-md border-none shadow-3xl bg-white rounded-[40px] overflow-hidden">
                <CardHeader className="p-8 bg-accent-red-50/50 border-b border-accent-red-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 bg-accent-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent-red-100 shrink-0">
                            <XCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-black text-secondary-900 uppercase tracking-tighter">
                                Refuser la demande
                            </CardTitle>
                            <p className="text-xs font-medium text-secondary-500 truncate">
                                {request.department}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-9 w-9">
                        <XCircle className="w-4 h-4 text-secondary-500" />
                    </Button>
                </CardHeader>

                <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                        <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400 flex items-center gap-1.5">
                            Motif du refus <span className="text-accent-red-500">*</span>
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
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-6 rounded-2xl font-bold uppercase tracking-widest text-xs border-secondary-200"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={() => onConfirm(reason)}
                            disabled={isLoading || !reason.trim()}
                            className="flex-1 py-6 rounded-2xl font-black uppercase tracking-widest text-xs bg-accent-red-600 hover:bg-accent-red-700 shadow-xl shadow-accent-red-100 gap-2 text-white"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <MessageSquare className="w-4 h-4" />
                            )}
                            {isLoading ? 'Traitement...' : 'Confirmer le refus'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function RecruitmentDetailsPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const recruitmentRequestId = (params?.id || '') as string;

    const [request, setRequest] = useState<RecruitmentRequest | null>(null);
    const [departmentsMap, setDepartmentsMap] = useState<Record<string, string>>({});
    const [positionsMap, setPositionsMap] = useState<Record<string, string>>({});
    const [requesterName, setRequesterName] = useState<string>('');

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [approveOpen, setApproveOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                setError(null);

                const reqData = await getRecruitmentRequestById(recruitmentRequestId);
                setRequest(reqData);

                // Load maps for display
                const [deptsData, posData]:any = await Promise.all([getDepartments(), getAllPositions()]);

                const dList = Array.isArray(deptsData) ? deptsData : deptsData['hydra:member'] || [];
                const dMap: Record<string, string> = {};
                dList.forEach((d: any) => {
                    dMap[d.id] = d.name;
                    if (d['@id']) dMap[d['@id']] = d.name;
                });
                setDepartmentsMap(dMap);

                const pList = Array.isArray(posData) ? posData : posData['hydra:member'] || posData['member'] || [];
                const pMap: Record<string, string> = {};
                pList.forEach((p: any) => {
                    pMap[p.id] = p.title;
                    if (p['@id']) pMap[p['@id']] = p.title;
                });
                setPositionsMap(pMap);

                // Requester label
                const requesterIriOrId = reqData.requestedBy;
                if (requesterIriOrId) {
                    const requesterId = normalizeId(requesterIriOrId);
                    const emp = await getEmployeeById(requesterId).catch(() => null);
                    if (emp) setRequesterName(`${(emp as any).firstName} ${(emp as any).lastName}`.trim());
                }
            } catch (e: any) {
                setError(e?.message || "Erreur lors du chargement de la demande.");
            } finally {
                setIsLoading(false);
            }
        }

        if (recruitmentRequestId) fetchData();
    }, [recruitmentRequestId]);

    const departmentLabel = useMemo(() => {
        if (!request) return '';
        return departmentsMap[request.department] || departmentsMap[normalizeId(request.department)] || request.department;
    }, [departmentsMap, request]);

    const positionLabel = useMemo(() => {
        if (!request) return '';
        return positionsMap[request.position] || positionsMap[normalizeId(request.position)] || request.position;
    }, [positionsMap, request]);

    function showToast(msg: string, type: 'success' | 'error') {
        setToast({ msg, type });
        window.setTimeout(() => setToast(null), 4500);
    }

    async function handleApprove() {
        if (!request) return;
        setActionLoading(true);
        try {
            await approveRecruitmentRequest(request.id);
            showToast('Demande approuvée avec succès.', 'success');
            setApproveOpen(false);
            const refreshed = await getRecruitmentRequestById(request.id);
            setRequest(refreshed);
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
            await rejectRecruitmentRequest(request.id, reason);
            showToast('Demande refusée.', 'success');
            setRejectOpen(false);
            const refreshed = await getRecruitmentRequestById(request.id);
            setRequest(refreshed);
        } catch (e: any) {
            showToast(e?.message || 'Erreur lors du refus.', 'error');
        } finally {
            setActionLoading(false);
        }
    }

    const statusInfo = request ? getStatusVariant(String(request.status)) : null;
    const createdAtLabel = request?.createdAt
        ? format(new Date(request.createdAt), 'dd MMM yyyy', { locale: fr })
        : '-';

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
                <p className="text-secondary-500 font-medium">{error || "Demande introuvable."}</p>
                <Button variant="outline" onClick={() => router.push('/recruitment')}>
                    Retour
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-[70] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-right duration-300 ${
                        toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-accent-red-600 text-white'
                    }`}
                >
                    {toast.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                    ) : (
                        <AlertCircle className="w-5 h-5 shrink-0" />
                    )}
                    {toast.msg}
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="h-12 px-4 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                        onClick={() => router.push('/recruitment')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black text-secondary-900 uppercase tracking-tighter">
                            Détails demande
                        </h1>
                        <p className="text-secondary-500 font-medium italic">
                            Validation du recrutement.
                        </p>
                    </div>
                </div>
                {statusInfo && (
                    <Badge
                        variant={statusInfo.variant as any}
                        className={`font-black text-[10px] uppercase py-2 px-3 rounded-xl border shadow-sm ${statusInfo.className}`}
                    >
                        {request.status}
                    </Badge>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-none shadow-2xl shadow-secondary-200/40 bg-white rounded-[40px]">
                    <CardHeader className="p-8 border-b border-secondary-50">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-black text-secondary-900 uppercase tracking-tight">
                                    Demande & justificatif
                                </CardTitle>
                                <CardDescription className="text-sm font-medium italic">
                                    {createdAtLabel}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-secondary-300" />
                                <Badge variant="outline" className="bg-primary-50 text-primary-600 border-primary-100 font-black text-[10px]">
                                    {request.numberOfPositions} poste(s)
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">
                                    Département
                                </Label>
                                <div className="flex items-center gap-2 rounded-2xl border border-secondary-100 bg-secondary-50/30 px-4 py-3">
                                    <Building2 className="w-4 h-4 text-secondary-400" />
                                    <p className="font-black text-secondary-900 truncate">{departmentLabel}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">
                                    Poste
                                </Label>
                                <div className="flex items-center gap-2 rounded-2xl border border-secondary-100 bg-secondary-50/30 px-4 py-3">
                                    <Briefcase className="w-4 h-4 text-secondary-400" />
                                    <p className="font-black text-secondary-900 truncate">{positionLabel}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 space-y-2">
                            <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">
                                Justification
                            </Label>
                            <div className="rounded-2xl border border-secondary-100 bg-secondary-50/30 p-4">
                                <p className="text-sm font-medium text-secondary-700 whitespace-pre-wrap">
                                    {request.justification || '-'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-2xl shadow-secondary-200/40 bg-white rounded-[40px]">
                    <CardHeader className="p-8 border-b border-secondary-50">
                        <CardTitle className="text-lg font-black text-secondary-900 uppercase tracking-tight">
                            Actions
                        </CardTitle>
                        <CardDescription className="text-sm font-medium italic">
                            Approbation ou refus
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        <div className="space-y-2 rounded-2xl border border-secondary-100 bg-secondary-50/30 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">
                                Demandeur
                            </p>
                            <p className="font-black text-secondary-900">
                                {requesterName || request.requestedBy}
                            </p>
                        </div>

                        {request.status === STATUS_PENDING ? (
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
                                    className="w-full py-6 rounded-2xl font-black uppercase tracking-widest text-accent-red-600 border-accent-red-100 bg-accent-red-50 hover:bg-accent-red-600 hover:text-white shadow-sm gap-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Refuser
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                                <FileText className="w-10 h-10 text-secondary-200" />
                                <p className="font-black uppercase tracking-widest text-[10px] text-secondary-400">
                                    Actions indisponibles
                                </p>
                                <p className="text-secondary-500 font-medium">
                                    Cette demande est déjà traitée.
                                </p>
                            </div>
                        )}

                        {request.rejectionReason && (
                            <div className="rounded-2xl border border-accent-red-100 bg-accent-red-50/60 p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-accent-red-700">
                                    Motif du refus
                                </p>
                                <p className="text-sm font-medium text-accent-red-700 whitespace-pre-wrap mt-2">
                                    {request.rejectionReason}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ApproveModal
                open={approveOpen}
                onClose={() => setApproveOpen(false)}
                onConfirm={handleApprove}
                isLoading={actionLoading}
                request={request}
            />
            <RejectModal
                open={rejectOpen}
                onClose={() => setRejectOpen(false)}
                onConfirm={handleReject}
                isLoading={actionLoading}
                request={request}
            />
        </div>
    );
}

