'use client';

import { useEffect, useState, Fragment } from 'react';
import { Plus, Loader2, AlertCircle, Award, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { getGrades, createGrade, updateGrade } from '@/lib/api/jobArchitecture';
import { Grade } from '@/types/jobArchitecture';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from '@/lib/toast';

export default function GradesPage() {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Grade | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', code: '', rank: '', description: '' });

    const load = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setGrades(await getGrades());
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur de chargement.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', code: '', rank: '', description: '' });
        setIsModalOpen(true);
    };

    const openEdit = (g: Grade) => {
        setEditing(g);
        setForm({
            name: g.name || '',
            code: g.code || '',
            rank: g.rank != null ? String(g.rank) : '',
            description: g.description || '',
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return toast.error('Le nom est obligatoire.');
        try {
            setSaving(true);
            const payload = {
                name: form.name,
                code: form.code || undefined,
                rank: form.rank ? parseInt(form.rank, 10) : undefined,
                description: form.description || undefined,
            };
            if (editing) {
                await updateGrade(editing.id, payload);
                toast.success('Grade mis à jour.');
            } else {
                await createGrade(payload);
                toast.success('Grade créé avec succès.');
            }
            setIsModalOpen(false);
            setEditing(null);
            setForm({ name: '', code: '', rank: '', description: '' });
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <PageShell>
            <PageHeader
                title="Grades"
                description="Niveaux hiérarchiques et grilles salariales de référence."
                actions={
                    <Button variant="pill" size="sm" className="gap-2" onClick={openCreate}>
                        <Plus className="w-4 h-4" />
                        Nouveau grade
                    </Button>
                }
            />

            <PageKpiStrip items={[
                { label: 'Total grades', value: grades.length, icon: Award, tone: 'primary', detail: 'Niveaux définis' },
            ]} />

            <DataPanel title="Grades" description={`${grades.length} grade(s)`} contentClassName="p-0">
                {isLoading ? (
                    <div className="p-32 flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
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
                                <TableHead className="px-6">Rang</TableHead>
                                <TableHead className="px-6">Description</TableHead>
                                <TableHead className="px-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {grades.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                        Aucun grade créé.
                                    </TableCell>
                                </TableRow>
                            ) : grades.map((g) => (
                                <TableRow key={g.id}>
                                    <TableCell className="px-6 font-semibold">{g.name}</TableCell>
                                    <TableCell className="px-6 text-secondary-600">{g.code || '—'}</TableCell>
                                    <TableCell className="px-6 text-secondary-600">{g.rank ?? '—'}</TableCell>
                                    <TableCell className="px-6 text-secondary-500 max-w-xs truncate">{g.description || '—'}</TableCell>
                                    <TableCell className="px-6 text-right">
                                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => openEdit(g)}>
                                            <Pencil className="w-3.5 h-3.5" /> Modifier
                                        </Button>
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
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">
                                        {editing ? 'Modifier le grade' : 'Nouveau grade'}
                                    </Dialog.Title>
                                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Nom <span className="text-rose-500">*</span></label>
                                        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="Ex: Grade A" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Code</label>
                                            <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="GA" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Rang</label>
                                            <input type="number" value={form.rank} onChange={e => setForm(p => ({ ...p, rank: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="1" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Description</label>
                                        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" placeholder="Description optionnelle..." />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                                    <Button variant="pill" onClick={handleSave} disabled={saving}>
                                        {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
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
