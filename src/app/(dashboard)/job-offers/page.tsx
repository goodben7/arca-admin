'use client';

import { useEffect, useMemo, useState, Fragment, FormEvent } from 'react';
import Link from 'next/link';
import { Dialog, Transition } from '@headlessui/react';
import {
    Briefcase,
    ChevronDown,
    ChevronRight,
    Eye,
    FileText,
    Filter,
    Loader2,
    Pencil,
    Save,
    Search,
    AlertCircle,
    Megaphone,
    FileEdit,
    Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Label } from '@/components/ui/Input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { getAllJobOffers, updateJobOffer } from '@/lib/api/jobOffer';
import { getDepartments } from '@/lib/api/employee';
import { JobOffer } from '@/types/jobOffer';
import { STATUS_CLOSED, STATUS_DRAFT, STATUS_PUBLISHED } from '@/types/jobOffer';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/layout/FilterBar';
import { DataPanel } from '@/components/layout/DataPanel';
import { PageKpiStrip } from '@/components/layout/PageKpi';

function normalizeList(data: any): JobOffer[] {
    if (Array.isArray(data)) return data as JobOffer[];
    if (Array.isArray(data?.['hydra:member'])) return data['hydra:member'] as JobOffer[];
    if (Array.isArray(data?.member)) return data.member as JobOffer[];
    return [];
}

function getStatusLabel(status: string) {
    switch (status) {
        case STATUS_DRAFT:
            return { label: 'Brouillon', variant: 'warning' as const };
        case STATUS_PUBLISHED:
            return { label: 'Publiée', variant: 'success' as const };
        case STATUS_CLOSED:
            return { label: 'Clôturée', variant: 'destructive' as const };
        default:
            return { label: status, variant: 'secondary' as const };
    }
}

type TitleDrawerProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    onSubmit: (payload: { title: string; description: string }) => Promise<void>;
    isSubmitting: boolean;
    error: string | null;
};

function TitleDrawer({
    open,
    onClose,
    title,
    description,
    onSubmit,
    isSubmitting,
    error,
}: TitleDrawerProps) {
    const [draft, setDraft] = useState({ title, description });

    useEffect(() => {
        if (open) setDraft({ title, description });
    }, [open, title, description]);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        await onSubmit(draft);
    }

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-secondary-950/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-200"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-lg">
                                    <div className="h-full overflow-y-auto bg-white rounded-l-2xl shadow-float border-l border-border-subtle">
                                        <div className="p-6 border-b border-border-subtle flex items-start justify-between gap-4 panel-header-wash">
                                            <div className="min-w-0">
                                                <Dialog.Title className="text-lg font-bold text-foreground">
                                                    Modifier l&apos;offre
                                                </Dialog.Title>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Mettre à jour le titre et la description
                                                </p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={onClose}>
                                                Fermer
                                            </Button>
                                        </div>

                                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                            {error && (
                                                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4">
                                                    <p className="text-sm font-semibold text-destructive">Erreur</p>
                                                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label>Titre *</Label>
                                                <Input
                                                    value={draft.title}
                                                    onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                                                    required
                                                    className="h-11"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Description du poste</Label>
                                                <textarea
                                                    value={draft.description}
                                                    onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                                                    rows={8}
                                                    placeholder="Décrivez le poste, les missions, le profil recherché..."
                                                    className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-sm text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none"
                                                />
                                            </div>

                                            <div className="pt-2 flex items-center justify-end gap-3">
                                                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                                    Annuler
                                                </Button>
                                                <Button type="submit" disabled={isSubmitting || !draft.title.trim()} className="gap-2">
                                                    <Save className="w-4 h-4" />
                                                    {isSubmitting ? 'En cours…' : 'Enregistrer'}
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

export default function JobOffersPage() {
    const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    const [departmentsMap, setDepartmentsMap] = useState<Record<string, string>>({});

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selected, setSelected] = useState<JobOffer | null>(null);
    const [drawerSubmitting, setDrawerSubmitting] = useState(false);
    const [drawerError, setDrawerError] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    async function fetchData() {
        try {
            setIsLoading(true);
            setError(null);

            const [offersData, deptsData] = await Promise.all([getAllJobOffers(), getDepartments()]);
            setJobOffers(normalizeList(offersData));

            const list = Array.isArray(deptsData) ? deptsData : deptsData['hydra:member'] || [];
            const map: Record<string, string> = {};
            list.forEach((d: any) => {
                map[d.id] = d.name;
                if (d['@id']) map[d['@id']] = d.name;
            });
            setDepartmentsMap(map);
        } catch (e: any) {
            setError(e?.message || 'Erreur lors du chargement des offres.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stats = useMemo(() => ({
        total: jobOffers.length,
        published: jobOffers.filter((o) => o.status === STATUS_PUBLISHED).length,
        draft: jobOffers.filter((o) => o.status === STATUS_DRAFT).length,
        closed: jobOffers.filter((o) => o.status === STATUS_CLOSED).length,
    }), [jobOffers]);

    const filtered = useMemo(() => {
        return jobOffers.filter((o) => {
            if (statusFilter && o.status !== statusFilter) return false;
            if (!debouncedSearch.trim()) return true;
            const q = debouncedSearch.trim().toLowerCase();
            const deptLabel = (departmentsMap[o.department] || o.department || '').toLowerCase();
            const statusLabel = getStatusLabel(String(o.status)).label.toLowerCase();
            return (
                (o.title || '').toLowerCase().includes(q) ||
                deptLabel.includes(q) ||
                statusLabel.includes(q) ||
                (o.status || '').toLowerCase().includes(q)
            );
        });
    }, [jobOffers, debouncedSearch, statusFilter, departmentsMap]);

    const statusOptions = [
        { id: '', label: 'Tous les statuts', color: 'bg-secondary-200' },
        { id: STATUS_DRAFT, label: 'Brouillon', color: 'bg-amber-500' },
        { id: STATUS_PUBLISHED, label: 'Publiée', color: 'bg-emerald-500' },
        { id: STATUS_CLOSED, label: 'Clôturée', color: 'bg-rose-500' },
    ];

    const selectedStatusLabel = statusOptions.find((o) => o.id === statusFilter)?.label || 'Tous les statuts';

    return (
        <PageShell>
            <PageHeader
                title="Offres d'emploi"
                description="Gestion des brouillons, publications et clôtures d'offres."
            />

            <PageKpiStrip
                items={[
                    { label: 'Offres totales', value: stats.total, icon: Briefcase, tone: 'primary', detail: 'Dans le pipeline' },
                    { label: 'Publiées', value: stats.published, icon: Megaphone, tone: 'success', detail: 'Visibles candidats' },
                    { label: 'Brouillons', value: stats.draft, icon: FileEdit, tone: 'warning', detail: 'En préparation' },
                    { label: 'Clôturées', value: stats.closed, icon: Archive, tone: 'danger', detail: 'Recrutement terminé' },
                ]}
            />

            <FilterBar>
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher par titre, département ou statut..."
                        className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-secondary-400"
                    />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <button
                            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            className={cn(
                                'h-10 px-4 flex items-center gap-3 bg-white border rounded-xl transition-all',
                                isStatusDropdownOpen ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-secondary-200 hover:border-secondary-300',
                                statusFilter ? 'border-primary-300 bg-primary-50/50' : ''
                            )}
                        >
                            <Filter className={cn('w-4 h-4', statusFilter ? 'text-primary-500' : 'text-secondary-400')} />
                            <span className="text-xs font-medium text-secondary-700 min-w-[100px] text-left">
                                {selectedStatusLabel}
                            </span>
                            <ChevronDown className={cn('w-4 h-4 text-secondary-400 transition-transform duration-300', isStatusDropdownOpen && 'rotate-180')} />
                        </button>
                        {isStatusDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)} />
                                <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-float border border-secondary-100 p-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                                    {statusOptions.map((opt) => (
                                        <button
                                            key={opt.id || 'all'}
                                            onClick={() => { setStatusFilter(opt.id); setIsStatusDropdownOpen(false); }}
                                            className={cn(
                                                'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all',
                                                statusFilter === opt.id ? 'bg-primary-50 text-primary-700' : 'hover:bg-secondary-50 text-secondary-600'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn('w-1.5 h-1.5 rounded-full', opt.color)} />
                                                <span className="text-sm font-medium">{opt.label}</span>
                                            </div>
                                            {statusFilter === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-primary-600" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="w-px h-6 bg-secondary-200 mx-1 hidden lg:block" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary-500 hover:bg-primary-50"
                        onClick={() => {
                            setSearch('');
                            setStatusFilter('');
                        }}
                    >
                        Réinitialiser
                    </Button>
                </div>
            </FilterBar>

            <DataPanel
                title="Liste des offres"
                description={`${filtered.length} offre${filtered.length > 1 ? 's' : ''} affichée${filtered.length > 1 ? 's' : ''}`}
                contentClassName="p-0"
            >
                {isLoading ? (
                    <div className="p-32 flex flex-col items-center justify-center gap-6">
                        <div className="relative">
                            <Loader2 className="w-16 h-16 animate-spin text-primary-600" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Briefcase className="w-6 h-6 text-primary-200" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-sm text-secondary-900">Chargement des offres</p>
                            <p className="text-xs text-muted-foreground mt-2">Synchronisation avec le cloud ARCA…</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-6 text-center">
                        <div className="w-20 h-20 bg-rose-50 rounded-xl flex items-center justify-center">
                            <AlertCircle className="w-10 h-10 text-rose-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-lg text-secondary-900">Erreur de chargement</p>
                            <p className="text-secondary-500 max-w-md mx-auto mt-2">{error}</p>
                        </div>
                        <Button onClick={() => fetchData()} variant="outline">
                            Réessayer
                        </Button>
                    </div>
                ) : (
                    <div className="relative">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-secondary-100">
                                    <TableHead className="px-6">Offre</TableHead>
                                    <TableHead className="px-6">Département</TableHead>
                                    <TableHead className="px-6">Publiée le</TableHead>
                                    <TableHead className="px-6">Statut</TableHead>
                                    <TableHead className="px-6 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                            Aucune offre trouvée pour ce critère.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((o) => {
                                        const statusInfo = getStatusLabel(String(o.status));
                                        const deptLabel = departmentsMap[o.department] || o.department;

                                        return (
                                            <TableRow key={o.id} className="group">
                                                <TableCell className="px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                                                            <FileText className="w-4 h-4 text-primary-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-secondary-900 truncate">
                                                                {o.title}
                                                            </p>
                                                            <span className="text-xs font-medium text-primary-600">
                                                                {o.id.substring(0, 12)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                                                        <span className="text-secondary-700">
                                                            {deptLabel || '—'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <span className="text-secondary-800 tabular-nums">
                                                        {o.publishedAt
                                                            ? format(new Date(o.publishedAt), 'dd MMM yyyy', { locale: fr })
                                                            : '—'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <Badge variant={statusInfo.variant}>
                                                        {statusInfo.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-9 w-9 p-0 text-secondary-400 hover:text-primary-600 hover:bg-primary-50"
                                                            title="Modifier le titre"
                                                            onClick={() => {
                                                                setSelected(o);
                                                                setDrawerError(null);
                                                                setDrawerOpen(true);
                                                            }}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Link href={`/job-offers/${o.id}`}>
                                                            <Button variant="ghost" size="sm" className="h-9 px-3 text-primary-500 hover:bg-primary-50 gap-1.5 font-semibold text-xs">
                                                                <Eye className="w-4 h-4" />
                                                                Détails
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>

                        <div className="p-6 border-t border-primary-100/40 table-footer-wash flex items-center justify-between gap-4">
                            <p className="text-sm text-secondary-600">
                                <span className="font-semibold text-secondary-900">{filtered.length}</span>
                                {' '}offre{filtered.length > 1 ? 's' : ''} sur{' '}
                                <span className="font-semibold text-secondary-900">{jobOffers.length}</span>
                            </p>
                            <Link href="/recruitment">
                                <Button variant="outline" size="sm" className="gap-1.5">
                                    Voir le recrutement
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </DataPanel>

            <TitleDrawer
                open={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelected(null);
                    setDrawerError(null);
                }}
                title={selected?.title || ''}
                description={selected?.description || ''}
                isSubmitting={drawerSubmitting}
                error={drawerError}
                onSubmit={async ({ title, description }) => {
                    if (!selected) return;
                    setDrawerSubmitting(true);
                    setDrawerError(null);
                    try {
                        await updateJobOffer(selected.id, { title, description });
                        setDrawerOpen(false);
                        setSelected(null);
                        await fetchData();
                    } catch (e: any) {
                        setDrawerError(e?.message || 'Erreur lors de la mise à jour.');
                    } finally {
                        setDrawerSubmitting(false);
                    }
                }}
            />
        </PageShell>
    );
}
