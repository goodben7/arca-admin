'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowRightLeft,
    Building2,
    FileText,
    Info,
    Loader2,
    Save,
    User,
    TrendingUp,
    BriefcaseBusiness,
    Award,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Input';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { getAllEmployees, getDepartments } from '@/lib/api/employee';
import { getJobRoles, getGrades } from '@/lib/api/jobArchitecture';
import { createMobilityRequest } from '@/lib/api/mobilityRequest';
import { MOBILITY_TYPE } from '@/types/mobilityRequest';
import { Employee, Department } from '@/types/employee';
import { JobRole, Grade } from '@/types/jobArchitecture';
import { toast } from '@/lib/toast';

export default function CreateMobilityRequestPage() {
    const router = useRouter();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        employee: '',
        type: '',
        targetDepartment: '',
        targetJobRoleId: '',
        targetGradeId: '',
        reason: '',
    });

    useEffect(() => {
        async function fetchData() {
            try {
                setIsFetching(true);
                setError(null);

                const [empsData, deptsData, roles, gradeList] = await Promise.all([
                    getAllEmployees({ itemsPerPage: 500 }),
                    getDepartments(),
                    getJobRoles().catch(() => []),
                    getGrades().catch(() => []),
                ]);

                const emps = Array.isArray(empsData)
                    ? empsData
                    : (empsData as { 'hydra:member'?: Employee[] })['hydra:member'] || [];
                const depts = Array.isArray(deptsData)
                    ? deptsData
                    : (deptsData as { 'hydra:member'?: Department[] })['hydra:member'] || [];

                setEmployees(emps);
                setDepartments(depts);
                setJobRoles(roles);
                setGrades(gradeList);
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'Erreur lors du chargement des données.');
            } finally {
                setIsFetching(false);
            }
        }
        fetchData();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const created = await createMobilityRequest({
                employee: formData.employee,
                type: formData.type,
                reason: formData.reason,
                ...(formData.type === MOBILITY_TYPE.TRANSFER && formData.targetDepartment
                    ? { targetDepartment: formData.targetDepartment }
                    : {}),
                ...((formData.type === MOBILITY_TYPE.PROMOTION || formData.type === MOBILITY_TYPE.DEMOTION) &&
                formData.targetJobRoleId
                    ? { targetJobRoleId: formData.targetJobRoleId }
                    : {}),
                ...(formData.targetGradeId ? { targetGradeId: formData.targetGradeId } : {}),
            });
            toast.success('Demande de mobilité créée.');
            router.push(`/m/personnel/mobility/${created.id}`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erreur lors de la création de la demande.';
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const showTargetDepartment = formData.type === MOBILITY_TYPE.TRANSFER;
    const showTargetJobRole =
        formData.type === MOBILITY_TYPE.PROMOTION || formData.type === MOBILITY_TYPE.DEMOTION;
    const isPromotion = formData.type === MOBILITY_TYPE.PROMOTION;

    return (
        <PageShell className="max-w-4xl mx-auto">
            <PageHeader
                title="Nouvelle demande de mobilité"
                description="Initiez un transfert, une promotion, une rétrogradation ou un détachement."
                backHref="/m/personnel/mobility"
            />

            {error && (
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-2xl text-destructive text-sm font-semibold flex items-center gap-3">
                    <FileText className="w-5 h-5 shrink-0" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-none shadow-sm-200/50 overflow-hidden rounded-xl">
                    <CardHeader className="bg-secondary-50/50 border-b border-secondary-100 p-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
                                <ArrowRightLeft className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-secondary-900 uppercase tracking-tight">
                                    Paramètres de la mobilité
                                </CardTitle>
                                <CardDescription className="font-medium">
                                    Renseignez les informations nécessaires à la demande
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8 space-y-8">
                        {isFetching ? (
                            <div className="p-10 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                                <p className="text-secondary-400 font-bold uppercase tracking-widest text-[10px]">
                                    Chargement des référentiels...
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2 group">
                                        <Label className="uppercase tracking-widest text-xs font-black text-secondary-400">
                                            <User className="inline-block w-4 h-4 mr-2 text-secondary-500" />
                                            Employé
                                        </Label>
                                        <Select
                                            required
                                            name="employee"
                                            value={formData.employee}
                                            onChange={handleChange}
                                            className="h-12"
                                        >
                                            <option value="">Sélectionnez un employé...</option>
                                            {employees.map((emp) => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.firstName} {emp.lastName} ({emp.id})
                                                </option>
                                            ))}
                                        </Select>
                                    </div>

                                    <div className="space-y-2 group">
                                        <Label className="uppercase tracking-widest text-xs font-black text-secondary-400">
                                            <TrendingUp className="inline-block w-4 h-4 mr-2 text-secondary-500" />
                                            Type de mobilité
                                        </Label>
                                        <Select
                                            required
                                            name="type"
                                            value={formData.type}
                                            onChange={handleChange}
                                            className="h-12"
                                        >
                                            <option value="">Sélectionnez un type...</option>
                                            <option value={MOBILITY_TYPE.TRANSFER}>Transfert</option>
                                            <option value={MOBILITY_TYPE.PROMOTION}>Promotion</option>
                                            <option value={MOBILITY_TYPE.DEMOTION}>Rétrogradation</option>
                                            <option value={MOBILITY_TYPE.SECONDEMENT}>Détachement</option>
                                        </Select>
                                    </div>
                                </div>

                                {showTargetDepartment && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2 group">
                                            <Label className="uppercase tracking-widest text-xs font-black text-secondary-400">
                                                <Building2 className="inline-block w-4 h-4 mr-2 text-secondary-500" />
                                                Département cible
                                            </Label>
                                            <Select
                                                required
                                                name="targetDepartment"
                                                value={formData.targetDepartment}
                                                onChange={handleChange}
                                                className="h-12"
                                            >
                                                <option value="">Sélectionnez un département...</option>
                                                {departments.map((d) => (
                                                    <option key={d.id} value={d.id}>
                                                        {d.code} — {d.name}
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>
                                        <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-2xl border border-secondary-100">
                                            <Info className="w-5 h-5 text-primary-600 shrink-0" />
                                            <p className="text-[10px] font-bold text-secondary-500 uppercase leading-relaxed">
                                                Le transfert sera soumis à la validation du manager puis des RH.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {showTargetJobRole && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2 group">
                                            <Label className="uppercase tracking-widest text-xs font-black text-secondary-400">
                                                <BriefcaseBusiness className="inline-block w-4 h-4 mr-2 text-secondary-500" />
                                                Fiche métier cible
                                            </Label>
                                            <Select
                                                required
                                                name="targetJobRoleId"
                                                value={formData.targetJobRoleId}
                                                onChange={handleChange}
                                                className="h-12"
                                            >
                                                <option value="">Sélectionnez un métier...</option>
                                                {jobRoles.map((role) => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.title} ({role.code})
                                                    </option>
                                                ))}
                                            </Select>
                                        </div>
                                        {isPromotion && (
                                            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                                <Info className="w-5 h-5 text-amber-600 shrink-0" />
                                                <p className="text-[10px] font-bold text-amber-700 uppercase leading-relaxed">
                                                    Une vérification d&apos;éligibilité sera effectuée lors de la soumission.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2 group">
                                        <Label className="uppercase tracking-widest text-xs font-black text-secondary-400">
                                            <Award className="inline-block w-4 h-4 mr-2 text-secondary-500" />
                                            Grade cible{' '}
                                            <span className="normal-case tracking-normal font-medium text-secondary-400/70">(optionnel)</span>
                                        </Label>
                                        <Select
                                            name="targetGradeId"
                                            value={formData.targetGradeId}
                                            onChange={handleChange}
                                            className="h-12"
                                        >
                                            <option value="">Aucun grade cible</option>
                                            {grades.map((g) => (
                                                <option key={g.id} value={g.id}>
                                                    {g.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2 group">
                                    <Label className="uppercase tracking-widest text-xs font-black text-secondary-400">
                                        <FileText className="inline-block w-4 h-4 mr-2 text-secondary-500" />
                                        Motif / justification
                                    </Label>
                                    <Textarea
                                        required
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleChange}
                                        rows={5}
                                        placeholder="Expliquez le motif de cette demande de mobilité..."
                                        className="bg-secondary-50/30"
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-4 overflow-hidden p-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                        className="px-8 py-6 rounded-2xl font-bold uppercase tracking-widest text-xs text-secondary-400 hover:text-secondary-900 transition-all"
                    >
                        Annuler
                    </Button>
                    <Button
                        disabled={isLoading || isFetching}
                        type="submit"
                        className="px-10 py-6 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary-200 transition-all active:scale-[0.98] flex items-center gap-3"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Créer la demande
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </PageShell>
    );
}
