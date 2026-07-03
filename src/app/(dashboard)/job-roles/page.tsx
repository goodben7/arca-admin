'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { Plus, Loader2, AlertCircle, BriefcaseBusiness, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { FilterBar } from '@/components/layout/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { getJobRoles, createJobRole, getJobFamilies, getGrades } from '@/lib/api/jobArchitecture';
import { createJobRoleRequiredSkill, getJobRoleRequiredSkills, getSkills } from '@/lib/api/skill';
import { toIri, relationName } from '@/lib/api-iri';
import { JobRole, JobFamily, Grade } from '@/types/jobArchitecture';
import { JobRoleRequiredSkill, Skill, SKILL_LEVEL_LABELS, SkillLevel } from '@/types/skill';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from '@/lib/toast';

export default function JobRolesPage() {
    const [roles, setRoles] = useState<JobRole[]>([]);
    const [families, setFamilies] = useState<JobFamily[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ title: '', code: '', jobFamily: '', grade: '', description: '', responsibilities: '' });

    const [skillsRole, setSkillsRole] = useState<JobRole | null>(null);
    const [requiredSkills, setRequiredSkills] = useState<JobRoleRequiredSkill[]>([]);
    const [skillsCatalog, setSkillsCatalog] = useState<Skill[]>([]);
    const [skillsLoading, setSkillsLoading] = useState(false);
    const [addingSkill, setAddingSkill] = useState(false);
    const [skillForm, setSkillForm] = useState({ skillId: '', requiredLevel: 'INTERMEDIATE' as SkillLevel, mandatory: true });

    const load = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [r, f, g] = await Promise.all([getJobRoles(), getJobFamilies(), getGrades()]);
            setRoles(r);
            setFamilies(f);
            setGrades(g);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur de chargement.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return roles;
        const q = search.toLowerCase();
        return roles.filter(r => r.title.toLowerCase().includes(q) || (r.code || '').toLowerCase().includes(q));
    }, [roles, search]);

    const getEmbeddedName = relationName;

    const handleCreate = async () => {
        if (!form.title.trim()) return toast.error('Le titre est obligatoire.');
        try {
            setCreating(true);
            await createJobRole({
                title: form.title,
                code: form.code || undefined,
                jobFamily: toIri('job_families', form.jobFamily),
                grade: toIri('grades', form.grade),
                description: form.description || undefined,
                responsibilities: form.responsibilities || undefined,
            });
            toast.success('Fiche métier créée.');
            setIsModalOpen(false);
            setForm({ title: '', code: '', jobFamily: '', grade: '', description: '', responsibilities: '' });
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur lors de la création.');
        } finally {
            setCreating(false);
        }
    };

    const openSkillsModal = async (role: JobRole) => {
        setSkillsRole(role);
        setSkillsLoading(true);
        try {
            const [req, catalog] = await Promise.all([
                getJobRoleRequiredSkills(role.id),
                getSkills(),
            ]);
            setRequiredSkills(req);
            setSkillsCatalog(catalog);
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur de chargement des compétences.');
        } finally {
            setSkillsLoading(false);
        }
    };

    const skillName = (ref: string) => {
        const id = ref.split('/').pop() || ref;
        const s = skillsCatalog.find(x => x.id === id || x['@id'] === ref);
        return s ? (s.code ? `${s.name} (${s.code})` : s.name) : id;
    };

    const handleAddRequiredSkill = async () => {
        if (!skillsRole || !skillForm.skillId) return toast.error('Sélectionnez une compétence.');
        try {
            setAddingSkill(true);
            await createJobRoleRequiredSkill({
                jobRole: toIri('job_roles', skillsRole.id)!,
                skill: toIri('skills', skillForm.skillId)!,
                requiredLevel: skillForm.requiredLevel,
                mandatory: skillForm.mandatory,
            });
            setRequiredSkills(await getJobRoleRequiredSkills(skillsRole.id));
            setSkillForm({ skillId: '', requiredLevel: 'INTERMEDIATE', mandatory: true });
            toast.success('Compétence requise ajoutée.');
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setAddingSkill(false);
        }
    };

    return (
        <PageShell>
            <PageHeader
                title="Fiches métiers"
                description="Référentiel des postes et rôles disponibles dans l'organisation."
                actions={
                    <Button variant="pill" size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Nouvelle fiche
                    </Button>
                }
            />

            <PageKpiStrip items={[
                { label: 'Total fiches', value: roles.length, icon: BriefcaseBusiness, tone: 'primary', detail: 'Métiers définis' },
                { label: 'Familles', value: families.length, icon: BriefcaseBusiness, tone: 'info', detail: 'Familles de métiers' },
                { label: 'Grades', value: grades.length, icon: BriefcaseBusiness, tone: 'warning', detail: 'Niveaux de grade' },
            ]} />

            <FilterBar>
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par titre ou code..." className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                </div>
            </FilterBar>

            <DataPanel title="Fiches métiers" description={`${filtered.length} fiche(s)`} contentClassName="p-0">
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
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6">Titre</TableHead>
                                <TableHead className="px-6">Code</TableHead>
                                <TableHead className="px-6">Famille</TableHead>
                                <TableHead className="px-6">Grade</TableHead>
                                <TableHead className="px-6">Description</TableHead>
                                <TableHead className="px-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="h-48 text-center text-muted-foreground">Aucune fiche métier.</TableCell></TableRow>
                            ) : filtered.map(r => (
                                <TableRow key={r.id}>
                                    <TableCell className="px-6 font-semibold">{r.title}</TableCell>
                                    <TableCell className="px-6 text-secondary-600">{r.code || '—'}</TableCell>
                                    <TableCell className="px-6 text-secondary-600">{getEmbeddedName(r.jobFamily)}</TableCell>
                                    <TableCell className="px-6 text-secondary-600">{getEmbeddedName(r.grade)}</TableCell>
                                    <TableCell className="px-6 text-secondary-500 max-w-xs truncate">{r.description || '—'}</TableCell>
                                    <TableCell className="px-6 text-right">
                                        <Button variant="outline" size="sm" onClick={() => openSkillsModal(r)}>
                                            Compétences requises
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
                            <Dialog.Panel className="bg-white rounded-2xl shadow-float w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center justify-between">
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">Nouvelle fiche métier</Dialog.Title>
                                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Titre <span className="text-rose-500">*</span></label>
                                        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="Ex: Développeur Senior" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Code</label>
                                            <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="DEV-SR" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Grade</label>
                                            <select value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
                                                <option value="">Sélectionner</option>
                                                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Famille de métier</label>
                                        <select value={form.jobFamily} onChange={e => setForm(p => ({ ...p, jobFamily: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
                                            <option value="">Sélectionner</option>
                                            {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Description</label>
                                        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Responsabilités</label>
                                        <textarea value={form.responsibilities} onChange={e => setForm(p => ({ ...p, responsibilities: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" />
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

            <Transition appear show={!!skillsRole} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setSkillsRole(null)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="bg-white rounded-2xl shadow-float w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center justify-between">
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">
                                        Compétences requises — {skillsRole?.title}
                                    </Dialog.Title>
                                    <button onClick={() => setSkillsRole(null)} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
                                </div>
                                {skillsLoading ? (
                                    <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
                                ) : (
                                    <>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {requiredSkills.length === 0 ? (
                                                <p className="text-sm text-secondary-500 italic">Aucune compétence requise définie.</p>
                                            ) : requiredSkills.map(rs => (
                                                <div key={rs.id} className="flex items-center justify-between p-3 rounded-xl border border-secondary-100 bg-secondary-50/50 text-sm">
                                                    <span className="font-medium">{skillName(rs.skill as string)}</span>
                                                    <span className="text-xs text-secondary-500">
                                                        {SKILL_LEVEL_LABELS[rs.requiredLevel as SkillLevel] || rs.requiredLevel}
                                                        {rs.mandatory ? ' · Obligatoire' : ''}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="border-t border-secondary-100 pt-4 space-y-3">
                                            <p className="text-sm font-semibold text-secondary-800">Ajouter une compétence</p>
                                            <select value={skillForm.skillId} onChange={e => setSkillForm(p => ({ ...p, skillId: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm bg-white">
                                                <option value="">Sélectionner...</option>
                                                {skillsCatalog.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>
                                                ))}
                                            </select>
                                            <select value={skillForm.requiredLevel} onChange={e => setSkillForm(p => ({ ...p, requiredLevel: e.target.value as SkillLevel }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm bg-white">
                                                {Object.entries(SKILL_LEVEL_LABELS).map(([k, v]) => (
                                                    <option key={k} value={k}>{v}</option>
                                                ))}
                                            </select>
                                            <label className="flex items-center gap-2 text-sm text-secondary-700">
                                                <input type="checkbox" checked={skillForm.mandatory} onChange={e => setSkillForm(p => ({ ...p, mandatory: e.target.checked }))} />
                                                Obligatoire
                                            </label>
                                            <Button variant="pill" className="w-full" onClick={handleAddRequiredSkill} disabled={addingSkill}>
                                                {addingSkill && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Ajouter
                                            </Button>
                                        </div>
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
