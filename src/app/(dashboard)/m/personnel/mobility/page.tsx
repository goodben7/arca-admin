'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    ArrowRightLeft,
    ChevronDown,
    ChevronRight,
    Eye,
    Filter,
    Loader2,
    AlertCircle,
    Plus,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Clock,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/layout/FilterBar';
import { DataPanel } from '@/components/layout/DataPanel';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { getAllMobilityRequests } from '@/lib/api/mobilityRequest';
import { getAllEmployees } from '@/lib/api/employee';
import {
    MobilityRequest,
    MOBILITY_TYPE,
    MOBILITY_TYPE_LABELS,
    MOBILITY_STATUS,
    MOBILITY_STATUS_LABELS,
    MobilityType,
    MobilityStatus,
} from '@/types/mobilityRequest';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const IN_PROGRESS_STATUSES: string[] = [
    MOBILITY_STATUS.DRAFT,
    MOBILITY_STATUS.MANAGER_APPROVAL,
    MOBILITY_STATUS.HR_APPROVAL,
    MOBILITY_STATUS.EXECUTIVE_APPROVAL,
];

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    switch (status) {
        case MOBILITY_STATUS.DRAFT: return 'secondary';
        case MOBILITY_STATUS.MANAGER_APPROVAL:
        case MOBILITY_STATUS.HR_APPROVAL:
        case MOBILITY_STATUS.EXECUTIVE_APPROVAL: return 'warning';
        case MOBILITY_STATUS.IMPLEMENTED: return 'success';
        case MOBILITY_STATUS.REJECTED: return 'destructive';
        case MOBILITY_STATUS.CANCELLED: return 'secondary';
        default: return 'default';
    }
}

function getTypeBadgeClass(type: string): string {
    switch (type) {
        case MOBILITY_TYPE.PROMOTION: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        case MOBILITY_TYPE.TRANSFER: return 'bg-primary-50 text-primary-700 border-primary-100';
        case MOBILITY_TYPE.DEMOTION: return 'bg-rose-50 text-rose-700 border-rose-100';
        case MOBILITY_TYPE.SECONDEMENT: return 'bg-purple-50 text-purple-700 border-purple-100';
        default: return 'bg-secondary-50 text-secondary-600 border-secondary-100';
    }
}

export default function MobilityPage() {
    const [requests, setRequests] = useState<MobilityRequest[]>([]);
    const [employeeMap, setEmployeeMap] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isTypeOpen, setIsTypeOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                setError(null);
                const [reqs, emps] = await Promise.all([
                    getAllMobilityRequests(),
                    getAllEmployees({ itemsPerPage: 500 }).catch(() => []),
                ]);
                setRequests(reqs);

                const empArray = Array.isArray(emps) ? emps : (emps as any)['hydra:member'] || [];
                const map: Record<string, string> = {};
                empArray.forEach((e: any) => {
                    const name = `${e.firstName} ${e.lastName}`.trim();
                    map[e.id] = name;
                    if (e['@id']) map[e['@id']] = name;
                });
                setEmployeeMap(map);
            } catch (e: any) {
                setError(e?.message || 'Erreur lors du chargement.');
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const stats = useMemo(() => ({
        total: requests.length,
        inProgress: requests.filter((r) => IN_PROGRESS_STATUSES.includes(r.status as string)).length,
        implemented: requests.filter((r) => r.status === MOBILITY_STATUS.IMPLEMENTED).length,
        rejected: requests.filter((r) => r.status === MOBILITY_STATUS.REJECTED).length,
    }), [requests]);

    const filtered = useMemo(() => {
        return requests.filter((r) => {
            if (typeFilter && r.type !== typeFilter) return false;
            if (statusFilter && r.status !== statusFilter) return false;
            if (!debouncedSearch.trim()) return true;
            const q = debouncedSearch.toLowerCase();
            const empName = (employeeMap[r.employee] || r.employee || '').toLowerCase();
            const typeLabel = (MOBILITY_TYPE_LABELS[r.type as MobilityType] || r.type || '').toLowerCase();
            const statusLabel = (MOBILITY_STATUS_LABELS[r.status as MobilityStatus] || r.status || '').toLowerCase();
            return empName.includes(q) || typeLabel.includes(q) || statusLabel.includes(q);
        });
    }, [requests, debouncedSearch, typeFilter, statusFilter, employeeMap]);

    const typeOptions = [
        { id: '', label: 'Tous les types', color: 'bg-secondary-200' },
        { id: MOBILITY_TYPE.TRANSFER, label: 'Transfert', color: 'bg-primary-500' },
        { id: MOBILITY_TYPE.PROMOTION, label: 'Promotion', color: 'bg-emerald-500' },
        { id: MOBILITY_TYPE.DEMOTION, label: 'Rétrogradation', color: 'bg-rose-500' },
        { id: MOBILITY_TYPE.SECONDEMENT, label: 'Détachement', color: 'bg-purple-500' },
    ];

    const statusOptions = [
        { id: '', label: 'Tous les statuts', color: 'bg-secondary-200' },
        { id: MOBILITY_STATUS.DRAFT, label: 'Brouillon', color: 'bg-secondary-400' },
        { id: MOBILITY_STATUS.MANAGER_APPROVAL, label: 'Responsable', color: 'bg-amber-500' },
        { id: MOBILITY_STATUS.HR_APPROVAL, label: 'RH', color: 'bg-amber-500' },
        { id: MOBILITY_STATUS.EXECUTIVE_APPROVAL, label: 'Direction', color: 'bg-amber-500' },
        { id: MOBILITY_STATUS.IMPLEMENTED, label: 'Implémentée', color: 'bg-emerald-500' },
        { id: MOBILITY_STATUS.REJECTED, label: 'Refusée', color: 'bg-rose-500' },
        { id: MOBILITY_STATUS.CANCELLED, label: 'Annulée', color: 'bg-secondary-400' },
    ];

    return (
        <PageShell>
            <PageHeader
                title="Mobilité RH"
                description="Gestion des transferts, promotions, rétrogradations et détachements."
                actions={
                    <Link href="/m/personnel/mobility/create">
                        <Button variant="pill" size="sm" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Nouvelle demande
                        </Button>
                    </Link>
                }
            />

            <PageKpiStrip
                items={[
                    { label: 'Total demandes', value: stats.total, icon: ArrowRightLeft, tone: 'primary', detail: 'En cours de traitement' },
                    { label: 'En cours', value: stats.inProgress, icon: Clock, tone: 'warning', detail: 'Validation en attente' },
                    { label: 'Implémentées', value: stats.implemented, icon: CheckCircle2, tone: 'success', detail: 'Mobilités effectives' },
                    { label: 'Refusées', value: stats.rejected, icon: XCircle, tone: 'danger', detail: 'Demandes rejetées' },
                ]}
            />

            <FilterBar>
                <div className="relative flex-1 group">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher par employé, type ou statut..."
                        className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-secondary-400"
                    />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Type filter */}
                    <div className="relative">
                        <button
                            onClick={() => { setIsTypeOpen(!isTypeOpen); setIsStatusOpen(false); }}
                            className={cn(
                                'h-10 px-4 flex items-center gap-3 bg-white border rounded-xl transition-all',
                                isTypeOpen ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-secondary-200 hover:border-secondary-300',
                                typeFilter ? 'border-primary-300 bg-primary-50/50' : ''
                            )}
                        >
                            <Filter className={cn('w-4 h-4', typeFilter ? 'text-primary-500' : 'text-secondary-400')} />
                            <span className="text-xs font-medium text-secondary-700 min-w-[90px] text-left">
                                {typeOptions.find((o) => o.id === typeFilter)?.label || 'Type'}
                            </span>
                            <ChevronDown className={cn('w-4 h-4 text-secondary-400 transition-transform duration-300', isTypeOpen && 'rotate-180')} />
                        </button>
                        {isTypeOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsTypeOpen(false)} />
                                <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-float border border-secondary-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    {typeOptions.map((opt) => (
                                        <button
                                            key={opt.id || 'all-type'}
                                            onClick={() => { setTypeFilter(opt.id); setIsTypeOpen(false); }}
                                            className={cn(
                                                'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all',
                                                typeFilter === opt.id ? 'bg-primary-50 text-primary-700' : 'hover:bg-secondary-50 text-secondary-600'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn('w-1.5 h-1.5 rounded-full', opt.color)} />
                                                <span className="text-sm font-medium">{opt.label}</span>
                                            </div>
                                            {typeFilter === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-primary-600" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Status filter */}
                    <div className="relative">
                        <button
                            onClick={() => { setIsStatusOpen(!isStatusOpen); setIsTypeOpen(false); }}
                            className={cn(
                                'h-10 px-4 flex items-center gap-3 bg-white border rounded-xl transition-all',
                                isStatusOpen ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-secondary-200 hover:border-secondary-300',
                                statusFilter ? 'border-primary-300 bg-primary-50/50' : ''
                            )}
                        >
                            <Filter className={cn('w-4 h-4', statusFilter ? 'text-primary-500' : 'text-secondary-400')} />
                            <span className="text-xs font-medium text-secondary-700 min-w-[100px] text-left">
                                {statusOptions.find((o) => o.id === statusFilter)?.label || 'Statut'}
                            </span>
                            <ChevronDown className={cn('w-4 h-4 text-secondary-400 transition-transform duration-300', isStatusOpen && 'rotate-180')} />
                        </button>
                        {isStatusOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsStatusOpen(false)} />
                                <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-float border border-secondary-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    {statusOptions.map((opt) => (
                                        <button
                                            key={opt.id || 'all-status'}
                                            onClick={() => { setStatusFilter(opt.id); setIsStatusOpen(false); }}
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
                        onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter(''); }}
                    >
                        Réinitialiser
                    </Button>
                </div>
            </FilterBar>

            <DataPanel
                title="Demandes de mobilité"
                description={`${filtered.length} demande${filtered.length > 1 ? 's' : ''} affichée${filtered.length > 1 ? 's' : ''}`}
                contentClassName="p-0"
            >
                {isLoading ? (
                    <div className="p-32 flex flex-col items-center justify-center gap-6">
                        <div className="relative">
                            <Loader2 className="w-16 h-16 animate-spin text-primary-600" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <ArrowRightLeft className="w-6 h-6 text-primary-200" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-sm text-secondary-900">Chargement des demandes</p>
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
                        <Button onClick={() => window.location.reload()} variant="outline">
                            Réessayer
                        </Button>
                    </div>
                ) : (
                    <div className="relative">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-secondary-100">
                                    <TableHead className="px-6">Employé</TableHead>
                                    <TableHead className="px-6">Type</TableHead>
                                    <TableHead className="px-6">Date demande</TableHead>
                                    <TableHead className="px-6">Statut</TableHead>
                                    <TableHead className="px-6 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                            Aucune demande trouvée pour ce critère.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((req) => {
                                        const empName = employeeMap[req.employee] || req.employee;
                                        const typeLabel = MOBILITY_TYPE_LABELS[req.type as MobilityType] || req.type;
                                        const statusLabel = MOBILITY_STATUS_LABELS[req.status as MobilityStatus] || req.status;
                                        const statusVariant = getStatusBadgeVariant(req.status as string);
                                        const typeClass = getTypeBadgeClass(req.type as string);

                                        const initials = (() => {
                                            const n = employeeMap[req.employee] || '';
                                            const parts = n.split(' ');
                                            return parts.length >= 2
                                                ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
                                                : n.substring(0, 2).toUpperCase();
                                        })();

                                        return (
                                            <TableRow key={req.id} className="group">
                                                <TableCell className="px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs shrink-0">
                                                            {initials || '?'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-secondary-900 truncate">{empName}</p>
                                                            <p className="text-xs text-muted-foreground">{req.id.substring(0, 10)}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <span className={cn(
                                                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border',
                                                        typeClass
                                                    )}>
                                                        <TrendingUp className="w-3 h-3" />
                                                        {typeLabel}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <span className="text-secondary-800 tabular-nums">
                                                        {req.createdAt
                                                            ? format(new Date(req.createdAt), 'dd MMM yyyy', { locale: fr })
                                                            : '—'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <Badge variant={statusVariant}>
                                                        {statusLabel}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-6 text-right">
                                                    <Link href={`/m/personnel/mobility/${req.id}`}>
                                                        <Button variant="ghost" size="sm" className="h-9 px-3 text-primary-500 hover:bg-primary-50 gap-1.5 font-semibold text-xs">
                                                            <Eye className="w-4 h-4" />
                                                            Voir
                                                        </Button>
                                                    </Link>
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
                                {' '}demande{filtered.length > 1 ? 's' : ''} sur{' '}
                                <span className="font-semibold text-secondary-900">{requests.length}</span>
                            </p>
                            <Link href="/m/personnel/mobility/create">
                                <Button variant="outline" size="sm" className="gap-1.5">
                                    Nouvelle demande
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </DataPanel>
        </PageShell>
    );
}
