'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import Link from 'next/link';
import { Plus, Loader2, AlertCircle, LogOut, Eye, Search, Clock, CheckCircle2, XCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { FilterBar } from '@/components/layout/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { getExitProcesses, createExitProcess } from '@/lib/api/offboarding';
import { getAllEmployees } from '@/lib/api/employee';
import { ExitProcess, EXIT_PROCESS_STATUS, EXIT_PROCESS_STATUS_LABELS, ExitProcessStatus, EXIT_REASON_LABELS, ExitReason } from '@/types/offboarding';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function statusVariant(s: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    switch (s) {
        case EXIT_PROCESS_STATUS.IN_PROGRESS: return 'warning';
        case EXIT_PROCESS_STATUS.COMPLETED: return 'success';
        case EXIT_PROCESS_STATUS.CANCELLED: return 'destructive';
        default: return 'secondary';
    }
}

export default function OffboardingPage() {
    const [processes, setProcesses] = useState<ExitProcess[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ employee: '', reason: '', departureDate: '' });

    const load = async () => {
        try {
            setIsLoading(true);
            const [p, emps] = await Promise.all([getExitProcesses(), getAllEmployees({ itemsPerPage: 500 }).catch(() => [])]);
            setProcesses(p);
            const arr = Array.isArray(emps) ? emps : (emps as any)['hydra:member'] || [];
            setEmployees(arr);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const empName = (id: string) => { const e = employees.find((x: any) => x.id === id || x['@id'] === id); return e ? `${e.firstName} ${e.lastName}` : id; };

    const stats = useMemo(() => ({
        total: processes.length,
        inProgress: processes.filter(p => p.status === EXIT_PROCESS_STATUS.IN_PROGRESS).length,
        completed: processes.filter(p => p.status === EXIT_PROCESS_STATUS.COMPLETED).length,
        pending: processes.filter(p => p.status === EXIT_PROCESS_STATUS.PENDING).length,
    }), [processes]);

    const filtered = useMemo(() => {
        if (!search.trim()) return processes;
        const q = search.toLowerCase();
        return processes.filter(p => empName(p.employee).toLowerCase().includes(q));
    }, [processes, search, employees]);

    const handleCreate = async () => {
        if (!form.employee || !form.reason) return toast.error('Employé et motif obligatoires.');
        try {
            setCreating(true);
            await createExitProcess({ employee: form.employee, reason: form.reason, departureDate: form.departureDate || undefined });
            toast.success('Processus de sortie créé.');
            setIsModalOpen(false);
            setForm({ employee: '', reason: '', departureDate: '' });
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
                title="Sortie collaborateurs"
                description="Gestion des processus de départ des collaborateurs."
                actions={
                    <Button variant="pill" size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4" />Nouveau départ
                    </Button>
                }
            />

            <PageKpiStrip items={[
                { label: 'Total départs', value: stats.total, icon: LogOut, tone: 'primary', detail: 'Processus créés' },
                { label: 'En cours', value: stats.inProgress, icon: Clock, tone: 'warning', detail: 'Départs actifs' },
                { label: 'Terminés', value: stats.completed, icon: CheckCircle2, tone: 'success', detail: 'Sorties complètes' },
                { label: 'En attente', value: stats.pending, icon: XCircle, tone: 'danger', detail: 'À démarrer' },
            ]} />

            <FilterBar>
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par employé..." className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                </div>
            </FilterBar>

            <DataPanel title="Processus de départ" description={`${filtered.length} processus`} contentClassName="p-0">
                {isLoading ? (
                    <div className="p-32 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-rose-500" /><p>{error}</p></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6">Employé</TableHead>
                                <TableHead className="px-6">Motif</TableHead>
                                <TableHead className="px-6">Statut</TableHead>
                                <TableHead className="px-6">Date départ</TableHead>
                                <TableHead className="px-6 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">Aucun processus de départ.</TableCell></TableRow>
                            ) : filtered.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="px-6 font-semibold">{empName(p.employee)}</TableCell>
                                    <TableCell className="px-6 text-secondary-600">{EXIT_REASON_LABELS[p.reason as ExitReason] || p.reason}</TableCell>
                                    <TableCell className="px-6"><Badge variant={statusVariant(p.status as string)}>{EXIT_PROCESS_STATUS_LABELS[p.status as ExitProcessStatus] || p.status}</Badge></TableCell>
                                    <TableCell className="px-6 text-secondary-500 tabular-nums">{p.departureDate ? format(new Date(p.departureDate), 'dd MMM yyyy', { locale: fr }) : '—'}</TableCell>
                                    <TableCell className="px-6 text-right">
                                        <Link href={`/m/personnel/offboarding/${p.id}`}>
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
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">Nouveau départ</Dialog.Title>
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
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Motif <span className="text-rose-500">*</span></label>
                                        <select value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
                                            <option value="">Sélectionner</option>
                                            {Object.entries(EXIT_REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Date de départ</label>
                                        <input type="date" value={form.departureDate} onChange={e => setForm(p => ({ ...p, departureDate: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
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
