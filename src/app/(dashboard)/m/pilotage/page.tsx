'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    Users, FileCheck, Clock, Umbrella,
    BookOpen, Briefcase, UserCheck, CalendarDays, ArrowRight,
    AlertCircle, GraduationCap, ClipboardList, UserPlus,
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, CartesianGrid,
    XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ComposedChart, Legend, Line,
} from 'recharts';
import { PageShell } from '@/components/layout/PageShell';
import { DashboardWelcome } from '@/components/layout/DashboardWelcome';
import { DataPanel } from '@/components/layout/DataPanel';
import { DashboardKpi, DashboardQuickLink } from '@/components/dashboard/DashboardKpi';
import { DashboardActionInbox } from '@/components/dashboard/DashboardActionInbox';
import { ChartTooltip } from '@/components/dashboard/ChartTooltip';
import { getAbout } from '@/lib/api/auth';
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

const CHART = {
    blue: '#007398',
    yellow: '#FDB913',
    red: '#C1272D',
    light: '#56afca',
    green: '#10B981',
} as const;

function normalize(data: unknown): any[] {
    if (Array.isArray(data)) return data;
    const d = data as Record<string, unknown>;
    if (Array.isArray(d?.['hydra:member'])) return d['hydra:member'] as any[];
    if (Array.isArray(d?.member)) return d.member as any[];
    return [];
}

export default function DashboardPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [jobOffers, setJobOffers] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [recruitments, setRecruitments] = useState<any[]>([]);
    const [trainings, setTrainings] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getAbout().catch(() => null),
            getAllEmployees().catch(() => []),
            getDepartments().catch(() => []),
            getAllContracts().catch(() => []),
            getAllLeaveRequests().catch(() => []),
            getAllJobOffers().catch(() => []),
            getAllApplications().catch(() => []),
            getAllRecruitmentRequests().catch(() => []),
            getAllTrainingRequests().catch(() => []),
            getAllTrainingSessions().catch(() => []),
        ]).then(([usr, emp, dept, cont, leave, jobs, apps, rec, train, sess]) => {
            setUser(usr);
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

    const activeEmployees = employees.filter(e => e.status === 'ACTIVE').length;
    const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
    const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length;
    const openJobOffers = jobOffers.filter(j => j.status === 'PUBLISHED').length;
    const pendingApplications = applications.filter(a => a.status === 'APPLIED' || a.status === 'PENDING').length;
    const pendingRecruitments = recruitments.filter(r => r.status === 'PENDING').length;
    const pendingTrainings = trainings.filter(t => t.status === 'PENDING').length;
    const plannedSessions = sessions.filter(s => s.status === 'PLANNED').length;
    const hiredCount = applications.filter(a => a.status === 'HIRED').length;

    const expiringContracts = useMemo(() => {
        const now = new Date();
        const limit = addDays(now, 30);
        return contracts.filter(c => {
            if (!c.endDate || c.status !== 'ACTIVE') return false;
            const end = new Date(c.endDate);
            return isAfter(end, now) && isBefore(end, limit);
        });
    }, [contracts]);

    const pendingTotal = pendingLeaves + pendingRecruitments + pendingTrainings + pendingApplications + expiringContracts.length;
    const deptData = useMemo(() =>
        departments.slice(0, 8).map((dept: Department) => {
            const count = employees.filter((e: Employee) => {
                const deptId = (e.department as any)?.id
                    || (typeof e.department === 'string' && e.department.split('/').pop())
                    || e.department;
                return deptId === dept.id || e.department === (dept as any)['@id'];
            }).length;
            return {
                name: dept.name?.length > 14 ? `${dept.name.slice(0, 14)}…` : dept.name,
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

    const statusPieData = useMemo(() => [
        { name: 'Actifs', value: activeEmployees, color: CHART.blue },
        { name: 'En congé', value: employees.filter(e => e.status === 'ON_LEAVE').length, color: CHART.yellow },
        { name: 'Suspendus', value: employees.filter(e => e.status === 'SUSPENDED').length, color: CHART.red },
        { name: 'Essai', value: employees.filter(e => e.status === 'PROBATION').length, color: CHART.light },
    ].filter(d => d.value > 0), [employees, activeEmployees]);

    const recruitmentFunnel = useMemo(() => [
        { name: 'Candidatures', value: applications.length, fill: CHART.blue },
        { name: 'En cours', value: applications.filter(a => ['SHORTLISTED', 'INTERVIEW', 'INTERVIEW_SCHEDULED'].includes(a.status)).length, fill: CHART.yellow },
        { name: 'Recrutés', value: hiredCount, fill: CHART.green },
    ], [applications, hiredCount]);

    const alerts = useMemo(() => {
        const list: { icon: typeof AlertCircle; label: string; href: string }[] = [];
        if (expiringContracts.length > 0) {
            list.push({ icon: AlertCircle, label: `${expiringContracts.length} contrat${expiringContracts.length > 1 ? 's' : ''} à renouveler`, href: '/m/personnel/contracts' });
        }
        if (pendingLeaves > 0) list.push({ icon: Clock, label: `${pendingLeaves} congé${pendingLeaves > 1 ? 's' : ''} à valider`, href: '/m/temps/leave' });
        if (pendingRecruitments > 0) list.push({ icon: UserPlus, label: `${pendingRecruitments} demande${pendingRecruitments > 1 ? 's' : ''} de recrutement`, href: '/m/recrutement/demandes' });
        if (pendingTrainings > 0) list.push({ icon: GraduationCap, label: `${pendingTrainings} formation${pendingTrainings > 1 ? 's' : ''} à valider`, href: '/m/formation/demandes' });
        if (pendingApplications > 0) list.push({ icon: ClipboardList, label: `${pendingApplications} candidature${pendingApplications > 1 ? 's' : ''} à traiter`, href: '/m/recrutement/candidatures' });
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
                <div className="w-14 h-14 bg-surface rounded-xl flex items-center justify-center shadow-card p-2">
                    <Image src="/logo_arca_nouveau-2.png" alt="ARCA" width={40} height={40} className="object-contain animate-pulse" />
                </div>
                <p className="text-sm text-muted-foreground">Chargement du tableau de bord…</p>
            </div>
        );
    }

    const activeRate = employees.length > 0 ? Math.round((activeEmployees / employees.length) * 100) : 0;

    return (
        <PageShell ambient className="space-y-6 dashboard-view">
            <DashboardWelcome user={user} pendingCount={pendingTotal} pendingLeaves={pendingLeaves} />

            {/* KPIs — 4 indicateurs clés */}
            <section aria-label="Indicateurs clés">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    <DashboardKpi
                        label="Effectifs"
                        value={employees.length}
                        detail={`${activeEmployees} actifs (${activeRate}%)`}
                        icon={Users}
                        href="/m/personnel/employees"
                        tone="primary"
                    />
                    <DashboardKpi
                        label="Contrats actifs"
                        value={activeContracts}
                        detail={expiringContracts.length > 0 ? `${expiringContracts.length} à renouveler` : 'Situation stable'}
                        icon={FileCheck}
                        href="/m/personnel/contracts"
                    />
                    <DashboardKpi
                        label="À traiter"
                        value={pendingTotal}
                        detail="Validations en attente"
                        icon={Umbrella}
                        href="#priorites"
                        tone={pendingTotal > 0 ? 'warning' : 'default'}
                    />
                    <DashboardKpi
                        label="Recrutement"
                        value={hiredCount}
                        detail={`${applications.length} candidatures au total`}
                        icon={UserCheck}
                        href="/m/recrutement/demandes"
                    />
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                    <DashboardQuickLink label="Congés" value={pendingLeaves} href="/m/temps/leave" icon={Umbrella} />
                    <DashboardQuickLink label="Offres" value={openJobOffers} href="/m/recrutement/offres" icon={Briefcase} />
                    <DashboardQuickLink label="Séances" value={plannedSessions} href="/m/formation/sessions" icon={GraduationCap} />
                    <DashboardQuickLink label="Formations" value={pendingTrainings} href="/m/formation/demandes" icon={BookOpen} />
                </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div className="xl:col-span-8 space-y-4" id="priorites">
                    <DashboardActionInbox items={alerts} pendingCount={pendingTotal} />

                    <DataPanel
                        className="!rounded-lg"
                        title="Effectifs par département"
                        description="Collaborateurs et contrats par unité"
                        contentClassName="pt-2"
                    >
                        {deptData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={320}>
                                <ComposedChart data={deptData} margin={{ top: 12, right: 12, bottom: 4, left: -8 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                                    <Bar dataKey="effectifs" name="Effectifs" fill={CHART.blue} radius={[4, 4, 0, 0]} barSize={32} />
                                    <Line dataKey="contrats" name="Contrats" stroke={CHART.yellow} strokeWidth={2.5} dot={{ r: 4, fill: CHART.yellow }} type="monotone" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[320px] flex items-center justify-center text-sm text-muted-foreground">
                                Aucune donnée par département
                            </div>
                        )}
                    </DataPanel>
                </div>

                <div className="xl:col-span-4 space-y-4">
                    <DataPanel className="!rounded-lg" title="Répartition des statuts" contentClassName="pt-2">
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Tooltip content={<ChartTooltip />} />
                                <Pie data={statusPieData} dataKey="value" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2}>
                                    {statusPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <ul className="space-y-2 mt-2">
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
                    </DataPanel>

                    <DataPanel className="!rounded-lg" title="Suivi du recrutement" contentClassName="pt-2">
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={recruitmentFunnel} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                    {recruitmentFunnel.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </DataPanel>

                    <DataPanel
                        className="!rounded-lg"
                        title="Prochaines séances"
                        toolbar={
                            <Link href="/m/formation/sessions" className="text-xs font-medium text-primary-500 hover:text-primary-600 inline-flex items-center gap-1">
                                Tout voir <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        }
                        contentClassName="p-0"
                    >
                        {upcomingSessions.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8 px-4">Aucune session planifiée</p>
                        ) : (
                            <ul className="divide-y divide-border-subtle">
                                {upcomingSessions.map((s, i) => (
                                    <li key={i}>
                                        <Link href={`/m/formation/sessions/${s.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors">
                                            <CalendarDays className="w-4 h-4 text-primary-500 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{s.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {s.startDate ? format(new Date(s.startDate), 'd MMM yyyy', { locale: fr }) : '—'}
                                                </p>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </DataPanel>
                </div>
            </div>
        </PageShell>
    );
}
