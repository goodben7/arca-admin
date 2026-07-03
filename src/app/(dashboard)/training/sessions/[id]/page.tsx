'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Loader2,
    ArrowLeft,
    MapPin,
    Users,
    CalendarDays,
    Play,
    CheckSquare,
    XCircle,
    BookOpen,
    UserCheck,
    MessageSquare,
    X,
    UserPlus,
    UserMinus,
    CheckCheck,
    Search,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Input';
import { TabsProvider, TabsList, TabsTrigger, TabsContent, TabsPanels } from '@/components/ui/Tabs';
import { getUserById } from '@/lib/api/profile';
import { getTrainingRequestById } from '@/lib/api/training';
import {
    cancelTrainingSession,
    completeTrainingSession,
    getTrainingSessionById,
    startTrainingSession,
} from '@/lib/api/trainingSession';
import {
    getEnrollmentsBySession,
    createEnrollment,
    completeEnrollment,
    markEnrollmentAbsent,
} from '@/lib/api/trainingEnrollment';
import { getAllEmployees } from '@/lib/api/employee';
import {
    TrainingSession,
    STATUS_PLANNED,
    STATUS_ONGOING,
    STATUS_COMPLETED,
    STATUS_CANCELLED,
} from '@/types/trainingSession';
import {
    TrainingEnrollment,
    ENROLLMENT_STATUS_ENROLLED,
    ENROLLMENT_STATUS_COMPLETED,
    ENROLLMENT_STATUS_ABSENT,
} from '@/types/trainingEnrollment';
import { Employee } from '@/types/employee';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalizeId(v?: string) {
    if (!v) return '';
    return v.split('/').filter(Boolean).pop() || v;
}

function getStatusLabel(status: string) {
    switch (status) {
        case STATUS_PLANNED:   return 'Planifiée';
        case STATUS_ONGOING:   return 'En cours';
        case STATUS_COMPLETED: return 'Terminée';
        case STATUS_CANCELLED: return 'Annulée';
        default:               return status;
    }
}

function getStatusClass(status: string) {
    switch (status) {
        case STATUS_PLANNED:   return 'bg-sky-50 text-sky-700 border border-sky-200';
        case STATUS_ONGOING:   return 'bg-amber-50 text-amber-700 border border-amber-200';
        case STATUS_COMPLETED: return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        case STATUS_CANCELLED: return 'bg-rose-50 text-rose-700 border border-rose-200';
        default:               return 'bg-secondary-50 text-secondary-600 border border-secondary-200';
    }
}

function getEnrollmentStatusLabel(status: string) {
    switch (status) {
        case ENROLLMENT_STATUS_ENROLLED:  return 'Enrollé';
        case ENROLLMENT_STATUS_COMPLETED: return 'Complété';
        case ENROLLMENT_STATUS_ABSENT:    return 'Absent';
        default:                          return status;
    }
}

function getEnrollmentStatusClass(status: string) {
    switch (status) {
        case ENROLLMENT_STATUS_ENROLLED:  return 'bg-sky-50 text-sky-700 border border-sky-200';
        case ENROLLMENT_STATUS_COMPLETED: return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        case ENROLLMENT_STATUS_ABSENT:    return 'bg-rose-50 text-rose-700 border border-rose-200';
        default:                          return 'bg-secondary-50 text-secondary-600 border border-secondary-200';
    }
}

function normalizeEmployees(data: unknown): Employee[] {
    if (Array.isArray(data)) return data as Employee[];
    const d = data as Record<string, unknown>;
    if (Array.isArray(d?.['hydra:member'])) return d['hydra:member'] as Employee[];
    if (Array.isArray(d?.member)) return d.member as Employee[];
    return [];
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({
    open, onClose, onConfirm, isLoading, title, description, confirmLabel, confirmClass, icon,
}: {
    open: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean;
    title: string; description: string; confirmLabel: string; confirmClass: string;
    icon: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary-50 flex items-center justify-center">{icon}</div>
                    <div>
                        <h3 className="text-lg font-black text-secondary-900 uppercase tracking-tight">{title}</h3>
                        <p className="text-xs text-secondary-400 font-medium">Cette action est irréversible</p>
                    </div>
                </div>
                <p className="text-sm text-secondary-600 font-medium leading-relaxed">{description}</p>
                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={onClose} className="rounded-2xl px-6 font-bold uppercase tracking-widest text-xs">Annuler</Button>
                    <Button onClick={onConfirm} disabled={isLoading} className={`rounded-2xl px-8 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2 ${confirmClass}`}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Cancel Modal ──────────────────────────────────────────────────────────────
function CancelModal({ open, onClose, onConfirm, isLoading }: {
    open: boolean; onClose: () => void; onConfirm: (reason: string) => void; isLoading: boolean;
}) {
    const [reason, setReason] = useState('');
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
                        <XCircle className="w-7 h-7 text-rose-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-secondary-900 uppercase tracking-tight">Annuler la session</h3>
                        <p className="text-xs text-secondary-400 font-medium">Un motif est obligatoire</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="uppercase tracking-widest text-[10px] font-black text-secondary-400">Motif d'annulation *</Label>
                    <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Expliquez la raison de l'annulation..." className="bg-secondary-50/30" />
                </div>
                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={onClose} className="rounded-2xl px-6 font-bold uppercase tracking-widest text-xs">Annuler</Button>
                    <Button onClick={() => reason.trim() && onConfirm(reason)} disabled={isLoading || !reason.trim()} className="rounded-2xl px-8 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Confirmer l'annulation
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Add Enrollment Modal ───────────────────────────────────────────────────────
function AddEnrollmentModal({ open, onClose, onConfirm, isLoading, employees, enrolledIds }: {
    open: boolean;
    onClose: () => void;
    onConfirm: (employeeId: string) => void;
    isLoading: boolean;
    employees: Employee[];
    enrolledIds: Set<string>;
}) {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState('');

    const filtered = employees.filter((e) => {
        const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
        const q = search.toLowerCase();
        return (fullName.includes(q) || e.email?.toLowerCase().includes(q) || e.employeeNumber?.toLowerCase().includes(q))
            && !enrolledIds.has(normalizeId(e.id));
    });

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center">
                        <UserPlus className="w-7 h-7 text-primary-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-secondary-900 uppercase tracking-tight">Ajouter un participant</h3>
                        <p className="text-xs text-secondary-400 font-medium">Sélectionnez un employé à enroller</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher par nom, email ou matricule..."
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-secondary-200 bg-secondary-50/50 text-sm font-medium text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                </div>

                {/* List */}
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {filtered.length === 0 && (
                        <p className="text-center text-xs text-secondary-400 font-medium py-6 italic">Aucun employé disponible</p>
                    )}
                    {filtered.map((emp) => (
                        <button
                            key={emp.id}
                            onClick={() => setSelected(normalizeId(emp.id))}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                                selected === normalizeId(emp.id)
                                    ? 'border-primary-400 bg-primary-50'
                                    : 'border-secondary-100 hover:border-secondary-200 hover:bg-secondary-50'
                            }`}
                        >
                            <div className="w-9 h-9 rounded-xl bg-secondary-100 flex items-center justify-center shrink-0">
                                <span className="text-xs font-black text-secondary-600">
                                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-secondary-900 truncate">{emp.firstName} {emp.lastName}</p>
                                <p className="text-xs text-secondary-400 font-medium truncate">{emp.email} · {emp.employeeNumber}</p>
                            </div>
                            {selected === normalizeId(emp.id) && (
                                <CheckCircle2 className="w-5 h-5 text-primary-600 shrink-0" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3 justify-end pt-2 border-t border-secondary-100">
                    <Button variant="ghost" onClick={onClose} className="rounded-2xl px-6 font-bold uppercase tracking-widest text-xs">Annuler</Button>
                    <Button
                        onClick={() => selected && onConfirm(selected)}
                        disabled={isLoading || !selected}
                        className="rounded-2xl px-8 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        Enroller
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TrainingSessionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    // Session state
    const [session, setSession] = useState<TrainingSession | null>(null);
    const [requestTitle, setRequestTitle] = useState<string | null>(null);
    const [startedByName, setStartedByName] = useState<string | null>(null);
    const [completedByName, setCompletedByName] = useState<string | null>(null);
    const [cancelledByName, setCancelledByName] = useState<string | null>(null);

    const [isFetching, setIsFetching] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [isActioning, setIsActioning] = useState(false);

    const [showStartModal, setShowStartModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Enrollments state
    const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
    const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
    const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [showAddEnrollmentModal, setShowAddEnrollmentModal] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [enrollmentActionId, setEnrollmentActionId] = useState<string | null>(null);

    // Enrollment action confirm modals
    const [showCompleteEnrollmentModal, setShowCompleteEnrollmentModal] = useState<string | null>(null);
    const [showAbsentEnrollmentModal, setShowAbsentEnrollmentModal] = useState<string | null>(null);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

    const reloadSession = async (sessionId: string) => {
        const updated = await getTrainingSessionById(sessionId);
        setSession(updated);
        return updated;
    };

    const reloadEnrollments = async (sessionId: string) => {
        setEnrollmentsLoading(true);
        try {
            const data = await getEnrollmentsBySession(sessionId);
            setEnrollments(data);
        } catch {
            // silent
        } finally {
            setEnrollmentsLoading(false);
        }
    };

    useEffect(() => {
        if (!id) return;
        async function fetchAll() {
            try {
                setIsFetching(true);
                const s = await getTrainingSessionById(id as string);
                setSession(s);

                if (s.trainingRequest) {
                    getTrainingRequestById(normalizeId(s.trainingRequest))
                        .then((r) => setRequestTitle(r.title))
                        .catch(() => setRequestTitle(null));
                }
                if (s.startedBy) getUserById(normalizeId(s.startedBy)).then((u) => setStartedByName(u.email)).catch(() => setStartedByName(normalizeId(s.startedBy)));
                if (s.completedBy) getUserById(normalizeId(s.completedBy)).then((u) => setCompletedByName(u.email)).catch(() => setCompletedByName(normalizeId(s.completedBy)));
                if (s.cancelledBy) getUserById(normalizeId(s.cancelledBy)).then((u) => setCancelledByName(u.email)).catch(() => setCancelledByName(normalizeId(s.cancelledBy)));

                // Load enrollments & employees in parallel
                getEnrollmentsBySession(id as string)
                    .then(setEnrollments)
                    .catch(() => {});
                getAllEmployees()
                    .then((data) => setEmployees(normalizeEmployees(data)))
                    .catch(() => {});
            } catch (e: unknown) {
                setFetchError((e as Error)?.message || 'Erreur lors du chargement.');
            } finally {
                setIsFetching(false);
            }
        }
        fetchAll();
    }, [id]);

    // Session actions
    const handleStart = async () => {
        if (!session) return;
        setIsActioning(true); setActionError(null);
        try {
            await startTrainingSession(session.id);
            showToast('Session démarrée avec succès.');
            setShowStartModal(false);
            await reloadSession(session.id);
        } catch (e: unknown) { setActionError((e as Error)?.message || 'Erreur.'); }
        finally { setIsActioning(false); }
    };

    const handleComplete = async () => {
        if (!session) return;
        setIsActioning(true); setActionError(null);
        try {
            await completeTrainingSession(session.id);
            showToast('Session marquée comme terminée.');
            setShowCompleteModal(false);
            await reloadSession(session.id);
        } catch (e: unknown) { setActionError((e as Error)?.message || 'Erreur.'); }
        finally { setIsActioning(false); }
    };

    const handleCancel = async (reason: string) => {
        if (!session) return;
        setIsActioning(true); setActionError(null);
        try {
            await cancelTrainingSession(session.id, reason);
            showToast('Session annulée.');
            setShowCancelModal(false);
            await reloadSession(session.id);
        } catch (e: unknown) { setActionError((e as Error)?.message || 'Erreur.'); }
        finally { setIsActioning(false); }
    };

    // Enrollment actions
    const handleEnroll = async (employeeId: string) => {
        if (!session) return;
        setIsEnrolling(true); setEnrollmentError(null);
        try {
            await createEnrollment({
                employee: employeeId,
                trainingSession: session.id,
            });
            showToast('Participant enrollé avec succès.');
            setShowAddEnrollmentModal(false);
            await reloadEnrollments(session.id);
        } catch (e: unknown) { setEnrollmentError((e as Error)?.message || 'Erreur.'); }
        finally { setIsEnrolling(false); }
    };

    const handleCompleteEnrollment = async (enrollmentId: string) => {
        setEnrollmentActionId(enrollmentId); setEnrollmentError(null);
        try {
            await completeEnrollment(enrollmentId);
            showToast('Participation marquée comme complétée.');
            setShowCompleteEnrollmentModal(null);
            if (session) await reloadEnrollments(session.id);
        } catch (e: unknown) { setEnrollmentError((e as Error)?.message || 'Erreur.'); }
        finally { setEnrollmentActionId(null); }
    };

    const handleAbsentEnrollment = async (enrollmentId: string) => {
        setEnrollmentActionId(enrollmentId); setEnrollmentError(null);
        try {
            await markEnrollmentAbsent(enrollmentId);
            showToast('Participant marqué comme absent.');
            setShowAbsentEnrollmentModal(null);
            if (session) await reloadEnrollments(session.id);
        } catch (e: unknown) { setEnrollmentError((e as Error)?.message || 'Erreur.'); }
        finally { setEnrollmentActionId(null); }
    };

    if (isFetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                <p className="text-secondary-400 font-bold uppercase tracking-widest text-[10px]">Chargement de la session...</p>
            </div>
        );
    }

    if (fetchError || !session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-secondary-600 font-bold">{fetchError || 'Session introuvable.'}</p>
                <Button onClick={() => router.back()} variant="outline" className="rounded-2xl">Retour</Button>
            </div>
        );
    }

    const isPlanned   = session.status === STATUS_PLANNED;
    const isOngoing   = session.status === STATUS_ONGOING;
    const statusClass = getStatusClass(session.status);

    const enrolledIds = new Set(enrollments.map((e) => normalizeId(e.employee)));

    return (
        <>
            {/* Toast */}
            {toast && (
                <div className="fixed top-6 right-6 z-50 bg-secondary-900 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm animate-in slide-in-from-top-4 duration-300 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />{toast}
                </div>
            )}

            {/* Session modals */}
            <ConfirmModal
                open={showStartModal} onClose={() => setShowStartModal(false)}
                onConfirm={handleStart} isLoading={isActioning}
                title="Démarrer la session" description="Vous êtes sur le point de démarrer cette session de formation. Son statut passera à EN COURS."
                confirmLabel="Démarrer" confirmClass="bg-amber-500 hover:bg-amber-600"
                icon={<Play className="w-7 h-7 text-amber-600" />}
            />
            <ConfirmModal
                open={showCompleteModal} onClose={() => setShowCompleteModal(false)}
                onConfirm={handleComplete} isLoading={isActioning}
                title="Terminer la session" description="Vous êtes sur le point de marquer cette session comme terminée."
                confirmLabel="Terminer" confirmClass="bg-emerald-600 hover:bg-emerald-700"
                icon={<CheckSquare className="w-7 h-7 text-emerald-600" />}
            />
            <CancelModal open={showCancelModal} onClose={() => setShowCancelModal(false)} onConfirm={handleCancel} isLoading={isActioning} />

            {/* Enrollment modals */}
            <AddEnrollmentModal
                open={showAddEnrollmentModal}
                onClose={() => setShowAddEnrollmentModal(false)}
                onConfirm={handleEnroll}
                isLoading={isEnrolling}
                employees={employees}
                enrolledIds={enrolledIds}
            />
            <ConfirmModal
                open={!!showCompleteEnrollmentModal}
                onClose={() => setShowCompleteEnrollmentModal(null)}
                onConfirm={() => showCompleteEnrollmentModal && handleCompleteEnrollment(showCompleteEnrollmentModal)}
                isLoading={enrollmentActionId === showCompleteEnrollmentModal}
                title="Marquer comme complété" description="Confirmez-vous que ce participant a bien complété la formation ?"
                confirmLabel="Confirmer" confirmClass="bg-emerald-600 hover:bg-emerald-700"
                icon={<CheckCheck className="w-7 h-7 text-emerald-600" />}
            />
            <ConfirmModal
                open={!!showAbsentEnrollmentModal}
                onClose={() => setShowAbsentEnrollmentModal(null)}
                onConfirm={() => showAbsentEnrollmentModal && handleAbsentEnrollment(showAbsentEnrollmentModal)}
                isLoading={enrollmentActionId === showAbsentEnrollmentModal}
                title="Marquer comme absent" description="Confirmez-vous que ce participant était absent lors de la formation ?"
                confirmLabel="Confirmer" confirmClass="bg-rose-600 hover:bg-rose-700"
                icon={<UserMinus className="w-7 h-7 text-rose-600" />}
            />

            <PageShell className="max-w-5xl mx-auto">
                <PageHeader
                    title={session.title}
                    description={`Session de formation · ${session.startDate ? format(new Date(session.startDate), 'dd MMMM yyyy', { locale: fr }) : '—'}`}
                    backHref="/training/sessions"
                    actions={
                        <>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusClass}`}>
                                {getStatusLabel(session.status)}
                            </span>
                            <div className="flex items-center gap-3 shrink-0 flex-wrap">
                                {(isPlanned || isOngoing) && (
                                    <Button onClick={() => setShowCancelModal(true)}
                                        className="rounded-2xl px-5 py-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                        <X className="w-4 h-4" /> Annuler
                                    </Button>
                                )}
                                {isPlanned && (
                                    <Button onClick={() => setShowStartModal(true)}
                                        className="rounded-2xl px-5 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-amber-200">
                                        <Play className="w-4 h-4" /> Démarrer
                                    </Button>
                                )}
                                {isOngoing && (
                                    <Button onClick={() => setShowCompleteModal(true)}
                                        className="rounded-2xl px-5 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-emerald-200">
                                        <CheckSquare className="w-4 h-4" /> Terminer
                                    </Button>
                                )}
                            </div>
                        </>
                    }
                />

                {actionError && (
                    <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-2xl text-destructive text-sm font-bold flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />{actionError}
                    </div>
                )}

                {/* Tabs */}
                <TabsProvider>
                    <TabsList className="w-full justify-start">
                        <TabsTrigger>
                            <CalendarDays className="w-4 h-4 mr-2" />
                            Détails
                        </TabsTrigger>
                        <TabsTrigger>
                            <Users className="w-4 h-4 mr-2" />
                            Enrollements
                            {enrollments.length > 0 && (
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-black">
                                    {enrollments.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsPanels>
                        {/* ── Tab Détails ── */}
                        <TabsContent>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <Card className="border-none shadow-xl shadow-secondary-200/50 rounded-3xl overflow-hidden">
                                        <CardHeader className="bg-secondary-50/50 border-b border-secondary-100 p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                                                    <CalendarDays className="w-5 h-5 text-white" />
                                                </div>
                                                <CardTitle className="text-base font-black uppercase tracking-tight text-secondary-900">
                                                    Détails de la session
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-5">
                                            <div className="grid grid-cols-2 gap-5">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Formateur</p>
                                                    <div className="flex items-center gap-2">
                                                        <UserCheck className="w-4 h-4 text-secondary-400" />
                                                        <p className="text-sm font-bold text-secondary-900">{session.trainer}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Lieu</p>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-secondary-400" />
                                                        <p className="text-sm font-bold text-secondary-900">{session.location}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Capacité</p>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-secondary-400" />
                                                        <p className="text-sm font-bold text-secondary-900">{session.capacity} participant(s)</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Demande liée</p>
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4 text-secondary-400" />
                                                        <p className="text-sm font-bold text-secondary-900 truncate">
                                                            {requestTitle || normalizeId(session.trainingRequest) || '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-secondary-100 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <Clock className="w-4 h-4 text-secondary-400 shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Début</p>
                                                        <p className="text-sm font-bold text-secondary-900">
                                                            {format(new Date(session.startDate), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Clock className="w-4 h-4 text-secondary-400 shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Fin</p>
                                                        <p className="text-sm font-bold text-secondary-900">
                                                            {format(new Date(session.endDate), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {session.status === STATUS_CANCELLED && (
                                        <Card className="border-none shadow-xl shadow-rose-100/50 rounded-3xl overflow-hidden">
                                            <CardHeader className="bg-rose-50/50 border-b border-rose-100 p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                                                        <MessageSquare className="w-5 h-5 text-rose-600" />
                                                    </div>
                                                    <CardTitle className="text-base font-black uppercase tracking-tight text-rose-700">
                                                        Motif d'annulation
                                                    </CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <p className="text-sm text-rose-700 font-medium leading-relaxed whitespace-pre-wrap">
                                                    {(session as TrainingSession & { cancellationReason?: string }).cancellationReason || '—'}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-5">
                                    <Card className="border-none shadow-xl shadow-secondary-200/50 rounded-3xl overflow-hidden">
                                        <CardHeader className="bg-secondary-50/50 border-b border-secondary-100 p-5">
                                            <CardTitle className="text-xs font-black uppercase tracking-widest text-secondary-400">Statut</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-5">
                                            <div className="flex items-center gap-3">
                                                {session.status === STATUS_PLANNED   && <Clock className="w-5 h-5 text-sky-500" />}
                                                {session.status === STATUS_ONGOING   && <Play className="w-5 h-5 text-amber-500" />}
                                                {session.status === STATUS_COMPLETED && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                                {session.status === STATUS_CANCELLED && <XCircle className="w-5 h-5 text-rose-500" />}
                                                <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusClass}`}>
                                                    {getStatusLabel(session.status)}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-xl shadow-secondary-200/50 rounded-3xl overflow-hidden">
                                        <CardHeader className="bg-secondary-50/50 border-b border-secondary-100 p-5">
                                            <CardTitle className="text-xs font-black uppercase tracking-widest text-secondary-400">Historique</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-5 space-y-4">
                                            {session.startedBy && (
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Démarrée par</p>
                                                    <p className="text-sm font-bold text-secondary-900">{startedByName ?? '—'}</p>
                                                    {session.startedAt && (
                                                        <p className="text-xs text-secondary-400 font-medium">
                                                            {format(new Date(session.startedAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            {session.completedBy && (
                                                <div className="space-y-1 pt-3 border-t border-secondary-100">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Terminée par</p>
                                                    <p className="text-sm font-bold text-secondary-900">{completedByName ?? '—'}</p>
                                                    {session.completedAt && (
                                                        <p className="text-xs text-secondary-400 font-medium">
                                                            {format(new Date(session.completedAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            {session.cancelledBy && (
                                                <div className="space-y-1 pt-3 border-t border-secondary-100">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Annulée par</p>
                                                    <p className="text-sm font-bold text-secondary-900">{cancelledByName ?? '—'}</p>
                                                    {session.cancelledAt && (
                                                        <p className="text-xs text-secondary-400 font-medium">
                                                            {format(new Date(session.cancelledAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            {!session.startedBy && !session.completedBy && !session.cancelledBy && (
                                                <p className="text-xs text-secondary-400 font-medium italic">Aucune action enregistrée.</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ── Tab Enrollements ── */}
                        <TabsContent>
                            <div className="space-y-5">
                                {/* Header enrollements */}
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <div>
                                        <h2 className="text-base font-black text-secondary-900 uppercase tracking-tight">Participants enrollés</h2>
                                        <p className="text-xs text-secondary-400 font-medium mt-0.5">
                                            {enrollments.length} / {session.capacity} participant(s)
                                        </p>
                                    </div>
                                    {(isPlanned || isOngoing) && (
                                        <Button
                                            onClick={() => setShowAddEnrollmentModal(true)}
                                            className="rounded-2xl px-5 py-4 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-primary-200"
                                        >
                                            <UserPlus className="w-4 h-4" /> Ajouter un participant
                                        </Button>
                                    )}
                                </div>

                                {enrollmentError && (
                                    <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-2xl text-destructive text-sm font-bold flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 shrink-0" />{enrollmentError}
                                    </div>
                                )}

                                {enrollmentsLoading ? (
                                    <div className="flex items-center justify-center py-16 gap-3">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                                        <p className="text-xs text-secondary-400 font-bold uppercase tracking-widest">Chargement...</p>
                                    </div>
                                ) : enrollments.length === 0 ? (
                                    <Card className="border-none shadow-xl shadow-secondary-200/50 rounded-3xl overflow-hidden">
                                        <CardContent className="p-16 flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-secondary-100 flex items-center justify-center">
                                                <Users className="w-8 h-8 text-secondary-400" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-black text-secondary-900 uppercase tracking-tight">Aucun participant</p>
                                                <p className="text-xs text-secondary-400 font-medium mt-1">
                                                    {(isPlanned || isOngoing) ? 'Ajoutez des participants à cette session.' : 'Aucun participant n\'a été enrollé.'}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Card className="border-none shadow-xl shadow-secondary-200/50 rounded-3xl overflow-hidden">
                                        <div className="divide-y divide-secondary-100">
                                            {enrollments.map((enrollment) => {
                                                const empId = normalizeId(enrollment.employee);
                                                const emp = employees.find((e) => normalizeId(e.id) === empId);
                                                const isEnrolled = enrollment.status === ENROLLMENT_STATUS_ENROLLED;

                                                return (
                                                    <div key={enrollment.id} className="flex items-center gap-4 p-5 hover:bg-secondary-50/50 transition-colors">
                                                        {/* Avatar */}
                                                        <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center shrink-0">
                                                            {emp ? (
                                                                <span className="text-xs font-black text-secondary-600">
                                                                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                                                                </span>
                                                            ) : (
                                                                <UserCheck className="w-5 h-5 text-secondary-400" />
                                                            )}
                                                        </div>

                                                        {/* Infos */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-secondary-900 truncate">
                                                                {emp ? `${emp.firstName} ${emp.lastName}` : empId}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                                                {emp && (
                                                                    <p className="text-xs text-secondary-400 font-medium truncate">{emp.email}</p>
                                                                )}
                                                                <p className="text-xs text-secondary-300 font-medium">
                                                                    Enrollé le {format(new Date(enrollment.enrolledAt), 'dd MMM yyyy', { locale: fr })}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Status badge */}
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 ${getEnrollmentStatusClass(enrollment.status)}`}>
                                                            {getEnrollmentStatusLabel(enrollment.status)}
                                                        </span>

                                                        {/* Actions — uniquement si ENROLLED et session active */}
                                                        {isEnrolled && isOngoing && (
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <button
                                                                    onClick={() => setShowCompleteEnrollmentModal(enrollment.id)}
                                                                    title="Marquer comme complété"
                                                                    className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors group"
                                                                >
                                                                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                                                                </button>
                                                                <button
                                                                    onClick={() => setShowAbsentEnrollmentModal(enrollment.id)}
                                                                    title="Marquer comme absent"
                                                                    className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition-colors group"
                                                                >
                                                                    <UserMinus className="w-4 h-4 text-rose-600" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Card>
                                )}
                            </div>
                        </TabsContent>
                    </TabsPanels>
                </TabsProvider>
            </PageShell>
        </>
    );
}
