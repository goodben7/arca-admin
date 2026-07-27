'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, FormEvent, useEffect, useMemo, useState } from 'react';
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
    Shield,
    Pencil,
    Save
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
import { getAllEmployees, getDepartments, updateDepartment } from '@/lib/api/employee';
import { Department, Employee } from '@/types/employee';
import { Input, Label } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/layout/FilterBar';
import { DataPanel } from '@/components/layout/DataPanel';
import { PageKpiStrip, PageInsightPanel } from '@/components/layout/PageKpi';

type DepartmentForm = {
    name: string;
    code: string;
    description: string;
    managerId: string;
};

function DepartmentDrawer({
    open,
    onClose,
    department,
    managerOptions,
    initialForm,
    onSubmit,
    isSubmitting,
    error
}: {
    open: boolean;
    onClose: () => void;
    department: Department | null;
    managerOptions: Array<{ value: string; label: string }>;
    initialForm: DepartmentForm;
    onSubmit: (payload: DepartmentForm) => Promise<void>;
    isSubmitting: boolean;
    error: string | null;
}) {
    const [form, setForm] = useState<DepartmentForm>(initialForm);

    useEffect(() => {
        if (open) setForm(initialForm);
    }, [open, initialForm]);

    async function handleFormSubmit(e: FormEvent) {
        e.preventDefault();
        await onSubmit(form);
    }

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-secondary-950/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-200"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-lg">
                                    <div className="h-full overflow-y-auto bg-white rounded-l-[32px] shadow-2xl border-l border-secondary-100">
                                        <div className="p-6 border-b border-secondary-100 flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <Dialog.Title className="text-lg font-black uppercase tracking-tight text-secondary-900">
                                                    Modifier le département
                                                </Dialog.Title>
                                                <p className="text-sm text-secondary-500 font-medium truncate mt-1">
                                                    {department?.name ?? ''}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={onClose}
                                                className="h-10 px-4 rounded-2xl"
                                            >
                                                Fermer
                                            </Button>
                                        </div>

                                        <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
                                            {error && (
                                                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
                                                    <p className="text-xs font-black uppercase tracking-widest text-destructive">
                                                        Erreur
                                                    </p>
                                                    <p className="text-sm font-medium text-secondary-700 mt-1">
                                                        {error}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">
                                                    Nom
                                                </Label>
                                                <Input
                                                    value={form.name}
                                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                                    required
                                                    className="h-12"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">
                                                        Code
                                                    </Label>
                                                    <Input
                                                        value={form.code}
                                                        onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
                                                        required
                                                        className="h-12"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">
                                                        Responsable
                                                    </Label>
                                                    <Select
                                                        value={form.managerId}
                                                        onChange={(e) => setForm(f => ({ ...f, managerId: e.target.value }))}
                                                        className="h-12"
                                                    >
                                                        <option value="">Aucun</option>
                                                        {managerOptions.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">
                                                    Description
                                                </Label>
                                                <Textarea
                                                    value={form.description}
                                                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                                                    className="min-h-[120px]"
                                                />
                                            </div>

                                            <div className="pt-2 flex items-center justify-end gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={onClose}
                                                    className="h-12 px-5 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                                                    disabled={isSubmitting}
                                                >
                                                    Annuler
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className={cn(
                                                        'h-12 px-5 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-2 shadow-sm',
                                                        'bg-primary-600 hover:bg-primary-700 text-white'
                                                    )}
                                                >
                                                    <Save className="w-4 h-4" />
                                                    {isSubmitting ? 'En cours...' : 'Enregistrer'}
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employeeMap, setEmployeeMap] = useState<Record<string, string>>({});
    const [deptCounts, setDeptCounts] = useState<Record<string, number>>({});
    const [managerOptions, setManagerOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const [drawerSubmitting, setDrawerSubmitting] = useState(false);
    const [drawerError, setDrawerError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const drawerInitialForm: DepartmentForm = useMemo(() => {
        return {
            name: selectedDepartment?.name ?? '',
            code: selectedDepartment?.code ?? '',
            description: selectedDepartment?.description ?? '',
            managerId: selectedDepartment?.managerId ?? ''
        };
    }, [selectedDepartment]);

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
            const optionsMap = new Map<string, string>();

            empsArray.forEach((emp: Employee) => {
                const fullName = `${emp.firstName} ${emp.lastName}`.trim();
                empMap[emp.id] = fullName;
                if (emp['@id']) {
                    empMap[emp['@id']] = fullName;
                }

                optionsMap.set(emp.id, fullName);
                if (emp['@id']) optionsMap.set(emp['@id'], fullName);

                // Count per department
                const deptId = emp.department; // assuming this is the ID or IRI
                if (deptId) {
                    counts[deptId] = (counts[deptId] || 0) + 1;
                }
            });

            setDepartments(deptsArray);
            setEmployeeMap(empMap);
            setDeptCounts(counts);
            setManagerOptions(Array.from(optionsMap.entries()).map(([value, label]) => ({ value, label })));
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

    const withManager = departments.filter(d => d.managerId).length;
    const filteredDepartments = departments.filter((dept) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const managerName = dept.managerId ? (employeeMap[dept.managerId] || '') : '';
        return (
            dept.name.toLowerCase().includes(q) ||
            (dept.code || '').toLowerCase().includes(q) ||
            managerName.toLowerCase().includes(q)
        );
    });

    if (isLoading) {
        return (
            <PageShell>
                <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary-100 rounded-full"></div>
                        <div className="w-16 h-16 border-4 border-primary-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                    </div>
                    <p className="font-black text-secondary-400 uppercase tracking-[0.3em] text-xs">Synchronisation structurelle...</p>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <DepartmentDrawer
                open={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedDepartment(null);
                    setDrawerError(null);
                }}
                department={selectedDepartment}
                managerOptions={managerOptions}
                initialForm={drawerInitialForm}
                isSubmitting={drawerSubmitting}
                error={drawerError}
                onSubmit={async (payload) => {
                    if (!selectedDepartment) return;
                    setDrawerSubmitting(true);
                    setDrawerError(null);
                    try {
                        const patch: Partial<Department> = {
                            name: payload.name,
                            code: payload.code,
                            description: payload.description,
                            managerId: payload.managerId
                        };

                        await updateDepartment(selectedDepartment.id, patch);
                        setDrawerOpen(false);
                        setSelectedDepartment(null);
                        await fetchData();
                    } catch (e: any) {
                        setDrawerError(e?.message || 'Erreur lors de la mise à jour du département.');
                    } finally {
                        setDrawerSubmitting(false);
                    }
                }}
            />

            <PageHeader
                title="Départements"
                description="Structure organisationnelle et gestion des pôles de compétences."
                actions={
                    <Link href="/m/personnel/departments/create">
                        <Button variant="pill" size="sm" className="gap-2">
                            <Plus className="w-4 h-4" />
                            Nouveau département
                        </Button>
                    </Link>
                }
            />

            {error ? (
                <div className="bg-destructive/10 border border-destructive/20 p-8 rounded-xl flex flex-col items-center gap-4 text-center">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                    <div>
                        <h3 className="text-lg font-bold text-secondary-900 uppercase">Erreur de chargement</h3>
                        <p className="text-secondary-600 font-medium">{error}</p>
                    </div>
                    <Button onClick={fetchData} variant="outline" className="font-bold px-8 mt-2">Réessayer</Button>
                </div>
            ) : (
                <>
                    <PageKpiStrip
                        items={[
                            { label: 'Départements', value: departments.length, icon: Building2, tone: 'primary', detail: 'Pôles organisationnels' },
                            { label: 'Effectifs actifs', value: totalEmployees, icon: Users, tone: 'success', detail: 'Collaborateurs rattachés' },
                            { label: 'Avec manager', value: withManager, icon: Shield, tone: 'info', detail: 'Pôles encadrés' },
                            { label: 'Sans manager', value: departments.length - withManager, icon: User, tone: 'warning', detail: 'À assigner' },
                        ]}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <PageInsightPanel
                            className="lg:col-span-2"
                            title="Répartition des effectifs"
                            description="Poids relatif par pôle organisationnel"
                            badge={
                                <Badge variant="default" className="bg-primary-500 text-white border-none">
                                    {totalEmployees} employés
                                </Badge>
                            }
                        >
                            <div className="space-y-5">
                                {departments.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-6">Aucune donnée départementale.</p>
                                ) : (
                                    departments.slice(0, 5).map((dept) => {
                                        const count = deptCounts[dept.id] || deptCounts[dept['@id'] || ''] || 0;
                                        const percentage = totalEmployees > 0 ? (count / totalEmployees) * 100 : 0;
                                        return (
                                            <div key={dept.id} className="space-y-2">
                                                <div className="flex justify-between items-end gap-4">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-muted-foreground">{dept.code || '—'}</p>
                                                        <p className="text-sm font-semibold text-foreground truncate">{dept.name}</p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-sm font-semibold text-primary-600">{Math.round(percentage)}%</p>
                                                        <p className="text-xs text-muted-foreground">{count} membre{count > 1 ? 's' : ''}</p>
                                                    </div>
                                                </div>
                                                <div className="h-2.5 bg-secondary-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-700"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </PageInsightPanel>

                        <PageInsightPanel
                            title="Gouvernance"
                            description="Responsables des pôles"
                        >
                            <div className="space-y-3">
                                {recentManagers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-4">Structure managériale en cours de définition.</p>
                                ) : (
                                    recentManagers.map((dept) => {
                                        const managerName = employeeMap[dept.managerId!] || 'N/A';
                                        const initials = managerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                                        return (
                                            <div key={dept.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                                                <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
                                                    {initials}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-foreground truncate">{managerName}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{dept.name}</p>
                                                </div>
                                                <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </PageInsightPanel>
                    </div>

                    <FilterBar>
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Rechercher un pôle, un manager ou un code..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-secondary-400"
                            />
                        </div>
                    </FilterBar>

                    <DataPanel title="Liste des départements" contentClassName="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-secondary-100">
                                    <TableHead className="px-6">Structure</TableHead>
                                    <TableHead className="px-6">Responsable</TableHead>
                                    <TableHead className="px-6">Effectif</TableHead>
                                    <TableHead className="px-6 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDepartments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                                            Aucun département trouvé.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredDepartments.map((dept) => {
                                        const managerName = dept.managerId ? (employeeMap[dept.managerId] || 'Non assigné') : 'Non défini';
                                        const count = deptCounts[dept.id] || deptCounts[dept['@id'] || ''] || 0;
                                        const initials = managerName !== 'Non défini' ? managerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

                                        return (
                                            <TableRow key={dept.id} className="group">
                                                <TableCell className="px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 bg-secondary-100 border border-secondary-200 rounded-xl flex items-center justify-center shrink-0">
                                                            <Building2 className="w-5 h-5 text-primary-500" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-secondary-900">{dept.name}</p>
                                                            <p className="text-xs font-medium text-primary-600">{dept.code || '—'}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-[10px] font-bold text-primary-700 uppercase">
                                                            {initials}
                                                        </div>
                                                        <span className="text-sm text-secondary-700">{managerName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <span className="font-medium tabular-nums text-foreground">{count}</span>
                                                    <span className="text-xs text-muted-foreground ml-1">membre{count > 1 ? 's' : ''}</span>
                                                </TableCell>
                                                <TableCell className="px-6 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 gap-1.5 text-primary-500 hover:bg-primary-50"
                                                        onClick={() => {
                                                            setSelectedDepartment(dept);
                                                            setDrawerError(null);
                                                            setDrawerOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="w-4 h-4" /> Modifier
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                        <div className="p-6 border-t border-primary-100/40 table-footer-wash">
                            <p className="text-sm text-secondary-600">
                                <span className="font-semibold text-secondary-900">{filteredDepartments.length}</span> département{filteredDepartments.length > 1 ? 's' : ''}
                            </p>
                        </div>
                    </DataPanel>
                </>
            )}
        </PageShell>
    );
}
