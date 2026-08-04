'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Search, Bell, Rocket, ArrowRight, LayoutGrid,
    Users, Umbrella, Briefcase, GraduationCap, Activity as ActivityIcon,
} from 'lucide-react';
import {
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
    CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getFavoriteSlugs, toggleFavorite } from '@/lib/modules/prefs';
import { getAbout } from '@/lib/api/auth';
import { getHrDashboard, getActivities } from '@/lib/api/hrDashboard';
import { getAllEmployees } from '@/lib/api/employee';
import { getAllLeaveRequests } from '@/lib/api/leave';
import { getAllJobOffers } from '@/lib/api/jobOffer';
import { getAllApplications } from '@/lib/api/application';
import { getAllRecruitmentRequests } from '@/lib/api/recruitment';
import { getAllTrainingSessions } from '@/lib/api/trainingSession';
import type { HrDashboard, Activity } from '@/types/succession';
import { ShellAmbient } from '@/components/layout/ShellAmbient';
import { DashboardKpi, DashboardQuickLink } from '@/components/dashboard/DashboardKpi';
import { ChartTooltip } from '@/components/dashboard/ChartTooltip';
import { DataPanel } from '@/components/layout/DataPanel';
import { useSetupProgress } from '@/hooks/useSetupProgress';
import { AppsLauncherModal } from './AppsLauncherModal';
import { AppsCommandPalette } from './AppsCommandPalette';
import { AppsSidebar, AppsSidebarToggle } from './AppsSidebar';

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

function normalize(data: unknown): any[] {
    if (Array.isArray(data)) return data;
    const d = data as Record<string, unknown>;
    if (Array.isArray(d?.['hydra:member'])) return d['hydra:member'] as any[];
    if (Array.isArray(d?.member)) return d.member as any[];
    return [];
}

/**
 * Hub RH `/apps` — tableau de bord léger + lanceur d’applications + palette ⌘K.
 */
export function AppsHome() {
    const [favorites, setFavorites] = useState<string[]>([]);
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<HrDashboard | null>(null);
    const [appsOpen, setAppsOpen] = useState(false);
    const [cmdOpen, setCmdOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [jobOffers, setJobOffers] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [recruitments, setRecruitments] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [dashLoading, setDashLoading] = useState(true);
    const { allDone, progressPercent, loading: setupLoading } = useSetupProgress();

    useEffect(() => {
        setFavorites(getFavoriteSlugs());
        getAbout().then(setUser).catch(() => setUser(null));

        Promise.all([
            getHrDashboard().catch(() => null),
            getAllEmployees().catch(() => []),
            getAllLeaveRequests().catch(() => []),
            getAllJobOffers().catch(() => []),
            getAllApplications().catch(() => []),
            getAllRecruitmentRequests().catch(() => []),
            getAllTrainingSessions().catch(() => []),
            getActivities().catch(() => []),
        ]).then(([hr, emp, leave, jobs, apps, rec, sess, acts]) => {
            setStats(hr);
            setEmployees(normalize(emp));
            setLeaves(normalize(leave));
            setJobOffers(normalize(jobs));
            setApplications(normalize(apps));
            setRecruitments(normalize(rec));
            setSessions(normalize(sess));
            setActivities(Array.isArray(acts) ? acts.slice(0, 8) : []);
        }).finally(() => setDashLoading(false));
    }, []);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setCmdOpen(true);
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const handleToggleFavorite = (slug: string) => {
        setFavorites(toggleFavorite(slug));
    };

    const activeEmployees = employees.filter(e => e.status === 'ACTIVE').length;
    const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length;
    const ongoingLeaves = leaves.filter(l => l.status === 'APPROVED' || l.status === 'IN_PROGRESS').length;
    const openJobOffers = jobOffers.filter(j => j.status === 'PUBLISHED').length;
    const hiredCount = applications.filter(a => a.status === 'HIRED').length;
    const trainingsInProgress = stats?.trainingsInProgress ?? sessions.filter(s => s.status === 'IN_PROGRESS' || s.status === 'PLANNED').length;
    const headcount = stats?.headcount ?? employees.length;
    const activeRate = employees.length > 0 ? Math.round((activeEmployees / employees.length) * 100) : 0;

    const statusPieData = useMemo(() => [
        { name: 'Actifs', value: activeEmployees, color: CHART.blue },
        { name: 'En congé', value: employees.filter(e => e.status === 'ON_LEAVE').length, color: CHART.yellow },
        { name: 'Suspendus', value: employees.filter(e => e.status === 'SUSPENDED').length, color: CHART.red },
        { name: 'Essai', value: employees.filter(e => e.status === 'PROBATION').length, color: CHART.light },
    ].filter(d => d.value > 0), [employees, activeEmployees]);

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
    const todayLabel = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr });

    return (
        <div className="flex h-full overflow-hidden bg-surface">
            <AppsSidebar
                mobileOpen={sidebarOpen}
                onMobileClose={() => setSidebarOpen(false)}
                onBrowseApps={() => setAppsOpen(true)}
            />

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <header className="shrink-0 border-b border-border-subtle bg-surface">
                    <div className="flex h-14 items-center gap-3 px-4 md:px-5">
                        <AppsSidebarToggle onClick={() => setSidebarOpen(true)} />

                        <div className="min-w-0">
                            <h1 className="truncate text-[15px] font-semibold tracking-tight text-secondary-900">
                                Tableau de bord — Ressources Humaines
                            </h1>
                            <p className="hidden truncate text-[11px] capitalize text-secondary-400 sm:block">
                                {todayLabel}
                            </p>
                        </div>

                        <div className="mx-auto hidden w-full max-w-sm md:block">
                            <button
                                type="button"
                                onClick={() => setCmdOpen(true)}
                                className="relative flex h-9 w-full items-center gap-2 rounded-xl border border-transparent bg-muted/80 px-3 text-left text-[13px] text-secondary-400 transition-all hover:border-primary-200 hover:bg-surface"
                            >
                                <Search className="h-3.5 w-3.5 shrink-0" />
                                <span className="flex-1 truncate">Rechercher un module ou une fonction…</span>
                                <kbd className="rounded border border-border-subtle bg-surface px-1.5 py-px text-[9px] font-medium text-secondary-400">
                                    ⌘K
                                </kbd>
                            </button>
                        </div>

                        <div className="ml-auto flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setAppsOpen(true)}
                                className="hidden sm:inline-flex h-9 items-center gap-2 rounded-xl bg-primary-600 px-3 text-[13px] font-semibold text-white shadow-sm hover:bg-primary-700"
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                                Applications
                            </button>
                            <button
                                type="button"
                                onClick={() => setAppsOpen(true)}
                                className="flex sm:hidden h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white"
                                aria-label="Applications"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button type="button" className="relative flex h-9 w-9 items-center justify-center rounded-xl text-secondary-500 hover:bg-muted" aria-label="Notifications">
                                <Bell className="h-4 w-4" />
                                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary-500" />
                            </button>
                        </div>
                    </div>
                    <div className="flex h-1">
                        <div className="flex-[3] bg-primary-500" />
                        <div className="flex-1 bg-accent-red-500" />
                        <div className="flex-1 bg-accent-yellow-500" />
                    </div>
                    <div className="border-b border-border-subtle px-4 py-2 md:hidden">
                        <button
                            type="button"
                            onClick={() => setCmdOpen(true)}
                            className="relative flex h-9 w-full items-center gap-2 rounded-xl bg-muted/80 px-3 text-left text-[13px] text-secondary-400"
                        >
                            <Search className="h-3.5 w-3.5" />
                            <span>Rechercher…</span>
                        </button>
                    </div>
                </header>

                <div className="relative min-h-0 flex-1 overflow-hidden bg-[#eef5f9]">
                    <ShellAmbient />

                    <div className="relative z-[1] h-full overflow-y-auto">
                        <div className="mx-auto max-w-6xl px-4 py-7 md:px-8 md:py-9 page-enter-stack">
                            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-2xl font-semibold tracking-tight text-secondary-900 md:text-[1.65rem]">
                                        {greeting()}, {displayName}
                                    </h2>
                                    <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-secondary-500">
                                        Vue d’ensemble RH — ouvrez une application pour aller plus loin.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAppsOpen(true)}
                                    className="inline-flex items-center gap-2 self-start rounded-xl border border-primary-200 bg-surface px-4 py-2.5 text-sm font-semibold text-primary-700 shadow-sm hover:bg-primary-50"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                    Parcourir les apps
                                </button>
                            </div>

                            {!setupLoading && !allDone && (
                                <Link
                                    href="/m/pilotage/configuration"
                                    className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 to-white hover:border-primary-300 transition-colors group"
                                >
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                                            <Rocket className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-secondary-900">Configuration initiale en cours</p>
                                            <p className="text-sm text-secondary-500 mt-0.5">
                                                Paramétrez les référentiels, les accès et vos premiers dossiers collaborateurs.
                                            </p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="w-24 h-1.5 rounded-full bg-primary-100 overflow-hidden">
                                                    <div className="h-full bg-primary-500" style={{ width: `${progressPercent}%` }} />
                                                </div>
                                                <span className="text-xs font-bold text-primary-700">{progressPercent}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 shrink-0 group-hover:gap-2 transition-all">
                                        Continuer <ArrowRight className="w-4 h-4" />
                                    </span>
                                </Link>
                            )}

                            <section aria-label="Indicateurs clés" className="mb-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                                    <DashboardKpi
                                        label="Effectif"
                                        value={dashLoading ? '…' : headcount}
                                        detail={dashLoading ? undefined : `${activeEmployees} actifs (${activeRate}%)`}
                                        icon={Users}
                                        href="/m/personnel/employees"
                                        tone="primary"
                                    />
                                    <DashboardKpi
                                        label="Congés"
                                        value={dashLoading ? '…' : pendingLeaves}
                                        detail={ongoingLeaves > 0 ? `${ongoingLeaves} en cours` : 'En attente de validation'}
                                        icon={Umbrella}
                                        href="/m/temps/leave"
                                        tone={pendingLeaves > 0 ? 'warning' : 'default'}
                                    />
                                    <DashboardKpi
                                        label="Postes ouverts"
                                        value={dashLoading ? '…' : openJobOffers}
                                        detail="Offres publiées"
                                        icon={Briefcase}
                                        href="/m/recrutement/offres"
                                    />
                                    <DashboardKpi
                                        label="Formations"
                                        value={dashLoading ? '…' : trainingsInProgress}
                                        detail="Sessions / parcours en cours"
                                        icon={GraduationCap}
                                        href="/m/formation/sessions"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <DashboardQuickLink label="Personnel" value={headcount} href="/m/personnel/employees" icon={Users} />
                                    <DashboardQuickLink label="Congés" value={pendingLeaves} href="/m/temps/leave" icon={Umbrella} />
                                    <DashboardQuickLink label="Offres" value={openJobOffers} href="/m/recrutement/offres" icon={Briefcase} />
                                    <DashboardQuickLink label="Pilotage" value={stats ? Math.round(stats.turnoverRatePercent) : 0} href="/m/pilotage" icon={ActivityIcon} />
                                </div>
                            </section>

                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-6">
                                <div className="xl:col-span-5">
                                    <DataPanel className="!rounded-xl" title="Répartition de l’effectif" description="Statuts collaborateurs" contentClassName="pt-2">
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
                                    <DataPanel className="!rounded-xl" title="Funnel recrutement" description="Demandes → candidatures → embauches" contentClassName="pt-2">
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

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <DataPanel
                                    className="!rounded-xl"
                                    title="Activité récente"
                                    toolbar={
                                        <Link href="/m/pilotage" className="text-xs font-medium text-primary-500 hover:text-primary-600 inline-flex items-center gap-1">
                                            Pilotage <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    }
                                    contentClassName="p-0"
                                >
                                    {activities.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-10 px-4">
                                            {dashLoading ? 'Chargement…' : 'Aucune activité récente'}
                                        </p>
                                    ) : (
                                        <ul className="divide-y divide-border-subtle">
                                            {activities.map(a => {
                                                const when = a.occurredAt || a.createdAt;
                                                return (
                                                    <li key={a.id} className="flex items-start gap-3 px-5 py-3.5">
                                                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                                                            <ActivityIcon className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium text-secondary-900 truncate">
                                                                {a.activity}
                                                                {a.ressourceName ? ` · ${a.ressourceName}` : ''}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                {when
                                                                    ? formatDistanceToNow(new Date(when), { addSuffix: true, locale: fr })
                                                                    : '—'}
                                                            </p>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </DataPanel>

                                <DataPanel className="!rounded-xl" title="Accès rapides" description="Modules clés" contentClassName="p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {[
                                            { href: '/m/personnel/employees', label: 'Collaborateurs', hint: 'Dossiers RH' },
                                            { href: '/m/temps/leave', label: 'Congés', hint: 'Demandes & validations' },
                                            { href: '/m/recrutement/offres', label: 'Recrutement', hint: 'Offres publiées' },
                                            { href: '/m/formation/sessions', label: 'Formation', hint: 'Sessions' },
                                            { href: '/m/performance', label: 'Performance', hint: 'Objectifs & évaluations' },
                                            { href: '/m/pilotage', label: 'Pilotage', hint: 'Indicateurs RH' },
                                        ].map(item => (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className="rounded-xl border border-border-subtle bg-surface px-3.5 py-3 hover:border-primary-200 hover:bg-primary-50/40 transition-colors"
                                            >
                                                <p className="text-sm font-semibold text-secondary-900">{item.label}</p>
                                                <p className="text-[11px] text-secondary-500 mt-0.5">{item.hint}</p>
                                            </Link>
                                        ))}
                                    </div>
                                </DataPanel>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AppsLauncherModal
                open={appsOpen}
                onClose={() => setAppsOpen(false)}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
            />
            <AppsCommandPalette
                open={cmdOpen}
                onClose={() => setCmdOpen(false)}
                onBrowseApps={() => setAppsOpen(true)}
            />
        </div>
    );
}
