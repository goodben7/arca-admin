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
import { ControlPanel, type ViewMode } from '@/components/modules/ControlPanel';
import { KanbanView } from '@/components/modules/KanbanView';
import { ListView } from '@/components/modules/ListView';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

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
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');

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

    const kanbanColumns = useMemo(() => {
        const colors: Record<string, string> = {
            APPLIED: 'bg-primary-500',
            SHORTLISTED: 'bg-amber-500',
            INTERVIEW: 'bg-indigo-500',
            REJECTED: 'bg-rose-500',
            HIRED: 'bg-emerald-500',
        };
        return Object.values(APPLICATION_STATUS).map(status => ({
            id: status,
            title: APPLICATION_STATUS_LABELS[status],
            color: colors[status],
            items: filtered.filter(a => a.status === status),
        }));
    }, [filtered]);

    return (
        <PageShell>
            <ControlPanel
                title="Fil de candidatures"
                description={`${applications.length} candidature(s) · vue ${viewMode === 'kanban' ? 'kanban' : 'liste'}`}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                availableViews={['kanban', 'list']}
                search={
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Nom, email, téléphone…"
                            className="pl-10 h-10 rounded-xl"
                        />
                    </div>
                }
                filters={
                    <div className="flex flex-wrap gap-2">
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="h-10 px-3 bg-surface border border-border-subtle rounded-xl text-sm"
                        >
                            {STATUS_FILTERS.map(f => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                        </select>
                        {uniqueOffers.length > 0 && (
                            <select
                                value={offerFilter}
                                onChange={e => setOfferFilter(e.target.value)}
                                className="h-10 px-3 bg-surface border border-border-subtle rounded-xl text-sm"
                            >
                                <option value="">Toutes les offres</option>
                                {uniqueOffers.map(o => (
                                    <option key={o.id} value={o.id}>{o.title}</option>
                                ))}
                            </select>
                        )}
                        {(search || statusFilter || offerFilter) && (
                            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setOfferFilter(''); }}>
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {Object.entries(APPLICATION_STATUS).map(([, val]) => (
                    <button
                        key={val}
                        type="button"
                        onClick={() => setStatusFilter(statusFilter === val ? '' : val)}
                        className={cn(
                            'rounded-xl border bg-surface p-3 text-left transition-all',
                            statusFilter === val ? 'border-indigo-300 ring-2 ring-indigo-500/20' : 'border-border-subtle'
                        )}
                    >
                        <p className="text-xl font-bold tabular-nums">{counts[val] || 0}</p>
                        <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{APPLICATION_STATUS_LABELS[val]}</p>
                    </button>
                ))}
            </div>

            {viewMode === 'kanban' ? (
                isLoading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary-600" /></div>
                ) : error ? (
                    <div className="py-12 flex flex-col items-center gap-3"><AlertCircle className="w-10 h-10 text-rose-500" /><p className="text-sm">{error}</p></div>
                ) : (
                    <KanbanView
                        columns={kanbanColumns}
                        keyExtractor={a => a.id}
                        renderCard={a => (
                            <Link href={`/m/recrutement/candidatures/${a.id}`} className="block space-y-2 group">
                                <p className="text-sm font-semibold text-foreground group-hover:text-indigo-600">
                                    {a.firstName} {a.lastName}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">{a.email}</p>
                                <p className="text-[11px] text-secondary-600 line-clamp-1 flex items-center gap-1">
                                    <Briefcase className="w-3 h-3 shrink-0" />
                                    {offersMap[extractId(a.jobOffer)] || offersMap[a.jobOffer] || '—'}
                                </p>
                                <p className="text-[10px] text-muted-foreground">{formatDate(a.appliedAt || a.createdAt)}</p>
                            </Link>
                        )}
                    />
                )
            ) : (
                <ListView isLoading={isLoading} error={error} isEmpty={filtered.length === 0} empty={<p className="text-sm text-muted-foreground">Aucune candidature.</p>}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-4">Candidat</TableHead>
                                <TableHead className="px-4">Offre</TableHead>
                                <TableHead className="px-4">Statut</TableHead>
                                <TableHead className="px-4">Date</TableHead>
                                <TableHead className="px-4" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map(a => (
                                <TableRow key={a.id}>
                                    <TableCell className="px-4 font-semibold">{a.firstName} {a.lastName}</TableCell>
                                    <TableCell className="px-4 text-sm text-secondary-600">
                                        {offersMap[extractId(a.jobOffer)] || offersMap[a.jobOffer] || '—'}
                                    </TableCell>
                                    <TableCell className="px-4">
                                        <Badge className={APPLICATION_STATUS_STYLES[a.status as keyof typeof APPLICATION_STATUS_STYLES]}>
                                            {APPLICATION_STATUS_LABELS[a.status as keyof typeof APPLICATION_STATUS_LABELS] || a.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-4 text-sm text-muted-foreground">{formatDate(a.appliedAt || a.createdAt)}</TableCell>
                                    <TableCell className="px-4 text-right">
                                        <Link href={`/m/recrutement/candidatures/${a.id}`}>
                                            <Button size="sm" variant="outline" className="gap-1">
                                                Voir <ChevronRight className="w-3.5 h-3.5" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ListView>
            )}
        </PageShell>
    );
}
