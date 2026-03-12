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
import { getAllPositions, createPosition } from '@/lib/api/position';
import { getDepartments } from '@/lib/api/employee';
import { Department } from '@/types/employee';

export default function PositionsPage() {
    const [positions, setPositions] = useState<Position[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const [form, setForm] = useState({
        title: '',
        department: '',
        level: 'JUNIOR',
        description: '',
        headcount: 1,
        openPositions: 1,
        status: 'OPEN'
    });

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

    function showToast(msg: string, type: 'success' | 'error') {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    }

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
        <div className="space-y-6 pb-12">
            {/* Toast */}
            {toast && (
                <div className={cn(
                    "fixed top-6 right-6 z-[60] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-right duration-300",
                    toast.type === 'success' ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                )}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-secondary-900 uppercase tracking-tighter flex items-center gap-3">
                        <Briefcase className="w-8 h-8 text-primary-600" /> Postes & Fonctions
                    </h1>
                    <p className="text-secondary-500 font-medium mt-1">Répertoire des métiers et gestion de la nomenclature des postes.</p>
                </div>
                <Button onClick={openCreate} className="gap-2 shadow-xl shadow-primary-200 py-6 px-8 rounded-2xl font-bold uppercase tracking-widest text-xs">
                    <Plus className="w-5 h-5" /> Nouveau Poste
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryBox label="Métiers référencés" value={stats.total} icon={Briefcase} />
                <SummaryBox label="Postes ouverts" value={stats.active} icon={Target} />
                <SummaryBox label="Recrutements en cours" value={stats.open} icon={TrendingUp} />
                <SummaryBox label="Classification" value="Standard" icon={Building2} />
            </div>

            {/* Table Card */}
            <Card className="overflow-hidden border-none shadow-2xl shadow-secondary-200/50 rounded-3xl bg-white">
                <div className="p-4 border-b border-secondary-100 bg-secondary-50/20 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-600 transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher par intitulé..."
                            className="w-full pl-10 pr-4 h-11 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-bold"
                        />
                    </div>
                </div>

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
                                <TableRow className="hover:bg-transparent uppercase tracking-wider text-[11px] font-black">
                                    <TableHead>Intitulé du Poste</TableHead>
                                    <TableHead>Département</TableHead>
                                    <TableHead>Niveau / Grade</TableHead>
                                    <TableHead className="text-center">Effectif Actuel</TableHead>
                                    <TableHead className="text-center">Ouvertures</TableHead>
                                    <TableHead className="text-center">Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-48 text-center text-secondary-400 font-medium italic">
                                            Aucun poste ne correspond à votre recherche.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((pos) => {
                                        // Attempt to nicely format department name
                                        let deptName = pos.department;
                                        if (deptName && deptName.includes('/api/departments/')) {
                                            const depId = deptName.split('/').pop();
                                            const foundDep = departments.find(d => d.id === depId);
                                            deptName = foundDep ? foundDep.name : (depId || deptName);
                                        }

                                        return (
                                            <TableRow key={pos.id} className="group hover:bg-secondary-50 transition-colors">
                                                <TableCell className="font-bold text-secondary-900 text-sm">{pos.title}</TableCell>
                                                <TableCell>
                                                    {pos.department ? (
                                                        <span className="text-xs font-black text-secondary-600 px-2.5 py-1 bg-secondary-50 rounded-xl border border-secondary-100 uppercase tracking-widest">
                                                            {deptName}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-secondary-400 italic">Non assigné</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="text-[10px] font-black uppercase bg-primary-50 text-primary-700 border-primary-100 border">
                                                        {POSITION_LEVEL_LABELS[pos.level] || pos.level || '—'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="inline-flex w-8 h-8 rounded-full bg-secondary-50 items-center justify-center font-black text-secondary-700 shadow-inner">
                                                        {pos.headcount || 0}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {pos.openPositions > 0 ? (
                                                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 border text-[10px] font-black tracking-widest px-2 py-0.5">
                                                            +{pos.openPositions}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest bg-secondary-50 px-2 py-0.5 rounded-lg border border-secondary-100">
                                                            Complet
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={cn("text-[10px] font-black tracking-widest uppercase px-2 py-0.5 border",
                                                        pos.status === 'OPEN' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"
                                                    )}>
                                                        {POSITION_STATUS_LABELS[pos.status] || pos.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="text-primary-600 hover:bg-primary-50 rounded-xl h-9 w-9 opacity-0 group-hover:opacity-100 transition-all">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                        <div className="px-6 py-3 border-t border-secondary-50 bg-secondary-50/20">
                            <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest">
                                {filtered.length} postes trouvés
                            </p>
                        </div>
                    </>
                )}
            </Card>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-secondary-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
                    <Card className="w-full max-w-2xl border-none shadow-3xl bg-white rounded-[40px] overflow-hidden animate-in zoom-in-95 duration-200 mb-8">
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
        </div>
    );
}

function SummaryBox({ label, value, icon: Icon }: any) {
    return (
        <Card className="p-5 border border-secondary-100 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-100/20 transition-all duration-300 rounded-[24px] bg-white flex flex-col gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-secondary-50 group-hover:bg-primary-50 flex items-center justify-center text-secondary-400 group-hover:text-primary-600 transition-colors">
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
                <h3 className="text-2xl font-black text-secondary-900 leading-none">{value}</h3>
            </div>
        </Card>
    );
}
