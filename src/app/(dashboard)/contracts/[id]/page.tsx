'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    FileText,
    Calendar,
    User,
    Loader2,
    AlertCircle,
    Download,
    Plus,
    Upload,
    FileCheck,
    Clock,
    Shield,
    X,
    FolderOpen,
    Image as ImageIcon,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Maximize2,
    Eye
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getContractById } from '@/lib/api/contract';
import { getEmployeeById } from '@/lib/api/employee';
import { uploadDocument, getDocumentsByHolder } from '@/lib/api/document';
import { Contract } from '@/types/contract';
import { Employee } from '@/types/employee';
import { DOCUMENT_TYPE, DocumentRecord, HOLDER_TYPE } from '@/types/document';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BASE_URL } from '@/lib/api/client';


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
    const url = doc.contentUrl ? `${BASE_URL}${doc.contentUrl}` : '';

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

    async function fetchData() {
        try {
            setIsLoading(true);
            const contractData = await getContractById(id);
            setContract(contractData);
            const empId = contractData.employee.split('/').pop() || contractData.employee;
            const [empData, docsData] = await Promise.all([
                getEmployeeById(empId),
                getDocumentsByHolder(HOLDER_TYPE.CONTRACT, id)
            ]);
            setEmployee(empData);
            setDocuments(Array.isArray(docsData) ? docsData : docsData['hydra:member'] || []);
        } catch (err: any) {
            setError(err.message);
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

    const getStatusVariant = (status: string) => {
        switch (status.toUpperCase()) {
            case 'CDI': return 'success'; case 'CDD': return 'warning';
            case 'INTERNSHIP': return 'secondary'; case 'CONSULTANT': return 'outline';
            default: return 'secondary';
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
        <div className="space-y-8 pb-12 animate-in fade-in duration-700">
            {/* Preview Modal */}
            {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <Button variant="outline" size="icon" onClick={() => router.back()}
                        className="h-12 w-12 border-none bg-white shadow-xl shadow-secondary-200/50 hover:scale-110 active:scale-95 transition-all rounded-2xl">
                        <ChevronLeft className="w-6 h-6 text-secondary-600" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-black text-secondary-900 uppercase tracking-tighter">Contrat #{contract.id.slice(0, 8)}</h1>
                            <Badge variant={getStatusVariant(contract.status)} className="font-black px-4 py-1 rounded-full uppercase tracking-widest text-[10px]">
                                {contract.status}
                            </Badge>
                        </div>
                        <p className="text-secondary-500 font-bold italic flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {employee ? `${employee.firstName} ${employee.lastName}` : '…'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 border-none bg-white shadow-xl shadow-secondary-100 rounded-2xl font-bold uppercase tracking-widest text-[10px] py-6 px-6">
                        <Download className="w-4 h-4" /> Générer PDF
                    </Button>
                    <Button
                        onClick={() => setIsUploadOpen(true)}
                        className="gap-2 shadow-2xl shadow-primary-200 py-6 rounded-2xl font-black uppercase tracking-widest text-xs px-8 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                    >
                        <Plus className="w-4 h-4" /> Ajouter un document
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-2xl shadow-secondary-200/40 bg-white rounded-[32px] overflow-hidden">
                        <div className="h-3 bg-primary-600 w-full" />
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Rémunération Mensuelle</Label>
                                <p className="text-3xl font-black text-emerald-700 tabular-nums">
                                    {contract.salary} <span className="text-xs font-bold text-secondary-400 ml-1">CDF</span>
                                </p>
                            </div>
                            <div className="pt-6 border-t border-secondary-50 grid grid-cols-1 gap-6">
                                <InfoItem icon={Calendar} label="Début"
                                    value={format(new Date(contract.startDate), 'dd MMMM yyyy', { locale: fr })} />
                                <InfoItem icon={Calendar} label="Fin"
                                    value={contract.endDate ? format(new Date(contract.endDate), 'dd MMMM yyyy', { locale: fr }) : 'Indéterminé'} />
                                <InfoItem icon={Clock} label="Créé le"
                                    value={format(new Date(contract.createdAt), 'dd/MM/yyyy')} />
                            </div>
                            <div className="pt-6 border-t border-secondary-50">
                                <Card className="bg-secondary-900 text-white rounded-2xl p-5 border-none">
                                    <div className="flex items-center justify-between mb-3">
                                        <Shield className="w-5 h-5 text-emerald-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Conformité</span>
                                    </div>
                                    <p className="text-lg font-black uppercase italic">Validé RH</p>
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase mt-1">Dossier Complet</p>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Documents Table */}
                <div className="lg:col-span-3">
                    <Card className="border-none shadow-2xl shadow-secondary-200/30 bg-white rounded-[32px] overflow-hidden">
                        <CardHeader className="p-8 border-b border-secondary-50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-secondary-100 border border-secondary-100">
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
                                                const contentUrl = doc.contentUrl ? `${BASE_URL}${doc.contentUrl}` : null;

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
                                                                className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
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
                </div>
            </div>

            {/* Upload Modal */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-lg border-none shadow-3xl bg-white rounded-[40px] overflow-hidden animate-in zoom-in-95 duration-300">
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
                                        <div className="w-full h-32 border-2 border-dashed border-secondary-200 rounded-3xl flex flex-col items-center justify-center gap-2 group-hover:border-primary-400 transition-colors bg-secondary-50/50">
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
        </div>
    );
}

function InfoItem({ icon: Icon, label, value }: any) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] font-black text-secondary-400 uppercase tracking-widest">
                <Icon className="w-3.5 h-3.5 text-primary-500" /> {label}
            </div>
            <p className="text-sm font-bold text-secondary-900 uppercase">{value}</p>
        </div>
    );
}
