'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { Plus, Loader2, AlertCircle, DollarSign, Search, X, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { FilterBar } from '@/components/layout/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { getCompensationHistories, recordCompensation } from '@/lib/api/compensation';
import { extractId } from '@/lib/api-iri';
import { getAllEmployees } from '@/lib/api/employee';
import { CompensationHistory, COMPENSATION_SOURCE_LABELS } from '@/types/compensation';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function parseSalary(v?: string | number | null): number | null {
    if (v == null || v === '') return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/\s/g, ''));
    return Number.isFinite(n) ? n : null;
}

function fmtSalary(v?: string | number | null) {
    const n = parseSalary(v);
    return n != null ? `${n.toLocaleString('fr-FR')} CDF` : '—';
}

function safeFormatDate(value?: string) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    try {
        return format(d, 'dd MMM yyyy', { locale: fr });
    } catch {
        return '—';
    }
}

const EMPTY_FORM = { employee: '', newSalary: '', effectiveDate: '', reason: '' };

export default function CompensationPage() {
    const [histories, setHistories] = useState<CompensationHistory[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    const load = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [h, emps] = await Promise.all([
                getCompensationHistories(),
                getAllEmployees({ itemsPerPage: 500 }).catch(() => []),
            ]);
            setHistories(h);
            const arr = Array.isArray(emps) ? emps : (emps as any)['hydra:member'] || [];
            setEmployees(arr);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const empName = (ref: string) => {
        const id = extractId(ref) || ref;
        const e = employees.find((x: any) => x.id === id || x['@id'] === ref);
        return e ? `${e.firstName} ${e.lastName}` : id;
    };

    const filtered = useMemo(() => {
        if (!search.trim()) return histories;
        const q = search.toLowerCase();
        return histories.filter(h => empName(h.employee).toLowerCase().includes(q));
    }, [histories, search, employees]);

    const totalPayroll = useMemo(() => {
        const empSalaries: Record<string, number> = {};
        histories.forEach(h => {
            const id = extractId(h.employee) || h.employee;
            const n = parseSalary(h.newSalary);
            if (n != null) empSalaries[id] = n;
        });
        return Object.values(empSalaries).reduce((s, v) => s + v, 0);
    }, [histories]);

    const handleCreate = async () => {
        if (!form.employee || !form.newSalary.trim() || !form.effectiveDate) {
            return toast.error('Employé, salaire et date obligatoires.');
        }
        try {
            setCreating(true);
            await recordCompensation({
                employee: form.employee,
                newSalary: form.newSalary.trim(),
                effectiveDate: form.effectiveDate,
                reason: form.reason.trim() || undefined,
            });
            toast.success('Compensation enregistrée.');
            setIsModalOpen(false);
            setForm(EMPTY_FORM);
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
                title="Compensation"
                description="Historique des évolutions salariales."
                actions={
                    <Button variant="pill" size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4" />Enregistrer une compensation
                    </Button>
                }
            />

            <PageKpiStrip items={[
                { label: 'Enregistrements', value: histories.length, icon: DollarSign, tone: 'primary', detail: 'Évolutions salariales' },
                { label: 'Masse salariale', value: fmtSalary(totalPayroll), icon: TrendingUp, tone: 'success', detail: 'Estimation actuelle' },
            ]} />

            <FilterBar>
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par employé..." className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                </div>
            </FilterBar>

            <DataPanel title="Historique de compensation" description={`${filtered.length} entrée(s)`} contentClassName="p-0">
                {isLoading ? (
                    <div className="p-32 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-rose-500" /><p>{error}</p></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6">Employé</TableHead>
                                <TableHead className="px-6">Salaire précédent</TableHead>
                                <TableHead className="px-6">Nouveau salaire</TableHead>
                                <TableHead className="px-6">Date effet</TableHead>
                                <TableHead className="px-6">Motif</TableHead>
                                <TableHead className="px-6">Source</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="h-48 text-center text-muted-foreground">Aucun historique.</TableCell></TableRow>
                            ) : filtered.map(h => (
                                <TableRow key={h.id}>
                                    <TableCell className="px-6 font-semibold">{empName(h.employee)}</TableCell>
                                    <TableCell className="px-6 text-secondary-500">{fmtSalary(h.oldSalary ?? h.previousSalary)}</TableCell>
                                    <TableCell className="px-6 font-semibold text-emerald-600">{fmtSalary(h.newSalary)}</TableCell>
                                    <TableCell className="px-6 text-secondary-500 tabular-nums">{safeFormatDate(h.effectiveDate)}</TableCell>
                                    <TableCell className="px-6 text-secondary-500 max-w-xs truncate">{h.reason || '—'}</TableCell>
                                    <TableCell className="px-6 text-xs text-secondary-400">
                                        {h.sourceEvent ? (COMPENSATION_SOURCE_LABELS[h.sourceEvent] || h.sourceEvent) : '—'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DataPanel>

            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
                    <Transition.Child
                        as="div"
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                        enter="ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child
                            as="div"
                            className="w-full max-w-md"
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="bg-white rounded-2xl shadow-float w-full p-6 space-y-5">
                                <div className="flex items-center justify-between">
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">Enregistrer une compensation</Dialog.Title>
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
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Nouveau salaire <span className="text-rose-500">*</span></label>
                                            <input type="text" inputMode="decimal" value={form.newSalary} onChange={e => setForm(p => ({ ...p, newSalary: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="Ex: 450000" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Date d&apos;effet <span className="text-rose-500">*</span></label>
                                            <input type="date" value={form.effectiveDate} onChange={e => setForm(p => ({ ...p, effectiveDate: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Motif</label>
                                        <input value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="Ex: Révision annuelle" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                                    <Button variant="pill" onClick={handleCreate} disabled={creating}>
                                        {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Enregistrer
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
