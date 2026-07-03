'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    FileText,
    Search,
    Filter,
    Plus,
    Download,
    Loader2,
    AlertCircle,
    Eye,
    ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/Table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/layout/FilterBar';
import { DataPanel } from '@/components/layout/DataPanel';
import { getAllContracts } from '@/lib/api/contract';
import { getAllEmployees } from '@/lib/api/employee';
import { getAllDocuments } from '@/lib/api/document';
import { BASE_URL } from '@/lib/api/client';
import { Contract, CONTRACT_TYPE, CONTRACT_STATUS } from '@/types/contract';
import { Employee } from '@/types/employee';

export default function ContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [employeeMap, setEmployeeMap] = useState<Record<string, Employee>>({});
    const [avatarsMap, setAvatarsMap] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        async function loadStaticData() {
            try {
                const [employeesData, docsData] = await Promise.all([
                    getAllEmployees({ itemsPerPage: 500 }).catch(() => []),
                    getAllDocuments({ type: 'PHOTO', holderType: 'EMPLOYEE' }).catch(() => ({ 'hydra:member': [] })),
                ]);

                const employeesArray = Array.isArray(employeesData)
                    ? employeesData
                    : employeesData['hydra:member'] || [];
                const map: Record<string, Employee> = {};
                employeesArray.forEach((emp: Employee) => {
                    map[emp.id] = emp;
                    if (emp['@id']) map[emp['@id']] = emp;
                });
                setEmployeeMap(map);

                const docList = Array.isArray(docsData) ? docsData : (docsData as any)['hydra:member'] || [];
                const avMap: Record<string, string> = {};
                docList.forEach((doc: any) => {
                    if (doc.holderId && doc.contentUrl) {
                        avMap[doc.holderId] = `${BASE_URL}${doc.contentUrl}`;
                    }
                });
                setAvatarsMap(avMap);
            } catch (err) {
                console.error('Error loading static data:', err);
            }
        }
        loadStaticData();
    }, []);

    useEffect(() => {
        async function fetchContracts() {
            setIsLoading(true);
            setError(null);
            try {
                const params: Record<string, string> = {};
                if (typeFilter) params.type = typeFilter;
                if (statusFilter) params.status = statusFilter;

                const contractsData = await getAllContracts(params);
                const contractsArray = Array.isArray(contractsData)
                    ? contractsData
                    : contractsData['hydra:member'] || [];
                setContracts(contractsArray);
            } catch (err: any) {
                setError(err.message || 'Erreur lors du chargement des données.');
            } finally {
                setIsLoading(false);
            }
        }
        fetchContracts();
    }, [typeFilter, statusFilter]);

    const filteredContracts = useMemo(() => {
        if (!debouncedSearch.trim()) return contracts;
        const q = debouncedSearch.toLowerCase();
        return contracts.filter((con) => {
            const emp = employeeMap[con.employee];
            const name = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : con.employee.toLowerCase();
            const ref = (con.id || '').toLowerCase();
            const matricule = (emp?.employeeNumber || '').toLowerCase();
            return name.includes(q) || ref.includes(q) || matricule.includes(q);
        });
    }, [contracts, debouncedSearch, employeeMap]);

    const getEmployeeDisplay = (employeeRef: string) => {
        const emp = employeeMap[employeeRef];
        if (!emp) return { name: employeeRef, initials: '?', employeeId: employeeRef };
        return {
            name: `${emp.firstName} ${emp.lastName}`.trim(),
            initials: `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase(),
            employeeId: emp.id,
            ref: emp.employeeNumber || emp.id.substring(0, 12),
        };
    };

    const getStatusLabel = (status: string) => {
        switch (status.toUpperCase()) {
            case CONTRACT_STATUS.ACTIVE: return { label: 'Actif', variant: 'success' as const };
            case CONTRACT_STATUS.PENDING: return { label: 'En attente', variant: 'warning' as const };
            case CONTRACT_STATUS.ENDED: return { label: 'Terminé', variant: 'secondary' as const };
            case CONTRACT_STATUS.CANCELLED: return { label: 'Annulé', variant: 'destructive' as const };
            default: return { label: status, variant: 'secondary' as const };
        }
    };

    const getTypeLabel = (type: string) => {
        if (type === CONTRACT_TYPE.INTERNSHIP) return 'Stage';
        return type;
    };

    const typeOptions = [
        { id: '', label: 'Tous les types', color: 'bg-secondary-200' },
        { id: CONTRACT_TYPE.CDI, label: 'CDI', color: 'bg-emerald-500' },
        { id: CONTRACT_TYPE.CDD, label: 'CDD', color: 'bg-blue-500' },
        { id: CONTRACT_TYPE.INTERNSHIP, label: 'Stage', color: 'bg-amber-500' },
        { id: CONTRACT_TYPE.CONSULTANT, label: 'Consultant', color: 'bg-purple-500' },
    ];

    const statusOptions = [
        { id: '', label: 'Tous les statuts', color: 'bg-secondary-200' },
        { id: CONTRACT_STATUS.PENDING, label: 'En attente', color: 'bg-amber-500' },
        { id: CONTRACT_STATUS.ACTIVE, label: 'Actif', color: 'bg-emerald-500' },
        { id: CONTRACT_STATUS.ENDED, label: 'Terminé', color: 'bg-slate-400' },
        { id: CONTRACT_STATUS.CANCELLED, label: 'Annulé', color: 'bg-rose-600' },
    ];

    const selectedTypeLabel = typeOptions.find((o) => o.id === typeFilter)?.label || 'Tous les types';
    const selectedStatusLabel = statusOptions.find((o) => o.id === statusFilter)?.label || 'Tous les statuts';

    return (
        <PageShell>
            <PageHeader
                title="Gestion des Contrats"
                description="Suivi des types de contrats, dates de fin et rémunérations."
                actions={
                    <>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="w-4 h-4" />
                            Rapport annuel
                        </Button>
                        <Link href="/contracts/create">
                            <Button variant="pill" size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Nouveau contrat
                            </Button>
                        </Link>
                    </>
                }
            />

            <FilterBar>
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Rechercher par collaborateur ou référence..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-secondary-400"
                    />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <button
                            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                            className={cn(
                                'h-10 px-4 flex items-center gap-3 bg-white border rounded-xl transition-all',
                                isTypeDropdownOpen ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-secondary-200 hover:border-secondary-300',
                                typeFilter ? 'border-primary-300 bg-primary-50/50' : ''
                            )}
                        >
                            <Filter className={cn('w-4 h-4', typeFilter ? 'text-primary-500' : 'text-secondary-400')} />
                            <span className="text-xs font-medium text-secondary-700 min-w-[100px] text-left">
                                {selectedTypeLabel}
                            </span>
                            <ChevronDown className={cn('w-4 h-4 text-secondary-400 transition-transform duration-300', isTypeDropdownOpen && 'rotate-180')} />
                        </button>
                        {isTypeDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsTypeDropdownOpen(false)} />
                                <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl shadow-secondary-900/10 border border-secondary-100 p-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                                    {typeOptions.map((opt) => (
                                        <button
                                            key={opt.id || 'all'}
                                            onClick={() => { setTypeFilter(opt.id); setIsTypeDropdownOpen(false); }}
                                            className={cn(
                                                'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all',
                                                typeFilter === opt.id ? 'bg-primary-50 text-primary-700' : 'hover:bg-secondary-50 text-secondary-600'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn('w-1.5 h-1.5 rounded-full', opt.color)} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                                            </div>
                                            {typeFilter === opt.id && <div className="w-1 h-1 rounded-full bg-primary-600" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

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
                                <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl shadow-secondary-900/10 border border-secondary-100 p-2 z-20 animate-in fade-in zoom-in-95 duration-200">
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
                                                <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                                            </div>
                                            {statusFilter === opt.id && <div className="w-1 h-1 rounded-full bg-primary-600" />}
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
                            setTypeFilter('');
                            setStatusFilter('');
                        }}
                    >
                        Réinitialiser
                    </Button>
                </div>
            </FilterBar>

            <DataPanel title="Liste des contrats" contentClassName="p-0">
                {isLoading ? (
                    <div className="p-32 flex flex-col items-center justify-center gap-6">
                        <div className="relative">
                            <Loader2 className="w-16 h-16 animate-spin text-primary-600" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-primary-200" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="font-black uppercase tracking-[0.3em] text-xs text-secondary-900 animate-pulse">Chargement des contrats</p>
                            <p className="text-[10px] text-secondary-400 font-bold mt-2 uppercase tracking-widest">Synchronisation avec le cloud ARCA...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-6 text-center">
                        <div className="w-20 h-20 bg-rose-50 rounded-xl flex items-center justify-center">
                            <AlertCircle className="w-10 h-10 text-rose-600" />
                        </div>
                        <div>
                            <p className="font-black text-xl text-secondary-900 uppercase tracking-tight">Erreur de chargement</p>
                            <p className="text-secondary-500 font-medium max-w-md mx-auto mt-2">{error}</p>
                        </div>
                        <Button onClick={() => window.location.reload()} variant="outline" className="rounded-2xl px-8 h-12 font-black uppercase text-[10px] tracking-widest border-secondary-200">
                            Réessayer la connexion
                        </Button>
                    </div>
                ) : (
                    <div className="relative">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-secondary-100">
                                    <TableHead className="px-6">Collaborateur</TableHead>
                                    <TableHead className="px-6">Type</TableHead>
                                    <TableHead className="px-6">Date début</TableHead>
                                    <TableHead className="px-6">Date fin</TableHead>
                                    <TableHead className="px-6">Rémunération</TableHead>
                                    <TableHead className="px-6">Statut</TableHead>
                                    <TableHead className="px-6 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredContracts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                                            Aucun contrat trouvé pour ce critère.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredContracts.map((con) => {
                                        const employee = getEmployeeDisplay(con.employee);
                                        const statusInfo = getStatusLabel(con.status);
                                        const avatarUrl = avatarsMap[employee.employeeId];

                                        return (
                                            <TableRow key={con.id} className="group">
                                                <TableCell className="px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 rounded-xl bg-secondary-100 border border-secondary-200 flex items-center justify-center overflow-hidden shrink-0">
                                                            {avatarUrl ? (
                                                                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-sm font-semibold text-secondary-600 uppercase">
                                                                    {employee.initials}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-secondary-900 truncate">
                                                                {employee.name}
                                                            </p>
                                                            <span className="text-xs font-medium text-primary-600">
                                                                {employee.ref || con.id.substring(0, 12)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                                                        <span className="text-secondary-700">
                                                            {getTypeLabel(con.type)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <span className="text-secondary-800 tabular-nums">
                                                        {con.startDate ? format(new Date(con.startDate), 'dd MMM yyyy', { locale: fr }) : '—'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <span className="text-secondary-700 tabular-nums">
                                                        {con.endDate ? format(new Date(con.endDate), 'dd MMM yyyy', { locale: fr }) : 'Indéfini'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <span className="font-medium text-secondary-900 tabular-nums">
                                                        {parseInt(con.salary || '0').toLocaleString()} CDF
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <Badge variant={statusInfo.variant}>
                                                        {statusInfo.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-6 text-right">
                                                    <Link href={`/contracts/${con.id}`}>
                                                        <Button variant="ghost" size="sm" className="h-9 px-3 text-primary-500 hover:bg-primary-50 gap-1.5 font-semibold text-xs">
                                                            <Eye className="w-4 h-4" />
                                                            Contrat
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>

                        <div className="p-6 border-t border-primary-100/40 table-footer-wash flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-secondary-600">
                                Affichage de <span className="font-semibold text-secondary-900">{filteredContracts.length}</span> sur <span className="font-semibold text-secondary-900">{contracts.length}</span> contrats
                            </p>
                        </div>
                    </div>
                )}
            </DataPanel>
        </PageShell>
    );
}
