'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import Link from 'next/link';
import { Plus, Loader2, AlertCircle, TrendingUp, Eye, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { FilterBar } from '@/components/layout/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { getCareerPlans, createCareerPlan } from '@/lib/api/careerPlan';
import { resolveRelationLabel } from '@/lib/api-iri';
import { getAllEmployees } from '@/lib/api/employee';
import { getJobRoles, getGrades } from '@/lib/api/jobArchitecture';
import { CareerPlan } from '@/types/careerPlan';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function CareerPlansPage() {
    const [plans, setPlans] = useState<CareerPlan[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [grades, setGrades] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ employee: '', targetJobRole: '', targetGrade: '', targetDate: '', notes: '' });

    const load = async () => {
        try {
            setIsLoading(true);
            const [p, emps, r, g] = await Promise.all([getCareerPlans(), getAllEmployees({ itemsPerPage: 500 }).catch(() => []), getJobRoles().catch(() => []), getGrades().catch(() => [])]);
            setPlans(p);
            const arr = Array.isArray(emps) ? emps : (emps as any)['hydra:member'] || [];
            setEmployees(arr);
            setRoles(r);
            setGrades(g);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const empName = (id: string) => { const e = employees.find((x: any) => x.id === id || x['@id'] === id); return e ? `${e.firstName} ${e.lastName}` : id; };
    const roleName = (val?: unknown) => resolveRelationLabel(val, roles);
    const gradeName = (val?: unknown) => resolveRelationLabel(val, grades);

    const filtered = useMemo(() => {
        if (!search.trim()) return plans;
        const q = search.toLowerCase();
        return plans.filter(p => empName(p.employee).toLowerCase().includes(q));
    }, [plans, search, employees]);

    const handleCreate = async () => {
        if (!form.employee) return toast.error('Employé obligatoire.');
        if (!form.targetJobRole) return toast.error('Le métier cible est obligatoire.');
        try {
            setCreating(true);
            await createCareerPlan({
                employee: form.employee,
                targetJobRoleId: form.targetJobRole,
                targetGradeId: form.targetGrade || undefined,
                targetDate: form.targetDate || undefined,
                notes: form.notes || undefined,
            });
            toast.success('Plan de carrière créé.');
            setIsModalOpen(false);
            setForm({ employee: '', targetJobRole: '', targetGrade: '', targetDate: '', notes: '' });
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <PageShell>
            <PageHeader
                title="Plans de carrière"
                description="Suivi des évolutions professionnelles planifiées."
                actions={
                    <Button variant="pill" size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4" />Nouveau plan
                    </Button>
                }
            />

            <PageKpiStrip items={[
                { label: 'Total plans', value: plans.length, icon: TrendingUp, tone: 'primary', detail: 'Plans actifs' },
            ]} />

            <FilterBar>
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par employé..." className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                </div>
            </FilterBar>

            <DataPanel title="Plans de carrière" description={`${filtered.length} plan(s)`} contentClassName="p-0">
                {isLoading ? (
                    <div className="p-32 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-rose-500" /><p>{error}</p></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6">Employé</TableHead>
                                <TableHead className="px-6">Métier cible</TableHead>
                                <TableHead className="px-6">Grade cible</TableHead>
                                <TableHead className="px-6">Date cible</TableHead>
                                <TableHead className="px-6 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">Aucun plan de carrière.</TableCell></TableRow>
                            ) : filtered.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="px-6 font-semibold">{empName(p.employee)}</TableCell>
                                    <TableCell className="px-6 text-secondary-600">{roleName(p.targetJobRole || p.targetJobRoleId)}</TableCell>
                                    <TableCell className="px-6 text-secondary-600">{gradeName(p.targetGrade || p.targetGradeId)}</TableCell>
                                    <TableCell className="px-6 text-secondary-500 tabular-nums">{p.targetDate ? format(new Date(p.targetDate), 'dd MMM yyyy', { locale: fr }) : '—'}</TableCell>
                                    <TableCell className="px-6 text-right">
                                        <Link href={`/m/performance/career-plans/${p.id}`}>
                                            <Button variant="ghost" size="sm" className="gap-1.5 text-primary-500 hover:bg-primary-50"><Eye className="w-4 h-4" />Voir</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DataPanel>

            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="bg-white rounded-2xl shadow-float w-full max-w-md p-6 space-y-5">
                                <div className="flex items-center justify-between">
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">Nouveau plan de carrière</Dialog.Title>
                                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Employé <span className="text-rose-500">*</span></label>
                                        <select value={form.employee} onChange={e => setForm(p => ({ ...p, employee: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
                                            <option value="">Sélectionner</option>
                                            {employees.map((e: any) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Métier cible <span className="text-rose-500">*</span></label>
                                        <select value={form.targetJobRole} onChange={e => setForm(p => ({ ...p, targetJobRole: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
                                            <option value="">Sélectionner</option>
                                            {roles.map((r: any) => <option key={r.id} value={r.id}>{r.title}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Grade cible</label>
                                        <select value={form.targetGrade} onChange={e => setForm(p => ({ ...p, targetGrade: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
                                            <option value="">Sélectionner</option>
                                            {grades.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Date cible</label>
                                        <input type="date" value={form.targetDate} onChange={e => setForm(p => ({ ...p, targetDate: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Notes</label>
                                        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                                    <Button variant="pill" onClick={handleCreate} disabled={creating}>
                                        {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Créer
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </PageShell>
    );
}
