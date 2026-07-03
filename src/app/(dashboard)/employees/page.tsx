'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Filter,
    Plus,
    Eye,
    Download,
    Briefcase,
    Loader2,
    AlertCircle,
    ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/Table';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/layout/FilterBar';
import { DataPanel } from '@/components/layout/DataPanel';
import Link from 'next/link';
import { getAllEmployees, getDepartments } from '@/lib/api/employee';
import { getAllPositions } from '@/lib/api/position';
import { getAllDocuments } from '@/lib/api/document';
import { BASE_URL } from '@/lib/api/client';
import { Employee, STATUS, Department } from '@/types/employee';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departmentsMap, setDepartmentsMap] = useState<Record<string, string>>({});
    const [positionsMap, setPositionsMap] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [avatarsMap, setAvatarsMap] = useState<Record<string, string>>({});
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;

    // Filter state
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Load static data (departments, positions and avatars) once
    useEffect(() => {
        async function loadStaticData() {
            try {
                const [deptsData, posData, docsData] = await Promise.all([
                    getDepartments().catch(() => []),
                    getAllPositions().catch(() => []),
                    getAllDocuments({ type: 'PHOTO', holderType: 'EMPLOYEE' }).catch(() => ({ 'hydra:member': [] }))
                ]);

                // Departments map
                const deptsList = Array.isArray(deptsData) ? deptsData : deptsData['hydra:member'] || [];
                const dMap: Record<string, string> = {};
                deptsList.forEach((dept: Department) => {
                    dMap[dept.id] = dept.name;
                    if (dept['@id']) dMap[dept['@id']] = dept.name;
                });
                setDepartmentsMap(dMap);

                // Positions map
                const posList = Array.isArray(posData) ? posData : (posData as any)['hydra:member'] || (posData as any)['member'] || [];
                const pMap: Record<string, string> = {};
                posList.forEach((pos: any) => {
                    pMap[pos.id] = pos.title;
                    if (pos['@id']) pMap[pos['@id']] = pos.title;
                });
                setPositionsMap(pMap);

                // Avatars map
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

    // Load paginated employees
    useEffect(() => {
        async function fetchEmployees() {
            try {
                setIsLoading(true);
                const params: any = {
                    page: currentPage,
                    itemsPerPage
                };

                if (debouncedSearch) {
                    // Try searching by lastName since ipartial is available
                    params.lastName = debouncedSearch;
                }

                if (statusFilter) {
                    params.status = statusFilter;
                }

                const empData = await getAllEmployees(params);

                const empList = Array.isArray(empData) ? empData : empData['hydra:member'] || [];
                // If it's an array, the total is the length. If it's Hydra, we take hydra:totalItems.
                const total = Array.isArray(empData) 
                    ? empData.length 
                    : (typeof empData['hydra:totalItems'] === 'number' ? empData['hydra:totalItems'] : empList.length);
                
                setEmployees(empList);
                setTotalItems(total);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchEmployees();
    }, [currentPage, debouncedSearch, statusFilter]);

    const getStatusLabel = (status: string) => {
        switch (status) {
            case STATUS.ACTIVE: return { label: 'Actif', variant: 'success' as const };
            case STATUS.ON_LEAVE: return { label: 'En congé', variant: 'warning' as const };
            case STATUS.INACTIVE: return { label: 'Inactif', variant: 'secondary' as const };
            case STATUS.SUSPENDED: return { label: 'Suspendu', variant: 'destructive' as const };
            case STATUS.TERMINATED: return { label: 'Contrat terminé', variant: 'destructive' as const };
            case STATUS.PROBATION: return { label: "Période d'essai", variant: 'info' as const };
            case STATUS.RETIRED: return { label: 'Retraité', variant: 'secondary' as const };
            default: return { label: status, variant: 'secondary' as const };
        }
    };

    return (
        <PageShell>
            <PageHeader
                title="Annuaire du Personnel"
                description="Visualisez et gérez l'ensemble des collaborateurs de l'organisation."
                actions={
                    <>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="w-4 h-4" />
                            Exporter
                        </Button>
                        <Link href="/employees/create">
                            <Button variant="pill" size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Nouveau Collaborateur
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
                                placeholder="Rechercher par nom ou matricule..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-secondary-400"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Status Custom Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                    className={cn(
                                        "h-10 px-4 flex items-center gap-3 bg-white border rounded-xl transition-all",
                                        isStatusDropdownOpen ? "border-primary-500 ring-2 ring-primary-500/20" : "border-secondary-200 hover:border-secondary-300",
                                        statusFilter ? "border-primary-300 bg-primary-50/50" : ""
                                    )}
                                >
                                    <Filter className={cn("w-4 h-4", statusFilter ? "text-primary-500" : "text-secondary-400")} />
                                    <span className="text-xs font-medium text-secondary-700 min-w-[100px] text-left">
                                        {statusFilter ? (
                                            statusFilter === STATUS.ACTIVE ? "Actif" :
                                            statusFilter === STATUS.ON_LEAVE ? "En congé" :
                                            statusFilter === STATUS.INACTIVE ? "Inactif" :
                                            statusFilter === STATUS.SUSPENDED ? "Suspendu" :
                                            statusFilter === STATUS.TERMINATED ? "Contrat Terminé" :
                                            statusFilter === STATUS.PROBATION ? "Période d'Essai" :
                                            statusFilter === STATUS.RETIRED ? "Retraité" :
                                            statusFilter
                                        ) : "Tous les Statuts"}
                                    </span>
                                    <ChevronDown className={cn("w-4 h-4 text-secondary-400 transition-transform duration-300", isStatusDropdownOpen && "rotate-180")} />
                                </button>

                                {isStatusDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)} />
                                        <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl shadow-secondary-900/10 border border-secondary-100 p-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                                            {[
                                                { id: '', label: 'Tous les Statuts', color: 'bg-secondary-200' },
                                                { id: STATUS.ACTIVE, label: 'Actif', color: 'bg-emerald-500' },
                                                { id: STATUS.PROBATION, label: 'Période d\'Essai', color: 'bg-blue-500' },
                                                { id: STATUS.ON_LEAVE, label: 'En congé', color: 'bg-amber-500' },
                                                { id: STATUS.SUSPENDED, label: 'Suspendu', color: 'bg-orange-500' },
                                                { id: STATUS.TERMINATED, label: 'Contrat Terminé', color: 'bg-rose-600' },
                                                { id: STATUS.RETIRED, label: 'Retraité', color: 'bg-purple-500' },
                                                { id: STATUS.INACTIVE, label: 'Inactif', color: 'bg-slate-400' }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => {
                                                        setStatusFilter(opt.id);
                                                        setCurrentPage(1);
                                                        setIsStatusDropdownOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group",
                                                        statusFilter === opt.id ? "bg-primary-50 text-primary-700" : "hover:bg-secondary-50 text-secondary-600"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("w-1.5 h-1.5 rounded-full", opt.color)} />
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
                                    setStatusFilter('');
                                    setCurrentPage(1);
                                }}
                            >
                                Réinitialiser
                            </Button>
                        </div>
            </FilterBar>

                <DataPanel title="Liste des collaborateurs" contentClassName="p-0">
                    {isLoading ? (
                        <div className="p-32 flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                <Loader2 className="w-16 h-16 animate-spin text-primary-600" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-primary-200" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="font-black uppercase tracking-[0.3em] text-xs text-secondary-900 animate-pulse">Chargement de l'annuaire</p>
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
                                        <TableHead className="px-6">Affectation</TableHead>
                                        <TableHead className="px-6">Poste & fonction</TableHead>
                                        <TableHead className="px-6">Ancienneté</TableHead>
                                        <TableHead className="px-6">Statut</TableHead>
                                        <TableHead className="px-6 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                                Aucun collaborateur trouvé pour ce critère.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        employees.map((emp) => {
                                            const statusInfo = getStatusLabel(emp.status);
                                            return (
                                                <TableRow key={emp.id} className="group">
                                                    <TableCell className="px-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-11 h-11 rounded-xl bg-secondary-100 border border-secondary-200 flex items-center justify-center overflow-hidden shrink-0">
                                                                {avatarsMap[emp.id] ? (
                                                                    <img src={avatarsMap[emp.id]} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-sm font-semibold text-secondary-600 uppercase">
                                                                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-secondary-900 truncate">
                                                                    {emp.firstName} {emp.lastName}
                                                                </p>
                                                                <span className="text-xs font-medium text-primary-600">
                                                                    {emp.employeeNumber || emp.id.substring(0, 8)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6">
                                                        <span className="font-medium text-secondary-900">
                                                            {departmentsMap[emp.department] || emp.department}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-6">
                                                        <div className="flex items-center gap-2">
                                                            <Briefcase className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                                                            <span className="text-secondary-700">
                                                                {positionsMap[emp.position] || emp.position}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6">
                                                        <span className="text-secondary-800 tabular-nums">
                                                            {emp.hireDate ? format(new Date(emp.hireDate), 'dd MMM yyyy', { locale: fr }) : '—'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-6">
                                                        <Badge variant={statusInfo.variant}>
                                                            {statusInfo.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-6 text-right">
                                                        <Link href={`/employees/${emp.id}`}>
                                                            <Button variant="ghost" size="sm" className="h-9 px-3 text-primary-500 hover:bg-primary-50 gap-1.5 font-semibold text-xs">
                                                                <Eye className="w-4 h-4" />
                                                                Dossier
                                                            </Button>
                                                        </Link>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination Section */}
                            <div className="p-6 border-t border-primary-100/40 table-footer-wash flex flex-col md:flex-row items-center justify-between gap-4">
                                <p className="text-sm text-secondary-600">
                                    Affichage de <span className="font-semibold text-secondary-900">{employees.length}</span> sur <span className="font-semibold text-secondary-900">{totalItems}</span> collaborateurs
                                </p>
                                
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-secondary-600">
                                        Page <span className="font-semibold text-secondary-900">{currentPage}</span> / {Math.ceil(totalItems / itemsPerPage) || 1}
                                    </span>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1 || isLoading}
                                    >
                                        Précédent
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        disabled={currentPage >= Math.ceil(totalItems / itemsPerPage) || isLoading}
                                    >
                                        Suivant
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DataPanel>
        </PageShell>
    );
}
