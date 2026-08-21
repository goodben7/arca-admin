'use client';

import { useState, useEffect, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    RotateCw,
    Maximize2,
    Eye,
    Activity,
    Power,
    Ban,
    Clock as ClockIcon,
    CheckCircle2,
    CheckCircle,
    ChevronDown,
    Play,
    History,
    FileText as FileIcon,
    UserCircle2,
    CalendarDays,
    MoreVertical,
    ChevronLeft,
    FileText,
    User,
    Loader2,
    AlertCircle,
    Download,
    Plus,
    Upload,
    FileCheck,
    Shield,
    X,
    FolderOpen,
    Image as ImageIcon,
    ZoomIn,
    ZoomOut
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TabsProvider, TabsList, TabsTrigger, TabsContent, TabsPanels } from '@/components/ui/Tabs';
import { Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getContractById, changeContractStatus } from '@/lib/api/contract';
import { getEmployeeById } from '@/lib/api/employee';
import { getAllUsers } from '@/lib/api/profile';
import { uploadDocument, getDocumentsByHolder } from '@/lib/api/document';
import { AppUser } from '@/types/profile';
import { Contract, CONTRACT_TYPE, CONTRACT_STATUS } from '@/types/contract';
import { Employee } from '@/types/employee';
import { DOCUMENT_TYPE, DocumentRecord, HOLDER_TYPE } from '@/types/document';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { ContentPanel } from '@/components/layout/ContentPanel';
import { AnchoredDropdown } from '@/components/ui/AnchoredDropdown';
import { ProfileField } from '@/components/employees/ProfileField';
import { EMPLOYEE_TAB_TRIGGER } from '@/components/employees/employeeProfileTabs';
import { buildAssetUrl } from '@/lib/api/client';
import { generateContractPdf } from '@/lib/contracts/generateContractPdf';


const DOC_TYPE_LABELS: Record<string, string> = {
    CNTR: 'Contrat', AMD: 'Avenant', ID: 'Carte d\'identité', CV: 'CV',
    DIPL: 'Diplôme', LEGAL: 'Document Légal', OTHER: 'Autre',
};

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

function getFileKind(doc: DocumentRecord): 'image' | 'pdf' | 'other' {
    const src = doc.contentUrl || doc.filePath || '';
    const ext = src.split('.').pop()?.toLowerCase() || '';
    if (IMAGE_EXTS.includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'other';
}

function formatDocDate(doc: DocumentRecord) {
    const raw = doc.uploadedAt || doc.createdAt;
    if (!raw) return '—';
    try { return format(new Date(raw), 'dd MMM yyyy', { locale: fr }); }
    catch { return '—'; }
}

// ─── Preview Modal ─────────────────────────────────────────────────────────────
function PreviewModal({ doc, onClose }: { doc: DocumentRecord; onClose: () => void }) {
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const kind = getFileKind(doc);
    const url = doc.contentUrl ? buildAssetUrl(doc.contentUrl) : '';

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 20, 300));
            if (e.key === '-') setZoom(z => Math.max(z - 20, 30));
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col bg-secondary-950/90 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Top Bar */}
            <div
                className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10 shrink-0"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        {kind === 'image' ? <ImageIcon className="w-5 h-5 text-white" /> : <FileText className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                        <h3 className="font-black text-white text-sm uppercase tracking-tight max-w-sm truncate">
                            {doc.title || 'Document'}
                        </h3>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] font-bold text-white/40 uppercase">{DOC_TYPE_LABELS[doc.type] || doc.type}</span>
                            {doc.documentRefNumber && (
                                <span className="text-[10px] text-white/30">Réf: {doc.documentRefNumber}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {kind === 'image' && (
                        <>
                            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(z - 20, 30))}
                                className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-xl">
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            <span className="text-xs font-black text-white/60 min-w-[3rem] text-center">{zoom}%</span>
                            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(z + 20, 300))}
                                className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-xl">
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setRotation(r => (r + 90) % 360)}
                                className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-xl">
                                <RotateCw className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setZoom(100)}
                                className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-xl">
                                <Maximize2 className="w-4 h-4" />
                            </Button>
                            <div className="w-px h-5 bg-white/10 mx-1" />
                        </>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => window.open(url, '_blank')}
                        className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-xl">
                        <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onClose}
                        className="h-9 w-9 text-white/70 hover:text-white hover:bg-rose-500 rounded-xl">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div
                className="flex-1 overflow-hidden flex items-center justify-center p-8"
                onClick={e => e.stopPropagation()}
            >
                {kind === 'image' && (
                    <div className="w-full h-full flex items-center justify-center overflow-auto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={url}
                            alt={doc.title || 'Aperçu'}
                            className="object-contain max-w-none transition-transform duration-300 rounded-2xl shadow-2xl"
                            style={{ width: `${zoom}%`, transform: `rotate(${rotation}deg)` }}
                        />
                    </div>
                )}
                {kind === 'pdf' && (
                    <iframe
                        src={`${url}#toolbar=1&navpanes=0`}
                        className="w-full h-full border-none rounded-2xl shadow-2xl"
                        title={doc.title || 'PDF'}
                    />
                )}
                {kind === 'other' && (
                    <div className="flex flex-col items-center gap-6 text-white/40">
                        <FileText className="w-20 h-20" />
                        <p className="font-bold uppercase tracking-widest text-sm">Aperçu non disponible</p>
                        <Button onClick={() => window.open(url, '_blank')}
                            className="gap-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl px-8 py-6">
                            <Download className="w-4 h-4" /> Télécharger le fichier
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
interface PageProps { params: Promise<{ id: string }>; }

export default function ContractDetailsPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [contract, setContract] = useState<Contract | null>(null);
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [documents, setDocuments] = useState<DocumentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
    const [uploadData, setUploadData] = useState({
        type: DOCUMENT_TYPE.CONTRACT as string,
        title: '',
        documentRefNumber: '',
        file: null as File | null
    });

    const [usersMap, setUsersMap] = useState<Record<string, { name?: string, email: string }>>({});
    const [isChangingStatus, setIsChangingStatus] = useState<string | null>(null);
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const statusTriggerRef = useRef<HTMLButtonElement>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean,
        title: string,
        message: string,
        action: string,
        variant: 'danger' | 'warning' | 'info' | 'success'
    }>({
        isOpen: false,
        title: '',
        message: '',
        action: '',
        variant: 'info'
    });

    async function handleStatusChange(action: string) {
        setIsStatusMenuOpen(false);

        let title = "Confirmation";
        let message = "Êtes-vous sûr de vouloir procéder à cette opération ?";
        let variant: 'danger' | 'warning' | 'info' | 'success' = 'warning';

        switch (action) {
            case 'activations':
                title = "Activer le contrat";
                message = "Activer définitivement ce contrat ?";
                variant = 'success';
                break;
            case 'endings':
                title = "Mettre fin au contrat";
                message = "Êtes-vous sûr de vouloir mettre fin à ce contrat ?";
                variant = 'danger';
                break;
            case 'cancellations':
                title = "Annuler le contrat";
                message = "Annuler ce contrat (erreur / rétractation) ?";
                variant = 'danger';
                break;
            case 'pendings':
                title = "Remettre en attente";
                message = "Souhaitez-vous repasser ce contrat en statut d'attente ?";
                variant = 'warning';
                break;
        }

        setConfirmModal({
            isOpen: true,
            title,
            message,
            action,
            variant
        });
    }

    async function executeStatusChange() {
        if (!contract) return;
        const action = confirmModal.action;
        setConfirmModal(prev => ({ ...prev, isOpen: false }));

        setIsChangingStatus(action);
        try {
            await changeContractStatus(action, contract.id);
            await fetchData();
        } catch (err: any) {
            alert(err.message || 'Erreur lors du changement de statut');
        } finally {
            setIsChangingStatus(null);
        }
    }

    async function fetchData() {
        try {
            setIsLoading(true);
            const [contractData, usersData] = await Promise.all([
                getContractById(id),
                getAllUsers().catch(() => ({ member: [] }))
            ]);
            
            setContract(contractData);

            // Populate users map
            const usersList = Array.isArray(usersData) ? usersData : (usersData as any).member || (usersData as any)['hydra:member'] || [];
            const uMap: Record<string, { name?: string, email: string }> = {};
            usersList.forEach((u: AppUser) => {
                uMap[u.id] = { name: (u as any).displayName, email: u.email };
                if (u['@id']) uMap[u['@id']] = { name: (u as any).displayName, email: u.email };
            });
            setUsersMap(uMap);

            if (contractData.employee) {
                const empId = contractData.employee.split('/').pop() || contractData.employee;
                getEmployeeById(empId).then(setEmployee).catch(console.error);
            }

            const docsData = await getDocumentsByHolder(HOLDER_TYPE.CONTRACT, id);
            setDocuments(Array.isArray(docsData) ? docsData : (docsData as any)['hydra:member'] || []);
        } catch (err: any) {
            setError(err.message || 'Erreur lors du chargement des données.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => { fetchData(); }, [id]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadData.file) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('type', uploadData.type);
            formData.append('title', String(uploadData.title || ''));
            formData.append('documentRefNumber', String(uploadData.documentRefNumber || ''));
            formData.append('holderType', HOLDER_TYPE.CONTRACT);
            formData.append('holderId', String(id));
            formData.append('file', uploadData.file);
            await uploadDocument(formData);
            setIsUploadOpen(false);
            setUploadData({ type: DOCUMENT_TYPE.CONTRACT, title: '', documentRefNumber: '', file: null });
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Erreur lors de l\'envoi du document');
        } finally {
            setIsUploading(false);
        }
    };

    const handleGeneratePdf = () => {
        if (!contract) return;
        setIsGeneratingPdf(true);
        try {
            generateContractPdf(contract, employee);
        } catch (err: any) {
            alert(err.message || 'Impossible de générer le PDF.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status.toUpperCase()) {
            case CONTRACT_STATUS.ACTIVE: return { label: 'Actif', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' };
            case CONTRACT_STATUS.PENDING: return { label: 'En attente', bg: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' };
            case CONTRACT_STATUS.ENDED: return { label: 'Terminé', bg: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
            case CONTRACT_STATUS.CANCELLED: return { label: 'Annulé', bg: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500' };
            default: return { label: status, bg: 'bg-secondary-50 text-secondary-600 border-secondary-200', dot: 'bg-secondary-400' };
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-secondary-400">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                <p className="font-black animate-pulse uppercase tracking-[0.2em] text-[10px]">Chargement du contrat...</p>
            </div>
        );
    }

    if (error || !contract) {
        return (
            <div className="h-96 flex flex-col items-center justify-center gap-6 p-8">
                <AlertCircle className="w-16 h-16 text-destructive/20" />
                <div className="text-center">
                    <h2 className="text-2xl font-black text-secondary-900 uppercase">Données introuvables</h2>
                    <p className="text-secondary-500 font-medium italic mt-2">{error || "Ce contrat n'existe pas."}</p>
                </div>
                <Button variant="outline" onClick={() => router.back()} className="font-bold border-none shadow-sm gap-2">
                    <ChevronLeft className="w-4 h-4" /> Retour
                </Button>
            </div>
        );
    }

    return (
        <PageShell className="pb-12 animate-in fade-in duration-700">
            {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}

            <PageHeader
                title={`Contrat #${contract.id.slice(0, 8)}`}
                description={employee ? `${employee.firstName} ${employee.lastName}` : '…'}
                backHref="/m/personnel/contracts"
                actions={
                    <>
                        <Badge variant={contract.status === CONTRACT_STATUS.ACTIVE ? 'success' : contract.status === CONTRACT_STATUS.PENDING ? 'warning' : 'secondary'}>
                            {getStatusStyles(contract.status).label}
                        </Badge>
                        <Badge variant="outline">{contract.type === CONTRACT_TYPE.INTERNSHIP ? 'Stage' : contract.type}</Badge>
                        <div className="relative">
                            <Button
                                ref={statusTriggerRef}
                                onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <Activity className="w-4 h-4" />
                                Statut
                                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isStatusMenuOpen && "rotate-180")} />
                            </Button>

                            <AnchoredDropdown
                                open={isStatusMenuOpen}
                                onClose={() => setIsStatusMenuOpen(false)}
                                triggerRef={statusTriggerRef}
                                width={224}
                                align="right"
                                className="p-2"
                            >
                                <div className="px-3 py-2 text-[10px] font-black tracking-widest uppercase text-secondary-400 border-b border-secondary-100 mb-2">
                                    Transitions disponibles
                                </div>
                                <div className="flex flex-col gap-1">
                                    {(contract.status === CONTRACT_STATUS.PENDING || contract.status === CONTRACT_STATUS.ENDED || contract.status === CONTRACT_STATUS.CANCELLED) && (
                                        <button
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
                                            onClick={() => handleStatusChange('activations')}
                                        >
                                            {isChangingStatus === 'activations' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                            Activer le Contrat
                                        </button>
                                    )}

                                    {contract.status === CONTRACT_STATUS.ACTIVE && (
                                        <>
                                            <button
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                                                onClick={() => handleStatusChange('endings')}
                                            >
                                                {isChangingStatus === 'endings' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                                                Terminer le Contrat
                                            </button>

                                            <button
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-amber-600 hover:bg-amber-50 transition-colors"
                                                onClick={() => handleStatusChange('pendings')}
                                            >
                                                {isChangingStatus === 'pendings' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClockIcon className="w-4 h-4" />}
                                                Mettre en Attente
                                            </button>

                                            <button
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                                                onClick={() => handleStatusChange('cancellations')}
                                            >
                                                {isChangingStatus === 'cancellations' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                                                Annuler le Contrat
                                            </button>
                                        </>
                                    )}

                                    {contract.status === CONTRACT_STATUS.PENDING && (
                                        <button
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                                            onClick={() => handleStatusChange('cancellations')}
                                        >
                                            {isChangingStatus === 'cancellations' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                                            Annuler le Contrat
                                        </button>
                                    )}
                                </div>
                            </AnchoredDropdown>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={handleGeneratePdf}
                            disabled={isGeneratingPdf}
                        >
                            {isGeneratingPdf ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            Générer PDF
                        </Button>
                        <Button onClick={() => setIsUploadOpen(true)} variant="pill" size="sm" className="gap-2">
                            <Plus className="w-4 h-4" /> Ajouter un document
                        </Button>
                    </>
                }
            />

            <ContentPanel>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 md:p-8 border-b border-border">
                <ProfileField
                    label="Rémunération mensuelle"
                    value={`${parseInt(contract.salary || '0').toLocaleString()} CDF`}
                />
                <ProfileField
                    label="Date de début"
                    value={format(new Date(contract.startDate), 'd MMMM yyyy', { locale: fr })}
                />
                <ProfileField
                    label="Date de fin"
                    value={contract.endDate ? format(new Date(contract.endDate), 'd MMMM yyyy', { locale: fr }) : 'Indéterminé'}
                />
                <ProfileField
                    label="Créé le"
                    value={format(new Date(contract.createdAt), 'd MMMM yyyy', { locale: fr })}
                />
            </dl>

            <TabsProvider defaultIndex={0}>
                <TabsList className="w-full justify-start rounded-none bg-transparent border-b border-border p-0 h-auto gap-0 px-6">
                    <TabsTrigger className={EMPLOYEE_TAB_TRIGGER}>Documents</TabsTrigger>
                    <TabsTrigger className={EMPLOYEE_TAB_TRIGGER}>Historique</TabsTrigger>
                </TabsList>

                <TabsPanels>
                    <TabsContent className="mt-0 p-6 md:p-8 focus:outline-none">
                                <Card className="border-none  shadow-sm-200/30 bg-white rounded-xl overflow-hidden">
                                    <CardHeader className="p-8 border-b border-secondary-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm-100 border border-secondary-100">
                                                <FolderOpen className="w-6 h-6 text-primary-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-black text-secondary-900 uppercase tracking-tight">Pièces Jointes</CardTitle>
                                                <CardDescription className="text-sm font-medium">Cliquez sur un document pour l'apercevoir</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-secondary-50/50 border-b border-secondary-100">
                                                    <tr>
                                                        <th className="px-8 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Type / Référence</th>
                                                        <th className="px-8 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Titre</th>
                                                        <th className="px-8 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Ajouté le</th>
                                                        <th className="px-8 py-5 text-right text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-secondary-50 text-sm">
                                                    {documents.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="px-8 py-16 text-center">
                                                                <FileText className="w-12 h-12 text-secondary-100 mx-auto mb-4" />
                                                                <p className="text-secondary-400 font-bold italic uppercase text-xs">Aucun document archivé</p>
                                                                <button
                                                                    onClick={() => setIsUploadOpen(true)}
                                                                    className="mt-3 text-xs font-bold text-primary-600 hover:underline"
                                                                >
                                                                    + Ajouter le premier document
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        documents.map((doc) => {
                                                            const kind = getFileKind(doc);
                                                            const canPreview = !!doc.contentUrl;
                                                            const contentUrl = doc.contentUrl ? buildAssetUrl(doc.contentUrl) : null;

                                                            return (
                                                                <tr
                                                                    key={doc.id}
                                                                    onClick={() => canPreview && setPreviewDoc(doc)}
                                                                    className={cn(
                                                                        "group transition-colors",
                                                                        canPreview ? "cursor-pointer hover:bg-primary-50/40" : "hover:bg-secondary-50/50"
                                                                    )}
                                                                >
                                                                    <td className="px-8 py-5">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={cn(
                                                                                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all",
                                                                                kind === 'pdf' ? "bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white" :
                                                                                    kind === 'image' ? "bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white" :
                                                                                        "bg-secondary-100 text-secondary-400"
                                                                            )}>
                                                                                {kind === 'image' ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                                                            </div>
                                                                            <div>
                                                                                <span className="font-black text-secondary-900 uppercase text-xs block">
                                                                                    {DOC_TYPE_LABELS[doc.type] || doc.type}
                                                                                </span>
                                                                                <span className="text-[10px] font-bold text-secondary-400 uppercase">
                                                                                    {doc.documentRefNumber || 'N/A'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-8 py-5">
                                                                        <span className="font-bold text-secondary-600 uppercase italic">
                                                                            {doc.title || 'Sans titre'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-8 py-5 font-bold text-secondary-400 tabular-nums text-xs">
                                                                        {formatDocDate(doc)}
                                                                    </td>
                                                                    <td className="px-8 py-5 text-right">
                                                                        <div
                                                                            className="flex items-center justify-end gap-2 opacity-100 transition-opacity"
                                                                            onClick={e => e.stopPropagation()}
                                                                        >
                                                                            {canPreview && (
                                                                                <Button
                                                                                    variant="outline" size="icon"
                                                                                    onClick={() => setPreviewDoc(doc)}
                                                                                    className="h-9 w-9 border-none bg-white shadow-sm hover:scale-110 active:scale-90 transition-all"
                                                                                    title="Aperçu"
                                                                                >
                                                                                    <Eye className="w-4 h-4 text-indigo-600" />
                                                                                </Button>
                                                                            )}
                                                                            {contentUrl && (
                                                                                <Button
                                                                                    variant="outline" size="icon"
                                                                                    onClick={() => window.open(contentUrl, '_blank')}
                                                                                    className="h-9 w-9 border-none bg-white shadow-sm hover:scale-110 active:scale-90 transition-all"
                                                                                    title="Télécharger"
                                                                                >
                                                                                    <Download className="w-4 h-4 text-primary-600" />
                                                                                </Button>
                                                                            )}
                                                                            <Button
                                                                                variant="outline" size="icon"
                                                                                className="h-9 w-9 border-none bg-white shadow-sm hover:scale-110 active:scale-90 transition-all text-destructive"
                                                                                title="Supprimer"
                                                                            >
                                                                                <X className="w-4 h-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent className="mt-0 p-6 md:p-8 focus:outline-none">
                                <Card className="border-none  shadow-sm-200/30 bg-white rounded-xl overflow-hidden">
                                    <CardHeader className="p-8 border-b border-secondary-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm-100 border border-secondary-100">
                                                <History className="w-6 h-6 text-primary-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-black text-secondary-900 uppercase tracking-tight">Historique du Contrat</CardTitle>
                                                <CardDescription className="text-sm font-medium">Trace des événements et changements de statut</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 relative">
                                        <div className="absolute left-[54px] top-12 bottom-12 w-px bg-secondary-100 hidden md:block" />

                                        <div className="space-y-4">
                                            {[
                                                { date: contract.createdAt, by: null, label: "Contrat Créé", type: "Création", icon: Plus, bg: "from-secondary-400 to-secondary-600", lightBg: "bg-secondary-50" },
                                                { date: contract.activatedAt, by: contract.activatedBy, label: "Contrat Activé", type: "Activation", icon: CheckCircle, bg: "from-emerald-400 to-emerald-600", lightBg: "bg-emerald-50" },
                                                { date: contract.pendingAt, by: contract.pendingBy, label: "Contrat Mis en Attente", type: "Statut", icon: ClockIcon, bg: "from-amber-400 to-amber-600", lightBg: "bg-amber-50" },
                                                { date: contract.endedAt, by: contract.endedBy, label: "Contrat Terminé", type: "Clôture", icon: Ban, bg: "from-slate-400 to-slate-600", lightBg: "bg-slate-50" },
                                                { date: contract.cancelledAt, by: contract.cancelledBy, label: "Contrat Annulé", type: "Annulation", icon: Ban, bg: "from-rose-400 to-rose-600", lightBg: "bg-rose-50" },
                                            ].filter(ev => ev.date).sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime()).map((ev, idx) => (
                                                <div key={idx} className="flex gap-6 pb-8 relative group">
                                                    <div className="relative z-10 shrink-0">
                                                        <div className={cn("w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110", ev.bg)}>
                                                            <ev.icon className="w-5 h-5 text-white" />
                                                        </div>
                                                    </div>
                                                    <div className={cn("flex-1 p-5 rounded-xl border shadow-sm group-hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-white", ev.lightBg.replace('bg-', 'from-'))}>
                                                        <div className="flex items-start justify-between gap-4 mb-3">
                                                            <div>
                                                                <p className="text-xs font-black text-secondary-900 uppercase tracking-widest">{ev.label}</p>
                                                                <p className="text-sm font-medium text-secondary-500 mt-1">
                                                                    Action effectuée par <span className="font-black text-secondary-800">
                                                                        {ev.by ? (usersMap[ev.by]?.name || usersMap[ev.by]?.email || ev.by) : 'Système'}
                                                                    </span>
                                                                </p>
                                                            </div>
                                                            <span className={cn("shrink-0 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border", ev.lightBg.replace('bg-', 'bg-').replace('50', '100'), ev.lightBg.replace('bg-', 'text-').replace('50', '700'))}>
                                                                {ev.type}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 pt-3 border-t border-secondary-100">
                                                            <CalendarDays className="w-3.5 h-3.5 text-secondary-400" />
                                                            <p className="text-[10px] font-black text-secondary-500 uppercase tracking-wider">
                                                                {format(new Date(ev.date!), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <div className="flex gap-6 relative">
                                                <div className="relative z-10 shrink-0">
                                                    <div className="w-11 h-11 rounded-2xl bg-secondary-100 border-2 border-dashed border-secondary-200 flex items-center justify-center">
                                                        <MoreVertical className="w-4 h-4 text-secondary-300" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 py-3">
                                                    <p className="text-[10px] font-black text-secondary-300 uppercase tracking-widest italic">
                                                        Fin de l'historique
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </TabsPanels>
            </TabsProvider>
            </ContentPanel>

            {/* Upload Modal */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-lg border-none shadow-3xl bg-white rounded-xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <CardHeader className="p-8 border-b border-secondary-50 flex flex-row items-center justify-between bg-indigo-50/30">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                                    <Upload className="w-5 h-5 text-white" />
                                </div>
                                <CardTitle className="text-lg font-black text-secondary-900 uppercase tracking-tighter">Nouveau Document</CardTitle>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsUploadOpen(false)} className="rounded-full hover:bg-white active:scale-90 shadow-sm">
                                <X className="w-5 h-5" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleUpload} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">Type de document</Label>
                                    <Select className="h-12 rounded-xl font-bold" value={uploadData.type}
                                        onChange={e => setUploadData({ ...uploadData, type: e.target.value })}>
                                        <option value={DOCUMENT_TYPE.CONTRACT}>Contrat (Original)</option>
                                        <option value={DOCUMENT_TYPE.CONTRACT_AMENDMENT}>Avenant</option>
                                        <option value={DOCUMENT_TYPE.ID_CARD}>Carte d'Identité</option>
                                        <option value={DOCUMENT_TYPE.CV}>CV</option>
                                        <option value={DOCUMENT_TYPE.DIPLOMA}>Diplôme</option>
                                        <option value={DOCUMENT_TYPE.LEGAL_DOCUMENT}>Document Légal</option>
                                        <option value={DOCUMENT_TYPE.OTHER}>Autre</option>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">Titre / Sujet</Label>
                                    <Input className="h-12 rounded-xl font-bold" placeholder="ex: Contrat de travail Jean Dupont"
                                        value={uploadData.title} onChange={e => setUploadData({ ...uploadData, title: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">Numéro de Référence</Label>
                                    <Input className="h-12 rounded-xl font-bold" placeholder="ex: REF-2024-001"
                                        value={uploadData.documentRefNumber} onChange={e => setUploadData({ ...uploadData, documentRefNumber: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">Fichier (PDF, Image)</Label>
                                    <div className="relative group">
                                        <input type="file" required
                                            onChange={e => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" />
                                        <div className="w-full h-32 border-2 border-dashed border-secondary-200 rounded-xl flex flex-col items-center justify-center gap-2 group-hover:border-primary-400 transition-colors bg-secondary-50/50">
                                            {uploadData.file ? (
                                                <>
                                                    <FileCheck className="w-8 h-8 text-emerald-500" />
                                                    <span className="text-sm font-bold text-emerald-600 truncate max-w-[240px]">{uploadData.file.name}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-8 h-8 text-secondary-400" />
                                                    <span className="text-xs font-black text-secondary-400 uppercase tracking-widest">Cliquez ou déposez</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button type="submit" disabled={isUploading || !uploadData.file}
                                    className="w-full py-7 rounded-2xl font-black uppercase tracking-widest text-xs gap-3 shadow-xl">
                                    {isUploading
                                        ? <Loader2 className="w-5 h-5 animate-spin" />
                                        : <><Upload className="w-5 h-5" /> Confirmer l'envoi</>
                                    }
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Custom Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-secondary-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <Card className="w-full max-w-sm border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] rounded-xl overflow-hidden bg-white animate-in zoom-in-95 duration-300">
                        <CardContent className="p-8 text-center space-y-6">
                            <div className={cn(
                                "w-20 h-20 rounded-xl flex items-center justify-center mx-auto shadow-sm",
                                confirmModal.variant === 'danger' ? "bg-rose-50 text-rose-500" :
                                confirmModal.variant === 'warning' ? "bg-amber-50 text-amber-500" :
                                confirmModal.variant === 'success' ? "bg-emerald-50 text-emerald-500" :
                                "bg-blue-50 text-blue-500"
                            )}>
                                {confirmModal.variant === 'danger' ? <AlertCircle className="w-10 h-10" /> :
                                 confirmModal.variant === 'success' ? <CheckCircle2 className="w-10 h-10" /> :
                                 <Activity className="w-10 h-10" />}
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-secondary-900 uppercase tracking-tight">{confirmModal.title}</h3>
                                <p className="text-sm font-medium text-secondary-500 leading-relaxed px-4">{confirmModal.message}</p>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <Button
                                    onClick={executeStatusChange}
                                    className={cn(
                                        "h-12 rounded-2xl text-white font-black uppercase text-[11px] tracking-widest shadow-xl transition-all active:scale-95",
                                        confirmModal.variant === 'danger' ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200/50" :
                                        confirmModal.variant === 'success' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50" :
                                        "bg-secondary-900 hover:bg-black shadow-secondary-200/50"
                                    )}
                                >
                                    Confirmer l'opération
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                    className="h-12 rounded-2xl text-secondary-400 font-bold uppercase text-[10px] tracking-widest hover:bg-secondary-50 transition-all"
                                >
                                    Annuler
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </PageShell>
    );
}
