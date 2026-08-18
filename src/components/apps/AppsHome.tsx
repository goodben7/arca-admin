'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Rocket, ArrowRight,
    Users, Umbrella, Briefcase, GraduationCap,
    Target, BarChart3, Sparkles, CheckCircle2, CalendarDays, Clock,
    Calculator, FileBarChart, Settings,
} from 'lucide-react';
import {
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
    CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts';
import { addDays, format, formatDistanceToNow, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getAbout } from '@/lib/api/auth';
import { getHrDashboard, getActivities } from '@/lib/api/hrDashboard';
import { fetchAllCollection } from '@/lib/api/collection';
import type { AuthUser } from '@/types/auth';
import type { Employee } from '@/types/employee';
import type { LeaveRequest } from '@/types/leave';
import type { JobOffer } from '@/types/jobOffer';
import type { Application } from '@/types/application';
import type { RecruitmentRequest } from '@/types/recruitment';
import type { TrainingSession } from '@/types/trainingSession';
import type { Contract } from '@/types/contract';
import type { CompensationHistory } from '@/types/compensation';
import type { PerformanceReview } from '@/types/performance';
import type { Profile } from '@/types/profile';
import type { HrDashboard, Activity } from '@/types/succession';
import { DashboardKpi, DashboardModuleCard } from '@/components/dashboard/DashboardKpi';
import { ChartTooltip } from '@/components/dashboard/ChartTooltip';
import { DataPanel } from '@/components/layout/DataPanel';
import { useSetupProgress } from '@/hooks/useSetupProgress';
import { cn } from '@/lib/utils';

const CHART = {
    blue: '#007398',
    yellow: '#FDB913',
    red: '#C1272D',
    light: '#56afca',
    green: '#10B981',
} as const;

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
}

function normalize<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    const d = data as Record<string, unknown>;
    if (Array.isArray(d?.['hydra:member'])) return d['hydra:member'] as T[];
    if (Array.isArray(d?.member)) return d.member as T[];
    if (Array.isArray(d?.data)) return d.data as T[];
    return [];
}

function statusOf(value: unknown) {
    if (typeof value === 'string') return value.toUpperCase();
    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        const nested = record.code ?? record.value ?? record.id ?? record.status;
        if (typeof nested === 'string') return nested.toUpperCase();
    }
    return '';
}

function isStatus(value: unknown, ...statuses: string[]) {
    const current = statusOf(value);
    return statuses.some((status) => current === status.toUpperCase());
}

function isThisMonth(dateStr?: string) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function isThisWeek(dateStr?: string) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    return isWithinInterval(date, {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
    });
}

function employeeStatusLabel(status?: string) {
    switch (status) {
        case 'ACTIVE': return 'Actif';
        case 'ON_LEAVE': return 'Congé';
        case 'SUSPENDED': return 'Suspendu';
        case 'PROBATION': return 'Essai';
        case 'TERMINATED': return 'Sorti';
        case 'RETIRED': return 'Retraité';
        case 'INACTIVE': return 'Inactif';
        default: return status || '—';
    }
}

function currentQuarterLabel() {
    const month = new Date().getMonth();
    return `T${Math.floor(month / 3) + 1} ${new Date().getFullYear()}`;
}
export function AppsHome() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [stats, setStats] = useState<HrDashboard | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [employeeTotal, setEmployeeTotal] = useState(0);
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [recruitments, setRecruitments] = useState<RecruitmentRequest[]>([]);
    const [sessions, setSessions] = useState<TrainingSession[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [compensations, setCompensations] = useState<CompensationHistory[]>([]);
    const [reviews, setReviews] = useState<PerformanceReview[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [dashLoading, setDashLoading] = useState(true);
    const { allDone, progressPercent, loading: setupLoading } = useSetupProgress();

    useEffect(() => {
        getAbout().then(setUser).catch(() => setUser(null));

        Promise.all([
            getHrDashboard().catch(() => null),
            fetchAllCollection<Employee>('/api/employees').catch(() => ({ items: [] as Employee[], total: 0 })),
            fetchAllCollection<LeaveRequest>('/api/leave_requests').catch(() => ({ items: [] as LeaveRequest[], total: 0 })),
            fetchAllCollection<JobOffer>('/api/job_offers').catch(() => ({ items: [] as JobOffer[], total: 0 })),
            fetchAllCollection<Application>('/api/applications').catch(() => ({ items: [] as Application[], total: 0 })),
            fetchAllCollection<RecruitmentRequest>('/api/recruitment_requests').catch(() => ({ items: [] as RecruitmentRequest[], total: 0 })),
            fetchAllCollection<TrainingSession>('/api/training_sessions').catch(() => ({ items: [] as TrainingSession[], total: 0 })),
            fetchAllCollection<Contract>('/api/contracts').catch(() => ({ items: [] as Contract[], total: 0 })),
            fetchAllCollection<CompensationHistory>('/api/compensation_histories').catch(() => ({ items: [] as CompensationHistory[], total: 0 })),
            fetchAllCollection<PerformanceReview>('/api/performance_reviews').catch(() => ({ items: [] as PerformanceReview[], total: 0 })),
            fetchAllCollection<Profile>('/api/profiles').catch(() => ({ items: [] as Profile[], total: 0 })),
            getActivities().catch(() => []),
        ]).then(([hr, emp, leave, jobs, apps, rec, sess, ctr, comp, rev, prof, acts]) => {
            setStats(hr);
            setEmployees(emp.items);
            setEmployeeTotal(emp.total);
            setLeaves(leave.items);
            setJobOffers(jobs.items);
            setApplications(apps.items);
            setRecruitments(rec.items);
            setSessions(sess.items);
            setContracts(ctr.items);
            setCompensations(comp.items);
            setReviews(rev.items);
            setProfiles(prof.items);
            setActivities(normalize<Activity>(acts).slice(0, 8));
        }).finally(() => setDashLoading(false));
    }, []);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeEmployees = employees.filter((e) => (
        isStatus(e.status, 'ACTIVE')
        || (!statusOf(e.status) && Boolean(e.activatedAt) && !e.deactivatedAt && !e.terminatedAt)
    )).length;
    const pendingLeaves = leaves.filter((l) => isStatus(l.status, 'PENDING')).length;
    const ongoingLeaves = leaves.filter((l) => {
        if (!isStatus(l.status, 'APPROVED')) return false;
        if (!l.endDate) return true;
        const end = new Date(l.endDate);
        return !Number.isNaN(end.getTime()) && end >= today;
    }).length;
    const returningThisWeek = leaves.filter((l) => isStatus(l.status, 'APPROVED') && isThisWeek(l.endDate)).length;
    const hiredThisMonth = employees.filter((e) => isThisMonth(e.hireDate)).length;
    const openJobOffers = jobOffers.filter((j) => isStatus(j.status, 'PUBLISHED')).length;
    const pendingRecruitments = recruitments.filter((r) => isStatus(r.status, 'PENDING')).length;
    const hiredCount = applications.filter((a) => isStatus(a.status, 'HIRED')).length;
    const applicationsThisMonth = applications.filter((a) => isThisMonth(a.appliedAt || a.createdAt)).length;
    const trainingsFromSessions = sessions.filter((s) => isStatus(s.status, 'ONGOING', 'PLANNED')).length;
    const trainingsInProgress = trainingsFromSessions || stats?.trainingsInProgress || 0;
    const headcount = Math.max(employeeTotal, employees.length, stats?.headcount || 0);
    const activeRate = headcount > 0 ? Math.round((activeEmployees / headcount) * 1000) / 10 : 0;
    const payrollThisMonth = compensations.filter((c) => isThisMonth(c.effectiveDate || c.createdAt)).length;
    const reviewScores = reviews
        .map(r => Number(r.score ?? r.overallRating))
        .filter(n => Number.isFinite(n) && n > 0);
    const performanceScore = reviewScores.length > 0
        ? Math.round((reviewScores.reduce((sum, n) => sum + n, 0) / reviewScores.length) * 10) / 10
        : null;
    const now = new Date();
    const inSixtyDays = addDays(now, 60);
    const contractsToRenew = contracts.filter(c => {
        if (!c.endDate || !isStatus(c.status, 'ACTIVE', 'PENDING')) return false;
        const end = new Date(c.endDate);
        return !Number.isNaN(end.getTime()) && end >= now && end <= inSixtyDays;
    }).length;
    const monthShort = format(now, 'MMM yyyy', { locale: fr });
    const recentEmployees = [...employees]
        .filter(e => e.firstName && e.lastName)
        .sort((a, b) => new Date(b.hireDate || b.createdAt || 0).getTime() - new Date(a.hireDate || a.createdAt || 0).getTime())
        .slice(0, 5);
    const alertItems = [
        contractsToRenew > 0 ? {
            title: `${contractsToRenew} contrat${contractsToRenew > 1 ? 's' : ''} à renouveler`,
            detail: 'Échéance dans les 60 prochains jours',
            tone: 'rose' as const,
        } : null,
        pendingLeaves > 0 ? {
            title: `${pendingLeaves} demande${pendingLeaves > 1 ? 's' : ''} de congé à traiter`,
            detail: ongoingLeaves > 0 ? `${ongoingLeaves} congé(s) en cours` : 'Validation RH attendue',
            tone: 'amber' as const,
        } : null,
        openJobOffers > 0 ? {
            title: `${openJobOffers} poste${openJobOffers > 1 ? 's' : ''} ouvert${openJobOffers > 1 ? 's' : ''}`,
            detail: `${applications.length} candidature(s) reçue(s)`,
            tone: 'rose' as const,
        } : null,
        trainingsInProgress > 0 ? {
            title: `${trainingsInProgress} session${trainingsInProgress > 1 ? 's' : ''} de formation`,
            detail: 'Sessions ou parcours en cours',
            tone: 'emerald' as const,
        } : null,
        reviews.length > 0 ? {
            title: `${reviews.length} évaluation${reviews.length > 1 ? 's' : ''} en suivi`,
            detail: performanceScore != null ? `Score moyen ${performanceScore}` : 'Cycles et revues de performance',
            tone: 'blue' as const,
        } : hiredCount > 0 ? {
            title: `${hiredCount} recrutement${hiredCount > 1 ? 's' : ''} finalisé${hiredCount > 1 ? 's' : ''}`,
            detail: 'Intégrations récentes à suivre',
            tone: 'blue' as const,
        } : null,
    ].filter(Boolean) as Array<{ title: string; detail: string; tone: 'amber' | 'rose' | 'emerald' | 'blue' }>;

    const statusPieData = useMemo(() => [
        { name: 'Actifs', value: activeEmployees, color: CHART.blue },
        { name: 'En congé', value: employees.filter((e) => isStatus(e.status, 'ON_LEAVE')).length, color: CHART.yellow },
        { name: 'Suspendus', value: employees.filter((e) => isStatus(e.status, 'SUSPENDED')).length, color: CHART.red },
        { name: 'Essai', value: employees.filter((e) => isStatus(e.status, 'PROBATION')).length, color: CHART.light },
    ].filter((d) => d.value > 0), [employees, activeEmployees]);

    const recruitmentFunnel = useMemo(() => [
        { name: 'Demandes', value: recruitments.length, fill: CHART.light },
        { name: 'Candidatures', value: applications.length, fill: CHART.blue },
        { name: 'Embauches', value: hiredCount, fill: CHART.green },
    ], [recruitments, applications, hiredCount]);

    const firstName =
        user?.displayName?.split(/\s+/)[0] ||
        user?.email?.split('@')[0] ||
        'collègue';
    const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

    const heroStats = [
        { label: 'Effectif', value: dashLoading ? '…' : headcount },
        { label: 'Congés', value: dashLoading ? '…' : ongoingLeaves },
        { label: 'Offres', value: dashLoading ? '…' : openJobOffers },
    ];

    return (
        <div className="page-enter-stack">
                            <div className="relative mb-8 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 px-6 py-8 md:px-8 md:py-9 shadow-md">
                                <div className="pointer-events-none absolute inset-0" aria-hidden>
                                    <div className="absolute inset-x-0 top-0 h-px bg-white/15" />
                                    <div className="absolute -top-20 -right-8 h-64 w-64 rounded-full bg-primary-400/18 blur-3xl" />
                                    <div className="absolute bottom-[-40%] left-[8%] h-56 w-56 rounded-full bg-accent-red-500/10 blur-3xl" />
                                    <div className="absolute top-6 right-[32%] h-36 w-36 rounded-full bg-accent-yellow-400/12 blur-2xl" />
                                </div>
                                <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="max-w-xl">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 mb-4 backdrop-blur-sm">
                                            <Sparkles className="h-3.5 w-3.5 text-accent-yellow-400" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/75">
                                                Hub ressources humaines
                                            </span>
                                        </div>
                                        <h2 className="text-[1.85rem] md:text-[2.15rem] font-black tracking-tight text-white leading-[1.15]">
                                            {greeting()}, {displayName}
                                        </h2>
                                        <p className="mt-2.5 text-sm leading-relaxed text-white/65 max-w-lg">
                                            Vue d’ensemble de l’activité RH — effectif, temps, recrutement et formation.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:flex-col lg:items-end">
                                        <div className="flex gap-2">
                                            {heroStats.map((item) => (
                                                <div
                                                    key={item.label}
                                                    className="min-w-[72px] rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-sm"
                                                >
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">{item.label}</p>
                                                    <p className="mt-1 text-xl font-black tabular-nums text-white leading-none">{item.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <Link
                                            href="/m/pilotage"
                                            className="inline-flex items-center justify-center gap-2 self-start rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-primary-800 shadow-sm hover:bg-primary-50 transition-colors"
                                        >
                                            <BarChart3 className="h-4 w-4" />
                                            Voir le pilotage
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {!setupLoading && !allDone && (
                                <Link
                                    href="/m/pilotage/configuration"
                                    className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-[1.35rem] border border-primary-100 bg-white shadow-sm hover:border-primary-200 hover:shadow-card transition-all group"
                                >
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="w-11 h-11 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                                            <Rocket className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-secondary-900">Configuration initiale en cours</p>
                                            <p className="text-sm text-secondary-500 mt-0.5">
                                                Paramétrez les référentiels, les accès et vos premiers dossiers collaborateurs.
                                            </p>
                                            <div className="mt-3 flex items-center gap-3">
                                                <div className="h-1.5 flex-1 max-w-xs rounded-full bg-primary-100 overflow-hidden">
                                                    <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${progressPercent}%` }} />
                                                </div>
                                                <span className="text-xs font-bold text-primary-700 tabular-nums">{progressPercent}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 shrink-0 group-hover:gap-2 transition-all">
                                        Continuer <ArrowRight className="w-4 h-4" />
                                    </span>
                                </Link>
                            )}

                            <section aria-label="Indicateurs clés" className="mb-8">
                                <div className="mb-3 flex items-baseline justify-between gap-3">
                                    <h3 className="text-[13px] font-bold uppercase tracking-[0.14em] text-secondary-400">Indicateurs</h3>
                                    <p className="text-xs text-secondary-400 hidden sm:block">Cliquez une carte pour ouvrir le module</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 kpi-enter-stack">
                                    <DashboardKpi
                                        label="Effectif total"
                                        value={dashLoading ? '…' : headcount}
                                        detail={hiredThisMonth > 0 ? `↑ +${hiredThisMonth} ce mois` : 'Collaborateurs au registre'}
                                        icon={Users}
                                        href="/m/personnel/employees"
                                        tone="primary"
                                    />
                                    <DashboardKpi
                                        label="Employés actifs"
                                        value={dashLoading ? '…' : activeEmployees}
                                        detail={dashLoading ? undefined : `${activeRate}% présents`}
                                        icon={CheckCircle2}
                                        href="/m/personnel/employees"
                                        tone="success"
                                    />
                                    <DashboardKpi
                                        label="Congés en cours"
                                        value={dashLoading ? '…' : ongoingLeaves}
                                        detail={returningThisWeek > 0
                                            ? `${returningThisWeek} retour${returningThisWeek > 1 ? 's' : ''} cette semaine`
                                            : pendingLeaves > 0
                                                ? `${pendingLeaves} en attente de validation`
                                                : 'Aucun départ planifié'}
                                        icon={CalendarDays}
                                        href="/m/temps/leave"
                                        tone="warning"
                                    />
                                    <DashboardKpi
                                        label="Postes ouverts"
                                        value={dashLoading ? '…' : openJobOffers}
                                        detail={pendingRecruitments > 0
                                            ? `${pendingRecruitments} demande${pendingRecruitments > 1 ? 's' : ''} en attente`
                                            : 'Offres publiées'}
                                        icon={Clock}
                                        href="/m/recrutement/offres"
                                        tone="danger"
                                    />
                                </div>
                            </section>

                            <section aria-label="Modules RH" className="mb-8">
                                <div className="mb-3 flex items-baseline justify-between gap-3">
                                    <h3 className="text-[13px] font-bold uppercase tracking-[0.14em] text-secondary-400">Modules</h3>
                                    <p className="text-xs text-secondary-400 hidden sm:block">Accès rapide aux domaines RH</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                    <DashboardModuleCard
                                        title="Gestion RH"
                                        value={dashLoading ? '…' : headcount}
                                        description="Dossiers employés, organigramme, contrats"
                                        badge="Actif"
                                        badgeTone="blue"
                                        href="/m/personnel/employees"
                                        icon={Users}
                                        tint="bg-primary-100 text-primary-700"
                                    />
                                    <DashboardModuleCard
                                        title="Paie"
                                        value={dashLoading ? '…' : payrollThisMonth}
                                        description="Mouvements de rémunération enregistrés"
                                        badge={monthShort}
                                        badgeTone="green"
                                        href="/m/paie"
                                        icon={Calculator}
                                        tint="bg-teal-50 text-teal-700"
                                    />
                                    <DashboardModuleCard
                                        title="Congés"
                                        value={dashLoading ? '…' : ongoingLeaves}
                                        description="Demandes en attente, soldes de congés"
                                        badge={pendingLeaves > 0 ? `${pendingLeaves} en attente` : 'En cours'}
                                        badgeTone="orange"
                                        href="/m/temps/leave"
                                        icon={Umbrella}
                                        tint="bg-amber-50 text-amber-700"
                                    />
                                    <DashboardModuleCard
                                        title="Recrutement"
                                        value={dashLoading ? '…' : applicationsThisMonth || applications.length}
                                        description="Candidatures reçues ce mois"
                                        badge={`${openJobOffers} poste${openJobOffers > 1 ? 's' : ''}`}
                                        badgeTone="red"
                                        href="/m/recrutement"
                                        icon={Briefcase}
                                        tint="bg-rose-50 text-rose-700"
                                    />
                                    <DashboardModuleCard
                                        title="Formation"
                                        value={dashLoading ? '…' : trainingsInProgress}
                                        description="Participants inscrits, sessions ouvertes"
                                        badge={`${sessions.length} session${sessions.length > 1 ? 's' : ''}`}
                                        badgeTone="blue"
                                        href="/m/formation/sessions"
                                        icon={GraduationCap}
                                        tint="bg-sky-50 text-sky-700"
                                    />
                                    <DashboardModuleCard
                                        title="Performance"
                                        value={dashLoading ? '…' : performanceScore != null ? `${performanceScore}` : reviews.length}
                                        description="Score moyen évaluations / revues"
                                        badge={currentQuarterLabel()}
                                        badgeTone="teal"
                                        href="/m/performance"
                                        icon={Target}
                                        tint="bg-cyan-50 text-cyan-800"
                                    />
                                    <DashboardModuleCard
                                        title="Rapports BI"
                                        value={dashLoading ? '…' : activities.length}
                                        description="Activités et indicateurs de pilotage"
                                        badge="Mensuel"
                                        badgeTone="yellow"
                                        href="/m/pilotage/reports"
                                        icon={FileBarChart}
                                        tint="bg-amber-50 text-amber-800"
                                    />
                                    <DashboardModuleCard
                                        title="Paramétrage"
                                        value={dashLoading ? '…' : profiles.length}
                                        description="Rôles, droits, référentiels"
                                        badge="Admin"
                                        badgeTone="blue"
                                        href="/m/securite"
                                        icon={Settings}
                                        tint="bg-slate-100 text-slate-700"
                                    />
                                </div>
                            </section>

                            <div className="mb-3 flex items-baseline justify-between gap-3">
                                <h3 className="text-[13px] font-bold uppercase tracking-[0.14em] text-secondary-400">Activité</h3>
                            </div>
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-6">
                                <div className="xl:col-span-5">
                                    <DataPanel accent={false} className="!rounded-[1.35rem]" title="Répartition de l’effectif" description="Statuts collaborateurs" contentClassName="pt-2">
                                        {statusPieData.length > 0 ? (
                                            <>
                                                <ResponsiveContainer width="100%" height={180}>
                                                    <PieChart>
                                                        <Tooltip content={<ChartTooltip />} />
                                                        <Pie data={statusPieData} dataKey="value" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2}>
                                                            {statusPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <ul className="space-y-2 mt-1">
                                                    {statusPieData.map((e, i) => (
                                                        <li key={i} className="flex items-center justify-between text-sm">
                                                            <span className="flex items-center gap-2 text-muted-foreground">
                                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                                                                {e.name}
                                                            </span>
                                                            <span className="font-semibold tabular-nums">{e.value}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        ) : (
                                            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                                                {dashLoading ? 'Chargement…' : 'Aucune donnée'}
                                            </div>
                                        )}
                                    </DataPanel>
                                </div>
                                <div className="xl:col-span-7">
                                    <DataPanel accent={false} className="!rounded-[1.35rem]" title="Funnel recrutement" description="Demandes → candidatures → embauches" contentClassName="pt-2">
                                        <ResponsiveContainer width="100%" height={240}>
                                            <BarChart data={recruitmentFunnel} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<ChartTooltip />} />
                                                <Bar dataKey="value" name="Volume" radius={[6, 6, 0, 0]} barSize={48}>
                                                    {recruitmentFunnel.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </DataPanel>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                <DataPanel
                                    accent={false}
                                    className="!rounded-[1.35rem] lg:col-span-8"
                                    title="Employés récemment intégrés"
                                    toolbar={
                                        <Link href="/m/personnel/employees" className="text-xs font-medium text-primary-500 hover:text-primary-600 inline-flex items-center gap-1">
                                            Voir tout <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    }
                                    contentClassName="p-0"
                                >
                                    {recentEmployees.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-10 px-4">
                                            {dashLoading ? 'Chargement…' : 'Aucune activité récente'}
                                        </p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="panel-header-wash text-secondary-400 uppercase tracking-wider text-[10px]">
                                                    <tr>
                                                        <th className="px-5 py-3 text-left">Employé</th>
                                                        <th className="px-5 py-3 text-left">Poste</th>
                                                        <th className="px-5 py-3 text-left">Statut</th>
                                                        <th className="px-5 py-3 text-left">Intégration</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-subtle">
                                                    {recentEmployees.map((emp) => (
                                                        <tr key={emp.id} className="hover:bg-primary-50/20 transition-colors">
                                                            <td className="px-5 py-3.5">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                                                                        {String(emp.firstName?.[0] || '').toUpperCase()}{String(emp.lastName?.[0] || '').toUpperCase()}
                                                                    </span>
                                                                    <div>
                                                                        <p className="font-semibold text-secondary-900">{emp.firstName} {emp.lastName}</p>
                                                                        <p className="text-xs text-secondary-500">{emp.employeeNumber || emp.id}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3.5 text-secondary-600">{emp.position || '—'}</td>
                                                            <td className="px-5 py-3.5">
                                                                <span className={cn(
                                                                    'inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide',
                                                                    emp.status === 'ACTIVE' && 'bg-emerald-50 text-emerald-700',
                                                                    emp.status === 'ON_LEAVE' && 'bg-amber-50 text-amber-700',
                                                                    emp.status !== 'ACTIVE' && emp.status !== 'ON_LEAVE' && 'bg-secondary-100 text-secondary-600',
                                                                )}>
                                                                    {employeeStatusLabel(emp.status)}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-3.5 text-secondary-500">
                                                                {emp.hireDate
                                                                    ? format(new Date(emp.hireDate), 'dd/MM/yyyy', { locale: fr })
                                                                    : '—'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </DataPanel>

                                <DataPanel accent={false} className="!rounded-[1.35rem] lg:col-span-4" title="Alertes & agenda RH" description="Points de vigilance" contentClassName="p-4">
                                    <div className="space-y-3">
                                        {alertItems.length === 0 && activities.length === 0 && (
                                            <div className="rounded-2xl border border-dashed border-secondary-200 bg-secondary-50/60 px-4 py-8 text-center">
                                                <p className="text-sm font-medium text-secondary-500">
                                                    {dashLoading ? 'Chargement…' : 'Rien à signaler pour le moment'}
                                                </p>
                                            </div>
                                        )}
                                        {alertItems.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    'rounded-2xl border border-l-[3px] px-4 py-3',
                                                    item.tone === 'amber' && 'border-amber-100 border-l-amber-400 bg-amber-50/70',
                                                    item.tone === 'rose' && 'border-rose-100 border-l-accent-red-400 bg-rose-50/70',
                                                    item.tone === 'emerald' && 'border-emerald-100 border-l-emerald-500 bg-emerald-50/70',
                                                    item.tone === 'blue' && 'border-primary-100 border-l-primary-500 bg-primary-50/70',
                                                )}
                                            >
                                                <p className="text-sm font-semibold text-secondary-900">{item.title}</p>
                                                <p className="mt-1 text-xs text-secondary-500">{item.detail}</p>
                                            </div>
                                        ))}
                                        {activities.slice(0, 2).map((a) => {
                                            const when = a.occurredAt || a.createdAt;
                                            return (
                                                <div key={a.id} className="rounded-2xl border border-border-subtle bg-white/70 px-4 py-3">
                                                    <p className="text-sm font-semibold text-secondary-900">
                                                        {a.activity}
                                                    </p>
                                                    <p className="mt-1 text-xs text-secondary-500">
                                                        {when
                                                            ? formatDistanceToNow(new Date(when), { addSuffix: true, locale: fr })
                                                            : '—'}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </DataPanel>
                            </div>
        </div>
    );
}
