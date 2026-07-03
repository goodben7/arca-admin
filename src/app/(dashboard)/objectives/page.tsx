'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { Plus, Loader2, AlertCircle, Target, CheckCircle2, XCircle, PlayCircle, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { FilterBar } from '@/components/layout/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { getObjectives, createObjective, activateObjective, completeObjective, cancelObjective } from '@/lib/api/performance';
import { toIri } from '@/lib/api-iri';
import { getAllEmployees } from '@/lib/api/employee';
import { Objective, OBJECTIVE_STATUS, OBJECTIVE_STATUS_LABELS, ObjectiveStatus } from '@/types/performance';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function statusVariant(s: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    switch (s) {
        case OBJECTIVE_STATUS.ACTIVE: return 'warning';
        case OBJECTIVE_STATUS.COMPLETED: return 'success';
        case OBJECTIVE_STATUS.CANCELLED: return 'destructive';
        default: return 'secondary';
    }
}

export default function ObjectivesPage() {
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [acting, setActing] = useState<string | null>(null);
    const [form, setForm] = useState({ employee: '', title: '', description: '', dueDate: '' });

    const load = async () => {
        try {
            setIsLoading(true);
            const [o, emps] = await Promise.all([getObjectives(), getAllEmployees({ itemsPerPage: 500 }).catch(() => [])]);
            setObjectives(o);
            const arr = Array.isArray(emps) ? emps : (emps as any)['hydra:member'] || [];
            setEmployees(arr);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const empName = (id: string) => {
        const e = employees.find((x: any) => x.id === id || x['@id'] === id);
        return e ? `${e.firstName} ${e.lastName}` : id;
    };

    const stats = useMemo(() => ({
        total: objectives.length,
        active: objectives.filter(o => o.status === OBJECTIVE_STATUS.ACTIVE).length,
        completed: objectives.filter(o => o.status === OBJECTIVE_STATUS.COMPLETED).length,
        draft: objectives.filter(o => o.status === OBJECTIVE_STATUS.DRAFT).length,
    }), [objectives]);

    const filtered = useMemo(() => {
        if (!search.trim()) return objectives;
        const q = search.toLowerCase();
        return objectives.filter(o => o.title.toLowerCase().includes(q) || empName(o.employee).toLowerCase().includes(q));
    }, [objectives, search, employees]);

    const handleAction = async (obj: Objective, action: 'activate' | 'complete' | 'cancel') => {
        try {
            setActing(obj.id + action);
            if (action === 'activate') await activateObjective(obj.id);
            else if (action === 'complete') await completeObjective(obj.id);
            else await cancelObjective(obj.id);
            toast.success('Objectif mis à jour.');
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setActing(null);
        }
    };

    const handleCreate = async () => {
        if (!form.employee || !form.title.trim()) return toast.error('Employé et titre obligatoires.');
        try {
            setCreating(true);
            await createObjective({ employee: toIri('employees', form.employee)!, title: form.title, description: form.description || undefined, dueDate: form.dueDate || undefined });
            toast.success('Objectif créé.');
            setIsModalOpen(false);
            setForm({ employee: '', title: '', description: '', dueDate: '' });
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
                title="Objectifs"
                description="Suivi des objectifs individuels par collaborateur."
                actions={
                    <Button variant="pill" size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4" />Nouvel objectif
                    </Button>
                }
            />

            <PageKpiStrip items={[
                { label: 'Total', value: stats.total, icon: Target, tone: 'primary', detail: 'Objectifs créés' },
                { label: 'Actifs', value: stats.active, icon: PlayCircle, tone: 'warning', detail: 'En cours' },
                { label: 'Atteints', value: stats.completed, icon: CheckCircle2, tone: 'success', detail: 'Objectifs réalisés' },
                { label: 'Brouillons', value: stats.draft, icon: Target, tone: 'info', detail: 'À activer' },
            ]} />

            <FilterBar>
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par titre ou employé..." className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                </div>
            </FilterBar>

            <DataPanel title="Objectifs" description={`${filtered.length} objectif(s)`} contentClassName="p-0">
                {isLoading ? (
                    <div className="p-32 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-rose-500" /><p>{error}</p></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6">Titre</TableHead>
                                <TableHead className="px-6">Employé</TableHead>
                                <TableHead className="px-6">Statut</TableHead>
                                <TableHead className="px-6">Échéance</TableHead>
                                <TableHead className="px-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">Aucun objectif.</TableCell></TableRow>
                            ) : filtered.map(o => (
                                <TableRow key={o.id}>
                                    <TableCell className="px-6 font-semibold">{o.title}</TableCell>
                                    <TableCell className="px-6 text-secondary-600">{empName(o.employee)}</TableCell>
                                    <TableCell className="px-6"><Badge variant={statusVariant(o.status as string)}>{OBJECTIVE_STATUS_LABELS[o.status as ObjectiveStatus] || o.status}</Badge></TableCell>
                                    <TableCell className="px-6 text-secondary-500 tabular-nums">{o.dueDate ? format(new Date(o.dueDate), 'dd MMM yyyy', { locale: fr }) : '—'}</TableCell>
                                    <TableCell className="px-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            {o.status === OBJECTIVE_STATUS.DRAFT && (
                                                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => handleAction(o, 'activate')} disabled={!!acting}>
                                                    {acting === o.id + 'activate' ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}Activer
                                                </Button>
                                            )}
                                            {o.status === OBJECTIVE_STATUS.ACTIVE && (
                                                <>
                                                    <Button size="sm" variant="outline" className="gap-1 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleAction(o, 'complete')} disabled={!!acting}>
                                                        {acting === o.id + 'complete' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}Atteint
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="gap-1 text-xs text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => handleAction(o, 'cancel')} disabled={!!acting}>
                                                        {acting === o.id + 'cancel' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}Annuler
                                                    </Button>
                                                </>
                                            )}
                                        </div>
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
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">Nouvel objectif</Dialog.Title>
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
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Titre <span className="text-rose-500">*</span></label>
                                        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="Ex: Augmenter le CA de 20%" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Date d'échéance</label>
                                        <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Description</label>
                                        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" />
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
