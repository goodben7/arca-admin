'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, UserCheck, Clock, CheckCircle2, XCircle, Eye, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { FilterBar } from '@/components/layout/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { getOnboardingProcesses } from '@/lib/api/onboarding';
import { getAllEmployees } from '@/lib/api/employee';
import { OnboardingProcess, ONBOARDING_PROCESS_STATUS, ONBOARDING_PROCESS_STATUS_LABELS, OnboardingProcessStatus } from '@/types/onboarding';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function statusVariant(s: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    switch (s) {
        case ONBOARDING_PROCESS_STATUS.IN_PROGRESS: return 'warning';
        case ONBOARDING_PROCESS_STATUS.COMPLETED: return 'success';
        case ONBOARDING_PROCESS_STATUS.CANCELLED: return 'destructive';
        default: return 'secondary';
    }
}

export default function OnboardingPage() {
    const [processes, setProcesses] = useState<OnboardingProcess[]>([]);
    const [employeeMap, setEmployeeMap] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        async function load() {
            try {
                setIsLoading(true);
                const [p, emps] = await Promise.all([getOnboardingProcesses(), getAllEmployees({ itemsPerPage: 500 }).catch(() => [])]);
                setProcesses(p);
                const arr = Array.isArray(emps) ? emps : (emps as any)['hydra:member'] || [];
                const map: Record<string, string> = {};
                arr.forEach((e: any) => {
                    const n = `${e.firstName} ${e.lastName}`.trim();
                    map[e.id] = n;
                    if (e['@id']) map[e['@id']] = n;
                });
                setEmployeeMap(map);
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'Erreur de chargement.');
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const stats = useMemo(() => ({
        total: processes.length,
        inProgress: processes.filter(p => p.status === ONBOARDING_PROCESS_STATUS.IN_PROGRESS).length,
        completed: processes.filter(p => p.status === ONBOARDING_PROCESS_STATUS.COMPLETED).length,
        cancelled: processes.filter(p => p.status === ONBOARDING_PROCESS_STATUS.CANCELLED).length,
    }), [processes]);

    const filtered = useMemo(() => {
        if (!search.trim()) return processes;
        const q = search.toLowerCase();
        return processes.filter(p => (employeeMap[p.employee] || '').toLowerCase().includes(q));
    }, [processes, search, employeeMap]);

    return (
        <PageShell>
            <PageHeader title="Onboarding" description="Gestion des processus d'intégration des nouveaux collaborateurs." />

            <PageKpiStrip items={[
                { label: 'Total processus', value: stats.total, icon: UserCheck, tone: 'primary', detail: 'Processus créés' },
                { label: 'En cours', value: stats.inProgress, icon: Clock, tone: 'warning', detail: 'Intégrations actives' },
                { label: 'Terminés', value: stats.completed, icon: CheckCircle2, tone: 'success', detail: 'Intégrations complètes' },
                { label: 'Annulés', value: stats.cancelled, icon: XCircle, tone: 'danger', detail: 'Processus annulés' },
            ]} />

            <FilterBar>
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par employé..." className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                </div>
            </FilterBar>

            <DataPanel title="Processus d'onboarding" description={`${filtered.length} processus`} contentClassName="p-0">
                {isLoading ? (
                    <div className="p-32 flex flex-col items-center gap-4"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center gap-4 text-center">
                        <AlertCircle className="w-12 h-12 text-rose-500" />
                        <p>{error}</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6">Employé</TableHead>
                                <TableHead className="px-6">Statut</TableHead>
                                <TableHead className="px-6">Démarré le</TableHead>
                                <TableHead className="px-6">Terminé le</TableHead>
                                <TableHead className="px-6 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">Aucun processus d'onboarding.</TableCell></TableRow>
                            ) : filtered.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="px-6 font-semibold">{employeeMap[p.employee] || p.employee}</TableCell>
                                    <TableCell className="px-6">
                                        <Badge variant={statusVariant(p.status as string)}>
                                            {ONBOARDING_PROCESS_STATUS_LABELS[p.status as OnboardingProcessStatus] || p.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-6 text-secondary-500 tabular-nums">
                                        {p.startedAt ? format(new Date(p.startedAt), 'dd MMM yyyy', { locale: fr }) : '—'}
                                    </TableCell>
                                    <TableCell className="px-6 text-secondary-500 tabular-nums">
                                        {p.completedAt ? format(new Date(p.completedAt), 'dd MMM yyyy', { locale: fr }) : '—'}
                                    </TableCell>
                                    <TableCell className="px-6 text-right">
                                        <Link href={`/onboarding/${p.id}`}>
                                            <Button variant="ghost" size="sm" className="gap-1.5 text-primary-500 hover:bg-primary-50">
                                                <Eye className="w-4 h-4" />Voir
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DataPanel>
        </PageShell>
    );
}
