'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { Plus, Loader2, AlertCircle, Gift, Search, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { FilterBar } from '@/components/layout/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { getBenefits, createBenefit, getEmployeeBenefits, createEmployeeBenefit } from '@/lib/api/benefit';
import { getAllEmployees } from '@/lib/api/employee';
import { extractId } from '@/lib/api-iri';
import {
    Benefit,
    EmployeeBenefit,
    BENEFIT_TYPE_LABELS,
    BenefitType,
    BENEFIT_TYPE,
    EMPLOYEE_BENEFIT_STATUS_LABELS,
    EmployeeBenefitStatus,
} from '@/types/benefit';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type Tab = 'catalog' | 'assignments';

const EMPTY_BENEFIT_FORM = { code: '', name: '', type: '', description: '' };
const EMPTY_ASSIGNMENT_FORM = { employee: '', benefitId: '', startDate: '', endDate: '' };

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

export default function BenefitsPage() {
    const [tab, setTab] = useState<Tab>('catalog');
    const [benefits, setBenefits] = useState<Benefit[]>([]);
    const [assignments, setAssignments] = useState<EmployeeBenefit[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [isBenefitModalOpen, setIsBenefitModalOpen] = useState(false);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [creatingBenefit, setCreatingBenefit] = useState(false);
    const [creatingAssignment, setCreatingAssignment] = useState(false);
    const [benefitForm, setBenefitForm] = useState(EMPTY_BENEFIT_FORM);
    const [assignmentForm, setAssignmentForm] = useState(EMPTY_ASSIGNMENT_FORM);

    const load = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [b, a, emps] = await Promise.all([
                getBenefits(),
                getEmployeeBenefits(),
                getAllEmployees({ itemsPerPage: 500 }).catch(() => []),
            ]);
            setBenefits(b);
            setAssignments(a);
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

    const benefitName = (ref?: string) => {
        if (!ref) return '—';
        const id = extractId(ref) || ref;
        const b = benefits.find(x => x.id === id || x['@id'] === ref);
        return b ? b.name : id;
    };

    const benefitRef = (eb: EmployeeBenefit) => eb.benefitId || eb.benefit;

    const filteredBenefits = useMemo(() => {
        if (!search.trim()) return benefits;
        const q = search.toLowerCase();
        return benefits.filter(b =>
            b.name.toLowerCase().includes(q) ||
            b.code?.toLowerCase().includes(q)
        );
    }, [benefits, search]);

    const filteredAssignments = useMemo(() => {
        if (!search.trim()) return assignments;
        const q = search.toLowerCase();
        return assignments.filter(a =>
            empName(a.employee).toLowerCase().includes(q) ||
            benefitName(benefitRef(a)).toLowerCase().includes(q)
        );
    }, [assignments, search, employees, benefits]);

    const typeBadgeVariant = (t: string): 'default' | 'secondary' | 'success' | 'warning' => {
        switch (t) {
            case BENEFIT_TYPE.HEALTH: return 'success';
            case BENEFIT_TYPE.TRANSPORT: return 'default';
            case BENEFIT_TYPE.MEAL: return 'warning';
            default: return 'secondary';
        }
    };

    const handleCreateBenefit = async () => {
        if (!benefitForm.code.trim() || !benefitForm.name.trim() || !benefitForm.type) {
            return toast.error('Code, nom et type obligatoires.');
        }
        try {
            setCreatingBenefit(true);
            await createBenefit({
                code: benefitForm.code,
                name: benefitForm.name,
                type: benefitForm.type,
                description: benefitForm.description || undefined,
            });
            toast.success('Avantage créé.');
            setIsBenefitModalOpen(false);
            setBenefitForm(EMPTY_BENEFIT_FORM);
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setCreatingBenefit(false);
        }
    };

    const handleCreateAssignment = async () => {
        if (!assignmentForm.employee || !assignmentForm.benefitId || !assignmentForm.startDate) {
            return toast.error('Employé, avantage et date de début obligatoires.');
        }
        try {
            setCreatingAssignment(true);
            await createEmployeeBenefit({
                employee: assignmentForm.employee,
                benefitId: assignmentForm.benefitId,
                startDate: assignmentForm.startDate,
                endDate: assignmentForm.endDate || undefined,
            });
            toast.success('Avantage attribué.');
            setIsAssignmentModalOpen(false);
            setAssignmentForm(EMPTY_ASSIGNMENT_FORM);
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setCreatingAssignment(false);
        }
    };

    const openCreateModal = () => {
        if (tab === 'catalog') setIsBenefitModalOpen(true);
        else setIsAssignmentModalOpen(true);
    };

    return (
        <PageShell>
            <PageHeader
                title="Avantages sociaux"
                description="Catalogue des avantages et attributions aux collaborateurs."
                actions={
                    <Button variant="pill" size="sm" className="gap-2" onClick={openCreateModal}>
                        <Plus className="w-4 h-4" />
                        {tab === 'catalog' ? 'Nouvel avantage' : 'Attribuer un avantage'}
                    </Button>
                }
            />

            <PageKpiStrip items={[
                { label: 'Total avantages', value: benefits.length, icon: Gift, tone: 'primary', detail: 'Dans le catalogue' },
                { label: 'Attributions', value: assignments.length, icon: Users, tone: 'info', detail: 'Avantages employés' },
                { label: 'Santé', value: benefits.filter(b => b.type === BENEFIT_TYPE.HEALTH).length, icon: Gift, tone: 'success', detail: 'Avantages santé' },
            ]} />

            <div className="flex gap-1 p-1 bg-secondary-100 rounded-xl w-fit mb-4">
                {([
                    ['catalog', 'Catalogue'],
                    ['assignments', 'Attributions'],
                ] as const).map(([t, label]) => (
                    <button
                        key={t}
                        onClick={() => { setTab(t); setSearch(''); }}
                        className={cn(
                            'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                            tab === t ? 'bg-white shadow text-secondary-900' : 'text-secondary-500 hover:text-secondary-700'
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <FilterBar>
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={tab === 'catalog' ? 'Rechercher par nom ou code...' : 'Rechercher par employé ou avantage...'}
                        className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                </div>
            </FilterBar>

            {tab === 'catalog' ? (
                <DataPanel title="Catalogue" description={`${filteredBenefits.length} avantage(s)`} contentClassName="p-0">
                    {isLoading ? (
                        <div className="p-32 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div>
                    ) : error ? (
                        <div className="p-20 flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-rose-500" /><p>{error}</p></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="px-6">Code</TableHead>
                                    <TableHead className="px-6">Nom</TableHead>
                                    <TableHead className="px-6">Type</TableHead>
                                    <TableHead className="px-6">Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredBenefits.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="h-48 text-center text-muted-foreground">Aucun avantage.</TableCell></TableRow>
                                ) : filteredBenefits.map(b => (
                                    <TableRow key={b.id}>
                                        <TableCell className="px-6 font-mono text-xs text-secondary-500">{b.code}</TableCell>
                                        <TableCell className="px-6 font-semibold">{b.name}</TableCell>
                                        <TableCell className="px-6">
                                            <Badge variant={typeBadgeVariant(b.type as string)}>
                                                {BENEFIT_TYPE_LABELS[b.type as BenefitType] || b.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 text-secondary-500 max-w-xs truncate">{b.description || '—'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </DataPanel>
            ) : (
                <DataPanel title="Attributions employés" description={`${filteredAssignments.length} attribution(s)`} contentClassName="p-0">
                    {isLoading ? (
                        <div className="p-32 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div>
                    ) : error ? (
                        <div className="p-20 flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-rose-500" /><p>{error}</p></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="px-6">Employé</TableHead>
                                    <TableHead className="px-6">Avantage</TableHead>
                                    <TableHead className="px-6">Début</TableHead>
                                    <TableHead className="px-6">Fin</TableHead>
                                    <TableHead className="px-6">Statut</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAssignments.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">Aucune attribution.</TableCell></TableRow>
                                ) : filteredAssignments.map(a => (
                                    <TableRow key={a.id}>
                                        <TableCell className="px-6 font-semibold">{empName(a.employee)}</TableCell>
                                        <TableCell className="px-6">{benefitName(benefitRef(a))}</TableCell>
                                        <TableCell className="px-6 text-secondary-500 tabular-nums">{safeFormatDate(a.startDate)}</TableCell>
                                        <TableCell className="px-6 text-secondary-500 tabular-nums">{safeFormatDate(a.endDate)}</TableCell>
                                        <TableCell className="px-6">
                                            {a.status ? (
                                                <Badge variant="secondary">
                                                    {EMPLOYEE_BENEFIT_STATUS_LABELS[a.status as EmployeeBenefitStatus] || a.status}
                                                </Badge>
                                            ) : '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </DataPanel>
            )}

            {/* Modal création avantage */}
            <Transition appear show={isBenefitModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsBenefitModalOpen(false)}>
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
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">Nouvel avantage</Dialog.Title>
                                    <button onClick={() => setIsBenefitModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Code <span className="text-rose-500">*</span></label>
                                            <input
                                                value={benefitForm.code}
                                                onChange={e => setBenefitForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                                className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                                placeholder="MUTUELLE-SANTE"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Type <span className="text-rose-500">*</span></label>
                                            <select
                                                value={benefitForm.type}
                                                onChange={e => setBenefitForm(p => ({ ...p, type: e.target.value }))}
                                                className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                                            >
                                                <option value="">Choisir</option>
                                                {Object.entries(BENEFIT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Nom <span className="text-rose-500">*</span></label>
                                        <input
                                            value={benefitForm.name}
                                            onChange={e => setBenefitForm(p => ({ ...p, name: e.target.value }))}
                                            className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                            placeholder="Ex: Mutuelle santé"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Description</label>
                                        <textarea
                                            value={benefitForm.description}
                                            onChange={e => setBenefitForm(p => ({ ...p, description: e.target.value }))}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="outline" onClick={() => setIsBenefitModalOpen(false)}>Annuler</Button>
                                    <Button variant="pill" onClick={handleCreateBenefit} disabled={creatingBenefit}>
                                        {creatingBenefit && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Créer
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>

            {/* Modal attribution employé */}
            <Transition appear show={isAssignmentModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsAssignmentModalOpen(false)}>
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
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">Attribuer un avantage</Dialog.Title>
                                    <button onClick={() => setIsAssignmentModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Employé <span className="text-rose-500">*</span></label>
                                        <select
                                            value={assignmentForm.employee}
                                            onChange={e => setAssignmentForm(p => ({ ...p, employee: e.target.value }))}
                                            className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                                        >
                                            <option value="">Sélectionner</option>
                                            {employees.map((e: any) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Avantage <span className="text-rose-500">*</span></label>
                                        <select
                                            value={assignmentForm.benefitId}
                                            onChange={e => setAssignmentForm(p => ({ ...p, benefitId: e.target.value }))}
                                            className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                                        >
                                            <option value="">Sélectionner</option>
                                            {benefits.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Date de début <span className="text-rose-500">*</span></label>
                                            <input
                                                type="date"
                                                value={assignmentForm.startDate}
                                                onChange={e => setAssignmentForm(p => ({ ...p, startDate: e.target.value }))}
                                                className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Date de fin</label>
                                            <input
                                                type="date"
                                                value={assignmentForm.endDate}
                                                onChange={e => setAssignmentForm(p => ({ ...p, endDate: e.target.value }))}
                                                className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="outline" onClick={() => setIsAssignmentModalOpen(false)}>Annuler</Button>
                                    <Button variant="pill" onClick={handleCreateAssignment} disabled={creatingAssignment}>
                                        {creatingAssignment && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Attribuer
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
