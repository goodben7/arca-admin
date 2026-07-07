'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { Plus, Loader2, AlertCircle, BookMarked, Search, X, Clock, Banknote, Building2, Pencil, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { FilterBar } from '@/components/layout/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { getTrainingCatalogs, createTrainingCatalog, updateTrainingCatalog } from '@/lib/api/trainingCatalog';
import { TrainingCatalog } from '@/types/trainingCatalog';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const EMPTY_FORM = { title: '', description: '', provider: '', duration: '1', cost: '' };

function formatDuration(t: TrainingCatalog) {
    if (!t.duration) return '—';
    return t.durationUnit ? `${t.duration} ${t.durationUnit}` : `${t.duration} h`;
}

export default function TrainingCatalogPage() {
    const [catalog, setCatalog] = useState<TrainingCatalog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [selected, setSelected] = useState<TrainingCatalog | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState(EMPTY_FORM);

    const load = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setCatalog(await getTrainingCatalogs());
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return catalog;
        const q = search.toLowerCase();
        return catalog.filter(t =>
            t.title.toLowerCase().includes(q) ||
            (t.provider || '').toLowerCase().includes(q) ||
            (t.description || '').toLowerCase().includes(q)
        );
    }, [catalog, search]);

    const stats = useMemo(() => ({
        total: catalog.length,
        withCost: catalog.filter(c => c.cost).length,
        avgDuration: catalog.length
            ? Math.round(catalog.reduce((s, c) => s + (c.duration || 0), 0) / catalog.length)
            : 0,
    }), [catalog]);

    const handleCreate = async () => {
        if (!form.title.trim()) return toast.error('Le titre est obligatoire.');
        const duration = parseInt(form.duration, 10);
        if (!duration || duration < 1) return toast.error('La durée doit être au moins 1.');
        try {
            setCreating(true);
            await createTrainingCatalog({
                title: form.title,
                description: form.description || undefined,
                provider: form.provider || undefined,
                duration,
                cost: form.cost || undefined,
            });
            toast.success('Formation ajoutée au catalogue.');
            setIsModalOpen(false);
            setForm(EMPTY_FORM);
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setCreating(false);
        }
    };

    const openDetail = (t: TrainingCatalog) => {
        setSelected(t);
        setIsEditing(false);
        setEditForm({
            title: t.title,
            description: t.description || '',
            provider: t.provider || '',
            duration: String(t.duration || 1),
            cost: t.cost || '',
        });
    };

    const handleUpdate = async () => {
        if (!selected) return;
        if (!editForm.title.trim()) return toast.error('Le titre est obligatoire.');
        const duration = parseInt(editForm.duration, 10);
        if (!duration || duration < 1) return toast.error('La durée doit être au moins 1.');
        try {
            setSaving(true);
            await updateTrainingCatalog(selected.id, {
                title: editForm.title,
                description: editForm.description,
                provider: editForm.provider,
                duration,
                cost: editForm.cost,
            });
            toast.success('Formation mise à jour.');
            setIsEditing(false);
            setSelected(null);
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <PageShell>
            <PageHeader
                title="Catalogue de formations"
                description="Référentiel des formations disponibles dans l'organisation."
                actions={
                    <Button variant="pill" size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4" />Ajouter une formation
                    </Button>
                }
            />

            <PageKpiStrip items={[
                { label: 'Formations', value: stats.total, icon: BookMarked, tone: 'primary', detail: 'Dans le catalogue' },
                { label: 'Durée moyenne', value: stats.avgDuration ? `${stats.avgDuration} h` : '—', icon: Clock, tone: 'info', detail: 'Heures par formation' },
                { label: 'Avec coût', value: stats.withCost, icon: Banknote, tone: 'warning', detail: 'Tarifs renseignés' },
            ]} />

            <FilterBar>
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par titre, prestataire ou description..." className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                </div>
            </FilterBar>

            <DataPanel title="Catalogue" description={`${filtered.length} formation(s)`} contentClassName="p-0">
                {isLoading ? (
                    <div className="p-32 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-rose-500" /><p>{error}</p></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6">Titre</TableHead>
                                <TableHead className="px-6">Prestataire</TableHead>
                                <TableHead className="px-6">Durée</TableHead>
                                <TableHead className="px-6">Coût</TableHead>
                                <TableHead className="px-6">ID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">Catalogue vide.</TableCell></TableRow>
                            ) : filtered.map(t => (
                                <TableRow key={t.id} className="cursor-pointer hover:bg-secondary-50/60" onClick={() => openDetail(t)}>
                                    <TableCell className="px-6">
                                        <p className="font-semibold text-secondary-900">{t.title}</p>
                                        {t.description && <p className="text-xs text-secondary-500 truncate max-w-xs mt-0.5">{t.description}</p>}
                                    </TableCell>
                                    <TableCell className="px-6 text-secondary-600">{t.provider || '—'}</TableCell>
                                    <TableCell className="px-6 text-secondary-600 tabular-nums">{formatDuration(t)}</TableCell>
                                    <TableCell className="px-6 text-secondary-700 font-medium">{t.cost || '—'}</TableCell>
                                    <TableCell className="px-6 text-xs font-mono text-secondary-400">{t.id}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DataPanel>

            {/* Create modal */}
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
                            className="w-full max-w-lg"
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="bg-white rounded-2xl shadow-float w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center justify-between">
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">Nouvelle formation</Dialog.Title>
                                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Titre <span className="text-rose-500">*</span></label>
                                        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="Ex: Gestion de projet Agile" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Prestataire</label>
                                            <input value={form.provider} onChange={e => setForm(p => ({ ...p, provider: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="Nom organisme" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Durée (heures) <span className="text-rose-500">*</span></label>
                                            <input type="number" min={1} value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Coût</label>
                                        <input value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="Ex: 1500 USD, 800 EUR..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Description</label>
                                        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                                    <Button variant="pill" onClick={handleCreate} disabled={creating}>
                                        {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Ajouter
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>

            {/* Detail / edit modal */}
            <Transition appear show={!!selected} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => { setSelected(null); setIsEditing(false); }}>
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
                            className="w-full max-w-lg"
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="bg-white rounded-2xl shadow-float w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                                {selected && (
                                    <>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                                                <BookMarked className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-lg font-bold text-secondary-900 leading-tight">
                                                    {isEditing ? 'Modifier la formation' : selected.title}
                                                </Dialog.Title>
                                                <p className="text-xs font-mono text-secondary-400 mt-1">{selected.id}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => { setSelected(null); setIsEditing(false); }} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center shrink-0">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {isEditing ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-1.5">Titre <span className="text-rose-500">*</span></label>
                                                <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-secondary-700 mb-1.5">Prestataire</label>
                                                    <input value={editForm.provider} onChange={e => setEditForm(p => ({ ...p, provider: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-secondary-700 mb-1.5">Durée (h)</label>
                                                    <input type="number" min={1} value={editForm.duration} onChange={e => setEditForm(p => ({ ...p, duration: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-1.5">Coût</label>
                                                <input value={editForm.cost} onChange={e => setEditForm(p => ({ ...p, cost: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-1.5">Description</label>
                                                <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-secondary-200 rounded-xl text-sm resize-none" />
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2">
                                                <Button variant="outline" onClick={() => setIsEditing(false)}>Annuler</Button>
                                                <Button variant="pill" onClick={handleUpdate} disabled={saving} className="gap-2">
                                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    Enregistrer
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <dl className="grid grid-cols-1 gap-4 p-4 rounded-xl border border-secondary-100 bg-secondary-50/40">
                                                <div className="flex items-center gap-3">
                                                    <Building2 className="w-4 h-4 text-secondary-400 shrink-0" />
                                                    <div>
                                                        <dt className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Prestataire</dt>
                                                        <dd className="text-sm text-secondary-800">{selected.provider || '—'}</dd>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Clock className="w-4 h-4 text-secondary-400 shrink-0" />
                                                    <div>
                                                        <dt className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Durée</dt>
                                                        <dd className="text-sm text-secondary-800">{formatDuration(selected)}</dd>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Banknote className="w-4 h-4 text-secondary-400 shrink-0" />
                                                    <div>
                                                        <dt className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Coût</dt>
                                                        <dd className="text-sm text-secondary-800 font-medium">{selected.cost || '—'}</dd>
                                                    </div>
                                                </div>
                                                {selected.description && (
                                                    <div>
                                                        <dt className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Description</dt>
                                                        <dd className="text-sm text-secondary-700 mt-1">{selected.description}</dd>
                                                    </div>
                                                )}
                                                {selected.createdAt && (
                                                    <div>
                                                        <dt className="text-[10px] font-bold uppercase tracking-widest text-secondary-400">Créé le</dt>
                                                        <dd className="text-sm text-secondary-600 mt-1">{format(new Date(selected.createdAt), 'dd MMMM yyyy', { locale: fr })}</dd>
                                                    </div>
                                                )}
                                            </dl>
                                            <div className="flex justify-end">
                                                <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditing(true)}>
                                                    <Pencil className="w-4 h-4" />Modifier
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                    </>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </PageShell>
    );
}
