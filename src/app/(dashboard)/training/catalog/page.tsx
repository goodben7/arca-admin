'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { Plus, Loader2, AlertCircle, BookMarked, Search, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { FilterBar } from '@/components/layout/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { getTrainingCatalogs, createTrainingCatalog } from '@/lib/api/trainingCatalog';
import { TrainingCatalog } from '@/types/trainingCatalog';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from '@/lib/toast';

const FORMAT_OPTIONS = ['PRÉSENTIEL', 'DISTANCIEL', 'MIXTE', 'E-LEARNING'];

export default function TrainingCatalogPage() {
    const [catalog, setCatalog] = useState<TrainingCatalog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', duration: '', durationUnit: 'heures', provider: '', format: '' });

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
        return catalog.filter(t => t.title.toLowerCase().includes(q) || (t.provider || '').toLowerCase().includes(q));
    }, [catalog, search]);

    const handleCreate = async () => {
        if (!form.title.trim()) return toast.error('Le titre est obligatoire.');
        try {
            setCreating(true);
            await createTrainingCatalog({
                title: form.title,
                description: form.description || undefined,
                duration: form.duration ? parseInt(form.duration) : undefined,
                durationUnit: form.durationUnit || undefined,
                provider: form.provider || undefined,
                format: form.format || undefined,
            });
            toast.success('Formation ajoutée au catalogue.');
            setIsModalOpen(false);
            setForm({ title: '', description: '', duration: '', durationUnit: 'heures', provider: '', format: '' });
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
                title="Catalogue de formations"
                description="Référentiel des formations disponibles dans l'organisation."
                actions={
                    <Button variant="pill" size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4" />Ajouter une formation
                    </Button>
                }
            />

            <PageKpiStrip items={[
                { label: 'Formations', value: catalog.length, icon: BookMarked, tone: 'primary', detail: 'Dans le catalogue' },
                { label: 'Distanciel', value: catalog.filter(c => c.format === 'DISTANCIEL').length, icon: Clock, tone: 'info', detail: 'Formations en ligne' },
            ]} />

            <FilterBar>
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par titre ou prestataire..." className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
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
                                <TableHead className="px-6">Format</TableHead>
                                <TableHead className="px-6">Durée</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="h-48 text-center text-muted-foreground">Catalogue vide.</TableCell></TableRow>
                            ) : filtered.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell className="px-6">
                                        <div>
                                            <p className="font-semibold text-secondary-900">{t.title}</p>
                                            {t.description && <p className="text-xs text-secondary-500 truncate max-w-xs">{t.description}</p>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 text-secondary-600">{t.provider || '—'}</TableCell>
                                    <TableCell className="px-6">{t.format ? <Badge variant="secondary">{t.format}</Badge> : '—'}</TableCell>
                                    <TableCell className="px-6 text-secondary-600">{t.duration ? `${t.duration} ${t.durationUnit || ''}` : '—'}</TableCell>
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
                            <Dialog.Panel className="bg-white rounded-2xl shadow-float w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
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
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Format</label>
                                            <select value={form.format} onChange={e => setForm(p => ({ ...p, format: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
                                                <option value="">Choisir</option>
                                                {FORMAT_OPTIONS.map(f => <option key={f}>{f}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Durée</label>
                                            <input type="number" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Unité</label>
                                            <select value={form.durationUnit} onChange={e => setForm(p => ({ ...p, durationUnit: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
                                                <option value="heures">Heures</option>
                                                <option value="jours">Jours</option>
                                                <option value="semaines">Semaines</option>
                                            </select>
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
                                        {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Ajouter
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
