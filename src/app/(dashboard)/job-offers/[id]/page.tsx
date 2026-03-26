'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, FormEvent } from 'react';
import {
    AlertCircle, ArrowLeft, CheckCircle2, ChevronRight,
    FileText, Loader2, Pencil, Save, XCircle, Briefcase,
    Users, Mail, Phone, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { getDepartments } from '@/lib/api/employee';
import { closeJobOffer, createDraftJobOffer, getJobOfferById, publishJobOffer, updateJobOffer } from '@/lib/api/jobOffer';
import { getAllApplications } from '@/lib/api/application';
import { JobOffer, STATUS_CLOSED, STATUS_DRAFT, STATUS_PUBLISHED } from '@/types/jobOffer';
import { Application, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_STYLES } from '@/types/application';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function normalizeId(v?: string) {
    if (!v) return '';
    return v.split('/').filter(Boolean).pop() || v;
}

function fmtDate(d?: string) {
    if (!d) return '—';
    try { return format(new Date(d), 'd MMM yyyy', { locale: fr }); } catch { return '—'; }
}

function getStatusBadge(status: string) {
    switch (status) {
        case STATUS_DRAFT: return { variant: 'warning' as const, className: 'bg-amber-50 text-amber-700 border-amber-100' };
        case STATUS_PUBLISHED: return { variant: 'success' as const, className: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
        case STATUS_CLOSED: return { variant: 'destructive' as const, className: 'bg-rose-50 text-rose-700 border-rose-100' };
        default: return { variant: 'outline' as const, className: 'bg-secondary-50 text-secondary-600 border-secondary-100' };
    }
}

// ── EditDrawer ────────────────────────────────────────────────────────────────
function EditDrawer({ open, onClose, initialTitle, initialDescription, isSubmitting, error, onSubmit }: {
    open: boolean; onClose: () => void;
    initialTitle: string; initialDescription: string;
    isSubmitting: boolean; error: string | null;
    onSubmit: (p: { title: string; description: string }) => Promise<void>;
}) {
    const [draft, setDraft] = useState({ title: initialTitle, description: initialDescription });
    useEffect(() => { if (open) setDraft({ title: initialTitle, description: initialDescription }); }, [open, initialTitle, initialDescription]);
    async function handleSubmit(e: FormEvent) { e.preventDefault(); await onSubmit(draft); }

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-in-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in-out duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-secondary-950/40 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child as={Fragment} enter="transform transition ease-in-out duration-300" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-200" leaveFrom="translate-x-0" leaveTo="translate-x-full">
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-lg">
                                    <div className="h-full overflow-y-auto bg-white rounded-l-[32px] shadow-2xl border-l border-secondary-100">
                                        <div className="p-6 border-b border-secondary-100 flex items-start justify-between gap-4">
                                            <Dialog.Title className="text-lg font-black uppercase tracking-tight text-secondary-900">Modifier l&apos;offre</Dialog.Title>
                                            <Button variant="outline" onClick={onClose} className="h-10 px-4 rounded-2xl">Fermer</Button>
                                        </div>
                                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                            {error && <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4"><p className="text-sm font-medium text-secondary-700">{error}</p></div>}
                                            <div className="space-y-2">
                                                <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">Titre *</Label>
                                                <Input value={draft.title} onChange={e => setDraft(p => ({ ...p, title: e.target.value }))} required className="h-12" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">Description du poste</Label>
                                                <textarea
                                                    value={draft.description}
                                                    onChange={e => setDraft(p => ({ ...p, description: e.target.value }))}
                                                    rows={8}
                                                    placeholder="Décrivez le poste, les missions, le profil recherché..."
                                                    className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-2xl text-sm font-medium text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none"
                                                />
                                            </div>
                                            <div className="pt-2 flex items-center justify-end gap-3">
                                                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="h-12 px-5 rounded-2xl font-black uppercase tracking-widest text-[10px]">Annuler</Button>
                                                <Button type="submit" disabled={isSubmitting || !draft.title.trim()} className="h-12 px-5 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-2 bg-primary-600 hover:bg-primary-700 text-white">
                                                    <Save className="w-4 h-4" />{isSubmitting ? 'En cours...' : 'Enregistrer'}
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function JobOfferDetailsPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const jobOfferId = params?.id || '';

    const [activeTab, setActiveTab] = useState<'info' | 'applications'>('info');
    const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);
    const [departmentsMap, setDepartmentsMap] = useState<Record<string, string>>({});
    const [applications, setApplications] = useState<Application[]>([]);
    const [appsLoading, setAppsLoading] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerSubmitting, setDrawerSubmitting] = useState(false);
    const [drawerError, setDrawerError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true); setError(null); setJobOffer(null);
                const [req, deptsData] = await Promise.all([getJobOfferById(jobOfferId), getDepartments()]);
                setJobOffer(req);
                const list = Array.isArray(deptsData) ? deptsData : (deptsData as any)['hydra:member'] || [];
                const map: Record<string, string> = {};
                list.forEach((d: any) => { map[d.id] = d.name; if (d['@id']) map[d['@id']] = d.name; });
                setDepartmentsMap(map);
            } catch (e: any) {
                setError(e?.message || "Erreur lors du chargement de l'offre.");
            } finally { setIsLoading(false); }
        }
        if (jobOfferId) fetchData();
    }, [jobOfferId]);

    useEffect(() => {
        if (activeTab !== 'applications' || !jobOfferId) return;
        setAppsLoading(true);
        getAllApplications({ jobOffer: jobOfferId })
            .then(setApplications).catch(() => setApplications([]))
            .finally(() => setAppsLoading(false));
    }, [activeTab, jobOfferId]);

    const deptLabel = useMemo(() => {
        if (!jobOffer) return '';
        return departmentsMap[jobOffer.department] || departmentsMap[normalizeId(jobOffer.department)] || jobOffer.department;
    }, [departmentsMap, jobOffer]);

    function showToast(msg: string, type: 'success' | 'error') {
        setToast({ msg, type });
        window.setTimeout(() => setToast(null), 4500);
    }

    async function refresh() { const r = await getJobOfferById(jobOfferId); setJobOffer(r); }

    async function handleClose() {
        if (!jobOffer) return; setActionLoading(true);
        try { await closeJobOffer(jobOffer.id); showToast('Offre clôturée.', 'success'); await refresh(); }
        catch (e: any) { showToast(e?.message || "Erreur.", 'error'); }
        finally { setActionLoading(false); }
    }

    async function handleDraft() {
        if (!jobOffer) return; setActionLoading(true);
        try { await createDraftJobOffer(jobOffer.id); showToast('Offre en brouillon.', 'success'); await refresh(); }
        catch (e: any) { showToast(e?.message || "Erreur.", 'error'); }
        finally { setActionLoading(false); }
    }

    async function handlePublish() {
        if (!jobOffer) return; setActionLoading(true);
        try { await publishJobOffer(jobOffer.id); showToast('Offre publiée.', 'success'); await refresh(); }
        catch (e: any) { showToast(e?.message || "Erreur.", 'error'); }
        finally { setActionLoading(false); }
    }

    const statusBadge = jobOffer ? getStatusBadge(String(jobOffer.status)) : null;

    if (isLoading) return (
        <div className="p-10 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            <p className="font-bold uppercase tracking-widest text-[10px] text-secondary-400">Chargement...</p>
        </div>
    );

    if (error || !jobOffer) return (
        <div className="p-10 flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-secondary-500 font-medium">{error || "Offre introuvable."}</p>
            <Button variant="outline" onClick={() => router.push('/job-offers')}>Retour</Button>
        </div>
    );

    const status = String(jobOffer.status);
    const canPublish = status !== STATUS_PUBLISHED;
    const canClose = status === STATUS_PUBLISHED;
    const canDraft = status !== STATUS_DRAFT;

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[70] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-right duration-300 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-accent-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-12 px-4 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={() => router.push('/job-offers')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />Retour
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black text-secondary-900 uppercase tracking-tighter">Détails offre</h1>
                        <p className="text-secondary-500 font-medium italic">{jobOffer.title}</p>
                    </div>
                </div>
                {statusBadge && (
                    <Badge variant={statusBadge.variant as any} className={`font-black text-[10px] uppercase py-2 px-3 rounded-xl border shadow-sm ${statusBadge.className}`}>
                        {jobOffer.status}
                    </Badge>
                )}
            </div>

            {/* Onglets */}
            <div className="flex items-center gap-1 border-b border-secondary-100">
                {([
                    { key: 'info', label: 'Informations', icon: FileText },
                    { key: 'applications', label: `Candidatures${applications.length > 0 && activeTab === 'applications' ? ` (${applications.length})` : ''}`, icon: Users },
                ] as const).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'flex items-center gap-2 px-5 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all',
                            activeTab === tab.key
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-secondary-400 hover:text-secondary-700'
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Contenu onglet Info */}
            {activeTab === 'info' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 border-none shadow-2xl shadow-secondary-200/40 bg-white rounded-[40px]">
                        <CardHeader className="p-8 border-b border-secondary-50">
                            <CardTitle className="text-xl font-black text-secondary-900 uppercase tracking-tight">Informations</CardTitle>
                            <CardDescription className="text-sm font-medium italic">Dépôt et contexte</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">Département</Label>
                                    <div className="flex items-center gap-2 rounded-2xl border border-secondary-100 bg-secondary-50/30 px-4 py-3">
                                        <Briefcase className="w-4 h-4 text-secondary-400" />
                                        <p className="font-black text-secondary-900 truncate">{deptLabel}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">Recrutement associé</Label>
                                    <div className="flex items-center gap-2 rounded-2xl border border-secondary-100 bg-secondary-50/30 px-4 py-3">
                                        <FileText className="w-4 h-4 text-secondary-400" />
                                        <p className="font-black text-secondary-900 truncate">{jobOffer.recruitmentRequest}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">Description du poste</Label>
                                {jobOffer.description ? (
                                    <div className="rounded-2xl border border-secondary-100 bg-secondary-50/30 px-4 py-4 text-sm font-medium text-secondary-700 leading-relaxed whitespace-pre-wrap">
                                        {jobOffer.description}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-secondary-200 bg-secondary-50/30 px-4 py-4 text-sm font-medium text-secondary-400 italic">
                                        Aucune description renseignée.
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {[
                                    { label: 'Créée le', val: fmtDate(jobOffer.createdAt) },
                                    { label: 'Publiée le', val: fmtDate(jobOffer.publishedAt) },
                                    { label: 'Clôturée le', val: fmtDate(jobOffer.closedAt) },
                                ].map(({ label, val }) => (
                                    <div key={label} className="space-y-2">
                                        <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">{label}</Label>
                                        <p className="font-black text-secondary-900 rounded-2xl border border-secondary-100 bg-secondary-50/30 px-4 py-3">{val}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-end gap-3">
                                <Button variant="outline" className="h-12 px-5 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-2" onClick={() => { setDrawerError(null); setDrawerOpen(true); }}>
                                    <Pencil className="w-4 h-4" />Modifier l&apos;offre
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-secondary-200/40 bg-white rounded-[40px]">
                        <CardHeader className="p-8 border-b border-secondary-50">
                            <CardTitle className="text-lg font-black text-secondary-900 uppercase tracking-tight">Actions</CardTitle>
                            <CardDescription className="text-sm font-medium italic">
                                {status === STATUS_DRAFT ? 'Publier' : status === STATUS_PUBLISHED ? 'Clôturer' : 'Réactiver'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-4">
                            <Button onClick={handlePublish} disabled={!canPublish || actionLoading} className="w-full py-6 rounded-2xl font-black uppercase tracking-widest bg-primary-600 hover:bg-primary-700 text-white gap-2">
                                <CheckCircle2 className="w-4 h-4" />Publier
                            </Button>
                            <Button onClick={handleClose} disabled={!canClose || actionLoading} variant="outline" className="w-full py-6 rounded-2xl font-black uppercase tracking-widest text-accent-red-600 border-accent-red-100 bg-accent-red-50 hover:bg-accent-red-600 hover:text-white gap-2">
                                <XCircle className="w-4 h-4" />Clôturer
                            </Button>
                            <Button onClick={handleDraft} disabled={!canDraft || actionLoading} variant="outline" className="w-full py-6 rounded-2xl font-black uppercase tracking-widest text-secondary-800 border-secondary-100 bg-secondary-50 hover:bg-secondary-100 gap-2">
                                <Briefcase className="w-4 h-4" />Passer en draft
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Contenu onglet Candidatures */}
            {activeTab === 'applications' && (
                <Card className="border-none shadow-xl shadow-secondary-200/50">
                    <CardHeader className="border-b border-secondary-100 bg-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-secondary-900 font-black uppercase tracking-tight text-lg">Candidatures reçues</CardTitle>
                                <CardDescription className="text-secondary-500 font-medium italic">Pour l&apos;offre : {jobOffer.title}</CardDescription>
                            </div>
                            <Badge className="font-black bg-primary-50 text-primary-600 border-primary-100 px-3 py-1 rounded-lg text-[10px] tracking-widest">
                                {applications.length} candidature(s)
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {appsLoading ? (
                            <div className="py-16 flex flex-col items-center gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                                <p className="text-secondary-400 font-bold uppercase tracking-widest text-[10px]">Chargement...</p>
                            </div>
                        ) : applications.length === 0 ? (
                            <div className="py-16 flex flex-col items-center gap-3 text-center">
                                <Users className="w-12 h-12 text-secondary-200" />
                                <p className="text-secondary-400 font-bold uppercase tracking-widest text-[10px]">Aucune candidature pour cette offre</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-secondary-50/50">
                                            {['Candidat', 'Contact', 'Statut', 'Date', ''].map(h => (
                                                <th key={h} className="text-left py-4 px-5 font-black uppercase tracking-widest text-[10px] text-secondary-500">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {applications.map(a => {
                                            const styleClass = APPLICATION_STATUS_STYLES[a.status as keyof typeof APPLICATION_STATUS_STYLES] || 'bg-secondary-50 text-secondary-600 border-secondary-100';
                                            return (
                                                <tr key={a.id} className="border-b border-secondary-100/70 hover:bg-secondary-50/30 transition-colors">
                                                    <td className="py-4 px-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center font-black text-primary-600 text-xs shrink-0">
                                                                {a.firstName[0]}{a.lastName[0]}
                                                            </div>
                                                            <p className="font-black text-secondary-900 text-sm uppercase tracking-tighter">{a.firstName} {a.lastName}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-5">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-secondary-400" /><span className="text-xs font-medium text-secondary-600">{a.email}</span></div>
                                                            <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-secondary-400" /><span className="text-xs font-medium text-secondary-500">{a.phone}</span></div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-5">
                                                        <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${styleClass}`}>
                                                            {APPLICATION_STATUS_LABELS[a.status as keyof typeof APPLICATION_STATUS_LABELS] || a.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-5">
                                                        <div className="flex items-center gap-1.5 text-secondary-400">
                                                            <Calendar className="w-3 h-3" />
                                                            <span className="text-xs font-medium">{fmtDate(a.appliedAt || a.createdAt)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-5 text-right">
                                                        <Link href={`/applications/${a.id}`}>
                                                            <Button className="h-9 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest bg-primary-600 hover:bg-primary-700 text-white gap-1.5">
                                                                Voir<ChevronRight className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <EditDrawer
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setDrawerError(null); }}
                initialTitle={jobOffer.title}
                initialDescription={jobOffer.description || ''}
                isSubmitting={drawerSubmitting}
                error={drawerError}
                onSubmit={async ({ title, description }) => {
                    setDrawerSubmitting(true); setDrawerError(null);
                    try { await updateJobOffer(jobOffer.id, { title, description }); setDrawerOpen(false); showToast('Offre mise à jour.', 'success'); await refresh(); }
                    catch (e: any) { setDrawerError(e?.message || "Erreur."); }
                    finally { setDrawerSubmitting(false); }
                }}
            />
        </div>
    );
}
