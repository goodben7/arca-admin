'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Eye,
    Download,
    Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FilterDropdown } from '@/components/ui/FilterDropdown';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/Table';
import { PageShell } from '@/components/layout/PageShell';
import { ControlPanel } from '@/components/modules/ControlPanel';
import { FilterBar } from '@/components/layout/FilterBar';
import { DataPanel } from '@/components/layout/DataPanel';
import { StateBlock } from '@/components/layout/StateBlock';
import Link from 'next/link';
import { getAllEmployees, getDepartments } from '@/lib/api/employee';
import { getAllPositions } from '@/lib/api/position';
import { getAllDocuments } from '@/lib/api/document';
import { BASE_URL } from '@/lib/api/client';
import { Employee, STATUS, Department } from '@/types/employee';
import { resolveFromMap } from '@/lib/api-iri';
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

    const statusOptions = [
        { id: '', label: 'Tous les Statuts', color: 'bg-secondary-200' },
        { id: STATUS.ACTIVE, label: 'Actif', color: 'bg-emerald-500' },
        { id: STATUS.PROBATION, label: 'Période d\'Essai', color: 'bg-blue-500' },
        { id: STATUS.ON_LEAVE, label: 'En congé', color: 'bg-amber-500' },
        { id: STATUS.SUSPENDED, label: 'Suspendu', color: 'bg-orange-500' },
        { id: STATUS.TERMINATED, label: 'Contrat Terminé', color: 'bg-rose-600' },
        { id: STATUS.RETIRED, label: 'Retraité', color: 'bg-purple-500' },
        { id: STATUS.INACTIVE, label: 'Inactif', color: 'bg-slate-400' },
    ];

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
            <ControlPanel
                title="Employés"
                description="Annuaire des collaborateurs — dossier 360° disponible sur chaque fiche."
                actions={
                    <>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="w-4 h-4" />
                            Exporter
                        </Button>
                        <Link href="/m/personnel/employees/create">
                            <Button variant="pill" size="sm" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Nouveau collaborateur
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
                            <FilterDropdown
                                value={statusFilter}
                                onChange={(id) => {
                                    setStatusFilter(id);
                                    setCurrentPage(1);
                                }}
                                options={statusOptions}
                                placeholder="Tous les Statuts"
                            />

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

                <DataPanel title="Liste des collaborateurs" contentClassName="p-0" className="relative z-0">
                    {isLoading ? (
                        <StateBlock
                            variant="loading"
                            title="Chargement de l'annuaire"
                            description="Synchronisation des collaborateurs…"
                            className="py-24"
                        />
                    ) : error ? (
                        <StateBlock
                            variant="error"
                            title="Erreur de chargement"
                            description={error}
                            action={
                                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                                    Réessayer
                                </Button>
                            }
                        />
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
                                                            {resolveFromMap(emp.department, departmentsMap)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-6">
                                                        <div className="flex items-center gap-2">
                                                            <Briefcase className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                                                            <span className="text-secondary-700">
                                                                {resolveFromMap(emp.position, positionsMap)}
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
                                                        <Link href={`/m/personnel/employees/${emp.id}`}>
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
