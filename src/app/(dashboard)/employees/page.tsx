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
    X,
    CheckCircle2,
    Clock,
    CalendarDays
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
            case STATUS.SUSPENDED: return { label: 'Suspendu', variant: 'destructive' as const };
            case STATUS.TERMINATED: return { label: 'Contrat Terminé', variant: 'destructive' as const };
            case STATUS.PROBATION: return { label: 'Période d\'Essai', variant: 'warning' as const };
            case STATUS.RETIRED: return { label: 'Retraité', variant: 'secondary' as const };
            default: return { label: status, variant: 'secondary' as const };
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header & Stats Section */}
            <div className="flex flex-col gap-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-secondary-900 tracking-tight uppercase">Annuaire du Personnel</h1>
                        </div>
                        <p className="text-secondary-500 font-bold ml-13">Visualisez et gérez l'ensemble des collaborateurs de l'organisation.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="h-12 px-6 rounded-2xl border-secondary-200 bg-white hover:bg-secondary-50 text-secondary-600 font-black uppercase text-[10px] tracking-widest transition-all">
                            <Download className="w-4 h-4 mr-2" />
                            Exporter
                        </Button>
                        <Link href="/employees/create">
                            <Button className="h-12 px-6 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
                                <Plus className="w-4 h-4 mr-2" />
                                Nouveau Collaborateur
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Employés', value: totalItems, icon: Users, color: 'text-primary-600', bg: 'bg-primary-50', border: 'border-primary-100' },
                        { label: 'Collaborateurs Actifs', value: employees.filter(e => e.status === STATUS.ACTIVE).length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                        { label: 'En Période d\'Essai', value: employees.filter(e => e.status === STATUS.PROBATION).length, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                        { label: 'Absents / Congés', value: employees.filter(e => e.status === STATUS.ON_LEAVE).length, icon: CalendarDays, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                    ].map((stat, i) => (
                        <Card key={i} className={cn("p-6 border shadow-sm transition-all hover:shadow-md rounded-[32px] group", stat.bg, stat.border)}>
                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400 group-hover:text-secondary-500 transition-colors">{stat.label}</p>
                                    <h3 className="text-3xl font-black text-secondary-900 tracking-tighter">{stat.value}</h3>
                                </div>
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-white shadow-sm transition-transform group-hover:scale-110 duration-300", stat.color)}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Filters & Content Section */}
            <div className="space-y-6">
                <Card className="p-6 border-none shadow-xl shadow-secondary-100 bg-white rounded-[40px] border border-secondary-50/50">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-300 group-focus-within:text-primary-600 transition-all" />
                            <input
                                type="text"
                                placeholder="Rechercher par nom ou matricule..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-14 pl-12 pr-6 bg-secondary-50/50 border border-secondary-100 rounded-[20px] text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold placeholder:text-secondary-300"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Status Custom Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                    className={cn(
                                        "h-14 px-6 flex items-center gap-4 bg-white border rounded-[20px] transition-all shadow-sm",
                                        isStatusDropdownOpen ? "border-primary-500 ring-4 ring-primary-500/10" : "border-secondary-100 hover:border-secondary-200",
                                        statusFilter ? "bg-primary-50/30 border-primary-100" : ""
                                    )}
                                >
                                    <Filter className={cn("w-4 h-4", statusFilter ? "text-primary-600" : "text-secondary-400")} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-secondary-600 min-w-[120px] text-left">
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
                                className="h-14 px-6 rounded-[20px] text-primary-600 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-primary-50 transition-all"
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

                {/* Table Section */}
                <Card className="overflow-hidden border-none shadow-2xl shadow-secondary-200/50 bg-white rounded-[40px] border border-secondary-50/50">
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
                            <div className="w-20 h-20 bg-rose-50 rounded-[32px] flex items-center justify-center">
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
                                    <TableRow className="bg-secondary-50/30 hover:bg-secondary-50/30 border-b border-secondary-100">
                                        <TableHead className="w-[340px] px-8 h-16 text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">Collaborateur</TableHead>
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">Affectation</TableHead>
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">Poste & Fonction</TableHead>
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">Ancienneté</TableHead>
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">État Civil</TableHead>
                                        <TableHead className="px-8 h-16 text-right text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {employees.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-64 text-center">
                                                <div className="flex flex-col items-center justify-center gap-4">
                                                    <div className="w-16 h-16 bg-secondary-50 rounded-full flex items-center justify-center">
                                                        <Search className="w-8 h-8 text-secondary-200" />
                                                    </div>
                                                    <p className="text-secondary-400 font-black uppercase text-[10px] tracking-widest italic">Aucun collaborateur trouvé pour ce critère.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        employees.map((emp) => {
                                            const statusInfo = getStatusLabel(emp.status);
                                            return (
                                                <TableRow key={emp.id} className="group hover:bg-secondary-50/40 transition-all border-b border-secondary-50">
                                                    <TableCell className="px-8 py-5">
                                                        <div className="flex items-center gap-5">
                                                            <div className="relative shrink-0">
                                                                <div className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-white to-secondary-50 border border-secondary-100 shadow-sm flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 duration-300">
                                                                    {avatarsMap[emp.id] ? (
                                                                        <img src={avatarsMap[emp.id]} alt="Avatar" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="text-base font-black text-secondary-400 uppercase tracking-tighter">
                                                                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className={cn(
                                                                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-white shadow-sm transition-transform duration-300 group-hover:scale-110",
                                                                    emp.status === STATUS.ACTIVE ? "bg-emerald-500 shadow-emerald-200" : 
                                                                    emp.status === STATUS.PROBATION ? "bg-blue-500 shadow-blue-200" :
                                                                    emp.status === STATUS.ON_LEAVE ? "bg-amber-500 shadow-amber-200" :
                                                                    emp.status === STATUS.SUSPENDED ? "bg-orange-500 shadow-orange-200" :
                                                                    emp.status === STATUS.TERMINATED ? "bg-rose-600 shadow-rose-200" :
                                                                    emp.status === STATUS.RETIRED ? "bg-purple-500 shadow-purple-200" :
                                                                    "bg-secondary-300 shadow-secondary-100"
                                                                )} />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <p className="font-black text-secondary-900 group-hover:text-primary-700 transition-colors uppercase truncate text-sm tracking-tight mb-0.5">
                                                                    {emp.firstName} {emp.lastName}
                                                                </p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-black text-primary-600 tracking-widest bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100/50">
                                                                        {emp.employeeNumber || emp.id.substring(0, 8)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-8">
                                                        <div className="flex flex-col">
                                                            <span className="text-[13px] font-black text-secondary-900 uppercase tracking-tight">
                                                                {departmentsMap[emp.department] || emp.department}
                                                            </span>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <div className="w-1 h-1 rounded-full bg-secondary-300" />
                                                                <span className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest">Unité ARCA</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-secondary-50 flex items-center justify-center border border-secondary-100/50 group-hover:bg-primary-50 group-hover:border-primary-100 transition-all">
                                                                <Briefcase className="w-3.5 h-3.5 text-primary-600" />
                                                            </div>
                                                            <span className="text-[13px] font-bold text-secondary-700 group-hover:text-secondary-900 transition-colors">
                                                                {positionsMap[emp.position] || emp.position}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-8">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-secondary-800 tabular-nums lowercase">
                                                                {emp.hireDate ? format(new Date(emp.hireDate), 'dd MMM yyyy', { locale: fr }) : '-'}
                                                            </span>
                                                            <span className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest mt-0.5">Entrée ARCA</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-8">
                                                        <Badge 
                                                            variant={statusInfo.variant} 
                                                            className={cn(
                                                                "font-black text-[9px] uppercase py-1.5 px-4 rounded-xl border shadow-sm",
                                                                emp.status === STATUS.ACTIVE ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                                emp.status === STATUS.PROBATION ? "bg-blue-50 text-blue-700 border-blue-100" :
                                                                emp.status === STATUS.ON_LEAVE ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                                emp.status === STATUS.SUSPENDED ? "bg-orange-50 text-orange-700 border-orange-100" :
                                                                emp.status === STATUS.TERMINATED ? "bg-rose-50 text-rose-700 border-rose-100" :
                                                                emp.status === STATUS.RETIRED ? "bg-purple-50 text-purple-700 border-purple-100" :
                                                                "bg-secondary-50 text-secondary-600 border-secondary-100"
                                                            )}
                                                        >
                                                            {statusInfo.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="px-8 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                            <Link href={`/employees/${emp.id}`}>
                                                                <Button variant="ghost" size="sm" className="h-10 px-4 text-primary-600 hover:bg-primary-50 rounded-xl transition-all gap-2 font-black uppercase text-[10px] tracking-widest border border-transparent hover:border-primary-100">
                                                                    <Eye className="w-4 h-4" />
                                                                    Dossier
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination Section */}
                            <div className="p-8 border-t border-secondary-100 bg-secondary-50/20 flex flex-col md:flex-row items-center justify-between gap-6">
                                <p className="text-[11px] text-secondary-400 font-black uppercase tracking-[0.15em]">
                                    Affichage de <span className="text-secondary-900 mx-1">{employees.length}</span> sur <span className="text-secondary-900 mx-1">{totalItems}</span> collaborateurs
                                </p>
                                
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-secondary-100 rounded-2xl shadow-sm">
                                        <span className="text-[10px] font-black uppercase text-secondary-400 tracking-widest">Page</span>
                                        <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center text-xs font-black shadow-md shadow-primary-100">
                                            {currentPage}
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-secondary-400 tracking-widest mx-1">/</span>
                                        <span className="text-xs font-black text-secondary-900">
                                            {Math.ceil(totalItems / itemsPerPage) || 1}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-10 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest border-secondary-200 hover:bg-white hover:border-primary-500 hover:text-primary-600 transition-all shadow-sm disabled:opacity-30"
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1 || isLoading}
                                        >
                                            Précédent
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-10 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest border-secondary-200 hover:bg-white hover:border-primary-500 hover:text-primary-600 transition-all shadow-sm disabled:opacity-30"
                                            onClick={() => setCurrentPage(prev => prev + 1)}
                                            disabled={currentPage >= Math.ceil(totalItems / itemsPerPage) || isLoading}
                                        >
                                            Suivant
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
