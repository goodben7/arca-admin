'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import { format as fmtDate, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
    Plus, Loader2, AlertCircle, Target, CheckCircle2, XCircle, PlayCircle, X, Search,
    List, CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { FilterBar } from '@/components/layout/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import {
    getObjectives, createObjective, activateObjective, completeObjective, cancelObjective, getEvaluationCycles,
} from '@/lib/api/performance';
import { extractId } from '@/lib/api-iri';
import { getAllEmployees } from '@/lib/api/employee';
import {
    Objective, EvaluationCycle, OBJECTIVE_STATUS, OBJECTIVE_STATUS_LABELS, ObjectiveStatus,
    EVALUATION_CYCLE_STATUS_LABELS, EvaluationCycleStatus,
} from '@/types/performance';
import { Dialog, Transition } from '@headlessui/react';
import { ObjectiveDetailDialog } from '@/components/performance/ObjectiveDetailDialog';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';

const locales = { fr };
const localizer = dateFnsLocalizer({
    format: fmtDate,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    getDay,
    locales,
});

const EMPTY_FORM = {
    employee: '',
    evaluationCycleId: '',
    title: '',
    description: '',
    specific: '',
    measurable: '',
    targetValue: '',
    achievable: '',
    relevant: '',
    dueDate: '',
};

function statusVariant(s: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    switch (s) {
        case OBJECTIVE_STATUS.ACTIVE: return 'warning';
        case OBJECTIVE_STATUS.COMPLETED: return 'success';
        case OBJECTIVE_STATUS.CANCELLED: return 'destructive';
        default: return 'secondary';
    }
}

function calColor(status: string) {
    switch (status) {
        case OBJECTIVE_STATUS.ACTIVE: return { bg: '#d97706', border: '#b45309' };
        case OBJECTIVE_STATUS.COMPLETED: return { bg: '#059669', border: '#047857' };
        case OBJECTIVE_STATUS.CANCELLED: return { bg: '#e11d48', border: '#be123c' };
        default: return { bg: '#64748b', border: '#475569' };
    }
}

export default function ObjectivesPage() {
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [employeeFilter, setEmployeeFilter] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [calView, setCalView] = useState<View>(Views.MONTH);
    const [calDate, setCalDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [acting, setActing] = useState<string | null>(null);
    const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const load = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [o, emps, c] = await Promise.all([
                getObjectives(),
                getAllEmployees({ itemsPerPage: 500 }).catch(() => []),
                getEvaluationCycles().catch(() => []),
            ]);
            setObjectives(o);
            const arr = Array.isArray(emps) ? emps : (emps as any)['hydra:member'] || [];
            setEmployees(arr);
            setCycles(c);
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

    const cycleName = (ref?: string) => {
        if (!ref) return '—';
        const id = extractId(ref) || ref;
        const c = cycles.find(x => x.id === id || x['@id'] === ref);
        return c ? `${c.name}${c.year ? ` (${c.year})` : ''}` : id;
    };

    const stats = useMemo(() => ({
        total: objectives.length,
        active: objectives.filter(o => o.status === OBJECTIVE_STATUS.ACTIVE).length,
        completed: objectives.filter(o => o.status === OBJECTIVE_STATUS.COMPLETED).length,
        draft: objectives.filter(o => o.status === OBJECTIVE_STATUS.DRAFT).length,
    }), [objectives]);

    const filtered = useMemo(() => {
        let list = objectives;
        if (employeeFilter) {
            list = list.filter(o => (extractId(o.employee) || o.employee) === employeeFilter);
        }
        if (!search.trim()) return list;
        const q = search.toLowerCase();
        return list.filter(o =>
            o.title.toLowerCase().includes(q) ||
            empName(o.employee).toLowerCase().includes(q)
        );
    }, [objectives, search, employeeFilter, employees]);

    const calEvents = useMemo(() =>
        filtered
            .filter(o => o.dueDate)
            .map(o => {
                const d = new Date(o.dueDate!);
                return {
                    id: o.id,
                    title: `${o.title} — ${empName(o.employee)}`,
                    start: d,
                    end: d,
                    allDay: true,
                    resource: o,
                };
            }),
        [filtered, employees]
    );

    const handleAction = async (obj: Objective, action: 'activate' | 'complete' | 'cancel') => {
        try {
            setActing(obj.id + action);
            if (action === 'activate') await activateObjective(obj.id);
            else if (action === 'complete') await completeObjective(obj.id);
            else await cancelObjective(obj.id);
            toast.success('Objectif mis à jour.');
            setSelectedObjective(null);
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setActing(null);
        }
    };

    const handleCreate = async () => {
        if (!form.employee || !form.evaluationCycleId || !form.title.trim()) {
            return toast.error('Employé, cycle et titre sont obligatoires.');
        }
        if (!form.specific.trim() || !form.measurable.trim()) {
            return toast.error('Les champs Spécifique et Mesurable sont obligatoires (SMART).');
        }
        try {
            setCreating(true);
            await createObjective({
                employee: form.employee,
                evaluationCycleId: form.evaluationCycleId,
                title: form.title.trim(),
                description: form.description.trim() || undefined,
                specific: form.specific.trim(),
                measurable: form.measurable.trim(),
                targetValue: form.targetValue.trim() || undefined,
                achievable: form.achievable.trim() || undefined,
                relevant: form.relevant.trim() || undefined,
                dueDate: form.dueDate || undefined,
            });
            toast.success('Objectif créé.');
            setIsModalOpen(false);
            setForm(EMPTY_FORM);
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setCreating(false);
        }
    };

    const eventStyleGetter = (event: { resource: Objective }) => {
        const { bg, border } = calColor(event.resource.status);
        return {
            style: {
                backgroundColor: bg,
                borderColor: border,
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                fontSize: '11px',
                border: `1px solid ${border}`,
                padding: '2px 6px',
            },
        };
    };

    return (
        <PageShell>
            <PageHeader
                title="Objectifs"
                description="Suivi des objectifs individuels par collaborateur."
                actions={
                    <>
                        <div className="flex items-center bg-secondary-100 rounded-2xl p-1 gap-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white shadow text-secondary-900' : 'text-secondary-400 hover:text-secondary-700'}`}
                            >
                                <List className="w-3.5 h-3.5" /> Liste
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('calendar')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-secondary-900' : 'text-secondary-400 hover:text-secondary-700'}`}
                            >
                                <CalendarDays className="w-3.5 h-3.5" /> Calendrier
                            </button>
                        </div>
                        <Button variant="pill" size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
                            <Plus className="w-4 h-4" />Nouvel objectif
                        </Button>
                    </>
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
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher par titre ou employé..."
                        className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                </div>
                <select
                    value={employeeFilter}
                    onChange={e => setEmployeeFilter(e.target.value)}
                    className="h-10 px-3 border border-secondary-200 rounded-xl text-sm bg-white min-w-[200px] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                    <option value="">Tous les employés</option>
                    {employees.map((e: any) => (
                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                    ))}
                </select>
            </FilterBar>

            {viewMode === 'list' ? (
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
                                    <TableHead className="px-6">Cycle</TableHead>
                                    <TableHead className="px-6">Statut</TableHead>
                                    <TableHead className="px-6">Échéance</TableHead>
                                    <TableHead className="px-6 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="h-48 text-center text-muted-foreground">Aucun objectif.</TableCell></TableRow>
                                ) : filtered.map(o => (
                                    <TableRow key={o.id} className="cursor-pointer hover:bg-secondary-50/60" onClick={() => setSelectedObjective(o)}>
                                        <TableCell className="px-6 font-semibold">{o.title}</TableCell>
                                        <TableCell className="px-6 text-secondary-600">{empName(o.employee)}</TableCell>
                                        <TableCell className="px-6 text-secondary-500 text-sm">{cycleName(o.evaluationCycleId || o.evaluationCycle)}</TableCell>
                                        <TableCell className="px-6"><Badge variant={statusVariant(o.status as string)}>{OBJECTIVE_STATUS_LABELS[o.status as ObjectiveStatus] || o.status}</Badge></TableCell>
                                        <TableCell className="px-6 text-secondary-500 tabular-nums">{o.dueDate ? format(new Date(o.dueDate), 'dd MMM yyyy', { locale: fr }) : '—'}</TableCell>
                                        <TableCell className="px-6 text-right" onClick={e => e.stopPropagation()}>
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
            ) : (
                <DataPanel title="Calendrier des échéances" description={`${calEvents.length} objectif(s) avec date`} contentClassName="p-4">
                    {isLoading ? (
                        <div className="p-32 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div>
                    ) : error ? (
                        <div className="p-20 flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-rose-500" /><p>{error}</p></div>
                    ) : calEvents.length === 0 ? (
                        <div className="p-20 flex flex-col items-center gap-4 text-muted-foreground">
                            <CalendarDays className="w-12 h-12 text-secondary-200" />
                            <p>Aucun objectif avec date d&apos;échéance{employeeFilter ? ' pour cet employé' : ''}.</p>
                        </div>
                    ) : (
                        <>
                            <style>{`
                                .rbc-calendar { font-family: inherit; min-height: 600px; }
                                .rbc-toolbar button { border-radius: 8px; font-weight: 600; font-size: 12px; }
                                .rbc-header { padding: 8px; font-weight: 700; font-size: 11px; text-transform: uppercase; }
                                .rbc-today { background-color: #f0fdfa; }
                            `}</style>
                            <Calendar
                                localizer={localizer}
                                events={calEvents}
                                view={calView}
                                onView={setCalView}
                                date={calDate}
                                onNavigate={setCalDate}
                                culture="fr"
                                eventPropGetter={eventStyleGetter}
                                onSelectEvent={(event) => setSelectedObjective(event.resource as Objective)}
                                messages={{
                                    today: "Aujourd'hui",
                                    previous: 'Préc.',
                                    next: 'Suiv.',
                                    month: 'Mois',
                                    week: 'Semaine',
                                    day: 'Jour',
                                    agenda: 'Agenda',
                                    noEventsInRange: 'Aucun objectif sur cette période.',
                                }}
                                style={{ height: 620 }}
                            />
                            <div className="flex items-center gap-4 mt-4 flex-wrap">
                                {Object.entries(OBJECTIVE_STATUS_LABELS).map(([k, v]) => {
                                    const { bg } = calColor(k);
                                    return (
                                        <span key={k} className="flex items-center gap-2 text-xs text-secondary-600">
                                            <span className="w-3 h-3 rounded" style={{ backgroundColor: bg }} />
                                            {v}
                                        </span>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </DataPanel>
            )}

            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="bg-white rounded-2xl shadow-float w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center justify-between">
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">Nouvel objectif (SMART)</Dialog.Title>
                                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Employé <span className="text-rose-500">*</span></label>
                                        <select value={form.employee} onChange={e => setForm(p => ({ ...p, employee: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
                                            <option value="">Sélectionner</option>
                                            {employees.map((e: any) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Cycle d&apos;évaluation <span className="text-rose-500">*</span></label>
                                        <select value={form.evaluationCycleId} onChange={e => setForm(p => ({ ...p, evaluationCycleId: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
                                            <option value="">Sélectionner un cycle</option>
                                            {cycles.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}{c.year ? ` (${c.year})` : ''} — {EVALUATION_CYCLE_STATUS_LABELS[c.status as EvaluationCycleStatus] || c.status}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Titre <span className="text-rose-500">*</span></label>
                                        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="Ex: Augmenter le CA de 20%" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Spécifique <span className="text-rose-500">*</span></label>
                                            <input value={form.specific} onChange={e => setForm(p => ({ ...p, specific: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="Quoi exactement ?" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Mesurable <span className="text-rose-500">*</span></label>
                                            <input value={form.measurable} onChange={e => setForm(p => ({ ...p, measurable: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="Comment mesurer ?" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Valeur cible</label>
                                        <input value={form.targetValue} onChange={e => setForm(p => ({ ...p, targetValue: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="Ex: +20% CA" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Atteignable</label>
                                            <input value={form.achievable} onChange={e => setForm(p => ({ ...p, achievable: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Pertinent</label>
                                            <input value={form.relevant} onChange={e => setForm(p => ({ ...p, relevant: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Date d&apos;échéance</label>
                                        <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Description</label>
                                        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" />
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

            <ObjectiveDetailDialog
                objective={selectedObjective}
                onClose={() => setSelectedObjective(null)}
                empName={empName}
                cycleName={cycleName}
                onAction={handleAction}
                acting={acting}
            />
        </PageShell>
    );
}
