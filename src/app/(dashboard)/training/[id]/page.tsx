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
    BookOpen,
    Users,
    CalendarDays,
    ThumbsUp,
    ThumbsDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Input';
import { getDepartments } from '@/lib/api/employee';
import { getUserById } from '@/lib/api/profile';
import {
    approveTrainingRequest,
    getTrainingRequestById,
    rejectTrainingRequest,
} from '@/lib/api/training';
import {
    TrainingRequest,
    TRAINING_REQUEST_STATUS,
    STATUS_APPROVED,
    STATUS_PENDING,
    STATUS_REJECTED,
} from '@/types/training';

function normalizeId(v?: string) {
    if (!v) return '';
    const parts = v.split('/').filter(Boolean);
    return parts[parts.length - 1] || v;
}

function getStatusVariant(status: string) {
    switch (status) {
        case STATUS_PENDING:
            return { className: 'bg-amber-50 text-amber-700 border border-amber-200' };
        case STATUS_APPROVED:
            return { className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
        case STATUS_REJECTED:
            return { className: 'bg-rose-50 text-rose-700 border border-rose-200' };
        default:
            return { className: 'bg-secondary-50 text-secondary-600 border border-secondary-200' };
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case STATUS_PENDING:   return 'En attente';
        case STATUS_APPROVED:  return 'Approuvée';
        case STATUS_REJECTED:  return 'Refusée';
        default:               return status;
    }
}

function getPriorityLabel(priority: string) {
    switch (priority) {
        case 'LOW':    return 'Faible';
        case 'MEDIUM': return 'Moyenne';
        case 'HIGH':   return 'Haute';
        default:       return priority;
    }
}

function getPriorityClass(priority: string) {
    switch (priority) {
        case 'HIGH':   return 'bg-rose-50 text-rose-700 border border-rose-200';
        case 'MEDIUM': return 'bg-amber-50 text-amber-700 border border-amber-200';
        case 'LOW':    return 'bg-sky-50 text-sky-700 border border-sky-200';
        default:       return 'bg-secondary-50 text-secondary-600 border border-secondary-200';
    }
}

// ── Approve Modal ─────────────────────────────────────────────────────────────
function ApproveModal({
    open,
    onClose,
    onConfirm,
    isLoading,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                        <ThumbsUp className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-secondary-900 uppercase tracking-tight">
                            Approuver la demande
                        </h3>
                        <p className="text-xs text-secondary-400 font-medium">
                            Cette action est irréversible
                        </p>
                    </div>
                </div>
                <p className="text-sm text-secondary-600 font-medium leading-relaxed">
                    Vous êtes sur le point d'approuver cette demande de formation. Elle sera transmise pour planification.
                </p>
                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={onClose} className="rounded-2xl px-6 font-bold uppercase tracking-widest text-xs">
                        Annuler
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="rounded-2xl px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Confirmer
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({
    open,
    onClose,
    onConfirm,
    isLoading,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    isLoading: boolean;
}) {
    const [reason, setReason] = useState('');
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
                        <ThumbsDown className="w-7 h-7 text-rose-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-secondary-900 uppercase tracking-tight">
                            Refuser la demande
                        </h3>
                        <p className="text-xs text-secondary-400 font-medium">
                            Un motif est obligatoire
                        </p>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="uppercase tracking-widest text-[10px] font-black text-secondary-400">
                        Motif du refus *
                    </Label>
                    <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        placeholder="Expliquez la raison du refus..."
                        className="bg-secondary-50/30"
                    />
                </div>
                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={onClose} className="rounded-2xl px-6 font-bold uppercase tracking-widest text-xs">
                        Annuler
                    </Button>
                    <Button
                        onClick={() => reason.trim() && onConfirm(reason)}
                        disabled={isLoading || !reason.trim()}
                        className="rounded-2xl px-8 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Confirmer le refus
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TrainingRequestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [request, setRequest] = useState<TrainingRequest | null>(null);
    const [departments, setDepartments] = useState<any[]>([]);
    const [requestedByName, setRequestedByName] = useState<string | null>(null);
    const [approvedByName, setApprovedByName] = useState<string | null>(null);
    const [rejectedByName, setRejectedByName] = useState<string | null>(null);

    const [isFetching, setIsFetching] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [isActioning, setIsActioning] = useState(false);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        if (!id) return;
        async function fetchAll() {
            try {
                setIsFetching(true);
                const [req, depts] = await Promise.all([
                    getTrainingRequestById(id as string),
                    getDepartments(),
                ]);
                setRequest(req);
                const deptsArr = Array.isArray(depts) ? depts : (depts as any)['hydra:member'] || [];
                setDepartments(deptsArr);

                if (req.requestedBy) {
                    getUserById(normalizeId(req.requestedBy))
                        .then((u) => setRequestedByName(u.email))
                        .catch(() => setRequestedByName(normalizeId(req.requestedBy)));
                }
                if (req.approvedBy) {
                    getUserById(normalizeId(req.approvedBy))
                        .then((u) => setApprovedByName(u.email))
                        .catch(() => setApprovedByName(normalizeId(req.approvedBy)));
                }
                if (req.rejectedBy) {
                    getUserById(normalizeId(req.rejectedBy))
                        .then((u) => setRejectedByName(u.email))
                        .catch(() => setRejectedByName(normalizeId(req.rejectedBy)));
                }
            } catch (e: any) {
                setFetchError(e?.message || 'Erreur lors du chargement.');
            } finally {
                setIsFetching(false);
            }
        }
        fetchAll();
    }, [id]);

    const departmentName = useMemo(() => {
        if (!request?.department || !departments.length) return request?.department || '—';
        const depId = normalizeId(request.department);
        const dep = departments.find(
            (d) => normalizeId(d['@id'] || d.id) === depId || d.id === depId
        );
        return dep ? `${dep.code} - ${dep.name}` : request.department;
    }, [request, departments]);

    const handleApprove = async () => {
        if (!request) return;
        setIsActioning(true);
        setActionError(null);
        try {
            await approveTrainingRequest(request.id);
            showToast('Demande approuvée avec succès.');
            setShowApproveModal(false);
            const updated = await getTrainingRequestById(request.id);
            setRequest(updated);
        } catch (e: any) {
            setActionError(e?.message || "Erreur lors de l'approbation.");
        } finally {
            setIsActioning(false);
        }
    };

    const handleReject = async (reason: string) => {
        if (!request) return;
        setIsActioning(true);
        setActionError(null);
        try {
            await rejectTrainingRequest(request.id, reason);
            showToast('Demande refusée.');
            setShowRejectModal(false);
            const updated = await getTrainingRequestById(request.id);
            setRequest(updated);
        } catch (e: any) {
            setActionError(e?.message || 'Erreur lors du refus.');
        } finally {
            setIsActioning(false);
        }
    };

    const isPending = request?.status === STATUS_PENDING;

    if (isFetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                <p className="text-secondary-400 font-bold uppercase tracking-widest text-[10px]">
                    Chargement de la demande...
                </p>
            </div>
        );
    }

    if (fetchError || !request) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-secondary-600 font-bold">{fetchError || 'Demande introuvable.'}</p>
                <Button onClick={() => router.back()} variant="outline" className="rounded-2xl">
                    Retour
                </Button>
            </div>
        );
    }

    const statusStyle = getStatusVariant(request.status);

    return (
        <>
            {/* Toast */}
            {toast && (
                <div className="fixed top-6 right-6 z-50 bg-secondary-900 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm animate-in slide-in-from-top-4 duration-300 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    {toast}
                </div>
            )}

            <ApproveModal
                open={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                onConfirm={handleApprove}
                isLoading={isActioning}
            />
            <RejectModal
                open={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onConfirm={handleReject}
                isLoading={isActioning}
            />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="p-0 hover:bg-transparent text-secondary-500 hover:text-secondary-900 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-all">
                                <ArrowLeft className="w-5 h-5" />
                            </div>
                        </Button>
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-black text-secondary-900 uppercase tracking-tighter">
                                    {request.title}
                                </h1>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusStyle.className}`}>
                                    {getStatusLabel(request.status)}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest italic mt-1">
                                Demande de formation · {request.createdAt
                                    ? format(new Date(request.createdAt), 'dd MMMM yyyy', { locale: fr })
                                    : '—'}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    {isPending && (
                        <div className="flex items-center gap-3 shrink-0">
                            <Button
                                onClick={() => setShowRejectModal(true)}
                                className="rounded-2xl px-6 py-5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all"
                            >
                                <XCircle className="w-4 h-4" />
                                Refuser
                            </Button>
                            <Button
                                onClick={() => setShowApproveModal(true)}
                                className="rounded-2xl px-6 py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Approuver
                            </Button>
                        </div>
                    )}
                </div>

                {actionError && (
                    <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-2xl text-destructive text-sm font-bold flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {actionError}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Infos principales */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Détails */}
                        <Card className="border-none shadow-xl shadow-secondary-200/50 rounded-3xl overflow-hidden">
                            <CardHeader className="bg-secondary-50/50 border-b border-secondary-100 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-white" />
                                    </div>
                                    <CardTitle className="text-base font-black uppercase tracking-tight text-secondary-900">
                                        Détails de la formation
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Département</p>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-secondary-400" />
                                            <p className="text-sm font-bold text-secondary-900">{departmentName}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Participants</p>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-secondary-400" />
                                            <p className="text-sm font-bold text-secondary-900">{request.numberOfParticipants} personne(s)</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Priorité</p>
                                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getPriorityClass(request.priority)}`}>
                                            {getPriorityLabel(request.priority)}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Date de création</p>
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="w-4 h-4 text-secondary-400" />
                                            <p className="text-sm font-bold text-secondary-900">
                                                {request.createdAt
                                                    ? format(new Date(request.createdAt), 'dd MMMM yyyy', { locale: fr })
                                                    : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Description */}
                        {request.description && (
                            <Card className="border-none shadow-xl shadow-secondary-200/50 rounded-3xl overflow-hidden">
                                <CardHeader className="bg-secondary-50/50 border-b border-secondary-100 p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-secondary-600" />
                                        </div>
                                        <CardTitle className="text-base font-black uppercase tracking-tight text-secondary-900">
                                            Description
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <p className="text-sm text-secondary-700 font-medium leading-relaxed whitespace-pre-wrap">
                                        {request.description}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Motif de refus */}
                        {request.status === STATUS_REJECTED && request.rejectionReason && (
                            <Card className="border-none shadow-xl shadow-rose-100/50 rounded-3xl overflow-hidden">
                                <CardHeader className="bg-rose-50/50 border-b border-rose-100 p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                                            <MessageSquare className="w-5 h-5 text-rose-600" />
                                        </div>
                                        <CardTitle className="text-base font-black uppercase tracking-tight text-rose-700">
                                            Motif du refus
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <p className="text-sm text-rose-700 font-medium leading-relaxed whitespace-pre-wrap">
                                        {request.rejectionReason}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        {/* Statut */}
                        <Card className="border-none shadow-xl shadow-secondary-200/50 rounded-3xl overflow-hidden">
                            <CardHeader className="bg-secondary-50/50 border-b border-secondary-100 p-5">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-secondary-400">
                                    Statut
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    {request.status === STATUS_PENDING && <Clock className="w-5 h-5 text-amber-500" />}
                                    {request.status === STATUS_APPROVED && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                    {request.status === STATUS_REJECTED && <XCircle className="w-5 h-5 text-rose-500" />}
                                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusStyle.className}`}>
                                        {getStatusLabel(request.status)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Personnes */}
                        <Card className="border-none shadow-xl shadow-secondary-200/50 rounded-3xl overflow-hidden">
                            <CardHeader className="bg-secondary-50/50 border-b border-secondary-100 p-5">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-secondary-400">
                                    Intervenants
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Demandé par</p>
                                    <p className="text-sm font-bold text-secondary-900">
                                        {requestedByName ?? '—'}
                                    </p>
                                </div>

                                {request.status === STATUS_APPROVED && (
                                    <div className="space-y-1 pt-3 border-t border-secondary-100">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Approuvé par</p>
                                        <p className="text-sm font-bold text-secondary-900">
                                            {approvedByName ?? '—'}
                                        </p>
                                        {request.approvedAt && (
                                            <p className="text-xs text-secondary-400 font-medium">
                                                {format(new Date(request.approvedAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {request.status === STATUS_REJECTED && (
                                    <div className="space-y-1 pt-3 border-t border-secondary-100">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Refusé par</p>
                                        <p className="text-sm font-bold text-secondary-900">
                                            {rejectedByName ?? '—'}
                                        </p>
                                        {request.rejectedAt && (
                                            <p className="text-xs text-secondary-400 font-medium">
                                                {format(new Date(request.rejectedAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
