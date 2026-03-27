'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    Users, FileCheck, Clock, Building2, Loader2,
    BookOpen, Briefcase, UserCheck, CalendarDays, ArrowRight,
    CheckCircle2, AlertCircle, GraduationCap, ClipboardList,
    UserPlus, FileText, TrendingUp, TrendingDown, Minus,
    Search,
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, CartesianGrid,
    XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line,
    ComposedChart, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { getAllEmployees, getDepartments } from '@/lib/api/employee';
import { getAllContracts } from '@/lib/api/contract';
import { getAllLeaveRequests } from '@/lib/api/leave';
import { getAllJobOffers } from '@/lib/api/jobOffer';
import { getAllApplications } from '@/lib/api/application';
import { getAllRecruitmentRequests } from '@/lib/api/recruitment';
import { getAllTrainingRequests } from '@/lib/api/training';
import { getAllTrainingSessions } from '@/lib/api/trainingSession';
import { Employee, Department } from '@/types/employee';
import { Contract } from '@/types/contract';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const BLUE   = '#007398';
const RED    = '#C1272D';
const YELLOW = '#FDB913';
const TEAL   = '#005d7b';
const LIGHT  = '#56afca';

function normalize(data: unknown): any[] {
    if (Array.isArray(data)) return data;
    const d = data as Record<string, unknown>;
    if (Array.isArray(d?.['hydra:member'])) return d['hydra:member'] as any[];
    if (Array.isArray(d?.member)) return d.member as any[];
    return [];
}

function ChartTip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-2xl border border-white/10 bg-[#0f172a]/90 backdrop-blur px-4 py-2.5 shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">{payload[0]?.payload?.name || payload[0]?.name}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} className="text-sm font-black" style={{ color: p.color || '#fff' }}>{p.value}</p>
            ))}
        </div>
    );
}

export default function DashboardPage() {
    const [employees, setEmployees]       = useState<Employee[]>([]);
    const [departments, setDepartments]   = useState<Department[]>([]);
    const [contracts, setContracts]       = useState<Contract[]>([]);
    const [leaves, setLeaves]             = useState<any[]>([]);
    const [jobOffers, setJobOffers]       = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [recruitments, setRecruitments] = useState<any[]>([]);
    const [trainings, setTrainings]       = useState<any[]>([]);
    const [sessions, setSessions]         = useState<any[]>([]);
    const [isLoading, setIsLoading]       = useState(true);

    useEffect(() => {
        Promise.all([
            getAllEmployees().catch(() => []),
            getDepartments().catch(() => []),
            getAllContracts().catch(() => []),
            getAllLeaveRequests().catch(() => []),
            getAllJobOffers().catch(() => []),
            getAllApplications().catch(() => []),
            getAllRecruitmentRequests().catch(() => []),
            getAllTrainingRequests().catch(() => []),
            getAllTrainingSessions().catch(() => []),
        ]).then(([emp, dept, cont, leave, jobs, apps, rec, train, sess]) => {
            setEmployees(normalize(emp));
            setDepartments(normalize(dept));
            setContracts(normalize(cont));
            setLeaves(normalize(leave));
            setJobOffers(normalize(jobs));
            setApplications(normalize(apps));
            setRecruitments(normalize(rec));
            setTrainings(normalize(train));
            setSessions(normalize(sess));
        }).finally(() => setIsLoading(false));
    }, []);

    // ── Métriques ─────────────────────────────────────────────────────────────
    const activeEmployees     = employees.filter(e => e.status === 'ACTIVE').length;
    const activeContracts     = contracts.filter(c => c.status === 'ACTIVE').length;
    const pendingLeaves       = leaves.filter(l => l.status === 'PENDING').length;
    const openJobOffers       = jobOffers.filter(j => j.status === 'PUBLISHED').length;
    const pendingApplications = applications.filter(a => a.status === 'PENDING').length;
    const pendingRecruitments = recruitments.filter(r => r.status === 'PENDING').length;
    const pendingTrainings    = trainings.filter(t => t.status === 'PENDING').length;
    const plannedSessions     = sessions.filter(s => s.status === 'PLANNED').length;

    const expiringContracts = useMemo(() => {
        const now = new Date(); const limit = addDays(now, 30);
        return contracts.filter(c => {
            if (!c.endDate || c.status !== 'ACTIVE') return false;
            const end = new Date(c.endDate);
            return isAfter(end, now) && isBefore(end, limit);
        });
    }, [contracts]);

    // ── Données graphiques ────────────────────────────────────────────────────
    const deptData = useMemo(() =>
        departments.slice(0, 8).map((dept: Department) => {
            const count = employees.filter((e: Employee) => {
                const deptId = (e.department as any)?.id
                    || (typeof e.department === 'string' && e.department.split('/').pop())
                    || e.department;
                return deptId === dept.id || e.department === (dept as any)['@id'];
            }).length;
            return {
                name: dept.name?.length > 14 ? dept.name.slice(0, 14) + '…' : dept.name,
                effectifs: count,
                contrats: contracts.filter(c => {
                    const empIds = employees
                        .filter((e: Employee) => {
                            const deptId = (e.department as any)?.id
                                || (typeof e.department === 'string' && e.department.split('/').pop())
                                || e.department;
                            return deptId === dept.id || e.department === (dept as any)['@id'];
                        })
                        .map(e => e.id);
                    const empId = typeof c.employee === 'string' ? c.employee.split('/').pop() : (c.employee as any)?.id;
                    return empIds.includes(empId);
                }).length,
            };
        }).filter(d => d.effectifs > 0),
    [departments, employees, contracts]);

    const performancePieData = useMemo(() => [
        { name: 'Employés actifs',  value: activeEmployees,                                        color: BLUE },
        { name: 'En congé',         value: employees.filter(e => e.status === 'ON_LEAVE').length,  color: YELLOW },
        { name: 'Suspendu',         value: employees.filter(e => e.status === 'SUSPENDED').length, color: RED },
        { name: 'Essai',            value: employees.filter(e => e.status === 'PROBATION').length, color: LIGHT },
        { name: 'Inactifs',         value: employees.filter(e => e.status === 'INACTIVE').length,  color: '#cbd5e1' },
    ].filter(d => d.value > 0), [employees, activeEmployees]);

    const contractPieData = useMemo(() => [
        { name: 'Actifs',     value: activeContracts,                                        color: BLUE },
        { name: 'En attente', value: contracts.filter(c => c.status === 'PENDING').length,   color: YELLOW },
        { name: 'Terminés',   value: contracts.filter(c => c.status === 'ENDED').length,     color: '#10B981' },
        { name: 'Annulés',    value: contracts.filter(c => c.status === 'CANCELLED').length, color: RED },
    ].filter(d => d.value > 0), [contracts, activeContracts]);

    const recruitmentFunnel = useMemo(() => [
        { name: 'Candidatures', value: applications.length },
        { name: 'En cours',     value: applications.filter(a => ['SHORTLISTED', 'INTERVIEW_SCHEDULED'].includes(a.status)).length },
        { name: 'Recrutés',     value: applications.filter(a => a.status === 'HIRED').length },
    ], [applications]);

    const alerts = useMemo(() => {
        const list: any[] = [];
        if (expiringContracts.length > 0) list.push({ icon: AlertCircle, color: RED,    bg: '#fff1f1', label: `${expiringContracts.length} contrat${expiringContracts.length > 1 ? 's' : ''} expire${expiringContracts.length === 1 ? '' : 'nt'} bientôt`, sub: 'Renouvellement urgent', href: '/contracts' });
        if (pendingLeaves > 0)            list.push({ icon: Clock,        color: YELLOW, bg: '#fffbeb', label: `${pendingLeaves} congé${pendingLeaves > 1 ? 's' : ''} en attente`, sub: 'À approuver', href: '/leave' });
        if (pendingRecruitments > 0)      list.push({ icon: UserPlus,     color: BLUE,   bg: '#f0f9fb', label: `${pendingRecruitments} demande${pendingRecruitments > 1 ? 's' : ''} recrutement`, sub: 'À approuver', href: '/recruitment' });
        if (pendingTrainings > 0)         list.push({ icon: GraduationCap,color: TEAL,   bg: '#e6f4f8', label: `${pendingTrainings} demande${pendingTrainings > 1 ? 's' : ''} formation`, sub: 'À approuver', href: '/training' });
        if (pendingApplications > 0)      list.push({ icon: ClipboardList,color: BLUE,   bg: '#f0f9fb', label: `${pendingApplications} candidature${pendingApplications > 1 ? 's' : ''} à traiter`, sub: 'Recrutement', href: '/recruitment' });
        return list;
    }, [pendingLeaves, pendingRecruitments, pendingTrainings, pendingApplications, expiringContracts]);

    const upcomingSessions = useMemo(() => {
        const now = new Date();
        return sessions
            .filter(s => s.status === 'PLANNED' && s.startDate && isAfter(new Date(s.startDate), now))
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .slice(0, 3);
    }, [sessions]);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg p-2">
                    <Image src="/logo_arca_nouveau-2.png" alt="ARCA" width={48} height={48} className="object-contain animate-pulse" />
                </div>
                <p className="font-black uppercase tracking-widest text-xs text-secondary-400">Chargement du dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12 relative">

            {/* Halos de fond ambiant */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#007398]/6 blur-[100px]" />
                <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-[#FDB913]/5 blur-[120px]" />
                <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] rounded-full bg-[#C1272D]/4 blur-[100px]" />
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                HEADER
            ══════════════════════════════════════════════════════════════════ */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-md shadow-[#007398]/10 border border-white p-2 shrink-0">
                        <Image src="/logo_arca_nouveau-2.png" alt="ARCA" width={40} height={40} className="object-contain" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#007398]">
                            {format(new Date(), "EEEE dd MMMM yyyy", { locale: fr })}
                        </p>
                        <h1 className="text-2xl font-black text-secondary-900 uppercase tracking-tighter leading-none mt-0.5">
                            Dashboard RH
                        </h1>
                        <p className="text-xs text-secondary-400 font-medium mt-0.5">
                            Autorité de Régulation et de Contrôle des Assurances
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/employees/create">
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#007398] text-white text-xs font-black uppercase tracking-widest hover:bg-[#005d7b] transition-all shadow-lg shadow-[#007398]/30 hover:shadow-[#007398]/50 hover:-translate-y-0.5">
                            <UserPlus className="w-3.5 h-3.5" /> Nouvel employé
                        </button>
                    </Link>
                    <Link href="/training/sessions/create">
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FDB913] text-[#003649] text-xs font-black uppercase tracking-widest hover:bg-[#FFD45D] transition-all shadow-lg shadow-[#FDB913]/40 hover:shadow-[#FDB913]/60 hover:-translate-y-0.5">
                            <GraduationCap className="w-3.5 h-3.5" /> Nouvelle session
                        </button>
                    </Link>
                </div>
            </div>

            {/* Séparateur tricolore */}
            <div className="flex h-1 rounded-full overflow-hidden gap-0.5">
                <div className="flex-[3] bg-[#007398] rounded-l-full" />
                <div className="flex-[1] bg-[#C1272D]" />
                <div className="flex-[1] bg-[#FDB913] rounded-r-full" />
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                LIGNE 1 — 3 KPIs larges (structure maquette)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* KPI 1 — Total effectifs */}
                <Link href="/employees">
                    <div className="group relative overflow-hidden rounded-3xl bg-[#007398] p-7 text-white shadow-xl shadow-[#007398]/30 hover:shadow-2xl hover:shadow-[#007398]/50 hover:-translate-y-1 transition-all cursor-pointer">
                        {/* Halos internes */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/8 blur-2xl group-hover:bg-white/12 transition-all" />
                        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-[#FDB913]/20 blur-xl" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-white/3 blur-3xl" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-1.5">
                                    <Users className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Total Effectifs</span>
                                </div>
                                <div className="flex items-center gap-1 bg-white/15 rounded-lg px-2.5 py-1">
                                    <TrendingUp className="w-3 h-3 text-[#FDB913]" />
                                    <span className="text-[10px] font-black text-[#FDB913]">+{activeEmployees}</span>
                                </div>
                            </div>
                            <p className="text-6xl font-black tabular-nums tracking-tighter leading-none">{employees.length}</p>
                            <div className="mt-4 flex items-center gap-4 text-white/60 text-[10px] font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FDB913]" />{activeEmployees} actifs</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/30" />{employees.length - activeEmployees} autres</span>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* KPI 2 — Recrutements */}
                <Link href="/recruitment">
                    <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm border border-white shadow-sm hover:shadow-xl hover:shadow-[#007398]/10 hover:-translate-y-1 transition-all cursor-pointer">
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#007398]/5 blur-2xl group-hover:bg-[#007398]/10 transition-all" />
                        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-[#FDB913]/8 blur-xl" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 bg-[#f0f9fb] rounded-xl px-3 py-1.5">
                                    <UserCheck className="w-3.5 h-3.5 text-[#007398]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#007398]">Recrutements</span>
                                </div>
                                {pendingRecruitments > 0 && (
                                    <div className="flex items-center gap-1 bg-[#FDB913]/15 rounded-lg px-2.5 py-1">
                                        <span className="text-[10px] font-black text-[#D99C00]">{pendingRecruitments} en attente</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-6xl font-black tabular-nums tracking-tighter leading-none text-secondary-900">{recruitments.length}</p>
                            {/* Mini barre de progression */}
                            <div className="mt-4 space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-bold text-secondary-400 uppercase tracking-widest">
                                    <span>Candidatures</span>
                                    <span>{applications.length}</span>
                                </div>
                                <div className="h-1.5 bg-secondary-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#007398] rounded-full transition-all"
                                        style={{ width: applications.length > 0 ? `${Math.min((applications.filter(a => a.status === 'HIRED').length / applications.length) * 100, 100)}%` : '0%' }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-bold text-secondary-400 uppercase tracking-widest">
                                    <span>Recrutés</span>
                                    <span>{applications.filter(a => a.status === 'HIRED').length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* KPI 3 — Conformité / Contrats */}
                <Link href="/contracts">
                    <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm border border-white shadow-sm hover:shadow-xl hover:shadow-[#C1272D]/10 hover:-translate-y-1 transition-all cursor-pointer">
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#C1272D]/5 blur-2xl group-hover:bg-[#C1272D]/10 transition-all" />
                        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-[#007398]/6 blur-xl" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 bg-[#f0f9fb] rounded-xl px-3 py-1.5">
                                    <FileCheck className="w-3.5 h-3.5 text-[#007398]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#007398]">Contrats actifs</span>
                                </div>
                                {expiringContracts.length > 0 ? (
                                    <div className="flex items-center gap-1 bg-[#fff1f1] rounded-lg px-2.5 py-1 border border-[#ffc5c8]">
                                        <AlertCircle className="w-3 h-3 text-[#C1272D]" />
                                        <span className="text-[10px] font-black text-[#C1272D]">{expiringContracts.length} expirent</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 bg-emerald-50 rounded-lg px-2.5 py-1 border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span className="text-[10px] font-black text-emerald-600">OK</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-6xl font-black tabular-nums tracking-tighter leading-none text-secondary-900">{activeContracts}</p>
                            <div className="mt-4 flex items-center gap-4 text-secondary-400 text-[10px] font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FDB913]" />{contracts.filter(c => c.status === 'PENDING').length} en attente</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#C1272D]" />{contracts.filter(c => c.status === 'CANCELLED').length} annulés</span>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                LIGNE 2 — 4 KPIs secondaires compacts
            ══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Congés en attente',    value: pendingLeaves,    sub: 'À approuver',          icon: Clock,         color: YELLOW, href: '/leave' },
                    { label: 'Offres publiées',       value: openJobOffers,    sub: `${jobOffers.length} total`, icon: Briefcase,  color: BLUE,   href: '/job-offers' },
                    { label: 'Sessions planifiées',   value: plannedSessions,  sub: `${sessions.length} total`,  icon: GraduationCap, color: TEAL, href: '/training/sessions' },
                    { label: 'Formations en attente', value: pendingTrainings, sub: 'À approuver',          icon: BookOpen,      color: RED,    href: '/training' },
                ].map((kpi, i) => (
                    <Link key={i} href={kpi.href}>
                        <div className="group relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-white hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5" style={{ boxShadow: `0 2px 12px ${kpi.color}10` }}>
                            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-xl opacity-30 transition-opacity group-hover:opacity-50" style={{ backgroundColor: kpi.color }} />
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative" style={{ backgroundColor: kpi.color + '18' }}>
                                <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400 truncate">{kpi.label}</p>
                                <p className="text-2xl font-black text-secondary-900 tabular-nums tracking-tighter leading-tight">{kpi.value}</p>
                                <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">{kpi.sub}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                LIGNE 3 — Grand graphique + Donut (structure maquette)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Grand graphique : Effectifs & Contrats par département */}
                <div className="lg:col-span-2 rounded-3xl bg-white/80 backdrop-blur-sm border border-white shadow-sm shadow-[#007398]/5 overflow-hidden">
                    <div className="p-6 border-b border-secondary-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-secondary-900">Effectifs & Contrats par Département</h2>
                            <p className="text-[10px] text-secondary-400 font-medium mt-0.5">Analyse des talents par unité organisationnelle</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-[#f0f9fb] text-[#007398] border border-[#bde4ed] text-[10px] font-black uppercase tracking-widest">
                            Temps réel
                        </span>
                    </div>
                    <div className="p-4">
                        {deptData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <ComposedChart data={deptData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-poppins)' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-poppins)' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<ChartTip />} />
                                    <Legend
                                        wrapperStyle={{ fontSize: '10px', fontFamily: 'var(--font-poppins)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '8px' }}
                                        formatter={(value) => <span style={{ color: '#64748b' }}>{value}</span>}
                                    />
                                    <Bar dataKey="effectifs" name="Effectifs" fill={BLUE} radius={[6, 6, 0, 0]} barSize={22} />
                                    <Line dataKey="contrats" name="Contrats" stroke={YELLOW} strokeWidth={2.5} dot={{ fill: YELLOW, r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} type="monotone" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-64 flex items-center justify-center">
                                <p className="text-xs text-secondary-300 font-bold uppercase tracking-widest">Aucune donnée disponible</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Donut Performance */}
                <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm border border-white shadow-sm shadow-[#FDB913]/5">
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-[#FDB913]/8 blur-2xl pointer-events-none" />
                    <div className="p-6 border-b border-secondary-50">
                        <h2 className="text-sm font-black uppercase tracking-widest text-secondary-900">Performance RH</h2>
                        <p className="text-[10px] text-secondary-400 font-medium mt-0.5">Répartition des statuts</p>
                    </div>
                    <div className="p-4">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Tooltip content={<ChartTip />} />
                                <Pie
                                    data={performancePieData}
                                    dataKey="value"
                                    cx="50%" cy="50%"
                                    innerRadius={55} outerRadius={85}
                                    paddingAngle={3}
                                    isAnimationActive
                                >
                                    {performancePieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-2 space-y-2">
                            {performancePieData.map((e, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                                        <span className="text-[10px] font-bold text-secondary-500">{e.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-secondary-900">{e.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                LIGNE 4 — Alertes + Contrats donut + Sessions + Recrutement
            ══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Alertes */}
                <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm border border-white shadow-sm shadow-[#C1272D]/5">
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#C1272D]/6 blur-2xl pointer-events-none" />
                    <div className="p-5 border-b border-secondary-50 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#fff1f1] flex items-center justify-center">
                            <AlertCircle className="w-4 h-4 text-[#C1272D]" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-secondary-900">Alertes</p>
                            <p className="text-[10px] text-secondary-400 font-medium">{alerts.length} élément{alerts.length > 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <div className="p-3 space-y-0.5">
                        {alerts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-2">
                                <CheckCircle2 className="w-8 h-8 text-[#bde4ed]" />
                                <p className="text-[10px] font-black uppercase text-secondary-300 tracking-widest text-center">Tout est à jour</p>
                            </div>
                        ) : alerts.map((a, i) => (
                            <Link key={i} href={a.href}>
                                <div className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-secondary-50 transition-colors group cursor-pointer">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: a.bg }}>
                                        <a.icon className="w-3.5 h-3.5" style={{ color: a.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-secondary-800 truncate leading-tight">{a.label}</p>
                                        <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">{a.sub}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Contrats donut */}
                <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm border border-white shadow-sm shadow-[#007398]/5">
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-[#007398]/6 blur-2xl pointer-events-none" />
                    <div className="p-5 border-b border-secondary-50">
                        <p className="text-xs font-black uppercase tracking-widest text-secondary-900">Contrats par Statut</p>
                        <p className="text-[10px] text-secondary-400 font-medium mt-0.5">Vue globale</p>
                    </div>
                    <div className="p-3">
                        <ResponsiveContainer width="100%" height={140}>
                            <PieChart>
                                <Tooltip content={<ChartTip />} />
                                <Pie data={contractPieData} dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} isAnimationActive>
                                    {contractPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-1 space-y-1.5">
                            {contractPieData.map((e, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                                        <span className="text-[10px] font-bold text-secondary-500">{e.name}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-secondary-900">{e.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sessions à venir */}
                <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm border border-white shadow-sm shadow-[#005d7b]/5">
                    <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#005d7b]/6 blur-2xl pointer-events-none" />
                    <div className="p-5 border-b border-secondary-50 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-secondary-900">Sessions à venir</p>
                            <p className="text-[10px] text-secondary-400 font-medium mt-0.5">{plannedSessions} planifiée{plannedSessions > 1 ? 's' : ''}</p>
                        </div>
                        <Link href="/training/sessions">
                            <ArrowRight className="w-4 h-4 text-secondary-300 hover:text-[#007398] transition-colors cursor-pointer" />
                        </Link>
                    </div>
                    <div className="p-3 space-y-0.5">
                        {upcomingSessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-2">
                                <GraduationCap className="w-8 h-8 text-[#bde4ed]" />
                                <p className="text-[10px] font-black uppercase text-secondary-300 tracking-widest text-center">Aucune session</p>
                            </div>
                        ) : upcomingSessions.map((s, i) => (
                            <Link key={i} href={`/training/sessions/${s.id}`}>
                                <div className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[#f0f9fb] transition-colors group cursor-pointer">
                                    <div className="w-7 h-7 rounded-lg bg-[#f0f9fb] border border-[#bde4ed] flex items-center justify-center shrink-0">
                                        <CalendarDays className="w-3.5 h-3.5 text-[#007398]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-secondary-800 truncate leading-tight">{s.title}</p>
                                        <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">
                                            {s.startDate ? format(new Date(s.startDate), 'dd MMM', { locale: fr }) : '—'}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Funnel recrutement */}
                <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-sm border border-white shadow-sm shadow-[#FDB913]/5">
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-[#FDB913]/8 blur-2xl pointer-events-none" />
                    <div className="p-5 border-b border-secondary-50">
                        <p className="text-xs font-black uppercase tracking-widest text-secondary-900">Pipeline Recrutement</p>
                        <p className="text-[10px] text-secondary-400 font-medium mt-0.5">Funnel candidatures</p>
                    </div>
                    <div className="p-3">
                        <ResponsiveContainer width="100%" height={140}>
                            <BarChart data={recruitmentFunnel} margin={{ top: 0, right: 4, bottom: 0, left: -24 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'var(--font-poppins)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'var(--font-poppins)' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTip />} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive>
                                    <Cell fill={BLUE} />
                                    <Cell fill={YELLOW} />
                                    <Cell fill="#10B981" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-1 space-y-1.5">
                            {recruitmentFunnel.map((f, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest">{f.name}</span>
                                    <span className="text-[10px] font-black text-secondary-900">{f.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                FOOTER
            ══════════════════════════════════════════════════════════════════ */}
            <div className="flex items-center justify-between pt-4 border-t border-secondary-100/60">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm border border-white p-1">
                        <Image src="/logo_arca_nouveau-2.png" alt="ARCA" width={20} height={20} className="object-contain" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">
                        © {new Date().getFullYear()} ARCA — Système d'Information RH
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#007398]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#C1272D]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FDB913]" />
                </div>
            </div>
        </div>
    );
}
