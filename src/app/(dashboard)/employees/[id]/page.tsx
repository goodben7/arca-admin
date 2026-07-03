'use client';

import { useState, useEffect, use, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, Mail, Phone, Briefcase, Calendar, MapPin, User, Shield, Clock, Heart,
    Globe, CheckCircle2, CalendarDays, Info, MoreVertical, Edit2, Download, Loader2,
    Building2, UserCircle2, FileText, Activity, FileCheck, Eye, Trash2, Plus, X, Upload, AlertCircle,
    UserMinus, UserPlus, UserCheck, Power, Plane, Palmtree, Ban, ShieldCheck, UserCog, ChevronDown, MoreHorizontal, Save
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TabsProvider, TabsList, TabsTrigger, TabsContent, TabsPanels } from '@/components/ui/Tabs';
import { Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getEmployeeById, getDepartments, getWorkExperiencesByEmployee, createWorkExperience, getAllEmployees, assignManager, changeEmployeeStatus, updateEmployee } from '@/lib/api/employee';
import { getEmployeeSkills, createEmployeeSkill, validateEmployeeSkill, getSkills } from '@/lib/api/skill';
import { getJobRoles, getGrades } from '@/lib/api/jobArchitecture';
import { extractId } from '@/lib/api-iri';
import { JobRole, Grade } from '@/types/jobArchitecture';
import { getAllPositions } from '@/lib/api/position';
import { getAllUsers } from '@/lib/api/profile';
import { AppUser } from '@/types/profile';
import { getContractsByEmployee } from '@/lib/api/contract';
import { getDocumentsByHolder, uploadDocument, deleteDocument } from '@/lib/api/document';
import { Employee, STATUS, Department, WorkExperience } from '@/types/employee';
import { EmployeeSkill, Skill as CatalogSkill, SKILL_LEVEL, SKILL_LEVEL_LABELS, SkillLevel } from '@/types/skill';
import { toast } from '@/lib/toast';
import { Contract } from '@/types/contract';
import { DocumentRecord, DOCUMENT_TYPE } from '@/types/document';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { ContentPanel } from '@/components/layout/ContentPanel';
import { EMPLOYEE_TAB_TRIGGER } from '@/components/employees/employeeProfileTabs';
import { ProfileSection } from '@/components/employees/ProfileSection';
import { ProfileField } from '@/components/employees/ProfileField';
import { EmployeeProfilePhoto } from '@/components/employees/EmployeeProfilePhoto';
import { AnchoredDropdown } from '@/components/ui/AnchoredDropdown';
import { BASE_URL } from '@/lib/api/client';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EmployeeDetailsPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [departmentsMap, setDepartmentsMap] = useState<Record<string, string>>({});
    const [positionsMap, setPositionsMap] = useState<Record<string, string>>({});
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
    const [skills, setSkills] = useState<EmployeeSkill[]>([]);
    const [skillsCatalog, setSkillsCatalog] = useState<CatalogSkill[]>([]);
    const [documents, setDocuments] = useState<DocumentRecord[]>([]);
    const [managerDetails, setManagerDetails] = useState<{ name: string, position?: string } | null>(null);
    const [usersMap, setUsersMap] = useState<Record<string, { name?: string, email: string }>>({});
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [selectedManagerId, setSelectedManagerId] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isChangingStatus, setIsChangingStatus] = useState<string | null>(null);
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
    const statusTriggerRef = useRef<HTMLButtonElement>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean,
        title: string,
        message: string,
        action: string,
        variant: 'danger' | 'warning' | 'info' | 'success'
    }>({
        isOpen: false,
        title: '',
        message: '',
        action: '',
        variant: 'info'
    });

    async function handleStatusChange(action: string) {
        setIsStatusMenuOpen(false);
        
        let title = "Confirmation";
        let message = "Êtes-vous sûr de vouloir procéder à cette opération ?";
        let variant: 'danger' | 'warning' | 'info' | 'success' = 'warning';

        switch (action) {
            case 'activations': 
                title = "Réactivation";
                message = employee?.status === STATUS.TERMINATED || employee?.status === STATUS.RETIRED ? "Ré-embaucher ce collaborateur ?" : "Réactiver le dossier du collaborateur ?";
                variant = 'success';
                break;
            case 'suspensions':
                title = "Suspension";
                message = "Le collaborateur sera suspendu immédiatement. Confirmer ?";
                variant = 'warning';
                break;
            case 'on_leaves':
                title = "Mise en Congé";
                message = "Confirmer la mise en congé de ce collaborateur ?";
                variant = 'info';
                break;
            case 'terminations':
                title = "Fin de Contrat";
                message = "ATTENTION : Vous allez mettre fin au contrat de ce collaborateur. Cette action est importante. Confirmer ?";
                variant = 'danger';
                break;
            case 'retirements':
                title = "Retraite";
                message = "Enregistrer le départ à la retraite de ce collaborateur ?";
                variant = 'info';
                break;
            case 'deactivations':
                title = "Désactivation";
                message = "Le dossier de l'employé sera désactivé et archivé. Confirmer ?";
                variant = 'danger';
                break;
            case 'probations':
                title = "Période d'Essai";
                message = "Placer ce collaborateur en période d'essai ?";
                variant = 'info';
                break;
        }

        setConfirmModal({
            isOpen: true,
            title,
            message,
            action,
            variant
        });
    }

    async function executeStatusChange() {
        const action = confirmModal.action;
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        
        setIsChangingStatus(action);
        try {
            await changeEmployeeStatus(action, id);
            // Refresh data
            setIsLoading(true);
            const empData = await getEmployeeById(id);
            setEmployee(empData);
        } catch (err: any) {
            alert(err.message || "Erreur lors de l'opération");
        } finally {
            setIsChangingStatus(null);
            setIsLoading(false);
        }
    }

    // Document Modal State
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
    const [docForm, setDocForm] = useState({ title: '', type: 'OTHER', file: null as File | null });
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Experience Modal State
    const [isExpModalOpen, setIsExpModalOpen] = useState(false);
    const [isExpLoading, setIsExpLoading] = useState(false);
    const [expForm, setExpForm] = useState({
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        description: '',
        isInternal: false
    });

    // Skill Modal State
    const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
    const [isSkillLoading, setIsSkillLoading] = useState(false);
    const [skillForm, setSkillForm] = useState({
        skillId: '',
        level: SKILL_LEVEL.BEGINNER as SkillLevel,
    });
    const [validatingSkillId, setValidatingSkillId] = useState<string | null>(null);
    const [isJobRoleModalOpen, setIsJobRoleModalOpen] = useState(false);
    const [isJobRoleSaving, setIsJobRoleSaving] = useState(false);
    const [jobRoleForm, setJobRoleForm] = useState({ jobRoleId: '', gradeId: '' });

    const skillCatalogMap = useMemo(() => {
        const map: Record<string, CatalogSkill> = {};
        skillsCatalog.forEach(s => {
            map[s.id] = s;
            if (s.code) map[s.code] = s;
            if (s['@id']) map[s['@id']] = s;
        });
        return map;
    }, [skillsCatalog]);

    const resolveSkillName = (skillRef: string) => {
        const sid = extractId(skillRef) || skillRef;
        const s = skillCatalogMap[sid] || skillCatalogMap[skillRef];
        if (!s) return sid;
        return s.code ? `${s.name} (${s.code})` : s.name;
    };

    const assignedSkillIds = useMemo(() =>
        new Set(skills.map(es => extractId(es.skill)).filter(Boolean) as string[]),
        [skills]
    );

    const jobRoleLabel = (ref?: string) => {
        if (!ref) return '—';
        const rid = extractId(ref) || ref;
        const role = jobRoles.find(r => r.id === rid || r['@id'] === ref);
        return role ? `${role.title}${role.code ? ` (${role.code})` : ''}` : rid;
    };

    const gradeLabel = (ref?: string) => {
        if (!ref) return '—';
        const gid = extractId(ref) || ref;
        const grade = grades.find(g => g.id === gid || g['@id'] === ref);
        return grade?.name || gid;
    };

    const openJobRoleModal = () => {
        setJobRoleForm({
            jobRoleId: extractId(employee?.jobRole) || '',
            gradeId: extractId(employee?.grade) || '',
        });
        setIsJobRoleModalOpen(true);
    };

    async function handleSaveJobRole(e: React.FormEvent) {
        e.preventDefault();
        if (!jobRoleForm.jobRoleId) return toast.error('Sélectionnez une fiche métier.');
        setIsJobRoleSaving(true);
        try {
            const updated = await updateEmployee(id, {
                jobRole: jobRoleForm.jobRoleId,
                ...(jobRoleForm.gradeId ? { grade: jobRoleForm.gradeId } : {}),
            });
            setEmployee(updated);
            setIsJobRoleModalOpen(false);
            toast.success('Fiche métier attribuée.');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'attribution.');
        } finally {
            setIsJobRoleSaving(false);
        }
    }

    async function handleAddExperience(e: React.FormEvent) {
        e.preventDefault();
        setIsExpLoading(true);
        try {
            const newExp = await createWorkExperience({
                ...expForm,
                employeeId: id
            });
            setWorkExperiences(prev => [newExp, ...prev]);
            setIsExpModalOpen(false);
            setExpForm({ company: '', position: '', startDate: '', endDate: '', description: '', isInternal: false });
        } catch (err: any) {
            alert(err.message || "Erreur lors de l'ajout de l'expérience");
        } finally {
            setIsExpLoading(false);
        }
    }

    async function handleAddSkill(e: React.FormEvent) {
        e.preventDefault();
        if (!skillForm.skillId) return toast.error('Sélectionnez une compétence.');
        setIsSkillLoading(true);
        try {
            const newSkill = await createEmployeeSkill({
                employee: id,
                skill: skillForm.skillId,
                level: skillForm.level,
            });
            setSkills(prev => [...prev, newSkill]);
            setIsSkillModalOpen(false);
            setSkillForm({ skillId: '', level: SKILL_LEVEL.BEGINNER });
            toast.success('Compétence ajoutée.');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erreur lors de l'ajout de la compétence");
        } finally {
            setIsSkillLoading(false);
        }
    }

    async function handleValidateSkill(employeeSkillId: string) {
        setValidatingSkillId(employeeSkillId);
        try {
            await validateEmployeeSkill(employeeSkillId);
            setSkills(prev => prev.map(s =>
                s.id === employeeSkillId ? { ...s, validatedAt: new Date().toISOString() } : s
            ));
            toast.success('Compétence validée.');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Erreur lors de la validation.');
        } finally {
            setValidatingSkillId(null);
        }
    }

    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingAvatar(true);
        try {
            const fd = new FormData();
            fd.append('title', 'Photo de profil');
            fd.append('type', 'PHOTO');
            fd.append('holderType', 'EMPLOYEE');
            fd.append('holderId', id);
            fd.append('file', file);

            const newDoc = await uploadDocument(fd);
            setDocuments(prev => [...prev, newDoc]);
        } catch (err: any) {
            alert(err.message || "Erreur lors de l'upload de la photo");
        } finally {
            setIsUploadingAvatar(false);
            e.target.value = '';
        }
    }

    async function handleUploadDocument(e: React.FormEvent) {
        e.preventDefault();
        if (!docForm.title || !docForm.file || !docForm.type) return;

        setIsUploading(true);
        setUploadError(null);
        try {
            const fd = new FormData();
            fd.append('title', docForm.title);
            fd.append('type', docForm.type);
            fd.append('holderType', 'EMPLOYEE');
            fd.append('holderId', id);
            fd.append('file', docForm.file);

            const newDoc = await uploadDocument(fd);
            setDocuments(prev => [...prev, newDoc]);
            setIsDocModalOpen(false);
            setDocForm({ title: '', type: 'OTHER', file: null });
        } catch (err: any) {
            setUploadError(err.message || "Erreur lors de l'ajout du document.");
        } finally {
            setIsUploading(false);
        }
    }

    async function handleDeleteDocument(docId: string) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
        try {
            await deleteDocument(docId);
            setDocuments(prev => prev.filter(d => d.id !== docId && (d as any)['@id'] !== docId));
        } catch (err: any) {
            alert(err.message || 'Impossible de supprimer ce document.');
        }
    }

    async function handleAssignManager() {
        if (!selectedManagerId) return;
        setIsAssigning(true);
        try {
            await assignManager(id, selectedManagerId);
            // Refresh data
            setIsLoading(true);
            const empData = await getEmployeeById(id);
            setEmployee(empData);

            // Refresh manager details
            if (empData.manager || empData.managerId) {
                const mId = empData.managerId || (empData.manager as string).split('/').pop();
                if (mId) {
                    const mgr = await getEmployeeById(mId);
                    setManagerDetails({
                        name: `${mgr.firstName} ${mgr.lastName}`,
                        position: mgr.position
                    });
                }
            }
            setIsAssignModalOpen(false);
        } catch (err: any) {
            alert(err.message || "Erreur lors de l'assignation du manager");
        } finally {
            setIsAssigning(false);
            setIsLoading(false);
        }
    }

    async function openAssignModal() {
        setIsAssignModalOpen(true);
        try {
            const data = await getAllEmployees();
            const list = Array.isArray(data) ? data : data['hydra:member'] || [];
            // Filter out current employee
            setAllEmployees(list.filter((e: any) => e.id !== id));
        } catch (e) {
            console.error("Error loading employees for assignment:", e);
        }
    }

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                // First fetch employee to get @id for skills
                const empData = await getEmployeeById(id);
                setEmployee(empData);

                // Fetch Manager details if available
                if (empData.manager || empData.managerId) {
                    const mId = empData.managerId || (empData.manager as string).split('/').pop();
                    if (mId) {
                        try {
                            const mgr = await getEmployeeById(mId);
                            setManagerDetails({
                                name: `${mgr.firstName} ${mgr.lastName}`,
                                position: mgr.position
                            });
                        } catch (e) {
                            console.error("Manager load error:", e);
                        }
                    }
                }

                const employeeIri = empData['@id'] || `/api/employees/${id}`;

                const [deptsData, posData, contractsData, experiencesData, employeeSkillsData, catalogData, documentsData, usersData, rolesData, gradesData] = await Promise.all([
                    getDepartments(),
                    getAllPositions(),
                    getContractsByEmployee(id),
                    getWorkExperiencesByEmployee(id),
                    getEmployeeSkills(id).catch(() => []),
                    getSkills().catch(() => []),
                    getDocumentsByHolder('EMPLOYEE', id).catch(() => []),
                    getAllUsers().catch(() => ({ member: [] })),
                    getJobRoles().catch(() => []),
                    getGrades().catch(() => []),
                ]);

                // Create users map
                const usersList = Array.isArray(usersData) ? usersData : (usersData as any).member || (usersData as any)['hydra:member'] || [];
                const uMap: Record<string, { name?: string, email: string }> = {};
                usersList.forEach((u: AppUser) => {
                    uMap[u.id] = { name: (u as any).displayName, email: u.email };
                    if (u['@id']) {
                        uMap[u['@id']] = { name: (u as any).displayName, email: u.email };
                    }
                });
                setUsersMap(uMap);

                // Create departments map
                const deptsList = Array.isArray(deptsData) ? deptsData : deptsData['hydra:member'] || [];
                const dMap: Record<string, string> = {};
                deptsList.forEach((dept: Department) => {
                    dMap[dept.id] = dept.name;
                    if (dept['@id']) {
                        dMap[dept['@id']] = dept.name;
                    }
                });
                setDepartmentsMap(dMap);

                // Create positions map
                const posList = Array.isArray(posData) ? posData : (posData as any)['hydra:member'] || (posData as any)['member'] || [];
                const pMap: Record<string, string> = {};
                posList.forEach((pos: any) => {
                    pMap[pos.id] = pos.title;
                    if (pos['@id']) {
                        pMap[pos['@id']] = pos.title;
                    }
                });
                setPositionsMap(pMap);

                // Handle contracts
                const contractsList = Array.isArray(contractsData) ? contractsData : contractsData['hydra:member'] || [];
                setContracts(contractsList);

                // Handle experiences
                const experiencesList = Array.isArray(experiencesData) ? experiencesData : experiencesData['hydra:member'] || [];
                setWorkExperiences(experiencesList);

                setSkills(employeeSkillsData);
                setSkillsCatalog(catalogData);
                setJobRoles(rolesData);
                setGrades(gradesData);

                // Handle documents
                const docsList = Array.isArray(documentsData) ? documentsData : (documentsData as any)['hydra:member'] || [];
                setDocuments(docsList);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case STATUS.ACTIVE: return { label: 'Actif', variant: 'success' as const };
            case STATUS.ON_LEAVE: return { label: 'En congé', variant: 'warning' as const };
            case STATUS.INACTIVE: return { label: 'Inactif', variant: 'secondary' as const };
            case STATUS.SUSPENDED: return { label: 'Suspendu', variant: 'destructive' as const };
            case STATUS.TERMINATED: return { label: 'Contrat terminé', variant: 'destructive' as const };
            case STATUS.PROBATION: return { label: "Période d'essai", variant: 'info' as const };
            case STATUS.RETIRED: return { label: 'Retraité', variant: 'secondary' as const };
            default: return { label: status, variant: 'secondary' as const };
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-secondary-400">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                <p className="font-black animate-pulse uppercase tracking-[0.2em] text-[10px]">Synchronisation du dossier...</p>
            </div>
        );
    }

    if (error || !employee) {
        return (
            <div className="max-w-xl mx-auto mt-20 p-12 bg-white rounded-xl border-none shadow-2xl shadow-rose-200/20 text-center space-y-6">
                <div className="w-20 h-20 bg-rose-50 rounded-xl flex items-center justify-center mx-auto">
                    <Info className="w-10 h-10 text-rose-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-secondary-900 uppercase tracking-tight">Dossier Introuvable</h2>
                    <p className="text-secondary-500 font-medium italic">{error || "Nous n'avons pas pu récupérer les données de cet employé."}</p>
                </div>
                <Button onClick={() => router.back()} variant="outline" className="px-10 py-6 rounded-2xl font-bold uppercase tracking-widest text-xs">
                    Retour à l'annuaire
                </Button>
            </div>
        );
    }

    const status = getStatusInfo(employee.status);
    const avatarDoc = [...documents].reverse().find(d => d.type === 'PHOTO');

    const positionLabel = positionsMap[employee.position] || employee.position || '';
    const departmentLabel = departmentsMap[employee.department] || employee.department || '';

    return (
        <PageShell>
            <PageHeader
                title={`${employee.firstName} ${employee.lastName}`}
                description={[positionLabel, departmentLabel, employee.employeeNumber].filter(Boolean).join(' · ') || undefined}
                backHref="/employees"
                leading={
                    <EmployeeProfilePhoto
                        firstName={employee.firstName}
                        lastName={employee.lastName}
                        photoUrl={avatarDoc?.contentUrl ? `${BASE_URL}${avatarDoc.contentUrl}` : undefined}
                        isUploading={isUploadingAvatar}
                        onUpload={handleAvatarUpload}
                    />
                }
                actions={
                    <>
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <Button onClick={openAssignModal} variant="outline" size="sm" className="gap-2">
                            <UserCog className="w-4 h-4" />
                            {employee.manager ? 'Changer manager' : 'Assigner manager'}
                        </Button>
                        <div>
                            <Button
                                ref={statusTriggerRef}
                                onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <Activity className={cn("w-4 h-4", isChangingStatus ? "animate-pulse" : "")} />
                                Statut
                                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isStatusMenuOpen && "rotate-180")} />
                            </Button>

                            <AnchoredDropdown
                                open={isStatusMenuOpen}
                                onClose={() => setIsStatusMenuOpen(false)}
                                triggerRef={statusTriggerRef}
                                width={240}
                                className="p-1.5"
                            >
                                <p className="px-3 py-2 text-xs font-medium text-muted-foreground">
                                    Actions disponibles
                                </p>

                                {employee.status === STATUS.ACTIVE && (
                                    <div className="space-y-0.5">
                                        <button onClick={() => handleStatusChange('suspensions')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                                            <Ban className="w-4 h-4 text-amber-600" /> Suspendre
                                        </button>
                                        <button onClick={() => handleStatusChange('on_leaves')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                                            <Plane className="w-4 h-4 text-amber-600" /> Mettre en congé
                                        </button>
                                        <button onClick={() => handleStatusChange('terminations')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                                            <UserMinus className="w-4 h-4 text-accent-red-500" /> Terminer contrat
                                        </button>
                                        <button onClick={() => handleStatusChange('retirements')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                                            <Heart className="w-4 h-4 text-secondary-500" /> Retraite
                                        </button>
                                        <button onClick={() => handleStatusChange('deactivations')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                                            <Power className="w-4 h-4 text-secondary-500" /> Désactiver
                                        </button>
                                    </div>
                                )}

                                {(employee.status === STATUS.INACTIVE || employee.status === STATUS.SUSPENDED || employee.status === STATUS.ON_LEAVE || employee.status === STATUS.TERMINATED || employee.status === STATUS.RETIRED) && (
                                    <button onClick={() => handleStatusChange('activations')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        Réactiver
                                    </button>
                                )}

                                {employee.status === STATUS.PROBATION && (
                                    <div className="space-y-0.5">
                                        <button onClick={() => handleStatusChange('activations')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                                            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Valider essai
                                        </button>
                                        <button onClick={() => handleStatusChange('terminations')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                                            <UserMinus className="w-4 h-4 text-accent-red-500" /> Fin d&apos;essai
                                        </button>
                                    </div>
                                )}

                                {employee.status === STATUS.INACTIVE && (
                                    <button onClick={() => handleStatusChange('probations')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors">
                                        <Clock className="w-4 h-4 text-primary-500" /> Période d&apos;essai
                                    </button>
                                )}
                            </AnchoredDropdown>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="w-4 h-4" />
                            Exporter
                        </Button>
                    </>
                }
            />

            <ContentPanel>
            <TabsProvider defaultIndex={0}>
                <TabsList className="w-full justify-start rounded-none bg-transparent border-b border-border p-0 h-auto gap-0 px-6">
                    <TabsTrigger className={EMPLOYEE_TAB_TRIGGER}>Général</TabsTrigger>
                    <TabsTrigger className={EMPLOYEE_TAB_TRIGGER}>Poste</TabsTrigger>
                    <TabsTrigger className={EMPLOYEE_TAB_TRIGGER}>Contrats</TabsTrigger>
                    <TabsTrigger className={EMPLOYEE_TAB_TRIGGER}>Expériences</TabsTrigger>
                    <TabsTrigger className={EMPLOYEE_TAB_TRIGGER}>Historique</TabsTrigger>
                    <TabsTrigger className={EMPLOYEE_TAB_TRIGGER}>Documents</TabsTrigger>
                </TabsList>

                <TabsPanels>
                    <TabsContent className="mt-0 p-6 md:p-8 focus:outline-none">
                        <div className="space-y-8">
                            <ProfileSection title="Coordonnées">
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                                    <ProfileField label="E-mail" value={employee.email} />
                                    <ProfileField label="Téléphone" value={employee.phone} />
                                </dl>
                            </ProfileSection>

                            <ProfileSection title="Informations personnelles">
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                                <ProfileField label="Nationalité" value={employee.nationality} />
                                <ProfileField
                                    label="Genre"
                                    value={employee.gender === 'M' ? 'Masculin' : employee.gender === 'F' ? 'Féminin' : employee.gender === 'O' ? 'Autre' : undefined}
                                />
                                <ProfileField
                                    label="Date de naissance"
                                    value={employee.birthDate ? format(new Date(employee.birthDate), 'd MMMM yyyy', { locale: fr }) : undefined}
                                />
                                <ProfileField
                                    label="Situation matrimoniale"
                                    value={
                                        employee.maritalStatus === 'SINGLE' ? 'Célibataire' :
                                        employee.maritalStatus === 'MARRIED' ? 'Marié(e)' :
                                        employee.maritalStatus === 'DIVORCED' ? 'Divorcé(e)' :
                                        employee.maritalStatus
                                    }
                                />
                                <ProfileField label="Résidence" value="Kinshasa, RD Congo" />
                                <ProfileField label="Matricule" value={employee.employeeNumber} />
                            </dl>
                            </ProfileSection>
                        </div>
                    </TabsContent>

                    <TabsContent className="mt-0 p-6 md:p-8 focus:outline-none">
                        <ProfileSection title="Affectation">
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 mb-8">
                                <ProfileField label="Poste organisationnel" value={positionsMap[employee.position] || employee.position} />
                                <ProfileField label="Département" value={departmentsMap[employee.department] || employee.department} />
                                <ProfileField
                                    label="Date d'intégration"
                                    value={employee.hireDate ? format(new Date(employee.hireDate), 'd MMMM yyyy', { locale: fr }) : undefined}
                                />
                                <ProfileField label="Statut RH" value={status.label} />
                            </dl>

                            <div className="pt-6 border-t border-border mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-foreground">Fiche métier RH</h3>
                                    <Button variant="outline" size="sm" onClick={openJobRoleModal}>
                                        {employee.jobRole ? 'Modifier' : 'Attribuer'}
                                    </Button>
                                </div>
                                {employee.jobRole ? (
                                    <div className="p-4 rounded-xl border border-primary-100 bg-primary-50/40">
                                        <p className="font-semibold text-foreground">{jobRoleLabel(employee.jobRole)}</p>
                                        <p className="text-xs font-mono text-muted-foreground mt-1">{extractId(employee.jobRole)}</p>
                                        {employee.grade && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Grade : {gradeLabel(employee.grade)}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                                        Aucune fiche métier attribuée — requis pour la mobilité et l&apos;éligibilité promotion.
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 border-t border-border">
                                <h3 className="text-sm font-semibold text-foreground mb-4">Manager</h3>
                                {managerDetails ? (
                                    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30">
                                        <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
                                            <UserCircle2 className="w-5 h-5 text-primary-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{managerDetails.name}</p>
                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                {managerDetails.position ? (positionsMap[managerDetails.position] || managerDetails.position) : 'Manager'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-dashed border-border">
                                        <p className="text-sm text-muted-foreground flex-1">Aucun manager assigné</p>
                                        <Button onClick={openAssignModal} variant="outline" size="sm" className="gap-2 shrink-0">
                                            <Plus className="w-4 h-4" />
                                            Assigner
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </ProfileSection>
                    </TabsContent>

                    <TabsContent className="mt-0 p-6 md:p-8 focus:outline-none">
                        <ProfileSection title="Contrats" contentClassName="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-secondary-100 border-b border-secondary-200">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-secondary-600">Type</th>
                                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-secondary-600">Début</th>
                                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-secondary-600">Fin</th>
                                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-secondary-600">Salaire</th>
                                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-secondary-600">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-secondary-200">
                                        {contracts.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                                                    Aucun contrat enregistré.
                                                </td>
                                            </tr>
                                        ) : (
                                            contracts.map((contract) => (
                                                <tr key={contract.id} className="hover:bg-primary-50/30">
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline">{contract.type}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-secondary-800">
                                                        {contract.startDate ? format(new Date(contract.startDate), 'dd MMM yyyy', { locale: fr }) : '—'}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {contract.endDate ? format(new Date(contract.endDate), 'dd MMM yyyy', { locale: fr }) : 'Indéfini'}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-foreground">
                                                        {contract.salary} CDF
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="secondary">{contract.status}</Badge>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </ProfileSection>
                    </TabsContent>

                    <TabsContent className="mt-0 p-6 md:p-8 focus:outline-none">
                        <div className="space-y-8">
                            <ProfileSection
                                title="Expériences"
                                description="Parcours professionnel antérieur et interne"
                                action={
                                    <Button onClick={() => setIsExpModalOpen(true)} variant="outline" size="sm" className="gap-2">
                                        <Plus className="w-4 h-4" /> Ajouter
                                    </Button>
                                }
                            >
                                {workExperiences.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-4">Aucune expérience enregistrée.</p>
                                ) : (
                                    <div className="divide-y divide-border">
                                        {workExperiences.map((exp, idx) => (
                                            <div key={exp.id || idx} className="py-5 first:pt-0 last:pb-0">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">
                                                    <h4 className="text-sm font-semibold text-foreground">{exp.position}</h4>
                                                    <Badge variant={exp.isInternal ? 'success' : 'outline'}>
                                                        {exp.isInternal ? 'Interne' : 'Externe'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-primary-600 font-medium">{exp.company}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {exp.startDate ? format(new Date(exp.startDate), 'MMM yyyy', { locale: fr }) : '—'}
                                                    {' — '}
                                                    {exp.endDate ? format(new Date(exp.endDate), 'MMM yyyy', { locale: fr }) : 'Présent'}
                                                </p>
                                                {exp.description && (
                                                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{exp.description}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ProfileSection>

                            <ProfileSection
                                title="Compétences"
                                description="Niveaux de maîtrise"
                                action={
                                    <Button onClick={() => setIsSkillModalOpen(true)} variant="outline" size="sm" className="gap-2">
                                        <Plus className="w-4 h-4" /> Ajouter
                                    </Button>
                                }
                            >
                                {skills.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-4">Aucune compétence répertoriée.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {skills.map((employeeSkill) => (
                                            <div key={employeeSkill.id} className="p-4 rounded-xl border border-border">
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <div className="min-w-0">
                                                        <h4 className="text-sm font-medium text-foreground truncate">
                                                            {resolveSkillName(employeeSkill.skill as string)}
                                                        </h4>
                                                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                                            {extractId(employeeSkill.skill)}
                                                        </p>
                                                    </div>
                                                    <Badge variant="secondary" size="sm">
                                                        {SKILL_LEVEL_LABELS[employeeSkill.level as SkillLevel] || employeeSkill.level}
                                                    </Badge>
                                                </div>
                                                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                                                    <div
                                                        className="h-full rounded-full bg-primary-500 transition-all"
                                                        style={{
                                                            width: employeeSkill.level === 'EXPERT' ? '100%'
                                                                : employeeSkill.level === 'ADVANCED' ? '75%'
                                                                : employeeSkill.level === 'INTERMEDIATE' ? '50%' : '25%'
                                                        }}
                                                    />
                                                </div>
                                                {employeeSkill.validatedAt ? (
                                                    <Badge variant="success" className="text-[10px]">Validée</Badge>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-[10px] gap-1"
                                                        disabled={validatingSkillId === employeeSkill.id}
                                                        onClick={() => handleValidateSkill(employeeSkill.id)}
                                                    >
                                                        {validatingSkillId === employeeSkill.id ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 className="w-3 h-3" />
                                                        )}
                                                        Valider
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ProfileSection>
                        </div>
                    </TabsContent>

                    <TabsContent className="mt-0 p-6 md:p-8 focus:outline-none">
                        <ProfileSection title="Journal d'audit" description="Traçabilité du dossier">
                            <div className="divide-y divide-border">
                                {[
                                    {
                                        date: employee.createdAt,
                                        label: 'Dossier créé',
                                        detail: `Initialisé par ${usersMap[employee.createdBy]?.name || usersMap[employee.createdBy]?.email || employee.createdBy || 'Système'}`,
                                        type: 'Création',
                                    },
                                    ...(employee.updatedAt && employee.updatedAt !== employee.createdAt ? [{
                                        date: employee.updatedAt,
                                        label: 'Dossier mis à jour',
                                        detail: 'Modification des données du dossier employé',
                                        type: 'Mise à jour',
                                    }] : []),
                                    ...[
                                        { date: employee.activatedAt, by: employee.activatedBy, label: 'Dossier activé', type: 'Activation' },
                                        { date: employee.managerAssignedAt, by: employee.managerAssignedBy, label: 'Manager assigné', type: 'Hiérarchie' },
                                        { date: employee.probationAt, by: employee.probationBy, label: "Période d'essai", type: 'RH' },
                                        { date: employee.onLeaveAt, by: employee.onLeaveBy, label: 'Départ en congé', type: 'Congés' },
                                        { date: employee.suspendedAt, by: employee.suspendedBy, label: 'Dossier suspendu', type: 'Sanction' },
                                        { date: employee.deactivatedAt, by: employee.deactivatedBy, label: 'Dossier désactivé', type: 'Statut' },
                                        { date: employee.terminatedAt, by: employee.terminatedBy, label: 'Contrat terminé', type: 'Départ' },
                                        { date: employee.retiredAt, by: employee.retiredBy, label: 'Départ retraite', type: 'Retraite' },
                                    ]
                                        .filter((ev) => ev.date)
                                        .map((ev) => ({
                                            date: ev.date!,
                                            label: ev.label,
                                            detail: `Par ${ev.by ? (usersMap[ev.by]?.name || usersMap[ev.by]?.email || ev.by) : 'Système'}`,
                                            type: ev.type,
                                        })),
                                ]
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((ev, idx) => (
                                        <div key={idx} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                                            <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 justify-between">
                                                    <p className="text-sm font-medium text-foreground">{ev.label}</p>
                                                    <Badge variant="secondary" size="sm">{ev.type}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-0.5">{ev.detail}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {format(new Date(ev.date), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </ProfileSection>
                    </TabsContent>

                    <TabsContent className="mt-0 p-6 md:p-8 focus:outline-none">
                        <ProfileSection
                            title="Documents"
                            description="Pièces jointes du dossier"
                            action={
                                <Button onClick={() => setIsDocModalOpen(true)} variant="pill" size="sm" className="gap-2">
                                    <Plus className="w-4 h-4" /> Ajouter
                                </Button>
                            }
                            contentClassName="p-0 -mx-0"
                        >
                            <div className="overflow-x-auto border border-border rounded-xl">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-secondary-100 border-b border-secondary-200">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-secondary-600">Type</th>
                                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-secondary-600">Titre</th>
                                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-secondary-600">Date</th>
                                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-secondary-600 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-secondary-200">
                                        {documents.filter((d) => d.type !== 'PHOTO').length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                                                    Aucun document pour cet employé.
                                                </td>
                                            </tr>
                                        ) : (
                                            documents.filter((d) => d.type !== 'PHOTO').map((doc) => (
                                                <tr key={doc.id} className="hover:bg-primary-50/30">
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline">{doc.type}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-foreground">
                                                        {doc.title || doc.documentRefNumber || 'Sans titre'}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {doc.createdAt ? format(new Date(doc.createdAt), 'd MMM yyyy', { locale: fr }) : '—'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-end gap-1">
                                                            {doc.contentUrl && (
                                                                <Button onClick={() => setPreviewDocUrl(`${BASE_URL}${doc.contentUrl}`)} variant="ghost" size="icon" className="h-8 w-8">
                                                                    <Eye className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                            {doc.contentUrl && (
                                                                <a href={`${BASE_URL}${doc.contentUrl}`} download target="_blank" rel="noreferrer">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <Download className="w-4 h-4" />
                                                                    </Button>
                                                                </a>
                                                            )}
                                                            <Button onClick={() => handleDeleteDocument(doc.id || (doc as any)['@id'])} variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </ProfileSection>
                    </TabsContent>
                        </TabsPanels>
            </TabsProvider>
            </ContentPanel>

            {/* Modals */}
            {isDocModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg border-none shadow-2xl bg-white rounded-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <CardHeader className="p-6 border-b border-secondary-50 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black text-secondary-900 uppercase tracking-widest">Nouveau Document</CardTitle>
                                    <CardDescription className="text-xs">Ajouter au dossier de l'employé</CardDescription>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsDocModalOpen(false)} className="rounded-full h-8 w-8">
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleUploadDocument} className="space-y-4">
                                {uploadError && (
                                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
                                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                        <p className="text-xs font-bold text-rose-600">{uploadError}</p>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>Titre du document</Label>
                                    <Input value={docForm.title} onChange={e => setDocForm({ ...docForm, title: e.target.value })} placeholder="ex: CNI Recto" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type de document</Label>
                                    <Select value={docForm.type} onChange={e => setDocForm({ ...docForm, type: e.target.value })} required>
                                        {Object.entries(DOCUMENT_TYPE).map(([k, v]) => (
                                            <option key={k} value={v}>{v}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Fichier (Max: 5MB)</Label>
                                    <Input type="file" onChange={e => setDocForm({ ...docForm, file: e.target.files?.[0] || null })} required className="p-2 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer" />
                                </div>
                                <div className="pt-4 flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsDocModalOpen(false)} disabled={isUploading}>Annuler</Button>
                                    <Button type="submit" disabled={isUploading || !docForm.file || !docForm.title} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        Uploader
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Experience Modal */}
            {isExpModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg border-none shadow-2xl bg-white rounded-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <CardHeader className="p-6 border-b border-secondary-50 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black text-secondary-900 uppercase tracking-widest">Ajouter une Expérience</CardTitle>
                                    <CardDescription className="text-xs text-secondary-400">Enrichir le parcours du collaborateur</CardDescription>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsExpModalOpen(false)} className="rounded-full h-8 w-8">
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleAddExperience} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Entreprise</Label>
                                        <Input value={expForm.company} onChange={e => setExpForm({ ...expForm, company: e.target.value })} placeholder="ex: Google" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Poste</Label>
                                        <Input value={expForm.position} onChange={e => setExpForm({ ...expForm, position: e.target.value })} placeholder="ex: Développeur Senior" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Date de début</Label>
                                        <Input type="date" value={expForm.startDate} onChange={e => setExpForm({ ...expForm, startDate: e.target.value })} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date de fin</Label>
                                        <Input type="date" value={expForm.endDate} onChange={e => setExpForm({ ...expForm, endDate: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <textarea
                                        className="w-full p-3 bg-secondary-50 border border-secondary-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/10 min-h-[100px]"
                                        value={expForm.description}
                                        onChange={e => setExpForm({ ...expForm, description: e.target.value })}
                                        placeholder="Décrivez les missions principales..."
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isInternal"
                                        checked={expForm.isInternal}
                                        onChange={e => setExpForm({ ...expForm, isInternal: e.target.checked })}
                                        className="w-4 h-4 rounded border-secondary-200 text-primary-600 focus:ring-primary-500"
                                    />
                                    <Label htmlFor="isInternal" className="cursor-pointer text-xs font-bold text-secondary-600">Expérience interne ARCA</Label>
                                </div>
                                <div className="pt-4 flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsExpModalOpen(false)} disabled={isExpLoading}>Annuler</Button>
                                    <Button type="submit" disabled={isExpLoading} className="bg-primary-600 hover:bg-primary-700 text-white gap-2">
                                        {isExpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        Ajouter l'expérience
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Job Role Modal */}
            {isJobRoleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-md border-none shadow-2xl bg-white rounded-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <CardHeader className="p-6 border-b border-secondary-50 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-black text-secondary-900 uppercase tracking-widest">Fiche métier RH</CardTitle>
                                <CardDescription className="text-xs text-secondary-400">Attribuer le métier et le grade de référence</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsJobRoleModalOpen(false)} className="rounded-full h-8 w-8">
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSaveJobRole} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Fiche métier <span className="text-rose-500">*</span></Label>
                                    <Select
                                        value={jobRoleForm.jobRoleId}
                                        onChange={e => setJobRoleForm(p => ({ ...p, jobRoleId: e.target.value }))}
                                        required
                                    >
                                        <option value="">Sélectionner...</option>
                                        {jobRoles.map(r => (
                                            <option key={r.id} value={r.id}>{r.title}{r.code ? ` (${r.code})` : ''}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Grade</Label>
                                    <Select
                                        value={jobRoleForm.gradeId}
                                        onChange={e => setJobRoleForm(p => ({ ...p, gradeId: e.target.value }))}
                                    >
                                        <option value="">Aucun grade</option>
                                        {grades.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="pt-4 flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsJobRoleModalOpen(false)} disabled={isJobRoleSaving}>Annuler</Button>
                                    <Button type="submit" disabled={isJobRoleSaving} className="bg-primary-600 hover:bg-primary-700 text-white gap-2">
                                        {isJobRoleSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Enregistrer
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Skill Modal */}
            {isSkillModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-sm border-none shadow-2xl bg-white rounded-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <CardHeader className="p-6 border-b border-secondary-50 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black text-secondary-900 uppercase tracking-widest">Ajouter une Compétence</CardTitle>
                                    <CardDescription className="text-xs text-secondary-400">Évaluer le savoir-faire</CardDescription>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsSkillModalOpen(false)} className="rounded-full h-8 w-8">
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleAddSkill} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Compétence du référentiel</Label>
                                    <Select
                                        value={skillForm.skillId}
                                        onChange={e => setSkillForm({ ...skillForm, skillId: e.target.value })}
                                        required
                                    >
                                        <option value="">Sélectionnez une compétence...</option>
                                        {skillsCatalog
                                            .filter(s => !assignedSkillIds.has(s.id))
                                            .map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}{s.code ? ` (${s.code})` : ''}
                                                </option>
                                            ))}
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Niveau de maîtrise</Label>
                                    <Select
                                        value={skillForm.level}
                                        onChange={e => setSkillForm({ ...skillForm, level: e.target.value as SkillLevel })}
                                        required
                                    >
                                        {Object.entries(SKILL_LEVEL_LABELS).map(([k, label]) => (
                                            <option key={k} value={k}>{label}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="pt-4 flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsSkillModalOpen(false)} disabled={isSkillLoading}>Annuler</Button>
                                    <Button type="submit" disabled={isSkillLoading} className="bg-primary-600 hover:bg-primary-700 text-white gap-2">
                                        {isSkillLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        Enregistrer
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {previewDocUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewDocUrl(null)}>
                    <div className="relative w-full max-w-4xl h-[80vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-secondary-100 flex items-center justify-between bg-secondary-50">
                            <h3 className="font-bold text-secondary-900 flex items-center gap-2"><Eye className="w-4 h-4 text-indigo-600" /> Aperçu du document</h3>
                            <Button variant="ghost" size="icon" onClick={() => setPreviewDocUrl(null)} className="rounded-full h-8 w-8 hover:bg-rose-100 hover:text-rose-600">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex-1 bg-secondary-100 relative">
                            {previewDocUrl.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/) != null ? (
                                <img src={previewDocUrl} alt="Preview" className="w-full h-full object-contain p-4" />
                            ) : previewDocUrl.toLowerCase().endsWith('.pdf') ? (
                                <iframe src={previewDocUrl} className="w-full h-full border-none" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-secondary-500">
                                    <FileText className="w-16 h-16 opacity-50" />
                                    <p className="font-medium text-sm">L'aperçu n'est pas disponible pour ce type de fichier.</p>
                                    <a href={previewDocUrl} target="_blank" rel="noreferrer" download>
                                        <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Télécharger le fichier</Button>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Assign Manager Modal */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-secondary-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-md border-none shadow-2xl rounded-xl overflow-hidden bg-white animate-in zoom-in-95 duration-300">
                        <CardHeader className="p-8 border-b border-secondary-50 bg-secondary-50/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center shadow-sm">
                                        <UserCircle2 className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-black text-secondary-900 uppercase tracking-widest leading-none mb-1">Assigner un Manager</CardTitle>
                                        <CardDescription className="text-[10px] font-bold uppercase text-secondary-400 tracking-wider">Sélectionner le supérieur hiérarchique</CardDescription>
                                    </div>
                                </div>
                                <button onClick={() => setIsAssignModalOpen(false)} className="w-10 h-10 rounded-xl hover:bg-white flex items-center justify-center transition-colors group">
                                    <X className="w-5 h-5 text-secondary-400 group-hover:text-rose-500 transition-colors" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Collaborateur Manager</Label>
                                    <Select
                                        value={selectedManagerId}
                                        onChange={(e) => setSelectedManagerId(e.target.value)}
                                        className="h-12"
                                    >
                                        <option value="">Choisir un employé...</option>
                                        {allEmployees.map((emp) => (
                                            <option
                                                key={emp.id}
                                                value={emp.id}
                                            >
                                                {emp.firstName} {emp.lastName} ({emp.id})
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsAssignModalOpen(false)}
                                    className="flex-1 h-12 rounded-2xl border-secondary-100 text-secondary-500 font-black uppercase text-[10px] tracking-widest hover:bg-secondary-50 transition-all"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleAssignManager}
                                    disabled={!selectedManagerId || isAssigning}
                                    className="flex-[1.5] h-12 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary-200 transition-all disabled:opacity-50"
                                >
                                    {isAssigning ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Assignation...
                                        </>
                                    ) : (
                                        'Confirmer l\'Assignation'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Custom Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-secondary-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <Card className="w-full max-w-sm border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] rounded-xl overflow-hidden bg-white animate-in zoom-in-95 duration-300">
                        <CardContent className="p-8 text-center space-y-6">
                            <div className={cn(
                                "w-20 h-20 rounded-xl flex items-center justify-center mx-auto shadow-sm",
                                confirmModal.variant === 'danger' ? "bg-rose-50 text-rose-500" :
                                confirmModal.variant === 'warning' ? "bg-amber-50 text-amber-500" :
                                confirmModal.variant === 'success' ? "bg-emerald-50 text-emerald-500" :
                                "bg-blue-50 text-blue-500"
                            )}>
                                {confirmModal.variant === 'danger' ? <AlertCircle className="w-10 h-10" /> :
                                 confirmModal.variant === 'success' ? <CheckCircle2 className="w-10 h-10" /> :
                                 <Activity className="w-10 h-10" />}
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-secondary-900 uppercase tracking-tight">{confirmModal.title}</h3>
                                <p className="text-sm font-medium text-secondary-500 leading-relaxed px-4">{confirmModal.message}</p>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <Button
                                    onClick={executeStatusChange}
                                    className={cn(
                                        "h-12 rounded-2xl text-white font-black uppercase text-[11px] tracking-widest shadow-xl transition-all active:scale-95",
                                        confirmModal.variant === 'danger' ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200/50" :
                                        confirmModal.variant === 'success' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50" :
                                        "bg-secondary-900 hover:bg-black shadow-secondary-200/50"
                                    )}
                                >
                                    Confirmer l'opération
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                    className="h-12 rounded-2xl text-secondary-400 font-bold uppercase text-[10px] tracking-widest hover:bg-secondary-50 transition-all"
                                >
                                    Annuler
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </PageShell>
    );
}

