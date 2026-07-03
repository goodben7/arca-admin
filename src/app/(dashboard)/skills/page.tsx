'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { Plus, Loader2, AlertCircle, Zap, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { getSkillCategories, createSkillCategory, getSkills, createSkill } from '@/lib/api/skill';
import { SkillCategory, Skill } from '@/types/skill';
import { toIri, resolveRelationLabel } from '@/lib/api-iri';

import { Dialog, Transition } from '@headlessui/react';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type Tab = 'categories' | 'skills';

function toEntityCode(name: string): string {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toUpperCase()
        .slice(0, 32) || 'ITEM';
}

export default function SkillsPage() {
    const [tab, setTab] = useState<Tab>('skills');
    const [categories, setCategories] = useState<SkillCategory[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [catForm, setCatForm] = useState({ name: '', code: '', description: '' });
    const [skillForm, setSkillForm] = useState({ name: '', code: '', category: '', description: '' });
    const [codeManual, setCodeManual] = useState(false);
    const [catCodeManual, setCatCodeManual] = useState(false);

    const load = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [c, s] = await Promise.all([getSkillCategories(), getSkills()]);
            setCategories(c);
            setSkills(s);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur de chargement.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const getCatName = (cat?: unknown) => resolveRelationLabel(cat, categories);

    const handleCreateCategory = async () => {
        if (!catForm.name.trim()) return toast.error('Le nom est obligatoire.');
        const code = catForm.code.trim() || toEntityCode(catForm.name);
        if (!code) return toast.error('Le code est obligatoire.');
        try {
            setCreating(true);
            await createSkillCategory({ name: catForm.name, code, description: catForm.description || undefined });
            toast.success('Catégorie créée.');
            setIsModalOpen(false);
            setCatForm({ name: '', code: '', description: '' });
            setCatCodeManual(false);
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur lors de la création.');
        } finally {
            setCreating(false);
        }
    };

    const handleCreateSkill = async () => {
        if (!skillForm.name.trim()) return toast.error('Le nom est obligatoire.');
        const code = skillForm.code.trim() || toEntityCode(skillForm.name);
        if (!code) return toast.error('Le code est obligatoire.');
        try {
            setCreating(true);
            await createSkill({
                name: skillForm.name,
                code,
                category: toIri('skill_categories', skillForm.category),
                description: skillForm.description || undefined,
            });
            toast.success('Compétence créée.');
            setIsModalOpen(false);
            setSkillForm({ name: '', code: '', category: '', description: '' });
            setCodeManual(false);
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
                title="Compétences"
                description="Catalogue des compétences et catégories de l'organisation."
                actions={
                    <Button variant="pill" size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        {tab === 'categories' ? 'Nouvelle catégorie' : 'Nouvelle compétence'}
                    </Button>
                }
            />

            <PageKpiStrip items={[
                { label: 'Compétences', value: skills.length, icon: Zap, tone: 'primary', detail: 'Dans le catalogue' },
                { label: 'Catégories', value: categories.length, icon: Tag, tone: 'info', detail: 'Groupes de compétences' },
            ]} />

            <div className="flex gap-1 p-1 bg-secondary-100 rounded-xl w-fit">
                {(['skills', 'categories'] as Tab[]).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all', tab === t ? 'bg-white shadow text-secondary-900' : 'text-secondary-500 hover:text-secondary-700')}>
                        {t === 'skills' ? 'Compétences' : 'Catégories'}
                    </button>
                ))}
            </div>

            <DataPanel title={tab === 'skills' ? 'Compétences' : 'Catégories'} description={tab === 'skills' ? `${skills.length} compétence(s)` : `${categories.length} catégorie(s)`} contentClassName="p-0">
                {isLoading ? (
                    <div className="p-32 flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                    </div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center gap-4 text-center">
                        <AlertCircle className="w-12 h-12 text-rose-500" />
                        <p>{error}</p>
                        <Button variant="outline" onClick={load}>Réessayer</Button>
                    </div>
                ) : tab === 'categories' ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6">Nom</TableHead>
                                <TableHead className="px-6">Description</TableHead>
                                <TableHead className="px-6">Compétences</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.length === 0 ? (
                                <TableRow><TableCell colSpan={3} className="h-48 text-center text-muted-foreground">Aucune catégorie.</TableCell></TableRow>
                            ) : categories.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell className="px-6 font-semibold">{c.name}</TableCell>
                                    <TableCell className="px-6 text-secondary-500 max-w-xs truncate">{c.description || '—'}</TableCell>
                                    <TableCell className="px-6">
                                        <Badge variant="secondary">
                                            {skills.filter(s => {
                                                const cat = s.category;
                                                if (!cat) return false;
                                                if (typeof cat === 'object') return (cat as SkillCategory).id === c.id || (cat as SkillCategory)['@id'] === c['@id'];
                                                return cat === c.id || cat === c['@id'];
                                            }).length}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6">Nom</TableHead>
                                <TableHead className="px-6">Code</TableHead>
                                <TableHead className="px-6">Catégorie</TableHead>
                                <TableHead className="px-6">Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {skills.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="h-48 text-center text-muted-foreground">Aucune compétence.</TableCell></TableRow>
                            ) : skills.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell className="px-6 font-semibold">{s.name}</TableCell>
                                    <TableCell className="px-6">
                                        {s.code ? <span className="font-mono text-xs text-secondary-600 bg-secondary-100 px-2 py-0.5 rounded">{s.code}</span> : '—'}
                                    </TableCell>
                                    <TableCell className="px-6">
                                        {s.category ? <Badge variant="secondary">{getCatName(s.category)}</Badge> : '—'}
                                    </TableCell>
                                    <TableCell className="px-6 text-secondary-500 max-w-xs truncate">{s.description || '—'}</TableCell>
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
                                        {tab === 'categories' ? 'Nouvelle catégorie' : 'Nouvelle compétence'}
                                    </Dialog.Title>
                                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
                                </div>
                                {tab === 'categories' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Nom <span className="text-rose-500">*</span></label>
                                            <input
                                                value={catForm.name}
                                                onChange={e => {
                                                    const name = e.target.value;
                                                    setCatForm(p => ({
                                                        ...p,
                                                        name,
                                                        code: catCodeManual ? p.code : toEntityCode(name),
                                                    }));
                                                }}
                                                className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                                placeholder="Ex: Compétences techniques"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Code <span className="text-rose-500">*</span></label>
                                            <input
                                                value={catForm.code}
                                                onChange={e => {
                                                    setCatCodeManual(true);
                                                    setCatForm(p => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') }));
                                                }}
                                                className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                                placeholder="Ex: TECH"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Description</label>
                                            <textarea value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Nom <span className="text-rose-500">*</span></label>
                                            <input
                                                value={skillForm.name}
                                                onChange={e => {
                                                    const name = e.target.value;
                                                    setSkillForm(p => ({
                                                        ...p,
                                                        name,
                                                        code: codeManual ? p.code : toEntityCode(name),
                                                    }));
                                                }}
                                                className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                                placeholder="Ex: Python, Gestion de projet..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Code <span className="text-rose-500">*</span></label>
                                            <input
                                                value={skillForm.code}
                                                onChange={e => {
                                                    setCodeManual(true);
                                                    setSkillForm(p => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') }));
                                                }}
                                                className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                                placeholder="Ex: PYTHON"
                                            />
                                            <p className="text-xs text-secondary-400 mt-1">Généré automatiquement depuis le nom, modifiable.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Catégorie</label>
                                            <select value={skillForm.category} onChange={e => setSkillForm(p => ({ ...p, category: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
                                                <option value="">Sans catégorie</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Description</label>
                                            <textarea value={skillForm.description} onChange={e => setSkillForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" />
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                                    <Button variant="pill" onClick={tab === 'categories' ? handleCreateCategory : handleCreateSkill} disabled={creating}>
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
