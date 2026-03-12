'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    FolderSearch,
    FileText,
    Image as ImageIcon,
    Download,
    Trash2,
    Search,
    Filter,
    Loader2,
    AlertCircle,
    Building2,
    User,
    FileCheck,
    X,
    Layers,
    HardDrive,
    Eye,
    ZoomIn,
    ZoomOut,
    Maximize2,
    RotateCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { getAllDocuments, deleteDocument } from '@/lib/api/document';
import { BASE_URL } from '@/lib/api/client';
import { DocumentRecord } from '@/types/document';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';


const HOLDER_TYPE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
    CONTRACT: { label: 'Contrats', icon: FileCheck, color: 'text-indigo-600 bg-indigo-50' },
    EMPLOYEE: { label: 'Employés', icon: User, color: 'text-emerald-600 bg-emerald-50' },
    LEAVE: { label: 'Congés', icon: FileText, color: 'text-amber-600 bg-amber-50' },
};

const DOC_TYPE_LABELS: Record<string, string> = {
    ID: 'Carte d\'identité', PASS: 'Passeport', PHOTO: 'Photo passeport', SIGN: 'Signature',
    BIRTH: 'Acte de naissance', MARST: 'État civil', ADDR: 'Attestation résidence',
    DIPL: 'Diplôme', CERT: 'Certificat', CV: 'CV', CNTR: 'Contrat de travail',
    AMD: 'Avenant contrat', JOFF: 'Offre d\'emploi', APPT: 'Lettre de nomination',
    ATST: 'Attestation de travail', MISS: 'Ordre de mission', WARN: 'Avertissement',
    PAY: 'Fiche de paie', TAX: 'Document fiscal', BANK: 'Coordonnées bancaires',
    INS: 'Assurance', MED: 'Certificat médical', RES: 'Lettre de démission',
    TERM: 'Fin de contrat', EXIT: 'Fiche de sortie', LEGAL: 'Document légal', OTHER: 'Autre',
};

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
const PDF_EXTS = ['pdf'];

function getFileType(doc: DocumentRecord): 'image' | 'pdf' | 'other' {
    const ext = (doc.filePath || doc.contentUrl || '').split('.').pop()?.toLowerCase() || '';
    if (IMAGE_EXTS.includes(ext)) return 'image';
    if (PDF_EXTS.includes(ext)) return 'pdf';
    return 'other';
}

function getFileIcon(doc: DocumentRecord) {
    const t = getFileType(doc);
    if (t === 'image') return ImageIcon;
    return FileText;
}

function isPreviewable(doc: DocumentRecord) {
    return !!doc.contentUrl && getFileType(doc) !== 'other';
}

function formatBytes(bytes?: number) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(doc: DocumentRecord) {
    const raw = doc.uploadedAt || doc.createdAt;
    if (!raw) return '—';
    try { return format(new Date(raw), 'dd MMM yyyy', { locale: fr }); }
    catch { return '—'; }
}

// ─── Preview Modal ─────────────────────────────────────────────────────────────
function PreviewModal({
    doc,
    allPreviewable,
    onClose,
    onPrev,
    onNext,
    hasPrev,
    hasNext,
}: {
    doc: DocumentRecord;
    allPreviewable: DocumentRecord[];
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    hasPrev: boolean;
    hasNext: boolean;
}) {
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const fileType = getFileType(doc);
    const url = doc.contentUrl ? `${BASE_URL}${doc.contentUrl}` : '';

    // Keyboard shortcuts
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft' && hasPrev) onPrev();
            if (e.key === 'ArrowRight' && hasNext) onNext();
            if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 20, 300));
            if (e.key === '-') setZoom(z => Math.max(z - 20, 30));
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [hasPrev, hasNext, onClose, onPrev, onNext]);

    // Reset zoom/rotation on doc change
    useEffect(() => { setZoom(100); setRotation(0); }, [doc.id]);

    const holderMeta = HOLDER_TYPE_LABELS[doc.holderType];

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col bg-secondary-950/90 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Top bar */}
            <div
                className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10 shrink-0"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        {fileType === 'image'
                            ? <ImageIcon className="w-5 h-5 text-white" />
                            : <FileText className="w-5 h-5 text-white" />
                        }
                    </div>
                    <div>
                        <h3 className="font-black text-white text-sm uppercase tracking-tight truncate max-w-md">
                            {doc.title || 'Document'}
                        </h3>
                        <div className="flex items-center gap-3 mt-0.5">
                            {holderMeta && (
                                <Badge className={cn("text-[8px] font-black uppercase border-none px-2", holderMeta.color)}>
                                    {holderMeta.label}
                                </Badge>
                            )}
                            <span className="text-[10px] font-bold text-white/40 uppercase">
                                {DOC_TYPE_LABELS[doc.type] || doc.type}
                            </span>
                            {doc.documentRefNumber && (
                                <span className="text-[10px] font-bold text-white/40">Réf: {doc.documentRefNumber}</span>
                            )}
                            <span className="text-[10px] text-white/30">{formatBytes(doc.fileSize)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {fileType === 'image' && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setZoom(z => Math.max(z - 20, 30))}
                                className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            <span className="text-xs font-black text-white/60 min-w-[3rem] text-center">{zoom}%</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setZoom(z => Math.min(z + 20, 300))}
                                className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setRotation(r => (r + 90) % 360)}
                                className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                            >
                                <RotateCw className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setZoom(100)}
                                className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                            >
                                <Maximize2 className="w-4 h-4" />
                            </Button>
                            <div className="w-px h-6 bg-white/10 mx-1" />
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(url, '_blank')}
                        className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                    >
                        <Download className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-9 w-9 text-white/70 hover:text-white hover:bg-rose-500 rounded-xl"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Content area */}
            <div
                className="flex-1 overflow-hidden relative flex items-center justify-center"
                onClick={e => e.stopPropagation()}
            >
                {/* Prev / Next buttons */}
                {hasPrev && (
                    <button
                        onClick={onPrev}
                        className="absolute left-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90 backdrop-blur-sm"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}
                {hasNext && (
                    <button
                        onClick={onNext}
                        className="absolute right-4 z-10 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90 backdrop-blur-sm"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                )}

                {fileType === 'image' && (
                    <div className="w-full h-full flex items-center justify-center overflow-auto p-8">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={url}
                            alt={doc.title || 'Aperçu'}
                            className="object-contain max-w-none transition-transform duration-300 rounded-2xl shadow-2xl"
                            style={{
                                width: `${zoom}%`,
                                transform: `rotate(${rotation}deg)`,
                            }}
                        />
                    </div>
                )}

                {fileType === 'pdf' && (
                    <iframe
                        src={`${url}#toolbar=1&navpanes=0`}
                        className="w-full h-full border-none"
                        title={doc.title || 'PDF'}
                    />
                )}
            </div>

            {/* Bottom navigation dots */}
            {allPreviewable.length > 1 && (
                <div
                    className="flex items-center justify-center gap-1.5 py-3 shrink-0"
                    onClick={e => e.stopPropagation()}
                >
                    {allPreviewable.map((d, i) => (
                        <div
                            key={d.id}
                            className={cn(
                                "rounded-full transition-all",
                                d.id === doc.id
                                    ? "w-6 h-2 bg-white"
                                    : "w-2 h-2 bg-white/20 hover:bg-white/40 cursor-pointer"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DocumentManagementPage() {
    const [docs, setDocs] = useState<DocumentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [activeHolderType, setActiveHolderType] = useState<string>('ALL');
    const [activeDocType, setActiveDocType] = useState<string>('ALL');
    const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setIsLoading(true);
                const data = await getAllDocuments();
                setDocs(data['hydra:member'] || []);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const handleDelete = async (id: string, title?: string) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le document "${title || 'ce document'}" ?`)) {
            return;
        }

        try {
            setIsDeleting(id);
            await deleteDocument(id);
            setDocs(prev => prev.filter(d => d.id !== id));
        } catch (err: any) {
            alert(err.message || "Erreur lors de la suppression");
        } finally {
            setIsDeleting(null);
        }
    };

    const holderTypes = useMemo(() => Array.from(new Set(docs.map(d => d.holderType))), [docs]);
    const docTypes = useMemo(() => Array.from(new Set(docs.map(d => d.type))), [docs]);

    const filtered = useMemo(() => docs.filter(doc => {
        const matchHolder = activeHolderType === 'ALL' || doc.holderType === activeHolderType;
        const matchType = activeDocType === 'ALL' || doc.type === activeDocType;
        const q = search.toLowerCase();
        const matchSearch = !q ||
            (doc.title || '').toLowerCase().includes(q) ||
            (doc.documentRefNumber || '').toLowerCase().includes(q) ||
            doc.holderId.toLowerCase().includes(q) ||
            doc.type.toLowerCase().includes(q);
        return matchHolder && matchType && matchSearch;
    }), [docs, activeHolderType, activeDocType, search]);

    // Only previewable docs in current filtered list, for prev/next navigation
    const previewable = useMemo(() => filtered.filter(isPreviewable), [filtered]);

    const previewIdx = previewDoc ? previewable.findIndex(d => d.id === previewDoc.id) : -1;

    const openPreview = useCallback((doc: DocumentRecord) => setPreviewDoc(doc), []);
    const closePreview = useCallback(() => setPreviewDoc(null), []);
    const prevPreview = useCallback(() => { if (previewIdx > 0) setPreviewDoc(previewable[previewIdx - 1]); }, [previewIdx, previewable]);
    const nextPreview = useCallback(() => { if (previewIdx < previewable.length - 1) setPreviewDoc(previewable[previewIdx + 1]); }, [previewIdx, previewable]);

    const totalSize = useMemo(() => docs.reduce((acc, d) => acc + (d.fileSize || 0), 0), [docs]);

    return (
        <div className="space-y-8 pb-12">
            {/* Preview modal */}
            {previewDoc && (
                <PreviewModal
                    doc={previewDoc}
                    allPreviewable={previewable}
                    onClose={closePreview}
                    onPrev={prevPreview}
                    onNext={nextPreview}
                    hasPrev={previewIdx > 0}
                    hasNext={previewIdx < previewable.length - 1}
                />
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-secondary-900 uppercase tracking-tighter">Gestion Documentaire</h1>
                    <p className="text-secondary-500 font-medium mt-1">Archive sécurisée de tous les documents administratifs.</p>
                </div>
                <div className="flex items-center gap-2 bg-white border border-secondary-100 shadow-xl shadow-secondary-100 rounded-2xl px-5 py-3">
                    <HardDrive className="w-4 h-4 text-primary-500" />
                    <span className="text-xs font-black text-secondary-900 uppercase">{formatBytes(totalSize)}</span>
                    <span className="text-xs font-medium text-secondary-400">utilisés</span>
                    <span className="ml-3 text-xs font-black text-secondary-900">{docs.length}</span>
                    <span className="text-xs font-medium text-secondary-400">documents</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-xl shadow-secondary-100/60 overflow-hidden rounded-[28px]">
                        <CardHeader className="px-6 py-5 bg-secondary-50/30 border-b border-secondary-100">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400 flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5" /> Par entité
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 space-y-1">
                            <FilterPill label="Tous" count={docs.length} active={activeHolderType === 'ALL'} onClick={() => setActiveHolderType('ALL')} />
                            {holderTypes.map(ht => {
                                const meta = HOLDER_TYPE_LABELS[ht] || { label: ht, icon: FileText, color: 'text-secondary-600 bg-secondary-50' };
                                const Icon = meta.icon;
                                return (
                                    <FilterPill
                                        key={ht}
                                        label={meta.label}
                                        count={docs.filter(d => d.holderType === ht).length}
                                        active={activeHolderType === ht}
                                        onClick={() => setActiveHolderType(ht)}
                                        icon={<Icon className="w-3.5 h-3.5" />}
                                        colorClass={meta.color}
                                    />
                                );
                            })}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl shadow-secondary-100/60 overflow-hidden rounded-[28px]">
                        <CardHeader className="px-6 py-5 bg-secondary-50/30 border-b border-secondary-100">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400 flex items-center gap-2">
                                <Filter className="w-3.5 h-3.5" /> Par type de pièce
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 space-y-1">
                            <FilterPill label="Tous les types" count={docs.length} active={activeDocType === 'ALL'} onClick={() => setActiveDocType('ALL')} />
                            {docTypes.map(dt => (
                                <FilterPill
                                    key={dt}
                                    label={DOC_TYPE_LABELS[dt] || dt}
                                    count={docs.filter(d => d.type === dt).length}
                                    active={activeDocType === dt}
                                    onClick={() => setActiveDocType(dt)}
                                />
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Main */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Search */}
                    <div className="flex items-center gap-4 bg-white p-2 pl-5 rounded-2xl shadow-sm border border-secondary-100">
                        <Search className="w-4 h-4 text-secondary-400 shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher par titre, référence ou titulaire..."
                            className="flex-1 text-sm bg-transparent border-none focus:ring-0 outline-none font-medium text-secondary-700 placeholder-secondary-400"
                        />
                        {search && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSearch('')}>
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    {/* Active filter chips */}
                    {(activeHolderType !== 'ALL' || activeDocType !== 'ALL') && (
                        <div className="flex flex-wrap gap-2">
                            {activeHolderType !== 'ALL' && (
                                <span className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-bold uppercase border border-primary-100">
                                    {HOLDER_TYPE_LABELS[activeHolderType]?.label || activeHolderType}
                                    <button onClick={() => setActiveHolderType('ALL')} className="hover:bg-primary-100 rounded-full p-0.5 transition-colors">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            {activeDocType !== 'ALL' && (
                                <span className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase border border-indigo-100">
                                    {DOC_TYPE_LABELS[activeDocType] || activeDocType}
                                    <button onClick={() => setActiveDocType('ALL')} className="hover:bg-indigo-100 rounded-full p-0.5 transition-colors">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    {isLoading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4 text-secondary-400">
                            <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                            <p className="text-xs font-black uppercase tracking-widest animate-pulse">Chargement des documents...</p>
                        </div>
                    ) : error ? (
                        <Card className="border-none shadow-lg rounded-3xl">
                            <CardContent className="p-12 flex flex-col items-center gap-4">
                                <AlertCircle className="w-14 h-14 text-destructive/20" />
                                <p className="text-secondary-400 font-bold italic">{error}</p>
                            </CardContent>
                        </Card>
                    ) : filtered.length === 0 ? (
                        <Card className="border-none shadow-lg rounded-3xl">
                            <CardContent className="p-16 flex flex-col items-center gap-4">
                                <FolderSearch className="w-16 h-16 text-secondary-100" />
                                <p className="text-secondary-400 font-bold italic uppercase text-sm">Aucun document trouvé</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filtered.map(doc => {
                                const Icon = getFileIcon(doc);
                                const holderMeta = HOLDER_TYPE_LABELS[doc.holderType];
                                const contentUrl = doc.contentUrl ? `${BASE_URL}${doc.contentUrl}` : null;
                                const canPreview = isPreviewable(doc);
                                const fileType = getFileType(doc);

                                return (
                                    <Card
                                        key={doc.id}
                                        className="group border border-secondary-100 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-100/30 transition-all duration-300 rounded-[24px] overflow-hidden"
                                    >
                                        {/* Thumbnail / Icon header */}
                                        {fileType === 'image' && contentUrl ? (
                                            <div
                                                className="relative w-full h-36 bg-secondary-50 overflow-hidden cursor-pointer"
                                                onClick={() => openPreview(doc)}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={contentUrl}
                                                    alt={doc.title || ''}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-secondary-900/0 group-hover:bg-secondary-900/40 transition-all flex items-center justify-center">
                                                    <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100 duration-300" />
                                                </div>
                                            </div>
                                        ) : fileType === 'pdf' ? (
                                            <div
                                                className="relative w-full h-36 bg-rose-50 flex items-center justify-center cursor-pointer overflow-hidden"
                                                onClick={() => openPreview(doc)}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-rose-100/60 to-rose-50" />
                                                <FileText className="w-14 h-14 text-rose-300 group-hover:text-rose-400 transition-colors z-10" />
                                                <div className="absolute inset-0 bg-secondary-900/0 group-hover:bg-secondary-900/30 transition-all flex items-center justify-center">
                                                    <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100 duration-300 z-20" />
                                                </div>
                                                <span className="absolute bottom-2 right-3 text-[9px] font-black text-rose-400 uppercase tracking-widest z-10">PDF</span>
                                            </div>
                                        ) : null}

                                        <CardContent className="p-5 flex flex-col gap-3">
                                            <div className="flex items-start justify-between gap-2">
                                                {fileType === 'other' && (
                                                    <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all flex items-center justify-center shrink-0">
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-black text-secondary-900 uppercase tracking-tight text-sm truncate" title={doc.title || doc.id}>
                                                        {doc.title || 'Sans titre'}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] font-bold text-secondary-400">
                                                        <span>Réf: {doc.documentRefNumber || 'N/A'}</span>
                                                        <span>·</span>
                                                        <span>{formatBytes(doc.fileSize)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5 shrink-0">
                                                    {holderMeta && (
                                                        <Badge className={cn("text-[8px] font-black uppercase border-none px-2 py-0.5 rounded-lg", holderMeta.color)}>
                                                            {holderMeta.label}
                                                        </Badge>
                                                    )}
                                                    <Badge variant="outline" className="text-[8px] font-black uppercase px-2 py-0.5 rounded-lg">
                                                        {DOC_TYPE_LABELS[doc.type] || doc.type}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="text-[10px] font-bold text-secondary-400 uppercase flex items-center gap-1.5">
                                                <Building2 className="w-3 h-3 shrink-0" />
                                                <span className="truncate">{doc.holderId}</span>
                                            </div>

                                            {/* Footer */}
                                            <div className="pt-3 border-t border-secondary-50 flex items-center justify-between">
                                                <span className="text-[10px] text-secondary-400 font-medium">{formatDate(doc)}</span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    {canPreview && (
                                                        <Button
                                                            variant="ghost" size="icon"
                                                            onClick={() => openPreview(doc)}
                                                            className="h-8 w-8 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all active:scale-90"
                                                            title="Aperçu"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    {contentUrl && (
                                                        <Button
                                                            variant="ghost" size="icon"
                                                            onClick={() => window.open(contentUrl, '_blank')}
                                                            className="h-8 w-8 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all active:scale-90"
                                                            title="Télécharger"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        onClick={() => handleDelete(doc.id, doc.title)}
                                                        disabled={isDeleting === doc.id}
                                                        className="h-8 w-8 text-secondary-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                                                        title="Supprimer"
                                                    >
                                                        {isDeleting === doc.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {!isLoading && filtered.length > 0 && (
                        <p className="text-center text-xs font-bold text-secondary-300 uppercase tracking-widest pt-4">
                            {filtered.length} sur {docs.length} documents · {previewable.length} prévisualisables
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Filter Pill ───────────────────────────────────────────────────────────────
function FilterPill({ label, count, active, onClick, icon, colorClass }: {
    label: string; count: number; active: boolean;
    onClick: () => void; icon?: React.ReactNode; colorClass?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all text-left",
                active ? "bg-primary-600 text-white shadow-lg shadow-primary-200" : "text-secondary-600 hover:bg-secondary-50"
            )}
        >
            <span className="flex items-center gap-2 truncate">
                {icon && <span className={cn("text-inherit shrink-0", !active && colorClass)}>{icon}</span>}
                <span className="truncate text-xs">{label}</span>
            </span>
            <span className={cn(
                "text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0",
                active ? "bg-white/20 text-white" : "bg-secondary-100 text-secondary-500"
            )}>
                {count}
            </span>
        </button>
    );
}
