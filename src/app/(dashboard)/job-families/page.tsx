'use client';

import { useEffect, useState } from 'react';
import { Plus, Loader2, AlertCircle, Layers, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { getJobFamilies, createJobFamily } from '@/lib/api/jobArchitecture';
import { JobFamily } from '@/types/jobArchitecture';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function JobFamiliesPage() {
    const [families, setFamilies] = useState<JobFamily[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ name: '', code: '', description: '' });

    const load = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setFamilies(await getJobFamilies());
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur de chargement.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        if (!form.name.trim()) return toast.error('Le nom est obligatoire.');
        try {
            setCreating(true);
            await createJobFamily(form);
            toast.success('Famille de métier créée avec succès.');
            setIsModalOpen(false);
            setForm({ name: '', code: '', description: '' });
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur lors de la création.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <PageShell>
            <PageHeader
                title="Familles de métiers"
                description="Regroupement des métiers par domaine d'activité."
                actions={
                    <Button variant="pill" size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Nouvelle famille
                    </Button>
                }
            />

            <PageKpiStrip items={[
                { label: 'Total familles', value: families.length, icon: Layers, tone: 'primary', detail: 'Familles de métiers' },
            ]} />

            <DataPanel title="Familles de métiers" description={`${families.length} famille(s)`} contentClassName="p-0">
                {isLoading ? (
                    <div className="p-32 flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                        <p className="text-sm text-muted-foreground">Chargement...</p>
                    </div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center gap-4 text-center">
                        <AlertCircle className="w-12 h-12 text-rose-500" />
                        <p className="text-secondary-700">{error}</p>
                        <Button variant="outline" onClick={load}>Réessayer</Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6">Nom</TableHead>
                                <TableHead className="px-6">Code</TableHead>
                                <TableHead className="px-6">Description</TableHead>
                                <TableHead className="px-6">Créé le</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {families.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                                        Aucune famille de métier créée.
                                    </TableCell>
                                </TableRow>
                            ) : families.map((f) => (
                                <TableRow key={f.id}>
                                    <TableCell className="px-6 font-semibold">{f.name}</TableCell>
                                    <TableCell className="px-6 text-secondary-600">{f.code || '—'}</TableCell>
                                    <TableCell className="px-6 text-secondary-600 max-w-xs truncate">{f.description || '—'}</TableCell>
                                    <TableCell className="px-6 text-secondary-500 tabular-nums">
                                        {f.createdAt ? format(new Date(f.createdAt), 'dd MMM yyyy', { locale: fr }) : '—'}
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
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">Nouvelle famille de métier</Dialog.Title>
                                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Nom <span className="text-rose-500">*</span></label>
                                        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="Ex: Ingénierie" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Code</label>
                                        <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="Ex: ENG" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Description</label>
                                        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" placeholder="Description de la famille..." />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                                    <Button variant="pill" onClick={handleCreate} disabled={creating}>
                                        {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
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
