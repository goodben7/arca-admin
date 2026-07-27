'use client';

import { useEffect, useState, useMemo, Fragment, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Plus, Loader2, AlertCircle, BarChart3, CheckCircle2, Send, X, Search, User, Pencil,
} from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { FilterBar } from '@/components/layout/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import {
    getPerformanceReviews, createPerformanceReview, updatePerformanceReview,
    submitPerformanceReview, validatePerformanceReview, getEvaluationCycles,
} from '@/lib/api/performance';
import { extractId, cycleRefOf, matchesCycleId } from '@/lib/api-iri';
import { getAllEmployees } from '@/lib/api/employee';
import {
    PerformanceReview, EvaluationCycle,
    PERFORMANCE_REVIEW_STATUS, PERFORMANCE_REVIEW_STATUS_LABELS, PerformanceReviewStatus,
} from '@/types/performance';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const EMPTY_FORM = {
    employee: '',
    evaluationCycleId: '',
    reviewer: '',
    score: '',
    comment: '',
};

function statusVariant(s: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    switch (s) {
        case PERFORMANCE_REVIEW_STATUS.SUBMITTED: return 'warning';
        case PERFORMANCE_REVIEW_STATUS.VALIDATED: return 'success';
        default: return 'secondary';
    }
}

function PerformanceReviewsPageContent() {
    const searchParams = useSearchParams();
    const [reviews, setReviews] = useState<PerformanceReview[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [employeeFilter, setEmployeeFilter] = useState('');
    const [cycleFilter, setCycleFilter] = useState(searchParams.get('cycle') || '');
    const [statusFilter, setStatusFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<PerformanceReview | null>(null);
    const [creating, setCreating] = useState(false);
    const [acting, setActing] = useState<string | null>(null);
    const [form, setForm] = useState(() => ({
        ...EMPTY_FORM,
        evaluationCycleId: searchParams.get('cycle') || '',
    }));

    const load = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [r, emps, c] = await Promise.all([
                getPerformanceReviews(),
                getAllEmployees({ itemsPerPage: 500 }).catch(() => []),
                getEvaluationCycles().catch(() => []),
            ]);
            setReviews(r);
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

    useEffect(() => {
        const cycle = searchParams.get('cycle');
        const openNew = searchParams.get('new') === '1';
        if (cycle) {
            setCycleFilter(cycle);
            setForm(p => ({ ...p, evaluationCycleId: cycle }));
        }
        if (openNew) setIsModalOpen(true);
    }, [searchParams]);

    const empName = (ref?: string | null) => {
        if (!ref) return '—';
        const id = extractId(ref) || ref;
        const e = employees.find((x: any) => x.id === id || x['@id'] === ref);
        return e ? `${e.firstName} ${e.lastName}` : id;
    };

    const cycleName = (ref?: unknown) => {
        if (!ref) return '—';
        const cid = extractId(ref as string | { id?: string; '@id'?: string });
        if (!cid) return '—';
        const c = cycles.find(x => x.id === cid || extractId(x['@id']) === cid);
        return c ? `${c.name}${c.year ? ` (${c.year})` : ''}` : cid;
    };

    const stats = useMemo(() => ({
        total: reviews.length,
        draft: reviews.filter(r => r.status === PERFORMANCE_REVIEW_STATUS.DRAFT).length,
        submitted: reviews.filter(r => r.status === PERFORMANCE_REVIEW_STATUS.SUBMITTED).length,
        validated: reviews.filter(r => r.status === PERFORMANCE_REVIEW_STATUS.VALIDATED).length,
    }), [reviews]);

    const filtered = useMemo(() => {
        let list = reviews;
        if (employeeFilter) {
            list = list.filter(r => (extractId(r.employee) || r.employee) === employeeFilter);
        }
        if (cycleFilter) {
            list = list.filter(r => matchesCycleId(cycleRefOf(r), cycleFilter));
        }
        if (statusFilter) {
            list = list.filter(r => r.status === statusFilter);
        }
        if (!search.trim()) return list;
        const q = search.toLowerCase();
        return list.filter(r =>
            empName(r.employee).toLowerCase().includes(q) ||
            empName(r.reviewer).toLowerCase().includes(q) ||
            cycleName(cycleRefOf(r)).toLowerCase().includes(q) ||
            (r.comment || '').toLowerCase().includes(q),
        );
    }, [reviews, search, employeeFilter, cycleFilter, statusFilter, employees, cycles]);

    const openCreate = () => {
        setEditing(null);
        setForm({
            ...EMPTY_FORM,
            evaluationCycleId: cycleFilter || searchParams.get('cycle') || '',
        });
        setIsModalOpen(true);
    };

    const openEdit = (review: PerformanceReview) => {
        setEditing(review);
        setForm({
            employee: extractId(review.employee) || review.employee,
            evaluationCycleId: extractId(cycleRefOf(review) as any) || '',
            reviewer: extractId(review.reviewer) || review.reviewer || '',
            score: review.score != null ? String(review.score) : '',
            comment: review.comment || review.comments || '',
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!editing) {
            if (!form.employee || !form.evaluationCycleId) {
                return toast.error('Employé et cycle sont obligatoires.');
            }
        }
        try {
            setCreating(true);
            if (editing) {
                await updatePerformanceReview(editing.id, {
                    reviewer: form.reviewer || undefined,
                    score: form.score ? Number(form.score) : undefined,
                    comment: form.comment.trim() || undefined,
                });
                toast.success('Évaluation mise à jour.');
            } else {
                await createPerformanceReview({
                    employee: form.employee,
                    evaluationCycleId: form.evaluationCycleId,
                    reviewer: form.reviewer || undefined,
                    score: form.score ? Number(form.score) : undefined,
                    comment: form.comment.trim() || undefined,
                });
                toast.success('Évaluation créée.');
            }
            setIsModalOpen(false);
            setEditing(null);
            setForm(EMPTY_FORM);
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setCreating(false);
        }
    };

    const handleAction = async (review: PerformanceReview, action: 'submit' | 'validate') => {
        try {
            setActing(review.id + action);
            if (action === 'submit') await submitPerformanceReview(review.id);
            else await validatePerformanceReview(review.id);
            toast.success(action === 'submit' ? 'Évaluation soumise.' : 'Évaluation validée.');
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setActing(null);
        }
    };

    const selectClass = 'w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500';

    return (
        <PageShell>
            <PageHeader
                title="Évaluations"
                description="Entretiens de performance par collaborateur et cycle."
                actions={
                    <Button variant="pill" size="sm" className="gap-2" onClick={openCreate}>
                        <Plus className="w-4 h-4" />Nouvelle évaluation
                    </Button>
                }
            />

            <PageKpiStrip items={[
                { label: 'Total', value: stats.total, icon: BarChart3, tone: 'primary', detail: 'Entretiens' },
                { label: 'Brouillons', value: stats.draft, icon: Pencil, tone: 'info', detail: 'À soumettre' },
                { label: 'Soumises', value: stats.submitted, icon: Send, tone: 'warning', detail: 'En attente' },
                { label: 'Validées', value: stats.validated, icon: CheckCircle2, tone: 'success', detail: 'Clôturées' },
            ]} />

            <FilterBar>
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher un collaborateur, évaluateur, cycle..."
                        className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                </div>
                <select
                    value={employeeFilter}
                    onChange={e => setEmployeeFilter(e.target.value)}
                    className="h-10 px-3 border border-secondary-200 rounded-xl text-sm bg-white min-w-[180px] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                    <option value="">Tous les employés</option>
                    {employees.map((e: any) => (
                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                    ))}
                </select>
                <select
                    value={cycleFilter}
                    onChange={e => setCycleFilter(e.target.value)}
                    className="h-10 px-3 border border-secondary-200 rounded-xl text-sm bg-white min-w-[180px] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                    <option value="">Tous les cycles</option>
                    {cycles.map(c => (
                        <option key={c.id} value={c.id}>{c.name}{c.year ? ` (${c.year})` : ''}</option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="h-10 px-3 border border-secondary-200 rounded-xl text-sm bg-white min-w-[160px] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                    <option value="">Tous les statuts</option>
                    {Object.entries(PERFORMANCE_REVIEW_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>
            </FilterBar>

            <DataPanel title="Évaluations de performance" description={`${filtered.length} entretien(s)`} contentClassName="p-0">
                {isLoading ? (
                    <div className="p-32 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-rose-500" /><p>{error}</p></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6">Collaborateur</TableHead>
                                <TableHead className="px-6">Cycle</TableHead>
                                <TableHead className="px-6">Évaluateur</TableHead>
                                <TableHead className="px-6">Note</TableHead>
                                <TableHead className="px-6">Statut</TableHead>
                                <TableHead className="px-6">Dates</TableHead>
                                <TableHead className="px-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                                        Aucune évaluation.
                                        <div className="mt-4">
                                            <Button variant="outline" size="sm" onClick={openCreate}>Créer une évaluation</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map(r => (
                                <TableRow key={r.id} className="hover:bg-secondary-50/60">
                                    <TableCell className="px-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4 text-secondary-500" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-secondary-900">{empName(r.employee)}</p>
                                                <p className="text-[10px] font-mono text-secondary-400">{extractId(r.employee)}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 text-sm text-secondary-600">
                                        {cycleName(cycleRefOf(r))}
                                        <div className="mt-0.5">
                                            <Link href={`/m/performance/cycles/${extractId(cycleRefOf(r) as any) || ''}`} className="text-xs text-primary-600 hover:underline">
                                                Voir le cycle
                                            </Link>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 text-sm text-secondary-600">{empName(r.reviewer)}</TableCell>
                                    <TableCell className="px-6 font-semibold tabular-nums">
                                        {r.score != null && r.score !== '' ? r.score : '—'}
                                    </TableCell>
                                    <TableCell className="px-6">
                                        <Badge variant={statusVariant(r.status as string)}>
                                            {PERFORMANCE_REVIEW_STATUS_LABELS[r.status as PerformanceReviewStatus] || r.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-6 text-xs text-secondary-500 space-y-0.5">
                                        {r.submittedAt && <p>Soumis : {format(new Date(r.submittedAt), 'dd MMM yyyy', { locale: fr })}</p>}
                                        {r.validatedAt && <p>Validé : {format(new Date(r.validatedAt), 'dd MMM yyyy', { locale: fr })}</p>}
                                        {!r.submittedAt && !r.validatedAt && (
                                            <p>Créé : {r.createdAt ? format(new Date(r.createdAt), 'dd MMM yyyy', { locale: fr }) : '—'}</p>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-6 text-right">
                                        <div className="flex justify-end gap-1.5">
                                            {r.status === PERFORMANCE_REVIEW_STATUS.DRAFT && (
                                                <>
                                                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => openEdit(r)}>
                                                        <Pencil className="w-3 h-3" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => handleAction(r, 'submit')} disabled={!!acting}>
                                                        {acting === r.id + 'submit' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                                        Soumettre
                                                    </Button>
                                                </>
                                            )}
                                            {r.status === PERFORMANCE_REVIEW_STATUS.SUBMITTED && (
                                                <Button size="sm" variant="pill" className="h-8 text-xs gap-1" onClick={() => handleAction(r, 'validate')} disabled={!!acting}>
                                                    {acting === r.id + 'validate' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                                    Valider
                                                </Button>
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
                <Dialog as="div" className="relative z-50" onClose={() => !creating && setIsModalOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="bg-white rounded-2xl shadow-float w-full max-w-md p-6 space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">
                                        {editing ? 'Modifier l\'évaluation' : 'Nouvelle évaluation'}
                                    </Dialog.Title>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {!editing && (
                                        <>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Collaborateur *</label>
                                                <select value={form.employee} onChange={e => setForm(p => ({ ...p, employee: e.target.value }))} className={selectClass}>
                                                    <option value="">Sélectionner...</option>
                                                    {employees.map((e: any) => (
                                                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Cycle *</label>
                                                <select value={form.evaluationCycleId} onChange={e => setForm(p => ({ ...p, evaluationCycleId: e.target.value }))} className={selectClass}>
                                                    <option value="">Sélectionner...</option>
                                                    {cycles.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}{c.year ? ` (${c.year})` : ''}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Évaluateur</label>
                                        <select value={form.reviewer} onChange={e => setForm(p => ({ ...p, reviewer: e.target.value }))} className={selectClass}>
                                            <option value="">Optionnel...</option>
                                            {employees.map((e: any) => (
                                                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Note</label>
                                        <input type="number" min={0} max={5} step={0.5} value={form.score} onChange={e => setForm(p => ({ ...p, score: e.target.value }))} className={selectClass} placeholder="0 – 5" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Commentaire</label>
                                        <textarea value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))} className={`${selectClass} h-24 py-2`} rows={3} />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)} disabled={creating}>Annuler</Button>
                                    <Button variant="pill" size="sm" onClick={handleSave} disabled={creating} className="gap-2">
                                        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        {editing ? 'Enregistrer' : 'Créer'}
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

export default function PerformanceReviewsPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            </div>
        }>
            <PerformanceReviewsPageContent />
        </Suspense>
    );
}
