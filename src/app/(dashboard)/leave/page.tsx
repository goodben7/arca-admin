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
            <Card className="w-full max-w-md border-none shadow-3xl bg-white rounded-[40px] overflow-hidden animate-in zoom-in-95 duration-200">
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function LeaveManagementPage() {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [employees, setEmployees] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // request id being acted upon
    const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [avatarsMap, setAvatarsMap] = useState<Record<string, string>>({});

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

    async function handleApprove(req: LeaveRequest) {
        setActionLoading(req.id);
        try {
            await approveLeaveRequest(req.id);
            showToast(`Demande de ${employees[req.employee] || req.employee} approuvée avec succès.`, 'success');
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
            case LEAVE_TYPE.ANNUAL: return 'Congé Annuel';
            case LEAVE_TYPE.SICK: return 'Maladie';
            case LEAVE_TYPE.MATERNITY: return 'Maternité';
            case LEAVE_TYPE.PATERNITY: return 'Paternité';
            case LEAVE_TYPE.UNPAID: return 'Congé Sabatique';
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
            <div className="p-20 flex flex-col items-center justify-center gap-4 text-secondary-400">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                <p className="font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Chargement des demandes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
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

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-secondary-900 uppercase tracking-tighter">Gestion des Congés</h1>
                    <p className="text-secondary-500 font-medium italic">Validez les demandes et suivez les absences de vos collaborateurs.</p>
                </div>
                <Link href="/leave/create">
                    <Button className="gap-2 shadow-xl shadow-primary-200 py-6 px-8 rounded-2xl transition-all active:scale-[0.98]">
                        <Plus className="w-5 h-5" />
                        <span className="font-bold uppercase tracking-tight">Nouvelle Demande</span>
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard title="En attente" count={stats.pending} icon={Clock} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" />
                <SummaryCard title="Approuvées" count={stats.approved} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" />
                <SummaryCard title="Refusées" count={stats.rejected} icon={XCircle} color="text-accent-red-600" bg="bg-accent-red-50" border="border-accent-red-100" />
                <SummaryCard title="Effectifs absents" count={stats.absent} icon={User} color="text-primary-600" bg="bg-primary-50" border="border-primary-100" />
            </div>

            {/* Table */}
            <Card className="overflow-hidden border-none shadow-2xl shadow-secondary-200/50 rounded-3xl bg-white">
                <div className="p-4 border-b border-secondary-100 bg-secondary-50/20 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher un collaborateur..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium"
                        />
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent uppercase tracking-wider text-[11px] font-black">
                            <TableHead>Collaborateur</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Période</TableHead>
                            <TableHead>Durée</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center text-secondary-400 font-medium italic">
                                    Aucune demande de congé enregistrée.
                                </TableCell>
                            </TableRow>
                        ) : (
                            requests.map((req) => {
                                const empId = req.employee?.split('/').pop() || '';
                                const employeeName = employees[req.employee] || req.employee;
                                const initials = employeeName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
                                const isActing = actionLoading === req.id;

                                return (
                                    <TableRow key={req.id} className="group hover:bg-secondary-50/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-50 to-secondary-100 flex items-center justify-center font-black text-xs text-secondary-600 border border-secondary-200 shadow-sm overflow-hidden">
                                                    {avatarsMap[empId] ? (
                                                        <img src={avatarsMap[empId]} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        initials
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-secondary-900 uppercase text-xs">{employeeName}</span>
                                                    <span className="text-[10px] text-secondary-400 font-medium">MCBS Staff</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-secondary-200 bg-white">
                                                {getLeaveLabel(req.type)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-[11px] font-bold text-secondary-600">
                                                <span>Du {format(new Date(req.startDate), 'dd MMM yyyy', { locale: fr })}</span>
                                                <span className="text-secondary-400">Au {format(new Date(req.endDate), 'dd MMM yyyy', { locale: fr })}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 bg-primary-50 px-3 py-1 rounded-full w-fit border border-primary-100">
                                                <Calendar className="w-3 h-3 text-primary-600" />
                                                <span className="font-black text-primary-700 text-[10px]">{req.numberOfDays} JOURS</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(req.status)} className="font-black text-[10px] uppercase py-1 px-3 rounded-full">
                                                {req.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {req.status === LEAVE_STATUS.PENDING ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        disabled={isActing}
                                                        onClick={() => handleApprove(req)}
                                                        className="h-9 px-4 font-bold rounded-xl text-xs uppercase tracking-tight gap-1.5 bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-100 text-white"
                                                    >
                                                        {isActing
                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            : <><CheckCircle2 className="w-3.5 h-3.5" /> Approuver</>
                                                        }
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={isActing}
                                                        onClick={() => setRejectTarget(req)}
                                                        className="h-9 px-4 text-accent-red-600 border-accent-red-100 bg-accent-red-50 hover:bg-accent-red-600 hover:text-white font-bold transition-all rounded-xl text-xs uppercase tracking-tight gap-1.5"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" /> Refuser
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-secondary-400 hover:text-secondary-900 hover:bg-secondary-100 rounded-xl">
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
            </Card>
        </div>
    );
}

function SummaryCard({ title, count, icon: Icon, color, bg, border }: any) {
    return (
        <Card className={cn("p-6 border shadow-sm flex items-center gap-5 rounded-[24px] bg-white transition-all hover:shadow-md", border)}>
            <div className={cn("p-4 rounded-2xl shrink-0 shadow-sm", bg)}>
                <Icon className={cn("w-6 h-6", color)} />
            </div>
            <div>
                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] leading-none mb-2">{title}</p>
                <h3 className="text-3xl font-black text-secondary-900 leading-none">{count}</h3>
            </div>
        </Card>
    );
}
