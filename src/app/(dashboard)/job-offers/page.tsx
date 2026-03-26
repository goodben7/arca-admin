'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, FormEvent } from 'react';
import {
    ChevronRight,
    FileText,
    Loader2,
    Pencil,
    Save,
    Search,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { getAllJobOffers, updateJobOffer } from '@/lib/api/jobOffer';
import { getDepartments } from '@/lib/api/employee';
import { JobOffer } from '@/types/jobOffer';
import { STATUS_CLOSED, STATUS_DRAFT, STATUS_PUBLISHED } from '@/types/jobOffer';
import { cn } from '@/lib/utils';

function normalizeList(data: any): JobOffer[] {
    if (Array.isArray(data)) return data as JobOffer[];
    if (Array.isArray(data?.['hydra:member'])) return data['hydra:member'] as JobOffer[];
    if (Array.isArray(data?.member)) return data.member as JobOffer[];
    return [];
}

function getStatusBadge(status: string) {
    switch (status) {
        case STATUS_DRAFT:
            return { variant: 'warning' as const, className: 'bg-amber-50 text-amber-700 border-amber-100' };
        case STATUS_PUBLISHED:
            return { variant: 'success' as const, className: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
        case STATUS_CLOSED:
            return { variant: 'destructive' as const, className: 'bg-rose-50 text-rose-700 border-rose-100' };
        default:
            return { variant: 'outline' as const, className: 'bg-secondary-50 text-secondary-600 border-secondary-100' };
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
                                    <div className="h-full overflow-y-auto bg-white rounded-l-[32px] shadow-2xl border-l border-secondary-100">
                                        <div className="p-6 border-b border-secondary-100 flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <Dialog.Title className="text-lg font-black uppercase tracking-tight text-secondary-900">
                                                    Modifier l’offre
                                                </Dialog.Title>
                                                <p className="text-sm text-secondary-500 font-medium truncate mt-1">
                                                    Mettre à jour uniquement le titre
                                                </p>
                                            </div>
                                            <Button variant="outline" onClick={onClose} className="h-10 px-4 rounded-2xl">
                                                Fermer
                                            </Button>
                                        </div>

                                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                            {error && (
                                                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
                                                    <p className="text-xs font-black uppercase tracking-widest text-destructive">
                                                        Erreur
                                                    </p>
                                                    <p className="text-sm font-medium text-secondary-700 mt-1">{error}</p>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">
                                                    Titre *
                                                </Label>
                                                <Input
                                                    value={draft.title}
                                                    onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                                                    required
                                                    className="h-12"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">
                                                    Description du poste
                                                </Label>
                                                <textarea
                                                    value={draft.description}
                                                    onChange={e => setDraft(p => ({ ...p, description: e.target.value }))}
                                                    rows={8}
                                                    placeholder="Décrivez le poste, les missions, le profil recherché..."
                                                    className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-2xl text-sm font-medium text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none"
                                                />
                                            </div>

                                            <div className="pt-2 flex items-center justify-end gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={onClose}
                                                    className="h-12 px-5 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                                                    disabled={isSubmitting}
                                                >
                                                    Annuler
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={isSubmitting || !draft.title.trim()}
                                                    className={cn(
                                                        'h-12 px-5 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-2 shadow-sm',
                                                        'bg-primary-600 hover:bg-primary-700 text-white'
                                                    )}
                                                >
                                                    <Save className="w-4 h-4" />
                                                    {isSubmitting ? 'En cours...' : 'Enregistrer'}
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

    const [departmentsMap, setDepartmentsMap] = useState<Record<string, string>>({});

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selected, setSelected] = useState<JobOffer | null>(null);
    const [drawerSubmitting, setDrawerSubmitting] = useState(false);
    const [drawerError, setDrawerError] = useState<string | null>(null);

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

    const filtered = useMemo(() => {
        if (!search.trim()) return jobOffers;
        const q = search.trim().toLowerCase();
        return jobOffers.filter((o) => {
            return (
                (o.title || '').toLowerCase().includes(q) ||
                (o.department || '').toLowerCase().includes(q) ||
                (o.status || '').toLowerCase().includes(q)
            );
        });
    }, [jobOffers, search]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-secondary-900 uppercase tracking-tighter">
                        Offres d’emploi
                    </h1>
                    <p className="text-secondary-500 font-medium italic">
                        Gestion des drafts, publications et clôtures
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge className="font-black bg-primary-50 text-primary-600 border-primary-100 px-3 py-1 rounded-lg text-[10px] tracking-widest">
                        {filtered.length} offre(s)
                    </Badge>
                </div>
            </div>

            <Card className="overflow-hidden border-none shadow-xl shadow-secondary-200/50 animate-in fade-in">
                <CardHeader className="border-b border-secondary-100 bg-white">
                    <CardTitle className="text-secondary-900 font-black uppercase tracking-tight text-lg">
                        Liste des offres
                    </CardTitle>
                    <CardDescription className="text-secondary-500 font-medium italic">
                        Modifiez le titre via le drawer
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                    <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-secondary-300" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher par titre, département ou statut..."
                                className="pl-12"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                            <p className="text-secondary-400 font-bold uppercase tracking-widest text-[10px]">
                                Chargement des offres...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="p-12 flex flex-col items-center justify-center gap-4 text-center">
                            <AlertCircle className="w-12 h-12 text-destructive" />
                            <p className="text-secondary-500 font-medium">{error}</p>
                            <Button onClick={() => window.location.reload()} variant="outline">
                                Réessayer
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-secondary-50/50">
                                        <th className="text-left py-5 px-6 font-black uppercase tracking-widest text-[10px] text-secondary-600">
                                            Offre
                                        </th>
                                        <th className="text-left py-5 px-6 font-black uppercase tracking-widest text-[10px] text-secondary-600">
                                            Département
                                        </th>
                                        <th className="text-left py-5 px-6 font-black uppercase tracking-widest text-[10px] text-secondary-600">
                                            Statut
                                        </th>
                                        <th className="text-right py-5 px-6 font-black uppercase tracking-widest text-[10px] text-secondary-600">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="h-64 text-center text-secondary-400 font-medium italic">
                                                Aucune offre trouvée.
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((o) => {
                                            const badge = getStatusBadge(String(o.status));
                                            const deptLabel = departmentsMap[o.department] || o.department;

                                            return (
                                                <tr key={o.id} className="border-b border-secondary-100/70 hover:bg-secondary-50/30">
                                                    <td className="py-5 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                                                                <FileText className="w-4 h-4 text-primary-600" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-black text-secondary-900 uppercase tracking-tighter text-sm truncate">
                                                                    {o.title}
                                                                </p>
                                                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-1 truncate">
                                                                    ID: {o.id}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-6">
                                                        <p className="font-black text-secondary-900 uppercase tracking-tight text-sm">
                                                            {deptLabel}
                                                        </p>
                                                    </td>
                                                    <td className="py-5 px-6">
                                                        <Badge
                                                            variant={badge.variant as any}
                                                            className={`font-black text-[10px] uppercase py-2 px-3 rounded-xl border shadow-sm ${badge.className}`}
                                                        >
                                                            {o.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-5 px-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl"
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
                                                                <Button className="h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest bg-primary-600 hover:bg-primary-700 text-white gap-2">
                                                                    Voir détails
                                                                    <ChevronRight className="w-4 h-4" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

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
                        setDrawerError(e?.message || "Erreur lors de la mise à jour.");
                    } finally {
                        setDrawerSubmitting(false);
                    }
                }}
            />
        </div>
    );
}

