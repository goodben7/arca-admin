'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, Activity, Search, User, Clock, ExternalLink } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { FilterBar } from '@/components/layout/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { getActivities } from '@/lib/api/hrDashboard';
import { Activity as ActivityType } from '@/types/succession';
import { Button } from '@/components/ui/Button';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { extractId } from '@/lib/api-iri';
import {
    buildActivityEnrichment,
    getActivityLabel,
    getResourceEnrichment,
    getUserLabel,
    type ActivityEnrichment,
} from '@/lib/activities/enrichment';

export default function ActivitiesPage() {
    const [activities, setActivities] = useState<ActivityType[]>([]);
    const [enrichment, setEnrichment] = useState<ActivityEnrichment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnriching, setIsEnriching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    const load = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setEnrichment(null);
            const data = await getActivities();
            setActivities(data);
            setIsLoading(false);

            setIsEnriching(true);
            const enriched = await buildActivityEnrichment(data);
            setEnrichment(enriched);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setIsLoading(false);
            setIsEnriching(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        return activities.filter(a => {
            if (actionFilter && a.activity !== actionFilter) return false;
            if (!search.trim()) return true;

            const q = search.toLowerCase();
            const resourceId = extractId(a.ressourceIdentifier) || a.ressourceIdentifier || '';
            const resource = getResourceEnrichment(enrichment, a.ressourceName, resourceId);
            const userLabel = getUserLabel(enrichment, a.user).toLowerCase();

            return (a.activity || '').toLowerCase().includes(q)
                || getActivityLabel(a.activity).toLowerCase().includes(q)
                || (a.ressourceName || '').toLowerCase().includes(q)
                || (resource?.label || '').toLowerCase().includes(q)
                || (resource?.typeLabel || '').toLowerCase().includes(q)
                || resourceId.toLowerCase().includes(q)
                || userLabel.includes(q)
                || (a.user || '').toLowerCase().includes(q);
        });
    }, [activities, search, actionFilter, enrichment]);

    const uniqueActions = useMemo(() => [...new Set(activities.map(a => a.activity))].filter(Boolean), [activities]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        try { return format(parseISO(dateStr), 'dd MMM yyyy HH:mm', { locale: fr }); }
        catch { return dateStr; }
    };

    return (
        <PageShell>
            <PageHeader
                title="Journal d'activité"
                description="Traçabilité des actions effectuées sur la plateforme."
            />

            <PageKpiStrip items={[
                { label: "Total actions", value: activities.length, icon: Activity, tone: 'primary', detail: 'Événements enregistrés' },
                { label: "Types d'actions", value: uniqueActions.length, icon: Activity, tone: 'info', detail: 'Actions distinctes' },
            ]} />

            <FilterBar>
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par action, ressource ou utilisateur..." className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                </div>
                {uniqueActions.length > 0 && (
                    <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
                        <option value="">Toutes les actions</option>
                        {uniqueActions.map(a => <option key={a} value={a}>{getActivityLabel(a)}</option>)}
                    </select>
                )}
                <Button variant="ghost" size="sm" className="text-primary-500 hover:bg-primary-50" onClick={() => { setSearch(''); setActionFilter(''); }}>
                    Réinitialiser
                </Button>
            </FilterBar>

            <DataPanel
                title="Journal d'activité"
                description={`${filtered.length} action(s) affichée(s)${isEnriching ? ' — enrichissement en cours…' : ''}`}
                contentClassName="p-0"
            >
                {isLoading ? (
                    <div className="p-32 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center gap-4">
                        <AlertCircle className="w-12 h-12 text-rose-500" />
                        <p className="text-secondary-700">{error}</p>
                        <Button variant="outline" onClick={load}>Réessayer</Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6">Action</TableHead>
                                <TableHead className="px-6">Ressource</TableHead>
                                <TableHead className="px-6">Utilisateur</TableHead>
                                <TableHead className="px-6">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="h-48 text-center text-muted-foreground">Aucune activité.</TableCell></TableRow>
                            ) : filtered.map((a, i) => {
                                const resourceId = extractId(a.ressourceIdentifier) || a.ressourceIdentifier || '';
                                const resource = getResourceEnrichment(enrichment, a.ressourceName, resourceId);
                                const userLabel = getUserLabel(enrichment, a.user);
                                const userEmail = a.user
                                    ? enrichment?.usersById[extractId(a.user) || a.user]?.email
                                    : undefined;

                                return (
                                    <TableRow key={a.id || i}>
                                        <TableCell className="px-6">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-100">
                                                <Activity className="w-3 h-3" />
                                                {getActivityLabel(a.activity)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-6">
                                            {resource ? (
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-secondary-400 mb-0.5">
                                                        {resource.typeLabel}
                                                    </p>
                                                    {resource.href ? (
                                                        <Link
                                                            href={resource.href}
                                                            className="inline-flex items-center gap-1.5 font-medium text-primary-600 hover:text-primary-700 text-sm group"
                                                        >
                                                            <span className="group-hover:underline">{resource.label}</span>
                                                            <ExternalLink className="w-3 h-3 opacity-60" />
                                                        </Link>
                                                    ) : (
                                                        <p className="font-medium text-secondary-800 text-sm">{resource.label}</p>
                                                    )}
                                                    <p className="text-xs text-secondary-400 mt-0.5">{resource.identifier}</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="font-medium text-secondary-800 text-sm">{a.ressourceName || '—'}</p>
                                                    {resourceId && (
                                                        <p className="text-xs text-secondary-400 flex items-center gap-1.5 mt-0.5">
                                                            {isEnriching && <Loader2 className="w-3 h-3 animate-spin" />}
                                                            {resourceId}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-secondary-100 flex items-center justify-center shrink-0">
                                                    <User className="w-3.5 h-3.5 text-secondary-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-secondary-800 truncate">{userLabel}</p>
                                                    {userEmail && userEmail !== userLabel && (
                                                        <p className="text-xs text-secondary-400 truncate">{userEmail}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6">
                                            <div className="flex items-center gap-1.5 text-secondary-500">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-sm tabular-nums">{formatDate(a.occurredAt || a.createdAt)}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </DataPanel>
        </PageShell>
    );
}
