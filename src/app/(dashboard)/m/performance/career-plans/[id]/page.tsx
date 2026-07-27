'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Loader2, AlertCircle, TrendingUp, Calendar, User,
    CheckCircle2, XCircle, Target, Zap, ArrowRight, BriefcaseBusiness,
    Clock, Award, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { getCareerPlanById, updateCareerPlan } from '@/lib/api/careerPlan';
import { getEmployeeById, getDepartments } from '@/lib/api/employee';
import { getAllPositions } from '@/lib/api/position';
import { getJobRoles, getGrades, getCareerPaths } from '@/lib/api/jobArchitecture';
import { checkPromotionEligibility, getObjectives } from '@/lib/api/performance';
import { getEmployeeJourney } from '@/lib/api/onboarding';
import { getEmployeeSkills, getJobRoleRequiredSkills, getSkills } from '@/lib/api/skill';
import { CareerPlan } from '@/types/careerPlan';
import { Employee, Department } from '@/types/employee';
import { Position } from '@/types/position';
import { JobRole, Grade, CareerPath } from '@/types/jobArchitecture';
import { PromotionEligibility, Objective, OBJECTIVE_STATUS_LABELS, ObjectiveStatus } from '@/types/performance';
import { EmployeeJourneyEntry } from '@/types/onboarding';
import { EmployeeSkill, JobRoleRequiredSkill, Skill, SKILL_LEVEL_LABELS, SkillLevel } from '@/types/skill';
import { extractId, relationName } from '@/lib/api-iri';
import { toast } from '@/lib/toast';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { translateEligibilityReason } from '@/lib/eligibility-messages';
import { cn } from '@/lib/utils';

function buildLabelMap<T extends { id: string; '@id'?: string }>(
    items: T[],
    getLabel: (item: T) => string,
): Record<string, string> {
    const map: Record<string, string> = {};
    items.forEach(item => {
        map[item.id] = getLabel(item);
        if (item['@id']) map[item['@id']] = getLabel(item);
    });
    return map;
}

function resolveFromMap(
    value: unknown,
    map: Record<string, string>,
    fallback = '—',
): string {
    if (!value) return fallback;
    if (typeof value === 'object' && value !== null) {
        return relationName(value as { name?: string; title?: string });
    }
    const str = value as string;
    const id = extractId(str);
    return map[str] || (id ? map[id] : undefined) || fallback;
}

function statusVariant(s: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    switch (s) {
        case 'ACTIVE': return 'warning';
        case 'COMPLETED': return 'success';
        case 'CANCELLED': return 'destructive';
        default: return 'secondary';
    }
}

export default function CareerPlanDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [plan, setPlan] = useState<CareerPlan | null>(null);
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [targetRole, setTargetRole] = useState<JobRole | null>(null);
    const [targetGrade, setTargetGrade] = useState<Grade | null>(null);
    const [eligibility, setEligibility] = useState<PromotionEligibility | null>(null);
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [journey, setJourney] = useState<EmployeeJourneyEntry[]>([]);
    const [requiredSkills, setRequiredSkills] = useState<JobRoleRequiredSkill[]>([]);
    const [employeeSkills, setEmployeeSkills] = useState<EmployeeSkill[]>([]);
    const [allSkills, setAllSkills] = useState<Skill[]>([]);
    const [careerPath, setCareerPath] = useState<CareerPath | null>(null);
    const [positionsMap, setPositionsMap] = useState<Record<string, string>>({});
    const [departmentsMap, setDepartmentsMap] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editNotes, setEditNotes] = useState('');

    const load = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const p = await getCareerPlanById(id);
            setPlan(p);
            setEditNotes(p.notes || '');

            const employeeId = extractId(p.employee);
            const targetRoleId = extractId(p.targetJobRoleId || p.targetJobRole);
            const targetGradeId = extractId(p.targetGradeId || p.targetGrade);

            const [
                emp,
                roles,
                grades,
                paths,
                skillsCatalog,
                deptsData,
                posData,
            ] = await Promise.all([
                employeeId ? getEmployeeById(employeeId).catch(() => null) : Promise.resolve(null),
                getJobRoles().catch(() => []),
                getGrades().catch(() => []),
                getCareerPaths().catch(() => []),
                getSkills().catch(() => []),
                getDepartments().catch(() => []),
                getAllPositions().catch(() => []),
            ]);

            const deptsList = Array.isArray(deptsData) ? deptsData : (deptsData as { 'hydra:member'?: Department[] })['hydra:member'] || [];
            const posList = Array.isArray(posData) ? posData : (posData as { member?: Position[]; 'hydra:member'?: Position[] }).member || (posData as { 'hydra:member'?: Position[] })['hydra:member'] || [];

            setPositionsMap(buildLabelMap(posList, p => p.title));
            setDepartmentsMap(buildLabelMap(deptsList, d => d.name));
            setEmployee(emp);
            setAllSkills(skillsCatalog);

            const role = roles.find(r => r.id === targetRoleId) || null;
            const grade = grades.find(g => g.id === targetGradeId) || null;
            setTargetRole(role);
            setTargetGrade(grade);

            // Parcours officiel correspondant
            const matchingPath = paths.find(cp =>
                extractId(cp.toJobRole) === targetRoleId
            ) || null;
            setCareerPath(matchingPath);

            if (employeeId && targetRoleId) {
                const [elig, objs, jour, reqSkills, empSkills] = await Promise.all([
                    checkPromotionEligibility(employeeId, targetRoleId).catch(() => null),
                    getObjectives({ employee: employeeId }).catch(() => []),
                    getEmployeeJourney(employeeId).catch(() => []),
                    getJobRoleRequiredSkills(targetRoleId).catch(() => []),
                    getEmployeeSkills(employeeId).catch(() => []),
                ]);
                setEligibility(elig);
                setObjectives(objs.slice(0, 5));
                setJourney(jour.slice(0, 6));
                setRequiredSkills(reqSkills);
                setEmployeeSkills(empSkills);
            }
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, [id]);

    const handleSave = async () => {
        if (!plan) return;
        try {
            setSaving(true);
            await updateCareerPlan(id, { notes: editNotes });
            toast.success('Plan mis à jour.');
            setEditing(false);
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setSaving(false);
        }
    };

    const skillName = (id: string) => {
        const s = allSkills.find(x => x.id === extractId(id) || x['@id'] === id);
        return s?.name || extractId(id) || id;
    };

    const skillCodeNames = useMemo(() => {
        const map: Record<string, string> = {};
        allSkills.forEach(s => {
            if (s.code) map[s.code] = s.name;
            map[s.id] = s.name;
        });
        return map;
    }, [allSkills]);

    const employeeSkillIds = useMemo(() =>
        new Set(employeeSkills.map(es => extractId(es.skill))),
        [employeeSkills]
    );

    const daysToTarget = plan?.targetDate
        ? differenceInDays(new Date(plan.targetDate), new Date())
        : null;

    const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : '';
    const employeeId = plan ? extractId(plan.employee) : '';
    const currentPositionLabel = resolveFromMap(employee?.position, positionsMap, 'Poste non renseigné');
    const currentDepartmentLabel = resolveFromMap(employee?.department, departmentsMap, '—');

    if (isLoading) return (
        <PageShell>
            <div className="p-32 flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                <p className="text-sm text-muted-foreground">Chargement du plan...</p>
            </div>
        </PageShell>
    );

    if (error || !plan) return (
        <PageShell>
            <div className="p-20 flex flex-col items-center gap-4">
                <AlertCircle className="w-12 h-12 text-rose-500" />
                <p>{error || 'Plan introuvable.'}</p>
            </div>
        </PageShell>
    );

    return (
        <PageShell>
            <PageHeader
                title={`Plan de carrière — ${employeeName || plan.employee}`}
                description="Vue consolidée : objectif, éligibilité, compétences et parcours RH"
                actions={
                    <div className="flex gap-2">
                        {employeeId && (
                            <Link href={`/m/personnel/employees/${employeeId}`}>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <ExternalLink className="w-4 h-4" />Fiche employé
                                </Button>
                            </Link>
                        )}
                        <Link href="/m/performance/career-plans">
                            <Button variant="outline" size="sm" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />Retour
                            </Button>
                        </Link>
                    </div>
                }
            />

            {/* Bandeau évolution */}
            <Card className="p-6 mb-6 bg-gradient-to-r from-primary-50/80 to-white border-primary-100">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary-100 text-secondary-600 flex items-center justify-center shrink-0">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wide">Situation actuelle</p>
                            <p className="font-bold text-secondary-900 mt-0.5">{currentPositionLabel}</p>
                            <p className="text-sm text-secondary-500">{currentDepartmentLabel}</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center">
                            <ArrowRight className="w-5 h-5" />
                        </div>
                        {daysToTarget != null && (
                            <span className={cn(
                                'text-xs font-semibold px-2 py-0.5 rounded-full',
                                daysToTarget < 0 ? 'bg-rose-100 text-rose-700' :
                                daysToTarget < 90 ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                            )}>
                                {daysToTarget < 0 ? `Échéance dépassée (${Math.abs(daysToTarget)}j)` :
                                 daysToTarget === 0 ? 'Échéance aujourd\'hui' :
                                 `${daysToTarget} jour${daysToTarget > 1 ? 's' : ''} restant${daysToTarget > 1 ? 's' : ''}`}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4 md:justify-end">
                        <div className="text-right">
                            <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide">Objectif cible</p>
                            <p className="font-bold text-primary-800 mt-0.5">{targetRole?.title || '—'}</p>
                            {targetGrade && (
                                <p className="text-sm text-primary-600">{targetGrade.name}</p>
                            )}
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                            <BriefcaseBusiness className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Éligibilité */}
                    {eligibility && (
                        <Card className={cn('p-6 border', eligibility.eligible ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/30')}>
                            <div className="flex items-start gap-4">
                                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', eligibility.eligible ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white')}>
                                    {eligibility.eligible ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <h2 className="font-bold text-secondary-900">
                                        {eligibility.eligible ? 'Éligible à la promotion' : 'Pas encore éligible'}
                                    </h2>
                                    {eligibility.reasons.length > 0 && (
                                        <ul className="mt-3 space-y-1.5">
                                            {eligibility.reasons.map((reason, i) => (
                                                <li key={i} className="text-sm text-secondary-600 flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-secondary-400 mt-1.5 shrink-0" />
                                                    {translateEligibilityReason(reason, skillCodeNames)}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Compétences */}
                    {requiredSkills.length > 0 && (
                        <Card className="p-6">
                            <h2 className="font-bold text-secondary-900 mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-primary-500" />
                                Compétences requises pour {targetRole?.title}
                            </h2>
                            <div className="space-y-2">
                                {requiredSkills.map(rs => {
                                    const skillId = extractId(rs.skill);
                                    const has = skillId ? employeeSkillIds.has(skillId) : false;
                                    const empSkill = employeeSkills.find(es => extractId(es.skill) === skillId);
                                    return (
                                        <div key={rs.id} className={cn(
                                            'flex items-center justify-between p-3 rounded-xl border',
                                            has ? 'bg-emerald-50 border-emerald-100' : 'bg-secondary-50 border-secondary-100'
                                        )}>
                                            <div className="flex items-center gap-3">
                                                {has ? (
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-secondary-400 shrink-0" />
                                                )}
                                                <div>
                                                    <p className="font-medium text-secondary-900 text-sm">{skillName(rs.skill as string)}</p>
                                                    <p className="text-xs text-secondary-500">
                                                        Niveau requis : {SKILL_LEVEL_LABELS[(rs.minimumLevel || rs.requiredLevel) as SkillLevel] || rs.minimumLevel || rs.requiredLevel}
                                                        {rs.mandatory && ' · Obligatoire'}
                                                    </p>
                                                </div>
                                            </div>
                                            {empSkill && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {SKILL_LEVEL_LABELS[empSkill.level as SkillLevel] || empSkill.level}
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-secondary-400 mt-3">
                                {employeeSkills.filter(es => employeeSkillIds.has(extractId(es.skill)!)).length} / {requiredSkills.length} compétences acquises
                            </p>
                        </Card>
                    )}

                    {/* Objectifs */}
                    {objectives.length > 0 && (
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-secondary-900 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-primary-500" />
                                    Objectifs liés
                                </h2>
                                <Link href="/m/performance/objectifs">
                                    <Button variant="ghost" size="sm" className="text-primary-500 text-xs">Voir tout</Button>
                                </Link>
                            </div>
                            <div className="space-y-2">
                                {objectives.map(obj => (
                                    <div key={obj.id} className="flex items-center justify-between p-3 rounded-xl border border-secondary-100 bg-secondary-50/50">
                                        <div>
                                            <p className="font-medium text-secondary-900 text-sm">{obj.title}</p>
                                            {obj.dueDate && (
                                                <p className="text-xs text-secondary-500 mt-0.5">
                                                    Échéance : {format(new Date(obj.dueDate), 'dd MMM yyyy', { locale: fr })}
                                                </p>
                                            )}
                                        </div>
                                        <Badge variant={statusVariant(obj.status as string)}>
                                            {OBJECTIVE_STATUS_LABELS[obj.status as ObjectiveStatus] || obj.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Notes */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-secondary-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary-500" />
                                Notes et suivi
                            </h2>
                            {!editing ? (
                                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Modifier</Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Annuler</Button>
                                    <Button variant="pill" size="sm" onClick={handleSave} disabled={saving}>
                                        {saving && <Loader2 className="w-3 h-3 animate-spin mr-2" />}Sauvegarder
                                    </Button>
                                </div>
                            )}
                        </div>
                        {editing ? (
                            <textarea
                                value={editNotes}
                                onChange={e => setEditNotes(e.target.value)}
                                rows={6}
                                className="w-full px-3 py-2 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                                placeholder="Notes sur le plan de carrière, actions RH, jalons..."
                            />
                        ) : (
                            <p className="text-secondary-600 text-sm whitespace-pre-wrap">{plan.notes || 'Aucune note.'}</p>
                        )}
                    </Card>
                </div>

                <div className="space-y-4">
                    {/* Détails plan */}
                    <Card className="p-6">
                        <h3 className="font-bold text-secondary-900 mb-4">Informations</h3>
                        <dl className="space-y-4 text-sm">
                            <div>
                                <dt className="text-secondary-500">Employé</dt>
                                <dd className="font-semibold text-secondary-900 mt-1">{employeeName || plan.employee}</dd>
                            </div>
                            {employee?.status && (
                                <div>
                                    <dt className="text-secondary-500">Statut</dt>
                                    <dd className="mt-1"><Badge variant="secondary">{employee.status}</Badge></dd>
                                </div>
                            )}
                            {employee && (
                                <div>
                                    <dt className="text-secondary-500">Poste actuel</dt>
                                    <dd className="font-medium text-secondary-800 mt-1">{currentPositionLabel}</dd>
                                </div>
                            )}
                            {employee && currentDepartmentLabel !== '—' && (
                                <div>
                                    <dt className="text-secondary-500">Département</dt>
                                    <dd className="text-secondary-600 mt-1">{currentDepartmentLabel}</dd>
                                </div>
                            )}
                            {targetRole && (
                                <div>
                                    <dt className="text-secondary-500">Métier cible</dt>
                                    <dd className="font-medium text-primary-700 mt-1">{targetRole.title}</dd>
                                    {targetRole.code && <dd className="text-xs font-mono text-secondary-400 mt-0.5">{targetRole.code}</dd>}
                                </div>
                            )}
                            {targetGrade && (
                                <div>
                                    <dt className="text-secondary-500 flex items-center gap-1"><Award className="w-3 h-3" />Grade cible</dt>
                                    <dd className="font-medium text-secondary-800 mt-1">{targetGrade.name}</dd>
                                </div>
                            )}
                            {plan.targetDate && (
                                <div>
                                    <dt className="text-secondary-500 flex items-center gap-1"><Calendar className="w-3 h-3" />Date cible</dt>
                                    <dd className="font-medium text-secondary-800 mt-1">
                                        {format(new Date(plan.targetDate), 'dd MMMM yyyy', { locale: fr })}
                                    </dd>
                                </div>
                            )}
                            {plan.createdAt && (
                                <div>
                                    <dt className="text-secondary-500">Créé le</dt>
                                    <dd className="text-secondary-600 mt-1">{format(new Date(plan.createdAt), 'dd MMM yyyy', { locale: fr })}</dd>
                                </div>
                            )}
                        </dl>
                    </Card>

                    {/* Parcours officiel */}
                    {careerPath && (
                        <Card className="p-6">
                            <h3 className="font-bold text-secondary-900 mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary-500" />
                                Parcours référentiel
                            </h3>
                            <p className="text-sm text-secondary-600">
                                Un parcours officiel existe vers ce métier dans le référentiel RH.
                            </p>
                            {careerPath.description && (
                                <p className="text-xs text-secondary-500 mt-2">{careerPath.description}</p>
                            )}
                            <Link href="/m/personnel/career-paths" className="text-xs text-primary-500 hover:underline mt-3 inline-block">
                                Voir tous les parcours →
                            </Link>
                        </Card>
                    )}

                    {/* Timeline parcours RH */}
                    {journey.length > 0 && (
                        <Card className="p-6">
                            <h3 className="font-bold text-secondary-900 mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary-500" />
                                Parcours RH récent
                            </h3>
                            <div className="space-y-3">
                                {journey.map(entry => (
                                    <div key={entry.id} className="flex gap-3">
                                        <div className="w-2 h-2 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-secondary-800">{entry.eventType}</p>
                                            <p className="text-xs text-secondary-500">{entry.stage}</p>
                                            <p className="text-xs text-secondary-400 mt-0.5">
                                                {format(new Date(entry.occurredAt), 'dd MMM yyyy', { locale: fr })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </PageShell>
    );
}
