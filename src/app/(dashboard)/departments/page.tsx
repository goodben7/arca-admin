'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Building2,
    Users,
    User,
    Plus,
    Search,
    MoreVertical,
    ArrowUpRight,
    Loader2,
    AlertCircle,
    FileText,
    TrendingUp,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/Table';
import { getDepartments, getAllEmployees } from '@/lib/api/employee';
import { Department, Employee } from '@/types/employee';

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employeeMap, setEmployeeMap] = useState<Record<string, string>>({});
    const [deptCounts, setDeptCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchData() {
        setIsLoading(true);
        setError(null);
        try {
            const [deptsData, empsData] = await Promise.all([
                getDepartments(),
                getAllEmployees()
            ]);

            const deptsArray = Array.isArray(deptsData) ? deptsData : deptsData['hydra:member'] || [];
            const empsArray = Array.isArray(empsData) ? empsData : empsData['hydra:member'] || [];

            // Build manager map and count employees per dept
            const empMap: Record<string, string> = {};
            const counts: Record<string, number> = {};

            empsArray.forEach((emp: Employee) => {
                const fullName = `${emp.firstName} ${emp.lastName}`.trim();
                empMap[emp.id] = fullName;
                if (emp['@id']) {
                    empMap[emp['@id']] = fullName;
                }

                // Count per department
                const deptId = emp.department; // assuming this is the ID or IRI
                if (deptId) {
                    counts[deptId] = (counts[deptId] || 0) + 1;
                }
            });

            setDepartments(deptsArray);
            setEmployeeMap(empMap);
            setDeptCounts(counts);
        } catch (err: any) {
            setError(err.message || 'Erreur lors du chargement des départements.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const totalEmployees = Object.values(deptCounts).reduce((acc, curr) => acc + curr, 0);

    // Get a few managers for the governance card
    const recentManagers = departments
        .filter(d => d.managerId && employeeMap[d.managerId])
        .slice(0, 2);

    if (isLoading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary-100 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-primary-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="font-black text-secondary-400 uppercase tracking-[0.3em] text-xs">Synchronisation structurelle...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-secondary-900 uppercase tracking-tighter">Départements</h1>
                    <p className="text-secondary-500 font-medium italic">Structure organisationnelle et gestion des pôles de compétences.</p>
                </div>
                <Link href="/departments/create">
                    <Button className="gap-2 shadow-xl shadow-primary-200 py-6 px-8 rounded-2xl transition-all active:scale-[0.98]">
                        <Plus className="w-5 h-5" />
                        <span className="font-bold uppercase tracking-tight">Nouveau Département</span>
                    </Button>
                </Link>
            </div>

            {error ? (
                <div className="bg-destructive/10 border border-destructive/20 p-8 rounded-3xl flex flex-col items-center gap-4 text-center">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                    <div>
                        <h3 className="text-lg font-bold text-secondary-900 uppercase">Erreur de chargement</h3>
                        <p className="text-secondary-600 font-medium">{error}</p>
                    </div>
                    <Button onClick={fetchData} variant="outline" className="font-bold px-8 mt-2">Réessayer</Button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        {/* Featured Departments Stats */}
                        <Card className="lg:col-span-2 border-none shadow-xl shadow-secondary-200/50 overflow-hidden bg-white">
                            <CardHeader className="bg-secondary-50/30 border-b border-secondary-100/50 flex flex-row items-center justify-between p-6">
                                <div>
                                    <CardTitle className="text-secondary-900 font-black uppercase tracking-tight">Répartition des Effectifs</CardTitle>
                                    <CardDescription className="font-medium italic">Poids relatif par pôle organisationnel</CardDescription>
                                </div>
                                <Badge className="font-black bg-primary-600 text-white border-none py-1.5 px-3 rounded-lg text-[10px] tracking-widest">
                                    {totalEmployees} EMPLOYÉS ACTIFS
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="space-y-6">
                                    {departments.length === 0 ? (
                                        <p className="text-center text-secondary-400 py-10 italic">Aucune donnée départementale.</p>
                                    ) : (
                                        departments.slice(0, 4).map((dept) => {
                                            const count = deptCounts[dept.id] || deptCounts[dept['@id'] || ''] || 0;
                                            const percentage = totalEmployees > 0 ? (count / totalEmployees) * 100 : 0;
                                            return (
                                                <div key={dept.id} className="space-y-2 group">
                                                    <div className="flex justify-between items-end">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-secondary-400 uppercase tracking-widest mb-0.5">{dept.code}</span>
                                                            <span className="text-sm font-bold text-secondary-900 group-hover:text-primary-600 transition-colors uppercase">{dept.name}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xs font-black text-primary-600 transition-all">{Math.round(percentage)}%</span>
                                                            <span className="text-[10px] font-bold text-secondary-400 uppercase">{count} membres</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-secondary-50 h-3 rounded-full overflow-hidden border border-secondary-100/50">
                                                        <div
                                                            className="bg-gradient-to-r from-primary-500 to-primary-700 h-full rounded-full transition-all duration-1000 shadow-sm"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl shadow-secondary-200/50 bg-gradient-to-br from-secondary-900 to-black text-white p-2">
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-1">
                                    <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center mb-4">
                                        <Shield className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter">Gouvernance</h3>
                                    <p className="text-secondary-400 text-xs font-medium italic">Validation des piliers structurels</p>
                                </div>
                                <div className="space-y-3">
                                    {recentManagers.length === 0 ? (
                                        <p className="text-xs text-secondary-500 italic py-4">Structure managériale en cours de définition.</p>
                                    ) : (
                                        recentManagers.map((dept) => {
                                            const managerName = employeeMap[dept.managerId!] || 'N/A';
                                            const initials = managerName.split(' ').map(n => n[0]).join('').toUpperCase();
                                            return (
                                                <div key={dept.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group">
                                                    <div className="w-12 h-12 rounded-xl bg-primary-600/20 text-primary-400 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                                                        {initials}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-sm font-black truncate">{managerName}</p>
                                                        <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-primary-500/80">Manage {dept.name}</p>
                                                    </div>
                                                    <ArrowUpRight className="w-4 h-4 ml-auto text-secondary-500" />
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                <Button variant="ghost" className="w-full text-white hover:bg-white/10 border-white/10 font-bold uppercase tracking-widest text-[10px] mt-2 transition-all" size="sm">
                                    Organigramme Dynamique
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="overflow-hidden border-none shadow-xl shadow-secondary-200/50 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="p-6 bg-white flex flex-col md:flex-row gap-6 justify-between items-center">
                            <div className="relative w-full md:w-96 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-secondary-300 group-focus-within:text-primary-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Indexer un pôle, un manager ou un code..."
                                    className="w-full pl-12 pr-4 py-3.5 bg-secondary-50 border-none rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all font-bold placeholder:text-secondary-300"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="gap-2 border-secondary-100 text-secondary-600 font-bold px-6 py-5 rounded-xl">
                                    <TrendingUp className="w-4 h-4" />
                                    Métriques
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-secondary-50/50">
                                    <TableRow className="hover:bg-transparent border-y border-secondary-100/50">
                                        <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest pl-8">Structure & Code</TableHead>
                                        <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest">Responsable (Manager)</TableHead>
                                        <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest">Effectif</TableHead>
                                        <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest">Secteur</TableHead>
                                        <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-right pr-8 px-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {departments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-64 text-center">
                                                <div className="flex flex-col items-center gap-2 opacity-50">
                                                    <Building2 className="w-12 h-12 text-secondary-200" />
                                                    <p className="text-secondary-400 font-bold uppercase tracking-widest text-xs italic">Néant structurel</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        departments.map((dept) => {
                                            const managerName = dept.managerId ? (employeeMap[dept.managerId] || "Manager Non Assigné") : "Responsable Non Défini";
                                            const count = deptCounts[dept.id] || deptCounts[dept['@id'] || ''] || 0;
                                            const initials = managerName !== "N/A" ? managerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "?";

                                            return (
                                                <TableRow key={dept.id} className="group hover:bg-secondary-50/50 transition-colors">
                                                    <TableCell className="pl-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-secondary-100 rounded-2xl flex items-center justify-center group-hover:bg-primary-50 transition-colors relative overflow-hidden">
                                                                <Building2 className="w-6 h-6 text-secondary-400 group-hover:text-primary-600 transition-colors" />
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-secondary-900 uppercase tracking-tighter text-sm">{dept.name}</p>
                                                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">{dept.code || 'NO-CODE'}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center text-[10px] font-black text-primary-700 shadow-sm uppercase">
                                                                {initials}
                                                            </div>
                                                            <span className="text-xs font-bold text-secondary-700 uppercase tracking-tight">{managerName}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="p-1.5 bg-secondary-100 rounded-lg">
                                                                <Users className="w-3.5 h-3.5 text-secondary-500" />
                                                            </div>
                                                            <span className="font-black tabular-nums text-secondary-900">{count}</span>
                                                            <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-wider">Membres</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-[9px] font-black px-2.5 py-1 uppercase tracking-widest border-secondary-200">
                                                            Pôle Expert
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-8 px-6">
                                                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-all gap-1 translate-x-4 group-hover:translate-x-0 transform">
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl">
                                                                <ArrowUpRight className="w-4 h-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-secondary-400 hover:text-secondary-900 hover:bg-secondary-100 rounded-xl">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}
