'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
    ShieldCheck, Plus, Edit2, Search, X, Loader2, AlertCircle,
    CheckCircle2, ChevronDown, ChevronUp, Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { getAllProfiles, createProfile, updateProfile, getAllPermissions } from '@/lib/api/profile';
import { Profile, Permission, PERSON_TYPE, PERSON_TYPE_LABELS } from '@/types/profile';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Searchable Multi-Select for Permissions ───────────────────────────────────
function PermissionMultiSelect({
    permissions,
    selected,
    onChange,
}: {
    permissions: Permission[];
    selected: string[];
    onChange: (roles: string[]) => void;
}) {
    const [query, setQuery] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        if (!q) return permissions;
        return permissions.filter(p =>
            p.label.toLowerCase().includes(q) ||
            p.role.toLowerCase().includes(q)
        );
    }, [permissions, query]);

    function toggle(role: string) {
        onChange(selected.includes(role) ? selected.filter(r => r !== role) : [...selected, role]);
    }

    function selectAllFiltered() {
        const filteredRoles = filtered.map(p => p.role);
        const allAlreadySelected = filteredRoles.every(r => selected.includes(r));
        if (allAlreadySelected) {
            onChange(selected.filter(r => !filteredRoles.includes(r)));
        } else {
            onChange([...new Set([...selected, ...filteredRoles])]);
        }
    }

    function clearAll() { onChange([]); }

    const filteredSelected = filtered.filter(p => selected.includes(p.role)).length;
    const allFilteredSelected = filtered.length > 0 && filteredSelected === filtered.length;

    // Selected chips (show labels of selected permissions)
    const selectedPerms = useMemo(() =>
        selected.map(role => permissions.find(p => p.role === role) || { role, label: role }),
        [selected, permissions]
    );

    return (
        <div className="space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">
                    Permissions
                    {selected.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-[9px] font-black">
                            {selected.length} sélectionnées
                        </span>
                    )}
                </Label>
                {selected.length > 0 && (
                    <button onClick={clearAll}
                        className="text-[10px] font-black text-rose-500 hover:text-rose-700 uppercase transition-colors">
                        Tout effacer
                    </button>
                )}
            </div>

            {/* Selected chips */}
            {selectedPerms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3 bg-primary-50/50 border border-primary-100 rounded-2xl max-h-24 overflow-y-auto">
                    {selectedPerms.map(p => (
                        <span
                            key={p.role}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-primary-200 rounded-xl text-[10px] font-bold text-primary-700 shadow-sm"
                        >
                            {p.label}
                            <button
                                onClick={() => toggle(p.role)}
                                className="ml-0.5 hover:text-rose-500 transition-colors rounded-full"
                            >
                                <X className="w-2.5 h-2.5" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Search box */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-xl focus-within:border-primary-400 focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-secondary-400 shrink-0" />
                <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Rechercher une permission..."
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-secondary-700 placeholder-secondary-400"
                />
                {query && (
                    <button onClick={() => setQuery('')} className="shrink-0 text-secondary-400 hover:text-secondary-700">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* List */}
            <div className="border border-secondary-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                {/* Sticky header row */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-secondary-50 border-b border-secondary-100 sticky top-0">
                    <button
                        onClick={selectAllFiltered}
                        className="flex items-center gap-2 text-[10px] font-black text-secondary-500 hover:text-secondary-900 uppercase tracking-widest transition-colors"
                    >
                        <div className={cn(
                            "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                            allFilteredSelected ? "bg-primary-600 border-primary-600" : "border-secondary-300"
                        )}>
                            {allFilteredSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                        </div>
                        {allFilteredSelected ? 'Désélectionner' : 'Sélectionner'} tout
                        {query && ` (${filtered.length} résultats)`}
                    </button>
                    <span className="text-[10px] font-bold text-secondary-400">
                        {filteredSelected}/{filtered.length}
                    </span>
                </div>

                {/* Permission rows */}
                <div className="max-h-64 overflow-y-auto divide-y divide-secondary-50">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-10 text-secondary-400">
                            <Search className="w-8 h-8 text-secondary-200" />
                            <p className="text-xs font-bold italic">Aucune permission trouvée pour « {query} »</p>
                        </div>
                    ) : (
                        filtered.map(perm => {
                            const isSelected = selected.includes(perm.role);
                            return (
                                <button
                                    key={perm.role}
                                    onClick={() => toggle(perm.role)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-all group",
                                        isSelected
                                            ? "bg-primary-50/60 hover:bg-primary-50"
                                            : "hover:bg-secondary-50"
                                    )}
                                >
                                    {/* Checkbox */}
                                    <div className={cn(
                                        "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                                        isSelected
                                            ? "bg-primary-600 border-primary-600"
                                            : "border-secondary-300 group-hover:border-primary-400"
                                    )}>
                                        {isSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                                    </div>

                                    {/* Label + role */}
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-sm font-bold leading-tight",
                                            isSelected ? "text-primary-800" : "text-secondary-700 group-hover:text-secondary-900"
                                        )}>
                                            {perm.label}
                                        </p>
                                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-0.5">
                                            {perm.role}
                                        </p>
                                    </div>

                                    {isSelected && (
                                        <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0" />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ProfilesPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Profile | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [expandedProfile, setExpandedProfile] = useState<string | null>(null);
    const [form, setForm] = useState({
        label: '',
        personType: PERSON_TYPE.EMPLOYEE as string,
        permission: [] as string[],
        active: true
    });

    async function loadData() {
        try {
            setIsLoading(true);
            const [pData, permData] = await Promise.all([getAllProfiles(), getAllPermissions()]);
            const pList = Array.isArray(pData) ? pData : (pData as any)['hydra:member'] || (pData as any).member || [];
            setProfiles(pList);
            const permList = Array.isArray(permData) ? permData : (permData as any)['hydra:member'] || (permData as any).member || [];
            setPermissions(permList);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => { loadData(); }, []);

    function showToast(msg: string, type: 'success' | 'error') {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    }

    function openCreate() {
        setEditTarget(null);
        setForm({ label: '', personType: PERSON_TYPE.EMPLOYEE, permission: [], active: true });
        setIsModalOpen(true);
    }

    function openEdit(p: Profile) {
        setEditTarget(p);
        setForm({ label: p.label, personType: p.personType, permission: [...p.permission], active: p.active });
        setIsModalOpen(true);
    }

    async function handleSave() {
        if (!form.label.trim()) return;
        setIsSaving(true);
        try {
            if (editTarget) {
                await updateProfile(editTarget.id, form);
                showToast('Profil mis à jour avec succès.', 'success');
            } else {
                await createProfile(form);
                showToast('Profil créé avec succès.', 'success');
            }
            setIsModalOpen(false);
            loadData();
        } catch (e: any) {
            showToast(e.message, 'error');
        } finally {
            setIsSaving(false);
        }
    }

    const filtered = useMemo(() => profiles.filter(p =>
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        (PERSON_TYPE_LABELS[p.personType] || '').toLowerCase().includes(search.toLowerCase())
    ), [profiles, search]);

    return (
        <div className="space-y-8 pb-12">
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
                        <ShieldCheck className="w-8 h-8 text-primary-600" /> Gestion des Profils
                    </h1>
                    <p className="text-secondary-500 font-medium mt-1">Définissez les rôles et permissions d'accès à la plateforme.</p>
                </div>
                <Button onClick={openCreate} className="gap-2 shadow-xl shadow-primary-200 py-6 px-8 rounded-2xl font-bold uppercase tracking-widest text-xs">
                    <Plus className="w-5 h-5" /> Nouveau Profil
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3 bg-white p-2 pl-5 rounded-2xl shadow-sm border border-secondary-100 max-w-md">
                <Search className="w-4 h-4 text-secondary-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher un profil..."
                    className="flex-1 text-sm bg-transparent border-none focus:ring-0 outline-none font-medium" />
                {search && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSearch('')}><X className="w-3 h-3" /></Button>}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="h-64 flex items-center justify-center gap-4 text-secondary-400">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                    <p className="text-xs font-black uppercase tracking-widest animate-pulse">Chargement...</p>
                </div>
            ) : error ? (
                <Card className="border-none shadow-lg rounded-3xl">
                    <CardContent className="p-12 flex flex-col items-center gap-4">
                        <AlertCircle className="w-14 h-14 text-destructive/20" />
                        <p className="text-secondary-400 font-bold italic">{error}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map(profile => (
                        <Card key={profile.id} className="border border-secondary-100 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-100/20 transition-all duration-300 rounded-[28px] overflow-hidden">
                            <div className={cn("h-1.5 w-full", profile.active ? "bg-emerald-500" : "bg-secondary-300")} />
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-secondary-900 uppercase tracking-tight text-sm truncate">{profile.label}</h3>
                                        <p className="text-[10px] font-bold text-secondary-400 uppercase mt-0.5">{PERSON_TYPE_LABELS[profile.personType] || profile.personType}</p>
                                    </div>
                                    <Badge variant={profile.active ? 'success' : 'secondary'} className="text-[9px] font-black uppercase shrink-0">
                                        {profile.active ? 'Actif' : 'Inactif'}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5 bg-primary-50 px-3 py-1.5 rounded-xl border border-primary-100">
                                        <ShieldCheck className="w-3 h-3 text-primary-600" />
                                        <span className="text-[10px] font-black text-primary-700 uppercase">{profile.permission.length} permissions</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-secondary-400">
                                        Créé le {(() => { try { return format(new Date(profile.createdAt), 'dd/MM/yyyy'); } catch { return '—'; } })()}
                                    </span>
                                </div>

                                <button
                                    onClick={() => setExpandedProfile(expandedProfile === profile.id ? null : profile.id)}
                                    className="w-full flex items-center justify-between text-xs font-bold text-secondary-500 hover:text-secondary-900 transition-colors py-1"
                                >
                                    <span className="uppercase tracking-widest">Voir les permissions</span>
                                    {expandedProfile === profile.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>

                                {expandedProfile === profile.id && (
                                    <div className="max-h-36 overflow-y-auto space-y-1 bg-secondary-50 rounded-2xl p-3 border border-secondary-100">
                                        {profile.permission.length === 0 ? (
                                            <p className="text-xs text-secondary-400 italic text-center py-2">Aucune permission</p>
                                        ) : (
                                            profile.permission.map(perm => (
                                                <div key={perm} className="flex items-center gap-2 text-[10px] font-bold text-secondary-600 uppercase">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                                                    <span className="truncate">{permissions.find(p => p.role === perm)?.label || perm}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                <div className="pt-2 border-t border-secondary-50">
                                    <Button variant="outline" size="sm" onClick={() => openEdit(profile)}
                                        className="w-full gap-2 rounded-xl font-bold text-xs uppercase tracking-widest border-secondary-200 hover:border-primary-300 hover:text-primary-700">
                                        <Edit2 className="w-3.5 h-3.5" /> Modifier le profil
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full flex flex-col items-center gap-4 py-16 text-secondary-400">
                            <ShieldCheck className="w-16 h-16 text-secondary-100" />
                            <p className="font-bold italic uppercase text-sm">Aucun profil trouvé</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Create/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-secondary-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
                    <Card className="w-full max-w-xl border-none shadow-3xl bg-white rounded-[40px] overflow-hidden animate-in zoom-in-95 duration-200 mb-8">
                        <CardHeader className="p-8 border-b border-secondary-50 flex flex-row items-center justify-between bg-primary-50/30">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-100">
                                    <ShieldCheck className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-black text-secondary-900 uppercase tracking-tighter">
                                        {editTarget ? 'Modifier le Profil' : 'Nouveau Profil'}
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-0.5">{editTarget?.label}</CardDescription>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full h-9 w-9">
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            {/* Label */}
                            <div className="space-y-2">
                                <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">Libellé du profil *</Label>
                                <Input className="h-12 rounded-xl font-bold" placeholder="ex: Responsable RH Région Nord"
                                    value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
                            </div>

                            {/* Person Type */}
                            <div className="space-y-2">
                                <Label className="uppercase tracking-widest text-[9px] font-black text-secondary-400">Type de personne *</Label>
                                <Select className="h-12 rounded-xl font-bold" value={form.personType}
                                    onChange={e => setForm(f => ({ ...f, personType: e.target.value }))}>
                                    {Object.entries(PERSON_TYPE_LABELS).map(([val, label]) => (
                                        <option key={val} value={val}>{label} ({val})</option>
                                    ))}
                                </Select>
                            </div>

                            {/* Active toggle */}
                            <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-2xl border border-secondary-100">
                                <div>
                                    <p className="font-black text-secondary-900 uppercase text-xs tracking-widest">Profil actif</p>
                                    <p className="text-[10px] font-medium text-secondary-400 mt-0.5">Un profil inactif ne peut pas être assigné</p>
                                </div>
                                <button
                                    onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                                    className={cn("w-12 h-6 rounded-full transition-all relative", form.active ? "bg-emerald-500" : "bg-secondary-200")}
                                >
                                    <div className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all", form.active ? "left-6" : "left-0.5")} />
                                </button>
                            </div>

                            {/* ✨ Searchable multi-select */}
                            <PermissionMultiSelect
                                permissions={permissions}
                                selected={form.permission}
                                onChange={roles => setForm(f => ({ ...f, permission: roles }))}
                            />

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}
                                    className="flex-1 py-6 rounded-2xl font-bold uppercase tracking-widest text-xs border-secondary-200">
                                    Annuler
                                </Button>
                                <Button onClick={handleSave} disabled={isSaving || !form.label.trim()}
                                    className="flex-1 py-6 rounded-2xl font-black uppercase tracking-widest text-xs gap-2 shadow-xl shadow-primary-100">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    {editTarget ? 'Enregistrer' : 'Créer le profil'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
