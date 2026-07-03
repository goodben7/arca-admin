'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import Link from 'next/link';
import { Plus, Loader2, AlertCircle, BarChart3, Eye, X, Clock, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { getEvaluationCycles, createEvaluationCycle } from '@/lib/api/performance';
import { EvaluationCycle, EVALUATION_CYCLE_STATUS, EVALUATION_CYCLE_STATUS_LABELS, EvaluationCycleStatus } from '@/types/performance';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function statusVariant(s: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    switch (s) {
        case EVALUATION_CYCLE_STATUS.OPEN: return 'success';
        case EVALUATION_CYCLE_STATUS.CLOSED: return 'secondary';
        default: return 'default';
    }
}

export default function EvaluationCyclesPage() {
    const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', startDate: '', endDate: '' });

    const load = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setCycles(await getEvaluationCycles());
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const stats = useMemo(() => ({
        total: cycles.length,
        open: cycles.filter(c => c.status === EVALUATION_CYCLE_STATUS.OPEN).length,
        closed: cycles.filter(c => c.status === EVALUATION_CYCLE_STATUS.CLOSED).length,
        draft: cycles.filter(c => c.status === EVALUATION_CYCLE_STATUS.DRAFT).length,
    }), [cycles]);

    const handleCreate = async () => {
        if (!form.name.trim()) return toast.error('Le nom est obligatoire.');
        try {
            setCreating(true);
            await createEvaluationCycle({ name: form.name, description: form.description || undefined, startDate: form.startDate || undefined, endDate: form.endDate || undefined });
            toast.success('Cycle créé.');
            setIsModalOpen(false);
            setForm({ name: '', description: '', startDate: '', endDate: '' });
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
                title="Cycles d'évaluation"
                description="Gestion des campagnes d'évaluation de performance."
                actions={
                    <Button variant="pill" size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4" />Nouveau cycle
                    </Button>
                }
            />

            <PageKpiStrip items={[
                { label: 'Total cycles', value: stats.total, icon: BarChart3, tone: 'primary', detail: 'Cycles créés' },
                { label: 'Ouverts', value: stats.open, icon: CheckCircle2, tone: 'success', detail: 'Campagnes actives' },
                { label: 'Brouillons', value: stats.draft, icon: FileText, tone: 'info', detail: 'En préparation' },
                { label: 'Clôturés', value: stats.closed, icon: Clock, tone: 'warning', detail: 'Campagnes terminées' },
            ]} />

            <DataPanel title="Cycles d'évaluation" description={`${cycles.length} cycle(s)`} contentClassName="p-0">
                {isLoading ? (
                    <div className="p-32 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-rose-500" /><p>{error}</p></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6">Nom</TableHead>
                                <TableHead className="px-6">Statut</TableHead>
                                <TableHead className="px-6">Début</TableHead>
                                <TableHead className="px-6">Fin</TableHead>
                                <TableHead className="px-6 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cycles.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">Aucun cycle d'évaluation.</TableCell></TableRow>
                            ) : cycles.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell className="px-6 font-semibold">{c.name}</TableCell>
                                    <TableCell className="px-6"><Badge variant={statusVariant(c.status as string)}>{EVALUATION_CYCLE_STATUS_LABELS[c.status as EvaluationCycleStatus] || c.status}</Badge></TableCell>
                                    <TableCell className="px-6 text-secondary-500 tabular-nums">{c.startDate ? format(new Date(c.startDate), 'dd MMM yyyy', { locale: fr }) : '—'}</TableCell>
                                    <TableCell className="px-6 text-secondary-500 tabular-nums">{c.endDate ? format(new Date(c.endDate), 'dd MMM yyyy', { locale: fr }) : '—'}</TableCell>
                                    <TableCell className="px-6 text-right">
                                        <Link href={`/evaluation-cycles/${c.id}`}>
                                            <Button variant="ghost" size="sm" className="gap-1.5 text-primary-500 hover:bg-primary-50">
                                                <Eye className="w-4 h-4" />Voir
                                            </Button>
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
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">Nouveau cycle d'évaluation</Dialog.Title>
                                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Nom <span className="text-rose-500">*</span></label>
                                        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="Ex: Évaluation S1 2026" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Date début</label>
                                            <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Date fin</label>
                                            <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                                        </div>
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
