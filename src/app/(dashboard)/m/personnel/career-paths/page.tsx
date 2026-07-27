'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import {
    Plus, Loader2, AlertCircle, GitBranch, X, ArrowRight, BriefcaseBusiness,
    Clock, Star, GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { getCareerPaths, createCareerPath, getJobRoles } from '@/lib/api/jobArchitecture';
import { getTrainingCatalogs } from '@/lib/api/trainingCatalog';
import { CareerPath, CareerPathConditions, JobRole } from '@/types/jobArchitecture';
import { TrainingCatalog } from '@/types/trainingCatalog';
import { toIri, resolveRelationLabel, extractId, relationName } from '@/lib/api-iri';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const EMPTY_FORM = {
    fromJobRole: '',
    toJobRole: '',
    minimumYears: '',
    minTenureMonths: '',
    minimumPerformance: '',
    requiredTrainings: [] as string[],
};

function RoleChip({ role, lookup }: { role: string | JobRole; lookup: JobRole[] }) {
    const title = resolveRelationLabel(role, lookup);
    const id = extractId(role);
    const full = lookup.find(r => r.id === id);
    const code = full?.code || (typeof role === 'object' ? role.code : undefined);
    const gradeName = relationName(full?.grade as Parameters<typeof relationName>[0]);

    return (
        <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                <BriefcaseBusiness className="w-5 h-5" />
            </div>
            <div className="min-w-0">
                <p className="font-semibold text-secondary-900 truncate">{title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {code && <span className="text-xs text-secondary-500 font-mono">{code}</span>}
                    {gradeName && gradeName !== '—' && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{gradeName}</Badge>
                    )}
                </div>
            </div>
        </div>
    );
}

function ConditionsChips({
    conditions,
    catalogs,
}: {
    conditions?: CareerPathConditions | Record<string, unknown>;
    catalogs: TrainingCatalog[];
}) {
    if (!conditions || typeof conditions !== 'object') return null;
    const c = conditions as CareerPathConditions;
    const chips: { icon: typeof Clock; label: string }[] = [];

    if (c.minimumYears != null) {
        chips.push({ icon: Clock, label: `${c.minimumYears} an(s) min.` });
    }
    if (c.minTenureMonths != null) {
        chips.push({ icon: Clock, label: `${c.minTenureMonths} mois min.` });
    }
    if (c.minimumPerformance != null) {
        chips.push({ icon: Star, label: `Perf. ≥ ${c.minimumPerformance}` });
    }
    if (Array.isArray(c.requiredTrainings) && c.requiredTrainings.length > 0) {
        const names = c.requiredTrainings.map(id => {
            const cat = catalogs.find(t => t.id === id || extractId(t.id) === id);
            return cat?.title || id;
        });
        chips.push({
            icon: GraduationCap,
            label: names.length <= 2 ? names.join(', ') : `${names.length} formations`,
        });
    }

    if (chips.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1.5 lg:justify-end">
            {chips.map((chip, i) => (
                <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary-50 border border-secondary-100 text-[11px] font-medium text-secondary-700"
                    title={chip.label}
                >
                    <chip.icon className="w-3 h-3 text-secondary-400" />
                    {chip.label}
                </span>
            ))}
        </div>
    );
}

export default function CareerPathsPage() {
    const [paths, setPaths] = useState<CareerPath[]>([]);
    const [roles, setRoles] = useState<JobRole[]>([]);
    const [catalogs, setCatalogs] = useState<TrainingCatalog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    const load = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [p, r, t] = await Promise.all([
                getCareerPaths(),
                getJobRoles(),
                getTrainingCatalogs().catch(() => []),
            ]);
            setPaths(p);
            setRoles(r);
            setCatalogs(t);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur de chargement.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const uniqueFromRoles = useMemo(() => {
        const ids = new Set(paths.map(p => extractId(p.fromJobRole)).filter(Boolean));
        return ids.size;
    }, [paths]);

    const toggleTraining = (id: string) => {
        setForm(prev => ({
            ...prev,
            requiredTrainings: prev.requiredTrainings.includes(id)
                ? prev.requiredTrainings.filter(t => t !== id)
                : [...prev.requiredTrainings, id],
        }));
    };

    const buildConditions = (): CareerPathConditions | undefined => {
        const conditions: CareerPathConditions = {};
        if (form.minimumYears !== '') {
            const n = Number(form.minimumYears);
            if (!Number.isNaN(n) && n >= 0) conditions.minimumYears = n;
        }
        if (form.minTenureMonths !== '') {
            const n = Number(form.minTenureMonths);
            if (!Number.isNaN(n) && n >= 0) conditions.minTenureMonths = n;
        }
        if (form.minimumPerformance !== '') {
            const n = Number(form.minimumPerformance);
            if (!Number.isNaN(n) && n >= 0) conditions.minimumPerformance = n;
        }
        if (form.requiredTrainings.length > 0) {
            conditions.requiredTrainings = form.requiredTrainings.map(id => extractId(id) || id);
        }
        return Object.keys(conditions).length > 0 ? conditions : undefined;
    };

    const handleCreate = async () => {
        if (!form.fromJobRole || !form.toJobRole) return toast.error('Les deux fiches métier sont obligatoires.');
        if (form.fromJobRole === form.toJobRole) return toast.error('Le métier de départ et le métier cible doivent être différents.');
        try {
            setCreating(true);
            await createCareerPath({
                fromJobRole: toIri('job_roles', form.fromJobRole)!,
                toJobRole: toIri('job_roles', form.toJobRole)!,
                conditions: buildConditions(),
            });
            toast.success('Parcours de carrière créé.');
            setIsModalOpen(false);
            setForm(EMPTY_FORM);
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur lors de la création.');
        } finally {
            setCreating(false);
        }
    };

    const inputClass = 'w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white';

    return (
        <PageShell>
            <PageHeader
                title="Parcours de carrière"
                description="Évolutions possibles entre fiches métiers et conditions de promotion."
                actions={
                    <Button variant="pill" size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Nouveau parcours
                    </Button>
                }
            />

            <PageKpiStrip items={[
                { label: 'Total parcours', value: paths.length, icon: GitBranch, tone: 'primary', detail: 'Évolutions définies' },
                { label: 'Métiers sources', value: uniqueFromRoles, icon: BriefcaseBusiness, tone: 'info', detail: 'Points de départ' },
                { label: 'Fiches métiers', value: roles.length, icon: BriefcaseBusiness, tone: 'warning', detail: 'Dans le référentiel' },
            ]} />

            <DataPanel title="Parcours de carrière" description={`${paths.length} évolution(s) possible(s)`} contentClassName="p-0">
                {isLoading ? (
                    <div className="p-32 flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                        <p className="text-sm text-muted-foreground">Chargement des parcours...</p>
                    </div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center gap-4 text-center">
                        <AlertCircle className="w-12 h-12 text-rose-500" />
                        <p>{error}</p>
                        <Button variant="outline" onClick={load}>Réessayer</Button>
                    </div>
                ) : paths.length === 0 ? (
                    <div className="p-20 flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-secondary-100 flex items-center justify-center">
                            <GitBranch className="w-8 h-8 text-secondary-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-secondary-900">Aucun parcours défini</p>
                            <p className="text-sm text-secondary-500 mt-1">Créez des évolutions entre fiches métiers pour structurer la mobilité interne.</p>
                        </div>
                        <Button variant="pill" size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
                            <Plus className="w-4 h-4" />Créer un parcours
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-secondary-100">
                        {paths.map(p => (
                            <div
                                key={p.id}
                                className={cn(
                                    'px-6 py-5 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6',
                                    'hover:bg-secondary-50/60 transition-colors',
                                )}
                            >
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
                                    <RoleChip role={p.fromJobRole} lookup={roles} />
                                    <div className="flex items-center justify-center">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100">
                                            <ArrowRight className="w-4 h-4 text-primary-600" />
                                            <span className="text-xs font-semibold text-primary-700 hidden sm:inline">Évolution</span>
                                        </div>
                                    </div>
                                    <RoleChip role={p.toJobRole} lookup={roles} />
                                </div>
                                <div className="lg:max-w-sm shrink-0">
                                    <ConditionsChips conditions={p.conditions} catalogs={catalogs} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DataPanel>

            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => !creating && setIsModalOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="bg-white rounded-2xl shadow-float w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center justify-between">
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">Nouveau parcours</Dialog.Title>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                                            Métier de départ <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={form.fromJobRole}
                                            onChange={e => setForm(prev => ({ ...prev, fromJobRole: e.target.value }))}
                                            className={inputClass}
                                        >
                                            <option value="">Sélectionner</option>
                                            {roles.map(r => (
                                                <option key={r.id} value={r.id}>{r.title}{r.code ? ` (${r.code})` : ''}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex justify-center">
                                        <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                                            <ArrowRight className="w-4 h-4 text-primary-500" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                                            Métier cible <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={form.toJobRole}
                                            onChange={e => setForm(prev => ({ ...prev, toJobRole: e.target.value }))}
                                            className={inputClass}
                                        >
                                            <option value="">Sélectionner</option>
                                            {roles.filter(r => r.id !== form.fromJobRole).map(r => (
                                                <option key={r.id} value={r.id}>{r.title}{r.code ? ` (${r.code})` : ''}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="pt-2 border-t border-secondary-100">
                                        <p className="text-sm font-semibold text-secondary-900 mb-1">Conditions de promotion</p>
                                        <p className="text-xs text-secondary-500 mb-3">
                                            Vérifiées à la soumission d&apos;une mobilité de type PROMOTION.
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-bold uppercase tracking-widest text-secondary-400 mb-1.5">
                                                    Ancienneté (années)
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    value={form.minimumYears}
                                                    onChange={e => setForm(p => ({ ...p, minimumYears: e.target.value }))}
                                                    className={inputClass}
                                                    placeholder="ex: 2"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold uppercase tracking-widest text-secondary-400 mb-1.5">
                                                    Ancienneté (mois)
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    value={form.minTenureMonths}
                                                    onChange={e => setForm(p => ({ ...p, minTenureMonths: e.target.value }))}
                                                    className={inputClass}
                                                    placeholder="ex: 24"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold uppercase tracking-widest text-secondary-400 mb-1.5">
                                                    Perf. min.
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={5}
                                                    step={0.1}
                                                    value={form.minimumPerformance}
                                                    onChange={e => setForm(p => ({ ...p, minimumPerformance: e.target.value }))}
                                                    className={inputClass}
                                                    placeholder="ex: 3.5"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <label className="block text-[11px] font-bold uppercase tracking-widest text-secondary-400 mb-1.5">
                                                Formations requises (catalogue)
                                            </label>
                                            {catalogs.length === 0 ? (
                                                <p className="text-xs text-secondary-400 py-2">Aucune formation catalogue disponible.</p>
                                            ) : (
                                                <div className="max-h-40 overflow-y-auto rounded-xl border border-secondary-200 divide-y divide-secondary-100">
                                                    {catalogs.map(t => {
                                                        const checked = form.requiredTrainings.includes(t.id);
                                                        return (
                                                            <label
                                                                key={t.id}
                                                                className={cn(
                                                                    'flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-secondary-50 transition-colors',
                                                                    checked && 'bg-primary-50/50',
                                                                )}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() => toggleTraining(t.id)}
                                                                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                                                                />
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-sm font-medium text-secondary-900 truncate">{t.title}</p>
                                                                    <p className="text-[10px] font-mono text-secondary-400">{t.id}</p>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {form.requiredTrainings.length > 0 && (
                                                <p className="text-xs text-primary-600 mt-1.5">
                                                    {form.requiredTrainings.length} formation(s) sélectionnée(s)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={creating}>Annuler</Button>
                                    <Button variant="pill" onClick={handleCreate} disabled={creating} className="gap-2">
                                        {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Créer
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
