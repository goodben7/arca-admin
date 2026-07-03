'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Users, Search, ChevronRight, Loader2, AlertCircle,
    Filter, X, Briefcase, Mail, Phone, Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getAllApplications } from '@/lib/api/application';
import { getAllJobOffers } from '@/lib/api/jobOffer';
import { Application, APPLICATION_STATUS, APPLICATION_STATUS_LABELS, APPLICATION_STATUS_STYLES } from '@/types/application';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';

function normalizeOffers(data: any) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.['hydra:member'])) return data['hydra:member'];
    return [];
}

function formatDate(d?: string) {
    if (!d) return '—';
    try { return format(new Date(d), 'd MMM yyyy', { locale: fr }); } catch { return '—'; }
}

function extractId(iri?: string) {
    if (!iri) return '';
    return iri.split('/').filter(Boolean).pop() || iri;
}

const STATUS_FILTERS = [
    { value: '', label: 'Tous' },
    { value: APPLICATION_STATUS.APPLIED, label: APPLICATION_STATUS_LABELS.APPLIED },
    { value: APPLICATION_STATUS.SHORTLISTED, label: APPLICATION_STATUS_LABELS.SHORTLISTED },
    { value: APPLICATION_STATUS.INTERVIEW, label: APPLICATION_STATUS_LABELS.INTERVIEW },
    { value: APPLICATION_STATUS.REJECTED, label: APPLICATION_STATUS_LABELS.REJECTED },
    { value: APPLICATION_STATUS.HIRED, label: APPLICATION_STATUS_LABELS.HIRED },
];

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [offersMap, setOffersMap] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [offerFilter, setOfferFilter] = useState('');

    useEffect(() => {
        async function load() {
            try {
                setIsLoading(true);
                const [apps, offersData] = await Promise.all([
                    getAllApplications(),
                    getAllJobOffers(),
                ]);
                setApplications(apps);
                const map: Record<string, string> = {};
                normalizeOffers(offersData).forEach((o: any) => {
                    if (o.id) map[o.id] = o.title;
                    if (o['@id']) map[o['@id']] = o.title;
                });
                setOffersMap(map);
            } catch (e: any) {
                setError(e?.message || 'Erreur de chargement.');
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const filtered = useMemo(() => {
        return applications.filter(a => {
            const q = search.trim().toLowerCase();
            const matchSearch = !q || [a.firstName, a.lastName, a.email, a.phone].some(v => v?.toLowerCase().includes(q));
            const matchStatus = !statusFilter || a.status === statusFilter;
            const matchOffer = !offerFilter || extractId(a.jobOffer) === offerFilter || a.jobOffer === offerFilter;
            return matchSearch && matchStatus && matchOffer;
        });
    }, [applications, search, statusFilter, offerFilter]);

    // Compteurs par statut
    const counts = useMemo(() => {
        const c: Record<string, number> = {};
        applications.forEach(a => { c[a.status] = (c[a.status] || 0) + 1; });
        return c;
    }, [applications]);

    const uniqueOffers = useMemo(() => {
        const seen = new Set<string>();
        const result: { id: string; title: string }[] = [];
        applications.forEach(a => {
            const id = extractId(a.jobOffer);
            if (id && !seen.has(id)) {
                seen.add(id);
                result.push({ id, title: offersMap[id] || offersMap[a.jobOffer] || id });
            }
        });
        return result;
    }, [applications, offersMap]);

    return (
        <PageShell>
            <PageHeader
                title="Candidatures"
                description="Gestion et suivi de toutes les candidatures reçues"
                actions={
                    <Badge className="font-black bg-primary-50 text-primary-600 border-primary-100 px-3 py-1 rounded-lg text-[10px] tracking-widest">
                        {applications.length} candidature(s)
                    </Badge>
                }
            />

            {/* Compteurs statuts */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(APPLICATION_STATUS).map(([, val]) => (
                    <button
                        key={val}
                        onClick={() => setStatusFilter(statusFilter === val ? '' : val)}
                        className={cn(
                            'bg-white rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
                            statusFilter === val ? 'border-primary-300 shadow-md shadow-primary-100' : 'border-secondary-100 shadow-sm'
                        )}
                    >
                        <p className="text-2xl font-black text-secondary-900 tabular-nums">{counts[val] || 0}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400 mt-1">
                            {APPLICATION_STATUS_LABELS[val]}
                        </p>
                    </button>
                ))}
            </div>

            <DataPanel
                title="Liste des candidatures"
                description="Cliquez sur une candidature pour voir les détails et agir"
            >
                    {/* Filtres */}
                    <div className="mb-6 flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-300" />
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Nom, email, téléphone..."
                                className="pl-11"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 bg-white border border-secondary-200 rounded-2xl text-sm font-bold text-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                        >
                            {STATUS_FILTERS.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>

                        {uniqueOffers.length > 0 && (
                            <select
                                value={offerFilter}
                                onChange={e => setOfferFilter(e.target.value)}
                                className="px-4 py-2.5 bg-white border border-secondary-200 rounded-2xl text-sm font-bold text-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                            >
                                <option value="">Toutes les offres</option>
                                {uniqueOffers.map(o => (
                                    <option key={o.id} value={o.id}>{o.title}</option>
                                ))}
                            </select>
                        )}

                        {(search || statusFilter || offerFilter) && (
                            <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter(''); setOfferFilter(''); }} className="gap-2 rounded-2xl">
                                <X className="w-4 h-4" /> Réinitialiser
                            </Button>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                            <p className="text-secondary-400 font-bold uppercase tracking-widest text-[10px]">Chargement...</p>
                        </div>
                    ) : error ? (
                        <div className="py-12 flex flex-col items-center gap-4 text-center">
                            <AlertCircle className="w-12 h-12 text-destructive" />
                            <p className="text-secondary-500 font-medium">{error}</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-3 text-center">
                            <Users className="w-12 h-12 text-secondary-200" />
                            <p className="text-secondary-400 font-bold uppercase tracking-widest text-[10px]">Aucune candidature trouvée</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-secondary-50/50">
                                        {['Candidat', 'Contact', 'Offre', 'Statut', 'Date', ''].map(h => (
                                            <th key={h} className="text-left py-4 px-5 font-black uppercase tracking-widest text-[10px] text-secondary-500 first:rounded-l-xl last:rounded-r-xl">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(a => {
                                        const styleClass = APPLICATION_STATUS_STYLES[a.status as keyof typeof APPLICATION_STATUS_STYLES] || 'bg-secondary-50 text-secondary-600 border-secondary-100';
                                        const offerTitle = offersMap[extractId(a.jobOffer)] || offersMap[a.jobOffer] || '—';
                                        return (
                                            <tr key={a.id} className="border-b border-secondary-100/70 hover:bg-secondary-50/30 transition-colors">
                                                <td className="py-4 px-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center font-black text-primary-600 text-xs shrink-0">
                                                            {a.firstName[0]}{a.lastName[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-secondary-900 text-sm uppercase tracking-tighter">
                                                                {a.firstName} {a.lastName}
                                                            </p>
                                                            <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest">
                                                                {a.gender === 'M' ? 'Homme' : a.gender === 'F' ? 'Femme' : a.gender}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-5">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-secondary-600">
                                                            <Mail className="w-3 h-3 text-secondary-400" />
                                                            <span className="text-xs font-medium">{a.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-secondary-500">
                                                            <Phone className="w-3 h-3 text-secondary-400" />
                                                            <span className="text-xs font-medium">{a.phone}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-5">
                                                    <div className="flex items-center gap-1.5">
                                                        <Briefcase className="w-3.5 h-3.5 text-secondary-400 shrink-0" />
                                                        <span className="text-xs font-bold text-secondary-700 uppercase tracking-tight line-clamp-1 max-w-[160px]">{offerTitle}</span>
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
                                                        <span className="text-xs font-medium">{formatDate(a.appliedAt || a.createdAt)}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-5 text-right">
                                                    <Link href={`/applications/${a.id}`}>
                                                        <Button className="h-9 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest bg-primary-600 hover:bg-primary-700 text-white gap-1.5">
                                                            Voir
                                                            <ChevronRight className="w-3.5 h-3.5" />
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
            </DataPanel>
        </PageShell>
    );
}
