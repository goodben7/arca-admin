'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { Plus, Loader2, AlertCircle, Network, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { FilterBar } from '@/components/layout/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { getSuccessionPlans, createSuccessionPlan } from '@/lib/api/succession';
import { resolveRelationLabel } from '@/lib/api-iri';
import { getAllEmployees } from '@/lib/api/employee';
import { getJobRoles } from '@/lib/api/jobArchitecture';
import { SuccessionPlan, READINESS_LEVEL, READINESS_LEVEL_LABELS, ReadinessLevel } from '@/types/succession';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from '@/lib/toast';

function readinessBadgeVariant(r: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    switch (r) {
        case READINESS_LEVEL.READY_NOW: return 'success';
        case READINESS_LEVEL.WITHIN_1_YEAR: return 'warning';
        case READINESS_LEVEL.WITHIN_2_YEARS: return 'default';
        case READINESS_LEVEL.NOT_READY: return 'destructive';
        default: return 'secondary';
    }
}

export default function SuccessionPlansPage() {
    const [plans, setPlans] = useState<SuccessionPlan[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ criticalJobRole: '', candidate: '', readinessLevel: '', notes: '' });

    const load = async () => {
        try {
            setIsLoading(true);
            const [p, emps, r] = await Promise.all([getSuccessionPlans(), getAllEmployees({ itemsPerPage: 500 }).catch(() => []), getJobRoles().catch(() => [])]);
            setPlans(p);
            const arr = Array.isArray(emps) ? emps : (emps as any)['hydra:member'] || [];
            setEmployees(arr);
            setRoles(r);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const empName = (id: string) => { const e = employees.find((x: any) => x.id === id || x['@id'] === id); return e ? `${e.firstName} ${e.lastName}` : id; };
    const roleName = (val: unknown) => resolveRelationLabel(val, roles);

    const filtered = useMemo(() => {
        if (!search.trim()) return plans;
        const q = search.toLowerCase();
        return plans.filter(p => empName(p.candidate).toLowerCase().includes(q) || roleName(p.criticalJobRole).toLowerCase().includes(q));
    }, [plans, search, employees, roles]);

    const handleCreate = async () => {
        if (!form.criticalJobRole || !form.candidate || !form.readinessLevel) return toast.error('Tous les champs sont obligatoires.');
        try {
            setCreating(true);
            await createSuccessionPlan({
                criticalJobRoleId: form.criticalJobRole,
                candidate: form.candidate,
                readinessLevel: form.readinessLevel,
                notes: form.notes || undefined,
            });
            toast.success('Plan de succession créé.');
            setIsModalOpen(false);
            setForm({ criticalJobRole: '', candidate: '', readinessLevel: '', notes: '' });
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
                title="Plans de succession"
                description="Identification et préparation des successeurs pour les postes critiques."
                actions={
                    <Button variant="pill" size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4" />Nouveau plan
                    </Button>
                }
            />

            <PageKpiStrip items={[
                { label: 'Total plans', value: plans.length, icon: Network, tone: 'primary', detail: 'Plans de succession' },
                { label: 'Prêts maintenant', value: plans.filter(p => p.readinessLevel === READINESS_LEVEL.READY_NOW).length, icon: Network, tone: 'success', detail: 'Successeurs disponibles' },
            ]} />

            <FilterBar>
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par candidat ou poste..." className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                </div>
            </FilterBar>

            <DataPanel title="Plans de succession" description={`${filtered.length} plan(s)`} contentClassName="p-0">
                {isLoading ? (
                    <div className="p-32 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-rose-500" /><p>{error}</p></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6">Poste critique</TableHead>
                                <TableHead className="px-6">Candidat successeur</TableHead>
                                <TableHead className="px-6">Niveau de préparation</TableHead>
                                <TableHead className="px-6">Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="h-48 text-center text-muted-foreground">Aucun plan de succession.</TableCell></TableRow>
                            ) : filtered.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="px-6 font-semibold text-primary-700">{roleName(p.criticalJobRole)}</TableCell>
                                    <TableCell className="px-6 font-semibold">{empName(p.candidate)}</TableCell>
                                    <TableCell className="px-6">
                                        <Badge variant={readinessBadgeVariant(p.readinessLevel as string)}>
                                            {READINESS_LEVEL_LABELS[p.readinessLevel as ReadinessLevel] || p.readinessLevel}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-6 text-secondary-500 max-w-xs truncate">{p.notes || '—'}</TableCell>
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
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">Nouveau plan de succession</Dialog.Title>
                                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Poste critique <span className="text-rose-500">*</span></label>
                                        <select value={form.criticalJobRole} onChange={e => setForm(p => ({ ...p, criticalJobRole: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
                                            <option value="">Sélectionner</option>
                                            {roles.map((r: { id: string; title: string }) => <option key={r.id} value={r.id}>{r.title}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Candidat successeur <span className="text-rose-500">*</span></label>
                                        <select value={form.candidate} onChange={e => setForm(p => ({ ...p, candidate: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
                                            <option value="">Sélectionner</option>
                                            {employees.map((e: { id: string; firstName: string; lastName: string }) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Niveau de préparation <span className="text-rose-500">*</span></label>
                                        <select value={form.readinessLevel} onChange={e => setForm(p => ({ ...p, readinessLevel: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
                                            <option value="">Sélectionner</option>
                                            {Object.entries(READINESS_LEVEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                        </select>
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
