'use client';

import { useEffect, useMemo, useState } from 'react';
import { addDays, isAfter, isBefore } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import {
    AlertCircle, BookOpen, Briefcase, CalendarDays, ClipboardList, Clock, FileCheck,
    Gift, GraduationCap, KeyRound, Presentation, Shield, Target, UserPlus, Users, Wallet,
} from 'lucide-react';
import { getDepartments } from '@/lib/api/employee';
import { getAllUsers, getAllProfiles } from '@/lib/api/profile';
import { getOnboardingProcesses } from '@/lib/api/onboarding';
import { getHrDashboard } from '@/lib/api/hrDashboard';
import { fetchAllCollection } from '@/lib/api/collection';
import { normalizeList } from '@/lib/modules/dashboard/normalize';
import type { OnboardingProcess } from '@/types/onboarding';
import type { AppUser, Profile } from '@/types/profile';

export interface ModuleKpi {
    label: string;
    value: number | string;
    detail?: string;
    href: string;
    tone?: 'default' | 'primary' | 'warning';
}

export interface ModuleAlert {
    icon: LucideIcon;
    label: string;
    href: string;
}

export interface ModuleChartSlice {
    name: string;
    value: number;
    color: string;
}

export interface ModuleDashboardData {
    loading: boolean;
    kpis: ModuleKpi[];
    alerts: ModuleAlert[];
    chart?: { title: string; data: ModuleChartSlice[] };
}

const CHART = {
    blue: '#007398',
    yellow: '#FDB913',
    red: '#C1272D',
    light: '#56afca',
    green: '#10B981',
} as const;

async function fetchPersonnel() {
    const [employees, departments, contracts, onboarding, hr] = await Promise.all([
        fetchAllCollection('/api/employees').catch(() => ({ items: [], total: 0 })),
        getDepartments().catch(() => []),
        fetchAllCollection('/api/contracts').catch(() => ({ items: [], total: 0 })),
        getOnboardingProcesses().catch(() => []),
        getHrDashboard().catch(() => null),
    ]);
    return {
        employees: employees.items,
        departments: normalizeList(departments),
        contracts: contracts.items,
        onboarding: normalizeList<OnboardingProcess>(onboarding),
        hr,
        employeeTotal: employees.total,
    };
}

async function fetchTemps() {
    const leaves = await fetchAllCollection('/api/leave_requests').catch(() => ({ items: [], total: 0 }));
    return { leaves: leaves.items };
}

async function fetchRecrutement() {
    const [applications, jobOffers, recruitments] = await Promise.all([
        fetchAllCollection('/api/applications').catch(() => ({ items: [], total: 0 })),
        fetchAllCollection('/api/job_offers').catch(() => ({ items: [], total: 0 })),
        fetchAllCollection('/api/recruitment_requests').catch(() => ({ items: [], total: 0 })),
    ]);
    return {
        applications: applications.items,
        jobOffers: jobOffers.items,
        recruitments: recruitments.items,
    };
}

async function fetchFormation() {
    const [trainings, sessions, catalogs] = await Promise.all([
        fetchAllCollection('/api/training_requests').catch(() => ({ items: [], total: 0 })),
        fetchAllCollection('/api/training_sessions').catch(() => ({ items: [], total: 0 })),
        fetchAllCollection('/api/training_catalogs').catch(() => ({ items: [], total: 0 })),
    ]);
    return {
        trainings: trainings.items,
        sessions: sessions.items,
        catalogs: catalogs.items,
    };
}

async function fetchPerformance() {
    const [cycles, objectives, succession, hr] = await Promise.all([
        fetchAllCollection('/api/evaluation_cycles').catch(() => ({ items: [], total: 0 })),
        fetchAllCollection('/api/objectives').catch(() => ({ items: [], total: 0 })),
        fetchAllCollection('/api/succession_plans').catch(() => ({ items: [], total: 0 })),
        getHrDashboard().catch(() => null),
    ]);
    return { cycles: cycles.items, objectives: objectives.items, succession: succession.items, hr };
}

async function fetchPaie() {
    const [contracts, benefits, compensations] = await Promise.all([
        fetchAllCollection('/api/contracts').catch(() => ({ items: [], total: 0 })),
        fetchAllCollection('/api/benefits').catch(() => ({ items: [], total: 0 })),
        fetchAllCollection('/api/compensation_histories').catch(() => ({ items: [], total: 0 })),
    ]);
    return {
        contracts: contracts.items,
        benefits: benefits.items,
        compensations: compensations.items,
    };
}

async function fetchSecurite() {
    const [users, profiles] = await Promise.all([
        getAllUsers().catch(() => []),
        getAllProfiles().catch(() => []),
    ]);
    return { users: normalizeList<AppUser>(users), profiles: normalizeList<Profile>(profiles) };
}

const FETCHERS: Record<string, () => Promise<unknown>> = {
    personnel: fetchPersonnel,
    temps: fetchTemps,
    recrutement: fetchRecrutement,
    formation: fetchFormation,
    performance: fetchPerformance,
    paie: fetchPaie,
    securite: fetchSecurite,
};

function computeDashboard(slug: string, raw: unknown, loading: boolean): ModuleDashboardData {
    if (loading) return { loading: true, kpis: [], alerts: [] };

    switch (slug) {
        case 'personnel': return computePersonnel(raw as Awaited<ReturnType<typeof fetchPersonnel>>);
        case 'temps': return computeTemps(raw as Awaited<ReturnType<typeof fetchTemps>>);
        case 'recrutement': return computeRecrutement(raw as Awaited<ReturnType<typeof fetchRecrutement>>);
        case 'formation': return computeFormation(raw as Awaited<ReturnType<typeof fetchFormation>>);
        case 'performance': return computePerformance(raw as Awaited<ReturnType<typeof fetchPerformance>>);
        case 'paie': return computePaie(raw as Awaited<ReturnType<typeof fetchPaie>>);
        case 'securite': return computeSecurite(raw as Awaited<ReturnType<typeof fetchSecurite>>);
        default: return { loading: false, kpis: [], alerts: [] };
    }
}

function computePersonnel(data: Awaited<ReturnType<typeof fetchPersonnel>>): ModuleDashboardData {
    const { employees, departments, contracts, onboarding, hr, employeeTotal } = data;
    const active = employees.filter(e => e.status === 'ACTIVE').length;
    const onLeave = employees.filter(e => e.status === 'ON_LEAVE').length;
    const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
    const now = new Date();
    const expiring = contracts.filter(c => {
        if (!c.endDate || c.status !== 'ACTIVE') return false;
        const end = new Date(c.endDate);
        return isAfter(end, now) && isBefore(end, addDays(now, 30));
    }).length;
    const onboardingActive = onboarding.filter(o => o.status === 'IN_PROGRESS' || o.status === 'PENDING').length;

    const alerts: ModuleAlert[] = [];
    if (expiring > 0) alerts.push({ icon: AlertCircle, label: `${expiring} contrat${expiring > 1 ? 's' : ''} à renouveler sous 30 j`, href: '/m/personnel/contracts' });
    if (onboardingActive > 0) alerts.push({ icon: UserPlus, label: `${onboardingActive} intégration${onboardingActive > 1 ? 's' : ''} en cours`, href: '/m/personnel/onboarding' });

    const chartData = [
        { name: 'Actifs', value: active, color: CHART.blue },
        { name: 'En congé', value: onLeave, color: CHART.yellow },
        { name: 'Autres', value: Math.max(0, employees.length - active - onLeave), color: CHART.light },
    ].filter(d => d.value > 0);

    const headcount = Math.max(employeeTotal || 0, employees.length);

    return {
        loading: false,
        kpis: [
            { label: 'Effectifs', value: headcount, detail: `${active} actifs`, href: '/m/personnel/employees', tone: 'primary' },
            { label: 'Contrats actifs', value: activeContracts, detail: expiring > 0 ? `${expiring} à échéance` : 'Situation stable', href: '/m/personnel/contracts', tone: expiring > 0 ? 'warning' : 'default' },
            { label: 'Départements', value: departments.length, detail: 'Structures actives', href: '/m/personnel/departments' },
            { label: 'Rotation', value: hr ? `${Math.round(hr.turnoverRatePercent)}%` : '—', detail: 'Sur 12 mois', href: '/m/pilotage' },
        ],
        alerts,
        chart: chartData.length > 0 ? { title: 'Répartition des effectifs', data: chartData } : undefined,
    };
}

function computeTemps(data: Awaited<ReturnType<typeof fetchTemps>>): ModuleDashboardData {
    const { leaves } = data;
    const pending = leaves.filter(l => l.status === 'PENDING').length;
    const approved = leaves.filter(l => l.status === 'APPROVED').length;
    const rejected = leaves.filter(l => l.status === 'REJECTED').length;

    const alerts: ModuleAlert[] = [];
    if (pending > 0) alerts.push({ icon: CalendarDays, label: `${pending} demande${pending > 1 ? 's' : ''} de congé à valider`, href: '/m/temps/leave' });

    return {
        loading: false,
        kpis: [
            { label: 'Demandes', value: leaves.length, detail: 'Total enregistrées', href: '/m/temps/leave' },
            { label: 'En attente', value: pending, detail: 'À valider', href: '/m/temps/leave', tone: pending > 0 ? 'warning' : 'default' },
            { label: 'Approuvées', value: approved, detail: 'Congés validés', href: '/m/temps/leave' },
            { label: 'Refusées', value: rejected, detail: 'Demandes rejetées', href: '/m/temps/leave' },
        ],
        alerts,
        chart: leaves.length > 0 ? {
            title: 'Statut des demandes',
            data: [
                { name: 'En attente', value: pending, color: CHART.yellow },
                { name: 'Approuvées', value: approved, color: CHART.green },
                { name: 'Refusées', value: rejected, color: CHART.red },
            ].filter(d => d.value > 0),
        } : undefined,
    };
}

function computeRecrutement(data: Awaited<ReturnType<typeof fetchRecrutement>>): ModuleDashboardData {
    const { applications, jobOffers, recruitments } = data;
    const pendingApps = applications.filter(a => a.status === 'APPLIED' || a.status === 'PENDING').length;
    const hired = applications.filter(a => a.status === 'HIRED').length;
    const openOffers = jobOffers.filter(j => j.status === 'PUBLISHED').length;
    const pendingRec = recruitments.filter(r => r.status === 'PENDING').length;

    const alerts: ModuleAlert[] = [];
    if (pendingApps > 0) alerts.push({ icon: ClipboardList, label: `${pendingApps} candidature${pendingApps > 1 ? 's' : ''} à traiter`, href: '/m/recrutement/candidatures' });
    if (pendingRec > 0) alerts.push({ icon: Briefcase, label: `${pendingRec} demande${pendingRec > 1 ? 's' : ''} de recrutement`, href: '/m/recrutement/demandes' });

    return {
        loading: false,
        kpis: [
            { label: 'Candidatures', value: applications.length, detail: `${pendingApps} en attente`, href: '/m/recrutement/candidatures', tone: pendingApps > 0 ? 'warning' : 'default' },
            { label: 'Recrutés', value: hired, detail: 'Embauches confirmées', href: '/m/recrutement/candidatures', tone: 'primary' },
            { label: 'Offres ouvertes', value: openOffers, detail: 'Publiées', href: '/m/recrutement/offres' },
            { label: 'Demandes RH', value: recruitments.length, detail: `${pendingRec} en attente`, href: '/m/recrutement/demandes' },
        ],
        alerts,
        chart: applications.length > 0 ? {
            title: 'Fil de candidatures',
            data: [
                { name: 'En attente', value: pendingApps, color: CHART.yellow },
                { name: 'En cours', value: applications.filter(a => ['SHORTLISTED', 'INTERVIEW', 'INTERVIEW_SCHEDULED'].includes(a.status)).length, color: CHART.light },
                { name: 'Recrutés', value: hired, color: CHART.green },
            ].filter(d => d.value > 0),
        } : undefined,
    };
}

function computeFormation(data: Awaited<ReturnType<typeof fetchFormation>>): ModuleDashboardData {
    const { trainings, sessions, catalogs } = data;
    const pending = trainings.filter(t => t.status === 'PENDING').length;
    const planned = sessions.filter(s => s.status === 'PLANNED').length;
    const ongoing = sessions.filter(s => s.status === 'ONGOING').length;

    const alerts: ModuleAlert[] = [];
    if (pending > 0) alerts.push({ icon: GraduationCap, label: `${pending} demande${pending > 1 ? 's' : ''} de formation à valider`, href: '/m/formation/demandes' });

    return {
        loading: false,
        kpis: [
            { label: 'Demandes', value: trainings.length, detail: `${pending} en attente`, href: '/m/formation/demandes', tone: pending > 0 ? 'warning' : 'default' },
            { label: 'Séances planifiées', value: planned, detail: 'À venir', href: '/m/formation/sessions' },
            { label: 'En cours', value: ongoing, detail: 'Séances actives', href: '/m/formation/sessions', tone: 'primary' },
            { label: 'Référentiel', value: catalogs.length, detail: 'Formations référencées', href: '/m/formation/catalog' },
        ],
        alerts,
        chart: trainings.length > 0 ? {
            title: 'Demandes de formation',
            data: [
                { name: 'En attente', value: pending, color: CHART.yellow },
                { name: 'Approuvées', value: trainings.filter(t => t.status === 'APPROVED').length, color: CHART.green },
                { name: 'Refusées', value: trainings.filter(t => t.status === 'REJECTED').length, color: CHART.red },
            ].filter(d => d.value > 0),
        } : undefined,
    };
}

function computePerformance(data: Awaited<ReturnType<typeof fetchPerformance>>): ModuleDashboardData {
    const { cycles, objectives, succession, hr } = data;
    const activeCycles = cycles.filter(c => c.status === 'ACTIVE' || c.status === 'IN_PROGRESS').length;
    const openObjectives = objectives.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length;

    const alerts: ModuleAlert[] = [];
    if (hr && hr.criticalSkillGaps > 0) {
        alerts.push({ icon: Target, label: `${hr.criticalSkillGaps} écart${hr.criticalSkillGaps > 1 ? 's' : ''} de compétences critiques`, href: '/m/performance/succession-plans' });
    }

    return {
        loading: false,
        kpis: [
            { label: 'Cycles actifs', value: activeCycles, detail: `${cycles.length} au total`, href: '/m/performance/cycles', tone: 'primary' },
            { label: 'Objectifs', value: objectives.length, detail: `${openObjectives} en cours`, href: '/m/performance/objectifs' },
            { label: 'Plans succession', value: succession.length, detail: 'Successeurs identifiés', href: '/m/performance/succession-plans' },
            { label: 'Couverture', value: hr ? `${Math.round(hr.successionCoveragePercent)}%` : '—', detail: 'Postes critiques couverts', href: '/m/performance/succession-plans' },
        ],
        alerts,
        chart: objectives.length > 0 ? {
            title: 'Avancement des objectifs',
            data: [
                { name: 'En cours', value: openObjectives, color: CHART.blue },
                { name: 'Atteints', value: objectives.filter(o => o.status === 'COMPLETED').length, color: CHART.green },
                { name: 'Autres', value: objectives.filter(o => ['CANCELLED', 'DRAFT'].includes(o.status)).length, color: CHART.light },
            ].filter(d => d.value > 0),
        } : undefined,
    };
}

function computePaie(data: Awaited<ReturnType<typeof fetchPaie>>): ModuleDashboardData {
    const { contracts, benefits, compensations } = data;
    const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;

    return {
        loading: false,
        kpis: [
            { label: 'Contrats actifs', value: activeContracts, detail: 'Base de paie', href: '/m/paie/payroll', tone: 'primary' },
            { label: 'Avantages', value: benefits.length, detail: 'Offres référencées', href: '/m/paie/benefits' },
            { label: 'Évolutions salariales', value: compensations.length, detail: 'Historiques enregistrés', href: '/m/paie/compensation' },
            { label: 'Bulletins', value: '—', detail: 'Module paie', href: '/m/paie/payroll' },
        ],
        alerts: [],
        chart: benefits.length > 0 ? {
            title: 'Répartition rémunération',
            data: [
                { name: 'Contrats', value: activeContracts, color: CHART.blue },
                { name: 'Avantages', value: benefits.length, color: CHART.yellow },
                { name: 'Évolutions', value: compensations.length, color: CHART.green },
            ].filter(d => d.value > 0),
        } : undefined,
    };
}

function computeSecurite(data: Awaited<ReturnType<typeof fetchSecurite>>): ModuleDashboardData {
    const { users, profiles } = data;
    const activeUsers = users.filter(u => !u.locked && !u.deleted).length;

    return {
        loading: false,
        kpis: [
            { label: 'Utilisateurs', value: users.length, detail: `${activeUsers} actifs`, href: '/m/securite/users', tone: 'primary' },
            { label: 'Profils', value: profiles.length, detail: 'Rôles configurés', href: '/m/securite/profiles' },
            { label: 'Accès', value: activeUsers, detail: 'Comptes actifs', href: '/m/securite/users' },
            { label: 'Sécurité', value: profiles.length > 0 ? 'Conforme' : '—', detail: 'Gouvernance des droits', href: '/m/securite/settings' },
        ],
        alerts: [],
        chart: users.length > 0 ? {
            title: 'Comptes utilisateurs',
            data: [
                { name: 'Actifs', value: activeUsers, color: CHART.green },
                { name: 'Inactifs', value: Math.max(0, users.length - activeUsers), color: CHART.red },
            ].filter(d => d.value > 0),
        } : undefined,
    };
}

const KPI_ICONS: Record<string, LucideIcon> = {
    personnel: Users,
    temps: CalendarDays,
    recrutement: UserPlus,
    formation: GraduationCap,
    performance: Target,
    paie: Wallet,
    securite: Shield,
};

export function useModuleDashboard(slug: string): ModuleDashboardData & { defaultIcon: LucideIcon } {
    const [loading, setLoading] = useState(true);
    const [raw, setRaw] = useState<unknown>(null);

    useEffect(() => {
        const fetcher = FETCHERS[slug];
        if (!fetcher) {
            setLoading(false);
            setRaw(null);
            return;
        }
        setLoading(true);
        fetcher()
            .then(setRaw)
            .catch(() => setRaw(null))
            .finally(() => setLoading(false));
    }, [slug]);

    const data = useMemo(() => computeDashboard(slug, raw, loading), [slug, raw, loading]);

    return { ...data, defaultIcon: KPI_ICONS[slug] ?? Users };
}

export function getKpiIcon(slug: string, index: number): LucideIcon {
    const icons: Record<string, LucideIcon[]> = {
        personnel: [Users, FileCheck, Briefcase, Target],
        temps: [CalendarDays, Clock, FileCheck, AlertCircle],
        recrutement: [ClipboardList, UserPlus, Briefcase, BookOpen],
        formation: [GraduationCap, BookOpen, Presentation, BookOpen],
        performance: [Target, ClipboardList, Users, Shield],
        paie: [Wallet, Gift, FileCheck, Wallet],
        securite: [Users, KeyRound, Shield, Shield],
    };
    return icons[slug]?.[index] ?? Users;
}
