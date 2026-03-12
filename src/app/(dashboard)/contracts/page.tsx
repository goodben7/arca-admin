'use client';

import { useState, useEffect } from 'react';
import {
    FileText,
    Search,
    Filter,
    Plus,
    Download,
    Calendar,
    DollarSign,
    User,
    Loader2,
    AlertCircle,
    Eye,
    Edit2,
    MoreHorizontal,
    ChevronDown,
    X,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
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
import { getAllContracts } from '@/lib/api/contract';
import { getAllEmployees } from '@/lib/api/employee';
import { Contract } from '@/types/contract';
import { Employee } from '@/types/employee';

export default function ContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [employeeMap, setEmployeeMap] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    async function fetchData() {
        setIsLoading(true);
        setError(null);
        try {
            const params: any = {};
            if (typeFilter) params.type = typeFilter;
            if (statusFilter) params.status = statusFilter;

            const [contractsData, employeesData] = await Promise.all([
                getAllContracts(params),
                getAllEmployees({ itemsPerPage: 100 })
            ]);

            const contractsArray = Array.isArray(contractsData) ? contractsData : contractsData['hydra:member'] || [];
            const employeesArray = Array.isArray(employeesData) ? employeesData : employeesData['hydra:member'] || [];

            // Build employee map for quick lookup
            const map: Record<string, string> = {};
            employeesArray.forEach((emp: Employee) => {
                const fullName = `${emp.firstName} ${emp.lastName}`.trim();
                map[emp.id] = fullName;
                if (emp['@id']) {
                    map[emp['@id']] = fullName;
                }
            });

            setContracts(contractsArray);
            setEmployeeMap(map);
        } catch (err: any) {
            setError(err.message || 'Erreur lors du chargement des données.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, [typeFilter, statusFilter]);

    const getTypeStyles = (type: string) => {
        switch (type.toUpperCase()) {
            case 'CDI': return 'bg-primary-50 text-primary-700 border-primary-100';
            case 'CDD': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'INTERNSHIP': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'CONSULTANT': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            default: return 'bg-secondary-50 text-secondary-700 border-secondary-100';
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status.toUpperCase()) {
            case 'ACTIVE': return { label: 'Actif', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' };
            case 'PENDING': return { label: 'En attente', bg: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500' };
            case 'ENDED': return { label: 'Terminé', bg: 'bg-secondary-50 text-secondary-600 border-secondary-200', dot: 'bg-secondary-400' };
            case 'CANCELLED': return { label: 'Annulé', bg: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500' };
            default: return { label: status, bg: 'bg-secondary-50 text-secondary-600 border-secondary-200', dot: 'bg-secondary-400' };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900 uppercase tracking-tighter">Gestion des Contrats</h1>
                    <p className="text-secondary-500 font-medium italic">Suivi des types de contrats, dates de fin et rémunérations.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2 border-none bg-white shadow-sm font-bold uppercase tracking-wider text-[10px] px-6">
                        <Download className="w-4 h-4" />
                        Rapport Annuel
                    </Button>
                    <Link href="/contracts/create">
                        <Button className="gap-2 shadow-xl shadow-primary-200 py-6 rounded-2xl transition-all active:scale-[0.98]">
                            <Plus className="w-4 h-4" />
                            <span className="font-bold uppercase tracking-tighter">Nouveau Contrat</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Grid of Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <Card className="p-6 border-none shadow-xl shadow-secondary-200/40 relative overflow-hidden group hover:scale-[1.02] transition-all bg-white rounded-[32px]">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1">Total Contrats</p>
                        <h3 className="text-3xl font-black text-secondary-900 tabular-nums">
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-secondary-100" /> : contracts.length}
                        </h3>
                    </div>
                    <FileText className="absolute -right-4 -bottom-4 w-24 h-24 text-secondary-50 opacity-50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" />
                </Card>
                <Card className="p-6 border-none shadow-xl shadow-secondary-200/40 relative overflow-hidden group hover:scale-[1.02] transition-all bg-white rounded-[32px]">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1">CDI Actifs</p>
                        <h3 className="text-3xl font-black text-primary-600 tabular-nums">
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-secondary-100" /> : contracts.filter(c => c.type === 'CDI' && c.status === 'ACTIVE').length}
                        </h3>
                    </div>
                </Card>
                <Card className="p-6 border-none shadow-xl shadow-secondary-200/40 relative overflow-hidden group hover:scale-[1.02] transition-all bg-white rounded-[32px]">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1">En attente</p>
                        <h3 className="text-3xl font-black text-amber-600 tabular-nums">
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-secondary-100" /> : contracts.filter(c => c.status === 'PENDING').length}
                        </h3>
                    </div>
                </Card>
                <Card className="p-6 border-none shadow-xl shadow-secondary-200/40 relative overflow-hidden group hover:scale-[1.02] transition-all bg-white rounded-[32px]">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1">Masse Salariale</p>
                        <div className="flex items-baseline gap-1">
                            <h3 className="text-2xl font-black text-emerald-600 tabular-nums">
                                {isLoading ? '...' : contracts.filter(c => c.status === 'ACTIVE').reduce((acc, c) => acc + parseInt(c.salary || '0'), 0).toLocaleString()}
                            </h3>
                            <span className="text-[10px] font-bold text-secondary-400">CDF</span>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="overflow-hidden border-none shadow-xl shadow-secondary-200/50 animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-[40px]">
                <div className="p-6 bg-white flex flex-col lg:flex-row gap-4 justify-between items-center border-b border-secondary-50">
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        {/* Type Filter */}
                        <div className="relative">
                            <button
                                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                                className={cn(
                                    "h-10 px-4 flex items-center gap-3 bg-white border rounded-xl transition-all shadow-sm",
                                    isTypeDropdownOpen ? "border-primary-500 ring-4 ring-primary-500/5" : "border-secondary-100 hover:border-secondary-200",
                                    typeFilter ? "border-primary-200 bg-primary-50/10" : ""
                                )}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest text-secondary-600">
                                    {typeFilter || "Types de Contrat"}
                                </span>
                                <ChevronDown className={cn("w-3.5 h-3.5 text-secondary-400 transition-transform", isTypeDropdownOpen && "rotate-180")} />
                            </button>
                            {isTypeDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsTypeDropdownOpen(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-secondary-100 p-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                                        {['', 'CDI', 'CDD', 'INTERNSHIP', 'CONSULTANT'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => { setTypeFilter(t); setIsTypeDropdownOpen(false); }}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                                                    typeFilter === t ? "bg-primary-50 text-primary-700" : "hover:bg-secondary-50 text-secondary-500"
                                                )}
                                            >
                                                {t || "Tous les types"}
                                                {typeFilter === t && <Check className="w-3 h-3" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <button
                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                className={cn(
                                    "h-10 px-4 flex items-center gap-3 bg-white border rounded-xl transition-all shadow-sm",
                                    isStatusDropdownOpen ? "border-primary-500 ring-4 ring-primary-500/5" : "border-secondary-100 hover:border-secondary-200",
                                    statusFilter ? "border-primary-200 bg-primary-50/10" : ""
                                )}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest text-secondary-600">
                                    {statusFilter ? getStatusStyles(statusFilter).label : "Statuts"}
                                </span>
                                <ChevronDown className={cn("w-3.5 h-3.5 text-secondary-400 transition-transform", isStatusDropdownOpen && "rotate-180")} />
                            </button>
                            {isStatusDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-secondary-100 p-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                                        {['', 'PENDING', 'ACTIVE', 'ENDED', 'CANCELLED'].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => { setStatusFilter(s); setIsStatusDropdownOpen(false); }}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                                                    statusFilter === s ? "bg-primary-50 text-primary-700" : "hover:bg-secondary-50 text-secondary-500"
                                                )}
                                            >
                                                {s ? getStatusStyles(s).label : "Tous les statuts"}
                                                {statusFilter === s && <Check className="w-3 h-3" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        onClick={() => { setTypeFilter(''); setStatusFilter(''); }}
                        className="text-primary-600 font-bold uppercase text-[10px] tracking-widest hover:bg-primary-50"
                    >
                        Réinitialiser
                    </Button>
                </div>

                {isLoading ? (
                    <div className="h-96 flex flex-col items-center justify-center gap-4 text-secondary-300">
                        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
                        <p className="text-sm font-black uppercase tracking-[0.2em]">Chargement des contrats...</p>
                    </div>
                ) : error ? (
                    <div className="h-96 flex flex-col items-center justify-center gap-6 p-8">
                        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                            <AlertCircle className="w-10 h-10 text-destructive" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-secondary-900 mb-2">Erreur de connexion</h3>
                            <p className="text-secondary-500 font-medium max-w-md">{error}</p>
                        </div>
                        <Button onClick={fetchData} variant="outline" className="font-bold px-8">Réessayer</Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent uppercase tracking-wider text-[11px]">
                                <TableHead className="w-[300px]">Employé</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Date Début</TableHead>
                                <TableHead>Date Fin</TableHead>
                                <TableHead>Rémunération</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contracts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-secondary-400 font-medium italic">
                                        Aucun contrat enregistré dans le système.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                contracts.map((con) => (
                                    <TableRow key={con.id} className="group hover:bg-secondary-50/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                                                    <User className="w-5 h-5 text-secondary-400 group-hover:text-primary-600 transition-colors" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-secondary-900 uppercase tracking-tight">
                                                        {employeeMap[con.employee] || con.employee}
                                                    </span>
                                                    <span className="text-[10px] text-secondary-400 font-bold uppercase">{con.id}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("font-black border-none px-2.5 py-1 rounded-lg tracking-tighter uppercase text-[9px]", getTypeStyles(con.type))}>
                                                {con.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-black text-secondary-600 tabular-nums text-xs">
                                            {con.startDate ? format(new Date(con.startDate), 'dd MMM yyyy', { locale: fr }) : '-'}
                                        </TableCell>
                                        <TableCell className="font-bold text-secondary-400 tabular-nums text-xs italic">
                                            {con.endDate ? format(new Date(con.endDate), 'dd MMM yyyy', { locale: fr }) : 'Indéfini'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-black text-emerald-700 tabular-nums text-sm">
                                                    {parseInt(con.salary || '0').toLocaleString()}
                                                </span>
                                                <span className="text-[9px] font-black text-secondary-400 uppercase">CDF</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest", getStatusStyles(con.status).bg)}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", getStatusStyles(con.status).dot)} />
                                                {getStatusStyles(con.status).label}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4">
                                                <Link href={`/contracts/${con.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-secondary-400 hover:text-secondary-900 hover:bg-secondary-100 rounded-xl">
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-secondary-400 hover:text-destructive hover:bg-destructive/5 rounded-xl">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}
