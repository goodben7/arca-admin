'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Filter,
    Plus,
    MoreHorizontal,
    Eye,
    Edit2,
    Download,
    Mail,
    Phone,
    Briefcase,
    Loader2,
    AlertCircle,
    ChevronDown,
    X
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
import { Card } from '@/components/ui/Card';
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
                // If hydra:totalItems is missing but we have a hydra:member, it might be the end or unpaginated.
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
            case STATUS.INACTIVE: return { label: 'Inactif', variant: 'destructive' as const };
            default: return { label: status, variant: 'secondary' as const };
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">Annuaire des Employés</h1>
                    <p className="text-secondary-500 font-medium">Gérez votre capital humain et accédez aux dossiers individuels.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Exporter
                    </Button>
                    <Link href="/employees/create">
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Ajouter un employé
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters Bar */}
            <Card className="p-4 border-none shadow-sm shadow-secondary-200/50">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-secondary-50/50 border border-secondary-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status Custom Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                className={cn(
                                    "h-10 px-4 flex items-center gap-3 bg-white border rounded-xl transition-all shadow-sm",
                                    isStatusDropdownOpen ? "border-primary-500 ring-2 ring-primary-500/10" : "border-secondary-200 hover:border-secondary-300",
                                    statusFilter ? "border-primary-200 bg-primary-50/30" : ""
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Filter className={cn("w-3.5 h-3.5", statusFilter ? "text-primary-600" : "text-secondary-400")} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary-600">
                                        {statusFilter ? (
                                            statusFilter === STATUS.ACTIVE ? "Actif" :
                                            statusFilter === STATUS.ON_LEAVE ? "En congé" :
                                            "Inactif"
                                        ) : "Tous les Statuts"}
                                    </span>
                                </div>
                                <ChevronDown className={cn("w-3.5 h-3.5 text-secondary-400 transition-transform duration-200", isStatusDropdownOpen && "rotate-180")} />
                            </button>

                            {isStatusDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl shadow-secondary-900/10 border border-secondary-100 p-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                                        {[
                                            { id: '', label: 'Tous les Statuts', color: 'bg-secondary-200' },
                                            { id: STATUS.ACTIVE, label: 'Actif', color: 'bg-emerald-500' },
                                            { id: STATUS.ON_LEAVE, label: 'En congé', color: 'bg-amber-500' },
                                            { id: STATUS.INACTIVE, label: 'Inactif', color: 'bg-rose-500' }
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
                            className="text-primary-600 font-bold hover:text-primary-700 transition-colors uppercase text-[10px] tracking-widest"
                            onClick={() => {
                                setSearch('');
                                setStatusFilter('');
                                setCurrentPage(1);
                            }}
                        >
                            Réinitialiser
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Table */}
            <Card className="overflow-hidden border-none shadow-xl shadow-secondary-200/50">
                {isLoading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4 text-secondary-400">
                        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                        <p className="font-bold animate-pulse uppercase tracking-widest text-xs">Chargement des données...</p>
                    </div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4 text-destructive bg-destructive/5">
                        <AlertCircle className="w-10 h-10" />
                        <p className="font-bold text-lg">{error}</p>
                        <Button onClick={() => window.location.reload()} variant="outline">Réessayer</Button>
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent uppercase tracking-wider text-[11px]">
                                    <TableHead className="w-[300px]">Employé</TableHead>
                                    <TableHead>Département</TableHead>
                                    <TableHead>Poste</TableHead>
                                    <TableHead>Date d'entrée</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center text-secondary-400 font-medium italic">
                                            Aucun employé trouvé dans l'organisation.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((emp) => {
                                        const statusInfo = getStatusLabel(emp.status);
                                        return (
                                            <TableRow key={emp.id} className="group hover:bg-secondary-50/50">
                                                <TableCell>
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 text-primary-700 flex items-center justify-center font-black border-2 border-white shadow-sm transition-transform group-hover:scale-110 duration-300 uppercase overflow-hidden">
                                                                {avatarsMap[emp.id] ? (
                                                                    <img src={avatarsMap[emp.id]} alt="Avatar" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span>{emp.firstName?.[0]}{emp.lastName?.[0]}</span>
                                                                )}
                                                            </div>
                                                            <div className={cn(
                                                                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm",
                                                                emp.status === STATUS.ACTIVE ? "bg-emerald-500" : "bg-secondary-300"
                                                            )} />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <p className="font-bold text-secondary-900 group-hover:text-primary-700 transition-colors uppercase truncate">
                                                                {emp.firstName} {emp.lastName}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-[11px]">
                                                                <span className="font-black text-primary-600 tracking-tighter bg-primary-50 px-1.5 py-0.5 rounded">
                                                                    {emp.employeeNumber || emp.id.substring(0, 8)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-secondary-700">
                                                            {departmentsMap[emp.department] || emp.department}
                                                        </span>
                                                        <span className="text-[10px] text-secondary-400 font-bold uppercase tracking-tighter">Unité MCBS</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase className="w-3.5 h-3.5 text-secondary-400" />
                                                        <span className="text-sm font-medium text-secondary-600">
                                                            {positionsMap[emp.position] || emp.position}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-secondary-500 font-bold tabular-nums text-sm">
                                                    {emp.hireDate ? format(new Date(emp.hireDate), 'dd MMM yyyy', { locale: fr }) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={statusInfo.variant} className="font-black text-[10px] uppercase py-1 px-3 rounded-full">
                                                        {statusInfo.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4">
                                                        <Link href={`/employees/${emp.id}`}>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/employees/${emp.id}/edit`}>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-secondary-400 hover:text-secondary-900 hover:bg-secondary-100 rounded-xl transition-all">
                                                                <Edit2 className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-secondary-400 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                        <div className="p-4 border-t border-secondary-100 bg-secondary-50/30 flex items-center justify-between">
                            <p className="text-sm text-secondary-500 font-medium tracking-tight">
                                Affichage de <span className="text-secondary-900 font-black">{employees.length}</span> sur <span className="text-secondary-900 font-black">{totalItems}</span> employés
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 mr-2">
                                    <span className="text-[11px] font-black uppercase text-secondary-400 tracking-widest">Page</span>
                                    <span className="w-8 h-8 rounded-lg bg-white border border-secondary-200 flex items-center justify-center text-sm font-black text-primary-600 shadow-sm">
                                        {currentPage}
                                    </span>
                                    <span className="text-[11px] font-black uppercase text-secondary-400 tracking-widest mx-1">sur</span>
                                    <span className="text-sm font-bold text-secondary-600">
                                        {Math.ceil(totalItems / itemsPerPage) || 1}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-9 px-4 rounded-xl font-bold border-secondary-200 hover:bg-white hover:border-primary-500 hover:text-primary-600 transition-all disabled:opacity-30"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1 || isLoading}
                                    >
                                        Précédent
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-9 px-4 rounded-xl font-bold border-secondary-200 hover:bg-white hover:border-primary-500 hover:text-primary-600 transition-all disabled:opacity-30"
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        disabled={currentPage >= Math.ceil(totalItems / itemsPerPage) || isLoading}
                                    >
                                        Suivant
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
