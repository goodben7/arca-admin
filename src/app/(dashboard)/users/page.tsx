'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    UserCog, Search, X, Loader2, AlertCircle, CheckCircle2,
    Lock, ShieldOff, Shield, User, Mail, Calendar, Eye, ChevronDown, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/Table';
import { cn } from '@/lib/utils';
import { getAllUsers } from '@/lib/api/profile';
import { AppUser, PERSON_TYPE_LABELS } from '@/types/profile';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const PERSON_TYPE_COLORS: Record<string, string> = {
    SPADM: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    ADM: 'bg-violet-50 text-violet-700 border-violet-100',
    HRADM: 'bg-primary-50 text-primary-700 border-primary-100',
    HRSTF: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    EXEC: 'bg-amber-50 text-amber-700 border-amber-100',
    MGR: 'bg-orange-50 text-orange-700 border-orange-100',
    HRPRV: 'bg-teal-50 text-teal-700 border-teal-100',
    EMP: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    CNS: 'bg-rose-50 text-rose-700 border-rose-100',
    INT: 'bg-secondary-50 text-secondary-700 border-secondary-100',
    CND: 'bg-sky-50 text-sky-700 border-sky-100',
};

function formatDate(d: string) {
    try { return format(new Date(d), 'dd MMM yyyy', { locale: fr }); } catch { return '—'; }
}

function getInitials(email: string) {
    return email.split('@')[0].substring(0, 2).toUpperCase();
}

export default function UsersPage() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [filterLocked, setFilterLocked] = useState('ALL');
    const [detailUser, setDetailUser] = useState<AppUser | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setIsLoading(true);
                const data = await getAllUsers();
                const list = Array.isArray(data) ? data : (data as any)['hydra:member'] || (data as any).member || [];
                setUsers(list);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const personTypes = useMemo(() => Array.from(new Set(users.map(u => u.personType))), [users]);

    const filtered = useMemo(() => users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch = !q || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
        const matchType = filterType === 'ALL' || u.personType === filterType;
        const matchLocked = filterLocked === 'ALL' || (filterLocked === 'LOCKED' ? u.locked : !u.locked);
        return matchSearch && matchType && matchLocked;
    }), [users, search, filterType, filterLocked]);

    const stats = {
        total: users.length,
        active: users.filter(u => !u.locked && !u.deleted).length,
        locked: users.filter(u => u.locked).length,
        unconfirmed: users.filter(u => !u.confirmed).length,
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Detail panel */}
            {detailUser && (
                <div className="fixed inset-0 z-50 flex items-start justify-end bg-secondary-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setDetailUser(null)}>
                    <div className="w-full max-w-[480px] h-full bg-white shadow-3xl flex flex-col animate-in slide-in-from-right duration-500"
                        onClick={e => e.stopPropagation()}>

                        {/* Header Gradient */}
                        <div className="relative h-40 bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 shrink-0">
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
                            <div className="absolute top-6 right-6 z-10">
                                <Button variant="ghost" size="icon" onClick={() => setDetailUser(null)} className="rounded-full bg-black/10 hover:bg-black/20 text-white border-none backdrop-blur-md">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                            <div className="absolute -bottom-10 left-8">
                                <div className="w-24 h-24 rounded-3xl bg-white p-1.5 shadow-2xl shadow-primary-900/20">
                                    <div className="w-full h-full rounded-[20px] bg-gradient-to-br from-secondary-100 to-white flex items-center justify-center border border-secondary-50 uppercase shadow-inner">
                                        <span className="text-3xl font-black text-secondary-300">
                                            {getInitials(detailUser.email)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 pt-14 flex-1 overflow-y-auto space-y-8">
                            <div>
                                <h1 className="text-xl font-black text-secondary-900 uppercase tracking-tighter truncate pr-4">
                                    {detailUser.email}
                                </h1>
                                <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mt-1 mb-4">{detailUser.id}</p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-none",
                                        PERSON_TYPE_COLORS[detailUser.personType] || 'bg-secondary-50 text-secondary-600')}>
                                        {PERSON_TYPE_LABELS[detailUser.personType] || detailUser.personType}
                                    </Badge>
                                    {detailUser.locked && (
                                        <Badge className="text-[9px] font-black bg-rose-50 text-rose-600 border-none px-3 py-1 rounded-full uppercase tracking-widest">
                                            <Lock className="w-3 h-3 mr-1" /> Verrouillé
                                        </Badge>
                                    )}
                                    {!detailUser.confirmed && (
                                        <Badge className="text-[9px] font-black bg-amber-50 text-amber-600 border-none px-3 py-1 rounded-full uppercase tracking-widest">Non confirmé</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <InfoBox icon={Calendar} label="Créé le" value={formatDate(detailUser.createdAt)} color="text-indigo-600" bg="bg-indigo-50" />
                                <InfoBox icon={UserCog} label="Type" value={detailUser.personType} color="text-amber-600" bg="bg-amber-50" />
                                <InfoBox icon={detailUser.locked ? Lock : Shield} label="Statut" value={detailUser.locked ? 'Verrouillé' : 'Actif'} color={detailUser.locked ? "text-rose-600" : "text-emerald-600"} bg={detailUser.locked ? "bg-rose-50" : "bg-emerald-50"} />
                                <InfoBox icon={Mail} label="Confirmé" value={detailUser.confirmed ? 'Oui' : 'Non'} color={detailUser.confirmed ? "text-emerald-600" : "text-amber-600"} bg={detailUser.confirmed ? "bg-emerald-50" : "bg-amber-50"} />
                            </div>

                            {/* Roles */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Permissions Actives</h3>
                                    <Badge className="bg-primary-50 text-primary-700 font-bold border-primary-100 text-[10px]">
                                        {detailUser.roles.filter(r => r !== 'ROLE_USER' && !r.startsWith('ROLE_SUPER')).length}
                                    </Badge>
                                </div>
                                <div className="bg-secondary-50/50 rounded-3xl p-5 border border-secondary-100 shadow-inner">
                                    <div className="space-y-3">
                                        {detailUser.roles.filter(r => r.startsWith('ROLE_') && r !== 'ROLE_USER' && r !== 'ROLE_SUPER_ADMIN').map(role => (
                                            <div key={role} className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-secondary-100">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                                </div>
                                                <span className="text-[10px] font-bold text-secondary-600 uppercase tracking-widest break-all">
                                                    {role}
                                                </span>
                                            </div>
                                        ))}
                                        {detailUser.roles.filter(r => r.startsWith('ROLE_') && r !== 'ROLE_USER' && r !== 'ROLE_SUPER_ADMIN').length === 0 && (
                                            <p className="text-secondary-400 font-medium italic text-xs text-center py-4">Aucune permission spécifique.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-secondary-900 uppercase tracking-tighter flex items-center gap-3">
                        <UserCog className="w-8 h-8 text-primary-600" /> Utilisateurs
                    </h1>
                    <p className="text-secondary-500 font-medium mt-1">Gérez les comptes d'accès à la plateforme ARCA SIRH.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total" value={stats.total} color="text-indigo-600" bg="bg-indigo-50 border-indigo-100" />
                <StatCard label="Actifs" value={stats.active} color="text-emerald-600" bg="bg-emerald-50 border-emerald-100" />
                <StatCard label="Verrouillés" value={stats.locked} color="text-rose-600" bg="bg-rose-50 border-rose-100" />
                <StatCard label="Non confirmés" value={stats.unconfirmed} color="text-amber-600" bg="bg-amber-50 border-amber-100" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-secondary-50/50 p-3 rounded-[28px] border border-secondary-100">
                <div className="flex items-center gap-3 bg-white p-2 pl-4 rounded-2xl shadow-sm border border-secondary-100 flex-1 min-w-48 h-12">
                    <Search className="w-4 h-4 text-secondary-400 shrink-0" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher par email ou ID..." className="flex-1 text-sm bg-transparent border-none focus:ring-0 outline-none font-bold placeholder-secondary-400 text-secondary-900" />
                    {search && <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors" onClick={() => setSearch('')}><X className="w-4 h-4" /></Button>}
                </div>

                <div className="relative group">
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center pointer-events-none group-hover:bg-primary-100 transition-colors">
                        <Filter className="w-4 h-4 text-primary-600" />
                    </div>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)}
                        className="h-12 pl-12 pr-10 text-sm font-bold bg-white border border-secondary-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none cursor-pointer min-w-[200px] text-secondary-900 shadow-sm">
                        <option value="ALL">Tous les types</option>
                        {personTypes.map(t => <option key={t} value={t}>{PERSON_TYPE_LABELS[t] || t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none group-hover:text-primary-600 transition-colors" />
                </div>

                <div className="relative group">
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center pointer-events-none group-hover:bg-amber-100 transition-colors">
                        <Shield className="w-4 h-4 text-amber-600" />
                    </div>
                    <select value={filterLocked} onChange={e => setFilterLocked(e.target.value)}
                        className="h-12 pl-12 pr-10 text-sm font-bold bg-white border border-secondary-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all appearance-none cursor-pointer min-w-[200px] text-secondary-900 shadow-sm">
                        <option value="ALL">Tous les statuts</option>
                        <option value="ACTIVE">Actifs</option>
                        <option value="LOCKED">Verrouillés</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none group-hover:text-amber-600 transition-colors" />
                </div>
            </div>

            {/* Table */}
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
                <Card className="overflow-hidden border-none shadow-2xl shadow-secondary-200/50 rounded-3xl bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent uppercase tracking-wider text-[11px] font-black">
                                <TableHead>Utilisateur</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Rôles actifs</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Créé le</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-secondary-400 italic">Aucun utilisateur trouvé.</TableCell>
                                </TableRow>
                            ) : (
                                filtered.map(user => (
                                    <TableRow key={user.id} className="group hover:bg-secondary-50/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-full flex items-center justify-center font-black text-sm uppercase shadow-sm border-2 border-white transition-transform group-hover:scale-110 duration-300",
                                                        user.locked ? "bg-gradient-to-br from-rose-50 to-rose-100 text-rose-700" : "bg-gradient-to-br from-primary-50 to-primary-100 text-primary-700"
                                                    )}>
                                                        {getInitials(user.email)}
                                                    </div>
                                                    <div className={cn(
                                                        "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm",
                                                        user.locked ? "bg-rose-500" : (user.confirmed ? "bg-emerald-500" : "bg-amber-400")
                                                    )} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <p className="font-bold text-secondary-900 group-hover:text-primary-700 transition-colors truncate text-sm">
                                                        {user.email}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                                                        <span className="font-black text-secondary-400 tracking-tighter bg-secondary-50 px-1.5 py-0.5 rounded">
                                                            {user.id}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn("inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border",
                                                PERSON_TYPE_COLORS[user.personType] || 'bg-secondary-50 text-secondary-600 border-secondary-100')}>
                                                {PERSON_TYPE_LABELS[user.personType] || user.personType}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 bg-primary-50 px-3 py-1 rounded-full w-fit border border-primary-100">
                                                <Shield className="w-3 h-3 text-primary-600" />
                                                <span className="text-[10px] font-black text-primary-700">
                                                    {user.roles.filter(r => r !== 'ROLE_USER' && r !== 'ROLE_SUPER_ADMIN').length} permissions
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                {user.locked ? (
                                                    <Badge className="w-fit text-[9px] font-black bg-rose-50 text-rose-600 border-none px-3 py-1 rounded-full uppercase tracking-widest">
                                                        <Lock className="w-3 h-3 mr-1" /> Verrouillé
                                                    </Badge>
                                                ) : (
                                                    <Badge className="w-fit text-[9px] font-black bg-emerald-50 text-emerald-600 border-none px-3 py-1 rounded-full uppercase tracking-widest">
                                                        Actif
                                                    </Badge>
                                                )}
                                                {!user.confirmed && (
                                                    <Badge className="w-fit text-[9px] font-black bg-amber-50 text-amber-600 border-none px-3 py-1 rounded-full uppercase tracking-widest">Non confirmé</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-bold text-secondary-500">{formatDate(user.createdAt)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost" size="icon"
                                                onClick={() => setDetailUser(user)}
                                                className="h-9 w-9 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    {!isLoading && (
                        <div className="px-6 py-3 border-t border-secondary-50 bg-secondary-50/20">
                            <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest">
                                {filtered.length} sur {users.length} utilisateurs
                            </p>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
    return (
        <Card className="p-6 border-none shadow-sm shadow-secondary-100/50 rounded-[32px] bg-white flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary-50/50 to-transparent rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <span className={cn("text-4xl font-black leading-none", color)}>{value}</span>
                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-2">{label}</p>
                </div>
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner", bg, color)}>
                    <UserCog className="w-6 h-6 opacity-80" />
                </div>
            </div>
        </Card>
    );
}

function InfoBox({ icon: Icon, label, value, color = "text-primary-600", bg = "bg-primary-50" }: { icon: any; label: string; value: string; color?: string; bg?: string }) {
    return (
        <div className="bg-white rounded-3xl p-5 border border-secondary-100 shadow-sm shadow-secondary-100/30 flex items-start gap-4 hover:border-primary-100 transition-colors group">
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-white shadow-sm transition-transform group-hover:scale-110", bg, color)}>
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-bold text-secondary-900 uppercase truncate">{value}</p>
            </div>
        </div>
    );
}
