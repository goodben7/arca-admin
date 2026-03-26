'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, AlertCircle, Loader2, CheckCircle2, Users,
    Mail, Phone, Calendar, Briefcase, FileText, Eye,
    UserCheck, MessageSquare, XCircle, Star, X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { getApplicationById, shortlistApplication, scheduleInterview, rejectApplication, hireApplication } from '@/lib/api/application';
import { getDocumentsByHolder } from '@/lib/api/document';
import { Application, APPLICATION_STATUS, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_STYLES } from '@/types/application';
import { DocumentRecord } from '@/types/document';
import { BASE_URL } from '@/lib/api/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function fmtDate(d?: string) {
    if (!d) return '—';
    try { return format(new Date(d), 'd MMMM yyyy', { locale: fr }); } catch { return '—'; }
}

function extractId(iri?: string) {
    if (!iri) return '';
    return iri.split('/').filter(Boolean).pop() || iri;
}

function getDocLabel(doc: DocumentRecord) {
    const labels: Record<string, string> = { CV: 'CV', OTHER: 'Lettre de motivation', DIPL: 'Diplôme', CERT: 'Certificat' };
    return doc.title || labels[doc.type] || doc.type;
}

function getFileExt(doc: DocumentRecord) {
    return (doc.filePath || doc.contentUrl || '').split('.').pop()?.toLowerCase() || '';
}

function isImage(doc: DocumentRecord) {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(getFileExt(doc));
}

// ── Preview Modal ─────────────────────────────────────────────────────────────
function PreviewModal({ doc, onClose }: { doc: DocumentRecord; onClose: () => void }) {
    const url = doc.contentUrl?.startsWith('http') ? doc.contentUrl : `${BASE_URL}${doc.contentUrl}`;
    const ext = getFileExt(doc);
    const isPdf = ext === 'pdf';
    const img = isImage(doc);

    return (
        <div className="fixed inset-0 z-[80] bg-secondary-950/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-100">
                    <div>
                        <p className="font-black text-secondary-900 uppercase tracking-tighter text-sm">{getDocLabel(doc)}</p>
                        <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest mt-0.5">{ext.toUpperCase()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-primary-50 text-primary-600 border border-primary-100 rounded-xl hover:bg-primary-100 transition-colors">
                            <Eye className="w-3.5 h-3.5" />Ouvrir
                        </a>
                        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-secondary-400 hover:bg-secondary-100 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto bg-secondary-50 flex items-center justify-center min-h-[400px]">
                    {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt={getDocLabel(doc)} className="max-w-full max-h-[70vh] object-contain rounded-xl" />
                    ) : isPdf ? (
                        <iframe src={url} className="w-full h-[70vh]" title={getDocLabel(doc)} />
                    ) : (
                        <div className="flex flex-col items-center gap-4 py-16">
                            <FileText className="w-16 h-16 text-secondary-300" />
                            <p className="text-secondary-500 font-medium text-sm">Aperçu non disponible pour ce format</p>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-black uppercase tracking-widest text-primary-600 hover:underline">Télécharger le fichier</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ onConfirm, onClose, loading }: { onConfirm: (reason: string) => void; onClose: () => void; loading: boolean }) {
    const [reason, setReason] = useState('');
    return (
        <div className="fixed inset-0 z-[80] bg-secondary-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-5">
                <div>
                    <p className="font-black text-secondary-900 uppercase tracking-tighter text-lg">Rejeter la candidature</p>
                    <p className="text-secondary-500 font-medium text-sm mt-1">Veuillez indiquer le motif du rejet</p>
                </div>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Motif du rejet..."
                    rows={4}
                    className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-2xl text-sm font-medium text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
                />
                <div className="flex items-center justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={loading} className="h-11 px-5 rounded-2xl font-black uppercase tracking-widest text-[10px]">Annuler</Button>
                    <Button onClick={() => onConfirm(reason)} disabled={!reason.trim() || loading} className="h-11 px-5 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-rose-600 hover:bg-rose-700 text-white gap-2">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Confirmer le rejet
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ApplicationDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const appId = params?.id || '';

    const [activeTab, setActiveTab] = useState<'info' | 'documents'>('info');
    const [application, setApplication] = useState<Application | null>(null);
    const [documents, setDocuments] = useState<DocumentRecord[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);

    useEffect(() => {
        if (!appId) return;
        setIsLoading(true);
        getApplicationById(appId)
            .then(setApplication).catch(e => setError(e?.message || 'Erreur.'))
            .finally(() => setIsLoading(false));
    }, [appId]);

    useEffect(() => {
        if (activeTab !== 'documents' || !appId) return;
        setDocsLoading(true);
        getDocumentsByHolder('APPLICATION', appId)
            .then(data => {
                const list = Array.isArray(data) ? data : (data as any)['hydra:member'] || [];
                setDocuments(list);
            })
            .catch(() => setDocuments([]))
            .finally(() => setDocsLoading(false));
    }, [activeTab, appId]);

    function showToast(msg: string, type: 'success' | 'error') {
        setToast({ msg, type });
        window.setTimeout(() => setToast(null), 4500);
    }

    async function refresh() { const r = await getApplicationById(appId); setApplication(r); }

    async function doAction(fn: () => Promise<void>, successMsg: string) {
        setActionLoading(true);
        try { await fn(); showToast(successMsg, 'success'); await refresh(); }
        catch (e: any) { showToast(e?.message || 'Erreur.', 'error'); }
        finally { setActionLoading(false); }
    }

    if (isLoading) return (
        <div className="p-10 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            <p className="font-bold uppercase tracking-widest text-[10px] text-secondary-400">Chargement...</p>
        </div>
    );

    if (error || !application) return (
        <div className="p-10 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-secondary-500 font-medium">{error || 'Candidature introuvable.'}</p>
            <Button variant="outline" onClick={() => router.push('/applications')}>Retour</Button>
        </div>
    );

    const status = application.status;
    const styleClass = APPLICATION_STATUS_STYLES[status as keyof typeof APPLICATION_STATUS_STYLES] || 'bg-secondary-50 text-secondary-600 border-secondary-100';
    const jobOfferId = extractId(application.jobOffer);

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[70] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-right duration-300 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-accent-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                    {toast.msg}
                </div>
            )}

            {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
            {showRejectModal && (
                <RejectModal
                    loading={actionLoading}
                    onClose={() => setShowRejectModal(false)}
                    onConfirm={async reason => {
                        setShowRejectModal(false);
                        await doAction(() => rejectApplication(appId, reason), 'Candidature rejetée.');
                    }}
                />
            )}

            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="h-12 px-4 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={() => router.push('/applications')}>
                            <ArrowLeft className="w-4 h-4 mr-2" />Retour
                        </Button>
                        <div>
                            <h1 className="text-2xl font-black text-secondary-900 uppercase tracking-tighter">
                                {application.firstName} {application.lastName}
                            </h1>
                            <p className="text-secondary-500 font-medium italic">Détail de la candidature</p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border ${styleClass}`}>
                        {APPLICATION_STATUS_LABELS[status as keyof typeof APPLICATION_STATUS_LABELS] || status}
                    </span>
                </div>

                {/* Barre d'actions */}
                <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-secondary-100 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary-400 mr-1">Actions :</span>
                    <Button
                        onClick={() => doAction(() => shortlistApplication(appId), 'Candidat présélectionné.')}
                        disabled={status === APPLICATION_STATUS.SHORTLISTED || status === APPLICATION_STATUS.HIRED || status === APPLICATION_STATUS.REJECTED || actionLoading}
                        className="h-10 px-5 rounded-xl font-black uppercase tracking-widest text-[10px] bg-amber-500 hover:bg-amber-600 text-white gap-2"
                    >
                        <Star className="w-4 h-4" />Présélectionner
                    </Button>
                    <Button
                        onClick={() => doAction(() => scheduleInterview(appId), 'Entretien planifié.')}
                        disabled={status === APPLICATION_STATUS.INTERVIEW || status === APPLICATION_STATUS.HIRED || status === APPLICATION_STATUS.REJECTED || actionLoading}
                        className="h-10 px-5 rounded-xl font-black uppercase tracking-widest text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                    >
                        <MessageSquare className="w-4 h-4" />Planifier entretien
                    </Button>
                    <Button
                        onClick={() => doAction(() => hireApplication(appId), 'Candidat recruté !')}
                        disabled={status === APPLICATION_STATUS.HIRED || status === APPLICATION_STATUS.REJECTED || actionLoading}
                        className="h-10 px-5 rounded-xl font-black uppercase tracking-widest text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                        <UserCheck className="w-4 h-4" />Recruter
                    </Button>
                    <Button
                        onClick={() => setShowRejectModal(true)}
                        disabled={status === APPLICATION_STATUS.REJECTED || status === APPLICATION_STATUS.HIRED || actionLoading}
                        variant="outline"
                        className="h-10 px-5 rounded-xl font-black uppercase tracking-widest text-[10px] text-rose-600 border-rose-100 bg-rose-50 hover:bg-rose-600 hover:text-white gap-2"
                    >
                        <XCircle className="w-4 h-4" />Rejeter
                    </Button>
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin text-secondary-400 ml-auto" />}
                </div>
            </div>

            {/* Onglets */}
            <div className="flex items-center gap-1 border-b border-secondary-100">
                {([
                    { key: 'info', label: 'Informations', icon: Users },
                    { key: 'documents', label: 'Documents', icon: FileText },
                ] as const).map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={cn('flex items-center gap-2 px-5 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all',
                            activeTab === tab.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-secondary-400 hover:text-secondary-700'
                        )}>
                        <tab.icon className="w-4 h-4" />{tab.label}
                    </button>
                ))}
            </div>

            {/* Onglet Info */}
            {activeTab === 'info' && (
                <div className="grid grid-cols-1 gap-6">
                    {/* Infos candidat */}
                    <Card className="border-none shadow-2xl shadow-secondary-200/40 bg-white rounded-[40px]">
                        <CardHeader className="p-8 border-b border-secondary-50">
                            <CardTitle className="text-xl font-black text-secondary-900 uppercase tracking-tight">Profil du candidat</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {/* Avatar + nom */}
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-2xl bg-primary-100 border border-primary-200 flex items-center justify-center font-black text-primary-700 text-xl shrink-0">
                                    {application.firstName[0]}{application.lastName[0]}
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-secondary-900 uppercase tracking-tighter">{application.firstName} {application.lastName}</p>
                                    <p className="text-secondary-400 font-bold text-xs uppercase tracking-widest mt-1">{application.gender === 'M' ? 'Homme' : application.gender === 'F' ? 'Femme' : application.gender}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoRow icon={Mail} label="Email" value={application.email} />
                                <InfoRow icon={Phone} label="Téléphone" value={application.phone} />
                                <InfoRow icon={Briefcase} label="Offre" value={jobOfferId} link={`/job-offers/${jobOfferId}`} />
                                <InfoRow icon={Calendar} label="Candidature reçue" value={fmtDate(application.appliedAt || application.createdAt)} />
                            </div>

                            {application.notes && (
                                <div className="bg-secondary-50 rounded-2xl border border-secondary-100 p-5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400 mb-2">Message du candidat</p>
                                    <p className="text-sm font-medium text-secondary-700 leading-relaxed">{application.notes}</p>
                                </div>
                            )}

                            {/* Timeline statuts */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Historique</p>
                                <div className="space-y-2">
                                    {[
                                        { label: 'Candidature reçue', date: application.appliedAt, by: null },
                                        { label: 'Présélectionné(e)', date: application.shortlistedAt, by: application.shortlistedBy },
                                        { label: 'Entretien planifié', date: application.interviewAt, by: application.interviewBy },
                                        { label: 'Rejeté(e)', date: application.rejectedAt, by: application.rejectedBy, reason: application.rejectionReason },
                                        { label: 'Recruté(e)', date: application.hiredAt, by: application.hiredBy },
                                    ].filter(e => e.date).map(e => (
                                        <div key={e.label} className="flex items-start gap-3 px-4 py-3 bg-secondary-50 rounded-2xl border border-secondary-100">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-black text-secondary-900 uppercase tracking-tight">{e.label}</p>
                                                <p className="text-[10px] text-secondary-400 font-medium mt-0.5">{fmtDate(e.date)}{e.by ? ` · par ${e.by}` : ''}</p>
                                                {e.reason && <p className="text-[11px] text-rose-600 font-medium mt-1 italic">{e.reason}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            )}

            {/* Onglet Documents */}
            {activeTab === 'documents' && (
                <Card className="border-none shadow-xl shadow-secondary-200/50">
                    <CardHeader className="border-b border-secondary-100 bg-white">
                        <CardTitle className="text-secondary-900 font-black uppercase tracking-tight text-lg">Documents joints</CardTitle>
                        <CardDescription className="text-secondary-500 font-medium italic">CV et lettres de motivation</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        {docsLoading ? (
                            <div className="py-16 flex flex-col items-center gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="py-16 flex flex-col items-center gap-3 text-center">
                                <FileText className="w-12 h-12 text-secondary-200" />
                                <p className="text-secondary-400 font-bold uppercase tracking-widest text-[10px]">Aucun document joint</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {documents.map(doc => {
                                    const ext = getFileExt(doc);
                                    const url = doc.contentUrl?.startsWith('http') ? doc.contentUrl : `${BASE_URL}${doc.contentUrl}`;
                                    return (
                                        <div key={doc.id} className="bg-white rounded-2xl border border-secondary-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-all">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                                                    <FileText className="w-5 h-5 text-primary-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-black text-secondary-900 text-sm uppercase tracking-tighter truncate">{getDocLabel(doc)}</p>
                                                    <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest mt-0.5">{ext.toUpperCase()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pt-2 border-t border-secondary-100">
                                                {doc.contentUrl && (
                                                    <button
                                                        onClick={() => setPreviewDoc(doc)}
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-widest bg-primary-50 text-primary-600 border border-primary-100 rounded-xl hover:bg-primary-100 transition-colors"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />Prévisualiser
                                                    </button>
                                                )}
                                                {doc.contentUrl && (
                                                    <a href={url} target="_blank" rel="noopener noreferrer"
                                                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest bg-secondary-50 text-secondary-600 border border-secondary-100 rounded-xl hover:bg-secondary-100 transition-colors">
                                                        <Eye className="w-3.5 h-3.5" />Ouvrir
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function InfoRow({ icon: Icon, label, value, link }: { icon: React.ElementType; label: string; value: string; link?: string }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3 bg-secondary-50 rounded-2xl border border-secondary-100">
            <Icon className="w-4 h-4 text-secondary-400 shrink-0" />
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">{label}</p>
                {link ? (
                    <a href={link} className="text-sm font-black text-primary-600 hover:underline truncate block">{value}</a>
                ) : (
                    <p className="text-sm font-black text-secondary-900 truncate">{value}</p>
                )}
            </div>
        </div>
    );
}
