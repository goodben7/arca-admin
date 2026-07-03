'use client';

import { useState, useEffect } from 'react';
import {
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    MoreVertical,
    Plus,
    Loader2,
    AlertCircle,
    Search,
    X,
    MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label, Input } from '@/components/ui/Input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/Table';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { getAllLeaveRequests, approveLeaveRequest, rejectLeaveRequest } from '@/lib/api/leave';
import { getAllEmployees } from '@/lib/api/employee';
import { getAllDocuments } from '@/lib/api/document';
import { BASE_URL } from '@/lib/api/client';
import { LeaveRequest, LEAVE_STATUS, LEAVE_TYPE } from '@/types/leave';
import { Employee } from '@/types/employee';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/layout/FilterBar';
import { DataPanel } from '@/components/layout/DataPanel';
import { PageKpiStrip } from '@/components/layout/PageKpi';

// ─── Rejection Modal ───────────────────────────────────────────────────────────
function RejectModal({
    request,
    employeeName,
    onConfirm,
    onCancel,
    isLoading,
}: {
    request: LeaveRequest;
    employeeName: string;
    onConfirm: (raison: string) => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    const [raison, setRaison] = useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-md border-none shadow-3xl bg-white rounded-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <CardHeader className="p-8 bg-accent-red-50/50 border-b border-accent-red-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-accent-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent-red-100">
                            <XCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-black text-secondary-900 uppercase tracking-tighter">Refuser la demande</CardTitle>
                            <p className="text-xs font-medium text-secondary-500 mt-0.5">{employeeName}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full h-9 w-9 hover:bg-accent-red-100">
                        <X className="w-4 h-4" />
                    </Button>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    {/* Request summary */}
                    <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-2xl border border-secondary-100">
                        <Calendar className="w-4 h-4 text-secondary-400 shrink-0" />
                        <div className="text-xs font-bold text-secondary-600 uppercase">
                            {format(new Date(request.startDate), 'dd MMM yyyy', { locale: fr })} → {format(new Date(request.endDate), 'dd MMM yyyy', { locale: fr })}
                            <span className="ml-2 text-primary-600">({request.numberOfDays} jours)</span>
                        </div>
                    </div>

                    {/* Reason field */}
                    <div className="space-y-2">
                        <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400 flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3" />
                            Motif du refus <span className="text-accent-red-500">*</span>
                        </Label>
                        <textarea
                            rows={4}
                            value={raison}
                            onChange={e => setRaison(e.target.value)}
                            placeholder="Expliquez la raison du refus à l'employé..."
                            className="w-full px-4 py-3 text-sm font-medium border border-secondary-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-red-500/20 focus:border-accent-red-400 transition-all resize-none bg-secondary-50/30 placeholder-secondary-300"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="flex-1 py-6 rounded-2xl font-bold uppercase tracking-widest text-xs border-secondary-200"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={() => onConfirm(raison)}
                            disabled={isLoading || !raison.trim()}
                            className="flex-1 py-6 rounded-2xl font-black uppercase tracking-widest text-xs bg-accent-red-600 hover:bg-accent-red-700 shadow-xl shadow-accent-red-100 gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <XCircle className="w-4 h-4" />
                                    Confirmer le refus
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Approve Modal ────────────────────────────────────────────────────────────
function ApproveModal({
    request,
    employeeName,
    onConfirm,
    onCancel,
    isLoading,
}: {
    request: LeaveRequest;
    employeeName: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-md border-none shadow-3xl bg-white rounded-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <CardHeader className="p-8 bg-emerald-50/50 border-b border-emerald-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-black text-secondary-900 uppercase tracking-tighter">Approuver la demande</CardTitle>
                            <p className="text-xs font-medium text-secondary-500 mt-0.5">{employeeName}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full h-9 w-9 hover:bg-emerald-100 text-secondary-500">
                        <X className="w-4 h-4" />
                    </Button>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-2xl border border-secondary-100">
                        <Calendar className="w-4 h-4 text-secondary-400 shrink-0" />
                        <div className="text-xs font-bold text-secondary-600 uppercase">
                            {format(new Date(request.startDate), 'dd MMM yyyy', { locale: fr })} → {format(new Date(request.endDate), 'dd MMM yyyy', { locale: fr })}
                            <span className="ml-2 text-primary-600">({request.numberOfDays} jours)</span>
                        </div>
                    </div>

                    <p className="text-sm text-secondary-600 font-medium">
                        Souhaitez-vous valider cette demande de congé ? L'employé sera notifié du statut d'approbation.
                    </p>

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={onCancel}
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
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Confirmer
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function LeaveManagementPage() {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [employees, setEmployees] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // request id being acted upon
    const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
    const [approveTarget, setApproveTarget] = useState<LeaveRequest | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [avatarsMap, setAvatarsMap] = useState<Record<string, string>>({});
    const [search, setSearch] = useState('');

    async function fetchData() {
        try {
            setIsLoading(true);
            const [leaveData, empData, docsData] = await Promise.all([
                getAllLeaveRequests().catch(() => ({ 'hydra:member': [] })),
                getAllEmployees().catch(() => ({ 'hydra:member': [] })),
                getAllDocuments({ type: 'PHOTO', holderType: 'EMPLOYEE' }).catch(() => ({ 'hydra:member': [] }))
            ]);
            const leaveList = Array.isArray(leaveData) ? leaveData : leaveData['hydra:member'] || [];
            setRequests(leaveList);
            const empList = Array.isArray(empData) ? empData : (empData as any)['hydra:member'] || [];
            const map: Record<string, string> = {};
            empList.forEach((emp: Employee) => {
                map[emp.id] = `${emp.firstName} ${emp.lastName}`;
                if (emp['@id']) map[emp['@id']] = `${emp.firstName} ${emp.lastName}`;
            });
            setEmployees(map);

            const docList = Array.isArray(docsData) ? docsData : (docsData as any)['hydra:member'] || [];
            const avMap: Record<string, string> = {};
            docList.forEach((doc: any) => {
                if (doc.holderId && doc.contentUrl) {
                    avMap[doc.holderId] = `${BASE_URL}${doc.contentUrl}`;
                }
            });
            setAvatarsMap(avMap);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => { fetchData(); }, []);

    function showToast(msg: string, type: 'success' | 'error') {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    }

    async function handleApprove() {
        if (!approveTarget) return;
        setActionLoading(approveTarget.id);
        try {
            await approveLeaveRequest(approveTarget.id);
            showToast(`Demande de ${employees[approveTarget.employee] || approveTarget.employee} approuvée avec succès.`, 'success');
            setApproveTarget(null);
            fetchData();
        } catch (e: any) {
            showToast(e.message, 'error');
        } finally {
            setActionLoading(null);
        }
    }

    async function handleReject(raison: string) {
        if (!rejectTarget) return;
        setActionLoading(rejectTarget.id);
        try {
            await rejectLeaveRequest(rejectTarget.id, raison);
            showToast(`Demande refusée.`, 'success');
            setRejectTarget(null);
            fetchData();
        } catch (e: any) {
            showToast(e.message, 'error');
        } finally {
            setActionLoading(null);
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case LEAVE_STATUS.APPROVED: return 'Approuvé';
            case LEAVE_STATUS.PENDING: return 'En attente';
            case LEAVE_STATUS.REJECTED: return 'Refusé';
            case LEAVE_STATUS.CANCELLED: return 'Annulé';
            default: return status;
        }
    };

    const filteredRequests = requests.filter((req) => {
        if (!search.trim()) return true;
        const name = (employees[req.employee] || req.employee).toLowerCase();
        return name.includes(search.toLowerCase());
    });

    const getStatusVariant = (status: string) => {
        switch (status) {
            case LEAVE_STATUS.APPROVED: return 'success';
            case LEAVE_STATUS.PENDING: return 'warning';
            case LEAVE_STATUS.REJECTED: return 'destructive';
            case LEAVE_STATUS.CANCELLED: return 'secondary';
            default: return 'outline';
        }
    };

    const getLeaveLabel = (type: string) => {
        switch (type) {
            case LEAVE_TYPE.ANNUAL: return 'Congé annuel';
            case LEAVE_TYPE.SICK: return 'Maladie';
            case LEAVE_TYPE.MATERNITY: return 'Maternité';
            case LEAVE_TYPE.PATERNITY: return 'Paternité';
            case LEAVE_TYPE.UNPAID: return 'Congé sabatique';
            default: return 'Autre';
        }
    };

    const stats = {
        pending: requests.filter(r => r.status === LEAVE_STATUS.PENDING).length,
        approved: requests.filter(r => r.status === LEAVE_STATUS.APPROVED).length,
        rejected: requests.filter(r => r.status === LEAVE_STATUS.REJECTED).length,
        absent: requests.filter(r => {
            const now = new Date(); const s = new Date(r.startDate); const e = new Date(r.endDate);
            return r.status === LEAVE_STATUS.APPROVED && now >= s && now <= e;
        }).length
    };

    if (isLoading) {
        return (
            <PageShell>
                <div className="p-20 flex flex-col items-center justify-center gap-4 text-secondary-400">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                    <p className="font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Chargement des demandes...</p>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            {/* Reject modal */}
            {rejectTarget && (
                <RejectModal
                    request={rejectTarget}
                    employeeName={employees[rejectTarget.employee] || rejectTarget.employee}
                    onConfirm={handleReject}
                    onCancel={() => setRejectTarget(null)}
                    isLoading={actionLoading === rejectTarget.id}
                />
            )}

            {/* Approve modal */}
            {approveTarget && (
                <ApproveModal
                    request={approveTarget}
                    employeeName={employees[approveTarget.employee] || approveTarget.employee}
                    onConfirm={handleApprove}
                    onCancel={() => setApproveTarget(null)}
                    isLoading={actionLoading === approveTarget.id}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className={cn(
                    "fixed top-6 right-6 z-[60] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-right duration-300",
                    toast.type === 'success' ? "bg-emerald-600 text-white" : "bg-accent-red-600 text-white"
                )}>
                    {toast.type === 'success'
                        ? <CheckCircle2 className="w-5 h-5 shrink-0" />
                        : <AlertCircle className="w-5 h-5 shrink-0" />
                    }
                    {toast.msg}
                </div>
            )}

            <PageHeader
                title="Gestion des Congés"
                description="Validez les demandes et suivez les absences de vos collaborateurs."
                actions={
                    <Link href="/leave/create">
                        <Button variant="pill" size="sm" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Nouvelle demande
                        </Button>
                    </Link>
                }
            />

            <PageKpiStrip
                items={[
                    { label: 'En attente', value: stats.pending, icon: Clock, tone: 'warning', detail: 'À valider' },
                    { label: 'Approuvées', value: stats.approved, icon: CheckCircle2, tone: 'success', detail: 'Demandes acceptées' },
                    { label: 'Refusées', value: stats.rejected, icon: XCircle, tone: 'danger', detail: 'Demandes rejetées' },
                    { label: 'Absents aujourd\'hui', value: stats.absent, icon: User, tone: 'primary', detail: 'Congés en cours' },
                ]}
            />

            <FilterBar>
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Rechercher un collaborateur..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-secondary-400"
                    />
                </div>
            </FilterBar>

            <DataPanel title="Demandes de congé" contentClassName="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-secondary-100">
                            <TableHead className="px-6">Collaborateur</TableHead>
                            <TableHead className="px-6">Type</TableHead>
                            <TableHead className="px-6">Période</TableHead>
                            <TableHead className="px-6">Durée</TableHead>
                            <TableHead className="px-6">Statut</TableHead>
                            <TableHead className="px-6 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRequests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                    Aucune demande de congé pour ce critère.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRequests.map((req) => {
                                const empId = req.employee?.split('/').pop() || '';
                                const employeeName = employees[req.employee] || req.employee;
                                const initials = employeeName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
                                const isActing = actionLoading === req.id;

                                return (
                                    <TableRow key={req.id} className="group">
                                        <TableCell className="px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-xl bg-secondary-100 border border-secondary-200 flex items-center justify-center overflow-hidden shrink-0">
                                                    {avatarsMap[empId] ? (
                                                        <img src={avatarsMap[empId]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-sm font-semibold text-secondary-600 uppercase">{initials}</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-secondary-900 truncate">{employeeName}</p>
                                                    <span className="text-xs font-medium text-primary-600">ARCA Personnel</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6">
                                            <Badge variant="outline">{getLeaveLabel(req.type)}</Badge>
                                        </TableCell>
                                        <TableCell className="px-6">
                                            <div className="text-sm text-secondary-800">
                                                <p>{format(new Date(req.startDate), 'dd MMM yyyy', { locale: fr })}</p>
                                                <p className="text-muted-foreground text-xs">→ {format(new Date(req.endDate), 'dd MMM yyyy', { locale: fr })}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6">
                                            <span className="text-sm font-medium text-foreground tabular-nums">{req.numberOfDays} jours</span>
                                        </TableCell>
                                        <TableCell className="px-6">
                                            <Badge variant={getStatusVariant(req.status)}>
                                                {getStatusLabel(req.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 text-right">
                                            {req.status === LEAVE_STATUS.PENDING ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        disabled={isActing}
                                                        onClick={() => setApproveTarget(req)}
                                                        className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Approuver
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={isActing}
                                                        onClick={() => setRejectTarget(req)}
                                                        className="h-9 gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" /> Refuser
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
                <div className="p-6 border-t border-primary-100/40 table-footer-wash">
                    <p className="text-sm text-secondary-600">
                        Affichage de <span className="font-semibold text-secondary-900">{filteredRequests.length}</span> sur <span className="font-semibold text-secondary-900">{requests.length}</span> demandes
                    </p>
                </div>
            </DataPanel>
        </PageShell>
    );
}
