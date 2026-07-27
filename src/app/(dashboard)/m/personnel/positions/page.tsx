'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Briefcase, Search, Filter, Plus, Building2,
    ChevronRight, TrendingUp, Target, Loader2, AlertCircle, X, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';
import { Position, POSITION_LEVEL_LABELS, POSITION_STATUS_LABELS } from '@/types/position';
import { getAllPositions, createPosition, openPosition, closePosition } from '@/lib/api/position';
import { getDepartments } from '@/lib/api/employee';
import { Department } from '@/types/employee';
import { Power, PowerOff, ShieldCheck } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from '@/lib/toast';
import { FilterBar } from '@/components/layout/FilterBar';
import { DataPanel } from '@/components/layout/DataPanel';
import { PageKpiStrip } from '@/components/layout/PageKpi';

export default function PositionsPage() {
    const [positions, setPositions] = useState<Position[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [form, setForm] = useState({
        title: '',
        department: '',
        level: 'JUNIOR',
        description: '',
        headcount: 1,
        openPositions: 1,
        status: 'OPEN'
    });

    function showToast(msg: string, type: 'success' | 'error') {
        if (type === 'success') toast.success(msg);
        else toast.error(msg);
    }

    async function loadData() {
        try {
            setIsLoading(true);
            const [posData, depData] = await Promise.all([
                getAllPositions(),
                getDepartments()
            ]);

            const pList = Array.isArray(posData) ? posData : (posData as any)['hydra:member'] || (posData as any).member || [];
            const dList = Array.isArray(depData) ? depData : (depData as any)['hydra:member'] || (depData as any).member || [];

            setPositions(pList);
            setDepartments(dList);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    function openCreate() {
        setForm({
            title: '',
            department: departments.length > 0 ? `/api/departments/${departments[0].id}` : '',
            level: 'JUNIOR',
            description: '',
            headcount: 1,
            openPositions: 1,
            status: 'OPEN'
        });
        setIsModalOpen(true);
    }

    async function handleSave() {
        if (!form.title.trim() || !form.department) {
            showToast('Titre et département obligatoires', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const payload = { ...form };
            await createPosition(payload);

            showToast('Poste créé avec succès.', 'success');
            setIsModalOpen(false);
            loadData();
        } catch (e: any) {
            showToast(e.message, 'error');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleToggleStatus(pos: Position) {
        setIsSaving(true);
        try {
            if (pos.status === 'OPEN') {
                await closePosition(pos.id);
                showToast(`Le poste ${pos.title} a été fermé.`, 'success');
            } else {
                await openPosition(pos.id);
                showToast(`Le poste ${pos.title} est désormais ouvert.`, 'success');
            }
            loadData();
        } catch (e: any) {
            showToast(e.message, 'error');
        } finally {
            setIsSaving(false);
        }
    }

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return positions;
        return positions.filter(p =>
            p.title.toLowerCase().includes(q) ||
            (p.department && p.department.toLowerCase().includes(q))
        );
    }, [positions, search]);

    const stats = {
        total: positions.length,
        open: positions.reduce((acc, p) => acc + (p.openPositions || 0), 0),
        active: positions.filter(p => p.status === 'OPEN').length,
    };

    return (
        <PageShell className="pb-12">
            <PageHeader
                title="Postes & Fonctions"
                description="Répertoire des métiers et gestion de la nomenclature des postes."
                actions={
                    <Button onClick={openCreate} variant="pill" size="sm" className="gap-2">
                        <Plus className="w-4 h-4" /> Nouveau poste
                    </Button>
                }
            />

            <PageKpiStrip
                items={[
                    { label: 'Métiers référencés', value: stats.total, icon: Briefcase, tone: 'primary', detail: 'Fiches poste actives' },
                    { label: 'Postes ouverts', value: stats.active, icon: Target, tone: 'success', detail: 'Recrutement possible' },
                    { label: 'Recrutements en cours', value: stats.open, icon: TrendingUp, tone: 'warning', detail: 'Ouvertures à pourvoir' },
                    { label: 'Taux d\'ouverture', value: stats.total ? `${Math.round((stats.active / stats.total) * 100)}%` : '0%', icon: Building2, tone: 'info', detail: 'Postes disponibles' },
                ]}
            />

            <FilterBar>
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher par intitulé..."
                        className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-secondary-400"
                    />
                </div>
            </FilterBar>

            <DataPanel title="Liste des postes" contentClassName="p-0">
                {isLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4 text-secondary-400">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                        <span className="text-xs font-black uppercase tracking-widest animate-pulse">Chargement des postes...</span>
                    </div>
                ) : error ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-4">
                        <AlertCircle className="w-12 h-12 text-rose-500/50" />
                        <span className="text-sm font-bold text-rose-600 italic">{error}</span>
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-secondary-100">
                                    <TableHead className="px-6">Intitulé du poste</TableHead>
                                    <TableHead className="px-6">Département</TableHead>
                                    <TableHead className="px-6">Niveau</TableHead>
                                    <TableHead className="px-6">Effectif</TableHead>
                                    <TableHead className="px-6">Ouvertures</TableHead>
                                    <TableHead className="px-6">Statut</TableHead>
                                    <TableHead className="px-6 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                                            Aucun poste ne correspond à votre recherche.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((pos) => {
                                        let deptName = pos.department;
                                        if (deptName && deptName.includes('/api/departments/')) {
                                            const depId = deptName.split('/').pop();
                                            const foundDep = departments.find(d => d.id === depId);
                                            deptName = foundDep ? foundDep.name : (depId || deptName);
                                        }

                                        return (
                                            <TableRow key={pos.id} className="group">
                                                <TableCell className="px-6 font-semibold text-secondary-900">{pos.title}</TableCell>
                                                <TableCell className="px-6">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                                                        <span className="text-secondary-700">{deptName || '—'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <Badge variant="outline">
                                                        {POSITION_LEVEL_LABELS[pos.level] || pos.level || '—'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-6 font-medium tabular-nums">{pos.headcount || 0}</TableCell>
                                                <TableCell className="px-6">
                                                    {pos.openPositions > 0 ? (
                                                        <Badge variant="warning">+{pos.openPositions}</Badge>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">Complet</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <Badge variant={pos.status === 'OPEN' ? 'success' : 'destructive'}>
                                                        {POSITION_STATUS_LABELS[pos.status] || pos.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-6 text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleToggleStatus(pos)}
                                                        className={cn(
                                                            'h-9 gap-1.5',
                                                            pos.status === 'OPEN'
                                                                ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                                                                : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                                                        )}
                                                    >
                                                        {pos.status === 'OPEN' ? (
                                                            <><PowerOff className="w-3.5 h-3.5" /> Fermer</>
                                                        ) : (
                                                            <><Power className="w-3.5 h-3.5" /> Ouvrir</>
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                        <div className="p-6 border-t border-primary-100/40 table-footer-wash">
                            <p className="text-sm text-secondary-600">
                                <span className="font-semibold text-secondary-900">{filtered.length}</span> poste{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
                            </p>
                        </div>
                    </>
                )}
            </DataPanel>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-secondary-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
                    <Card className="w-full max-w-2xl border-none shadow-3xl bg-white rounded-xl overflow-hidden animate-in zoom-in-95 duration-200 mb-8">
                        <CardHeader className="p-8 border-b border-secondary-50 flex flex-row items-center justify-between bg-primary-50/30">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-100">
                                    <Briefcase className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-black text-secondary-900 uppercase tracking-tighter">
                                        Nouveau Poste
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-0.5">Créer une nouvelle fiche de poste</CardDescription>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full h-9 w-9">
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {/* Title & Level */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">Intitulé du poste *</Label>
                                    <Input
                                        className="h-12 rounded-xl font-bold"
                                        placeholder="ex: Développeur Backend"
                                        value={form.title}
                                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">Niveau de responsabilité *</Label>
                                    <Select
                                        className="h-12 rounded-xl font-bold"
                                        value={form.level}
                                        onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                                    >
                                        {Object.entries(POSITION_LEVEL_LABELS).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </Select>
                                </div>
                            </div>

                            {/* Department & Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">Département *</Label>
                                    <Select
                                        className="h-12 rounded-xl font-bold"
                                        value={form.department}
                                        onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                                    >
                                        <option value="" disabled>Sélectionner un département</option>
                                        {departments.map((dept) => (
                                            // The API expects an IRI format for relationships
                                            <option key={dept.id} value={`/api/departments/${dept.id}`}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">Statut du poste *</Label>
                                    <Select
                                        className="h-12 rounded-xl font-bold"
                                        value={form.status}
                                        onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                                    >
                                        {Object.entries(POSITION_STATUS_LABELS).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </Select>
                                </div>
                            </div>

                            {/* Headcounts */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">Effectif cible (Headcount) *</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        className="h-12 rounded-xl font-bold"
                                        value={form.headcount}
                                        onChange={e => setForm(f => ({ ...f, headcount: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">Postes ouverts actuellement *</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        className="h-12 rounded-xl font-bold"
                                        value={form.openPositions}
                                        onChange={e => setForm(f => ({ ...f, openPositions: parseInt(e.target.value) || 0 }))}
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">Description du poste</Label>
                                <Textarea
                                    className="rounded-xl font-medium min-h-[100px] resize-none"
                                    placeholder="Décrivez les responsabilités et attentes..."
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-secondary-50">
                                <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}
                                    className="flex-1 py-6 rounded-2xl font-bold uppercase tracking-widest text-xs border-secondary-200">
                                    Annuler
                                </Button>
                                <Button onClick={handleSave} disabled={isSaving || !form.title.trim() || !form.department}
                                    className="flex-1 py-6 rounded-2xl font-black uppercase tracking-widest text-xs gap-2 shadow-xl shadow-primary-100">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Créer le poste
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </PageShell>
    );
}
