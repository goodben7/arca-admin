'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, Mail, Phone, Briefcase, Calendar, MapPin, User, Shield, Clock, Heart,
    Globe, CheckCircle2, CalendarDays, Info, MoreVertical, Edit2, Download, Loader2,
    Building2, UserCircle2, FileText, Activity, FileCheck, Eye, Trash2, Plus, X, Upload, AlertCircle,
    UserMinus, UserPlus, UserCheck, Power, Plane, Palmtree, Ban, ShieldCheck, UserCog, ChevronDown, MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TabsProvider, TabsList, TabsTrigger, TabsContent, TabsPanels } from '@/components/ui/Tabs';
import { Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getEmployeeById, getDepartments, getWorkExperiencesByEmployee, getSkillsByEmployee, createWorkExperience, createSkill, getAllEmployees, assignManager, changeEmployeeStatus } from '@/lib/api/employee';
import { getAllPositions } from '@/lib/api/position';
import { getAllUsers } from '@/lib/api/profile';
import { AppUser } from '@/types/profile';
import { getContractsByEmployee } from '@/lib/api/contract';
import { getDocumentsByHolder, uploadDocument, deleteDocument } from '@/lib/api/document';
import { Employee, STATUS, Department, WorkExperience, Skill, SKILL_LEVEL } from '@/types/employee';
import { Contract } from '@/types/contract';
import { DocumentRecord, DOCUMENT_TYPE } from '@/types/document';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';
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
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
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
        name: '',
        level: 'BEGINNER' as any
    });

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
        setIsSkillLoading(true);
        try {
            const newSkill = await createSkill({
                ...skillForm,
                employee: id
            });
            setSkills(prev => [...prev, newSkill]);
            setIsSkillModalOpen(false);
            setSkillForm({ name: '', level: 'BEGINNER' });
        } catch (err: any) {
            alert(err.message || "Erreur lors de l'ajout de la compétence");
        } finally {
            setIsSkillLoading(false);
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

                const [deptsData, posData, contractsData, experiencesData, skillsData, documentsData, usersData] = await Promise.all([
                    getDepartments(),
                    getAllPositions(),
                    getContractsByEmployee(id),
                    getWorkExperiencesByEmployee(id),
                    getSkillsByEmployee(id),
                    getDocumentsByHolder('EMPLOYEE', id).catch(() => []),
                    getAllUsers().catch(() => ({ member: [] }))
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

                // Handle skills
                const skillsList = Array.isArray(skillsData) ? skillsData : skillsData['hydra:member'] || [];
                setSkills(skillsList);

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
            case STATUS.ACTIVE: return { label: 'Actif', variant: 'success' as const, bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' };
            case STATUS.ON_LEAVE: return { label: 'En congé', variant: 'warning' as const, bg: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' };
            case STATUS.INACTIVE: return { label: 'Inactif', variant: 'destructive' as const, bg: 'bg-slate-50 text-slate-700 border-slate-100', dot: 'bg-slate-400' };
            case STATUS.SUSPENDED: return { label: 'Suspendu', variant: 'destructive' as const, bg: 'bg-orange-50 text-orange-700 border-orange-100', dot: 'bg-orange-500' };
            case STATUS.TERMINATED: return { label: 'Contrat Terminé', variant: 'destructive' as const, bg: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-600' };
            case STATUS.PROBATION: return { label: 'Période d\'Essai', variant: 'warning' as const, bg: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500' };
            case STATUS.RETIRED: return { label: 'Retraité', variant: 'secondary' as const, bg: 'bg-purple-50 text-purple-700 border-purple-100', dot: 'bg-purple-500' };
            default: return { label: status, variant: 'secondary' as const, bg: 'bg-secondary-50 text-secondary-700 border-secondary-100', dot: 'bg-secondary-400' };
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
            <div className="max-w-xl mx-auto mt-20 p-12 bg-white rounded-[32px] border-none shadow-2xl shadow-rose-200/20 text-center space-y-6">
                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto">
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="p-0 hover:bg-transparent text-secondary-500 hover:text-secondary-900 transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-all">
                            <ChevronLeft className="w-5 h-5" />
                        </div>
                    </Button>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="px-3 py-1 font-black text-[10px] uppercase tracking-widest border-secondary-200 text-secondary-500 rounded-full bg-white">
                            {employee.employeeNumber || employee.id}
                        </Badge>
                        <div className={cn("px-4 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2", status.bg)}>
                            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", status.dot)} />
                            {status.label}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Primary Action - Manager */}
                    <Button
                        onClick={openAssignModal}
                        variant="outline"
                        className="h-10 px-4 rounded-xl border-primary-100 bg-primary-50/50 text-primary-600 font-bold uppercase tracking-widest text-[9px] hover:bg-primary-100 hover:border-primary-200 transition-all gap-2"
                    >
                        <UserCog className="w-4 h-4" /> 
                        {employee.manager ? 'Changer Manager' : 'Assigner Manager'}
                    </Button>

                    {/* Status Actions Dropdown */}
                    <div className="relative">
                        <Button 
                            onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                            variant="outline" 
                            className={cn(
                                "h-10 px-5 rounded-xl border-secondary-200 font-bold uppercase tracking-widest text-[9px] gap-2 transition-all",
                                isStatusMenuOpen ? "bg-secondary-50 border-secondary-300 ring-4 ring-secondary-50" : "bg-white hover:bg-secondary-50"
                            )}
                        >
                            <Activity className={cn("w-4 h-4", isChangingStatus ? "animate-pulse" : "")} />
                            Actions Statut
                            <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isStatusMenuOpen && "rotate-180")} />
                        </Button>

                        {isStatusMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsStatusMenuOpen(false)} />
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl shadow-secondary-900/10 border border-secondary-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-3 py-2 text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1">
                                        Transitions Disponibles
                                    </div>
                                    
                                    {employee.status === STATUS.ACTIVE && (
                                        <div className="space-y-1">
                                            <button onClick={() => handleStatusChange('suspensions')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold text-orange-600 hover:bg-orange-50 transition-colors">
                                                <Ban className="w-4 h-4" /> Suspendre Collaborateur
                                            </button>
                                            <button onClick={() => handleStatusChange('on_leaves')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold text-amber-600 hover:bg-amber-50 transition-colors">
                                                <Plane className="w-4 h-4" /> Mettre en Congé
                                            </button>
                                            <button onClick={() => handleStatusChange('terminations')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors">
                                                <UserMinus className="w-4 h-4" /> Terminer Contrat
                                            </button>
                                            <button onClick={() => handleStatusChange('retirements')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold text-purple-600 hover:bg-purple-50 transition-colors">
                                                <Heart className="w-4 h-4" /> Départ à la Retraite
                                            </button>
                                            <div className="h-[1px] bg-secondary-50 my-1" />
                                            <button onClick={() => handleStatusChange('deactivations')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                                                <Power className="w-4 h-4" /> Désactiver le Dossier
                                            </button>
                                        </div>
                                    )}

                                    {(employee.status === STATUS.INACTIVE || employee.status === STATUS.SUSPENDED || employee.status === STATUS.ON_LEAVE || employee.status === STATUS.TERMINATED || employee.status === STATUS.RETIRED) && (
                                        <button onClick={() => handleStatusChange('activations')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 transition-colors">
                                            <CheckCircle2 className="w-4 h-4" /> 
                                            {employee.status === STATUS.TERMINATED || employee.status === STATUS.RETIRED ? 'Ré-embaucher (Activer)' : 'Réactiver Collaborateur'}
                                        </button>
                                    )}

                                    {employee.status === STATUS.PROBATION && (
                                        <div className="space-y-1">
                                            <button onClick={() => handleStatusChange('activations')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 transition-colors">
                                                <ShieldCheck className="w-4 h-4" /> Valider Période d'Essai
                                            </button>
                                            <button onClick={() => handleStatusChange('terminations')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors">
                                                <UserMinus className="w-4 h-4" /> Mettre Fin à l'Essai
                                            </button>
                                        </div>
                                    )}

                                    {employee.status === STATUS.INACTIVE && (
                                        <button onClick={() => handleStatusChange('probations')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition-colors">
                                            <Clock className="w-4 h-4" /> Passer en Période d'Essai
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="w-[1px] h-6 bg-secondary-100 mx-1" />

                    <Button variant="outline" className="h-10 px-6 rounded-xl border-secondary-200 font-bold uppercase tracking-widest text-[9px] gap-2 bg-white hover:bg-secondary-50 transition-all shadow-sm">
                        <Download className="w-4 h-4" />
                        Exporter
                    </Button>
                </div>
            </div>

            {/* Profile Header Card */}
            <Card className="border-none shadow-2xl shadow-secondary-200/50 bg-white overflow-hidden rounded-[40px] border border-secondary-100">
                <div className="relative h-40 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-900">
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_150%,#ffffff_0,transparent_50%)]" />
                    <div className="absolute -bottom-16 left-12 z-10">
                        <div className="w-44 h-44 rounded-[48px] bg-white p-2 shadow-2xl shadow-primary-900/20 group cursor-pointer relative" title="Modifier la photo">
                            <label className="cursor-pointer block w-full h-full relative">
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                                <div className="w-full h-full rounded-[40px] bg-secondary-50 flex items-center justify-center border border-secondary-100 uppercase overflow-hidden relative group-hover:border-primary-200 transition-colors">
                                    {isUploadingAvatar ? (
                                        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                                    ) : avatarDoc?.contentUrl ? (
                                        <img src={`${BASE_URL}${avatarDoc.contentUrl}`} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                    ) : (
                                        <span className="text-6xl font-black text-secondary-200 tracking-tighter">
                                            {employee.firstName?.[0]}{employee.lastName?.[0]}
                                        </span>
                                    )}
                                    <div className="absolute inset-0 bg-primary-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                                        <Upload className="w-8 h-8 text-white scale-90 group-hover:scale-100 transition-transform" />
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="pt-20 pb-10 pl-64 pr-12 flex items-end justify-between min-h-[160px]">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <h1 className="text-4xl lg:text-5xl font-black text-secondary-900 uppercase tracking-tighter leading-none">
                                {employee.firstName} <span className="text-primary-600">{employee.lastName}</span>
                            </h1>
                            <p className="text-xs font-black text-secondary-400 uppercase tracking-[0.3em]">Collaborateur ARCA</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-2">
                            <div className="flex items-center gap-2.5 px-4 py-2 bg-primary-50 rounded-2xl border border-primary-100/50">
                                <Briefcase className="w-4 h-4 text-primary-600" />
                                <span className="text-[11px] font-black text-primary-800 uppercase tracking-widest">{positionsMap[employee.position] || employee.position}</span>
                            </div>
                            <div className="flex items-center gap-2.5 px-4 py-2 bg-secondary-50 rounded-2xl border border-secondary-100/50">
                                <Building2 className="w-4 h-4 text-secondary-600" />
                                <span className="text-[11px] font-black text-secondary-700 uppercase tracking-widest">{departmentsMap[employee.department] || employee.department}</span>
                            </div>
                            <div className="flex items-center gap-2 text-secondary-400 font-bold uppercase tracking-widest text-[10px]">
                                <Calendar className="w-4 h-4 text-primary-400" />
                                Depuis le {employee.hireDate ? format(new Date(employee.hireDate), 'dd MMMM yyyy', { locale: fr }) : '-'}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Side Info - Summary */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Status inline badge - compact */}
                    <div className={cn(
                        "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border w-fit shadow-sm transition-all hover:shadow-md",
                        status.bg
                    )}>
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            status.dot
                        )} />
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            status.bg.includes('text-') ? "" : "text-secondary-700" // Fallback if needed, but status.bg usually includes text color
                        )}>
                            {status.label}
                        </span>
                    </div>

                    {/* Contact Card */}
                    <Card className="border-none shadow-xl shadow-secondary-100 bg-white rounded-[32px] overflow-hidden border border-secondary-100/50">
                        <div className="p-6 space-y-6">
                            <label className="text-[9px] font-black text-secondary-400 uppercase tracking-[0.3em] block">Coordonnées</label>

                            {/* Email */}
                            <div className="group">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0 group-hover:bg-primary-600 transition-all duration-300">
                                        <Mail className="w-4 h-4 text-primary-600 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest mb-1">Email Professionnel</p>
                                        <a href={`mailto:${employee.email}`} className="text-xs font-bold text-secondary-900 lowercase break-all hover:text-primary-600 transition-colors">
                                            {employee.email}
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="group">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 transition-all duration-300">
                                        <Phone className="w-4 h-4 text-emerald-600 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest mb-1">Mobile / WhatsApp</p>
                                        <a href={`tel:${employee.phone}`} className="text-xs font-bold text-secondary-900 hover:text-emerald-600 transition-colors tracking-wide">
                                            {employee.phone}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Department */}
                        <div className="mx-4 mb-4">
                            <div className="p-4 bg-gradient-to-br from-primary-600 to-primary-900 rounded-2xl text-white shadow-lg shadow-primary-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <Building2 className="w-4 h-4 text-primary-200" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary-200">Unité de Gestion</p>
                                </div>
                                <p className="font-black text-white uppercase text-sm tracking-tight leading-tight">
                                    {departmentsMap[employee.department] || employee.department}
                                </p>
                                <p className="text-[9px] font-bold text-primary-300 uppercase tracking-widest mt-1">ARCA Administration</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Side - Dynamic Content with Tabs */}
                <div className="lg:col-span-3">
                    <TabsProvider defaultIndex={0}>
                        <div className="mb-6 bg-white p-1.5 rounded-3xl shadow-sm border border-secondary-100">
                            <TabsList className="bg-transparent border-none gap-0.5 flex w-full">
                                <TabsTrigger className="flex-1 rounded-2xl px-3 py-2.5 data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary-200 font-black uppercase tracking-wider text-[10px] transition-all">Général</TabsTrigger>
                                <TabsTrigger className="flex-1 rounded-2xl px-3 py-2.5 data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary-200 font-black uppercase tracking-wider text-[10px] transition-all">Poste</TabsTrigger>
                                <TabsTrigger className="flex-1 rounded-2xl px-3 py-2.5 data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary-200 font-black uppercase tracking-wider text-[10px] transition-all">Contrats</TabsTrigger>
                                <TabsTrigger className="flex-1 rounded-2xl px-3 py-2.5 data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary-200 font-black uppercase tracking-wider text-[10px] transition-all">Expériences</TabsTrigger>
                                <TabsTrigger className="flex-1 rounded-2xl px-3 py-2.5 data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary-200 font-black uppercase tracking-wider text-[10px] transition-all">Historique</TabsTrigger>
                                <TabsTrigger className="flex-1 rounded-2xl px-3 py-2.5 data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary-200 font-black uppercase tracking-wider text-[10px] transition-all">Documents</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsPanels>
                            <TabsContent>
                                <Card className="border-none shadow-xl shadow-secondary-100 bg-white rounded-[40px] overflow-hidden border border-secondary-100/50">
                                    <CardHeader className="p-8 border-b border-secondary-50 bg-secondary-50/20">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-secondary-100">
                                                <User className="w-6 h-6 text-primary-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-black text-secondary-900 uppercase tracking-widest leading-none mb-1">Données de l'individu</CardTitle>
                                                <CardDescription className="text-[10px] font-bold uppercase text-secondary-400 tracking-wider">Informations administratives et état civil</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                        <DetailItem icon={Globe} label="Nationalité" value={employee.nationality} />
                                        <DetailItem
                                            icon={Heart}
                                            label="Sexe"
                                            value={employee.gender === 'M' ? 'Masculin' : employee.gender === 'F' ? 'Féminin' : 'Autre'}
                                        />
                                        <DetailItem
                                            icon={CalendarDays}
                                            label="Date de Naissance"
                                            value={employee.birthDate ? format(new Date(employee.birthDate), 'dd MMMM yyyy', { locale: fr }) : '-'}
                                        />
                                        <DetailItem
                                            icon={Shield}
                                            label="Situation Matrimoniale"
                                            value={employee.maritalStatus === 'SINGLE' ? 'Célibataire' : employee.maritalStatus === 'MARRIED' ? 'Marié(e)' : employee.maritalStatus === 'DIVORCED' ? 'Divorcé(e)' : employee.maritalStatus}
                                        />
                                        <DetailItem icon={MapPin} label="Résidence" value="Kinshasa, RD Congo" />
                                        <DetailItem icon={FileCheck} label="Numéro Employé" value={employee.employeeNumber} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent>
                                <Card className="border-none shadow-xl shadow-secondary-100 bg-white rounded-[40px] overflow-hidden border border-secondary-100/50">
                                    <CardHeader className="p-8 border-b border-secondary-50 bg-secondary-50/20">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-secondary-100">
                                                <Briefcase className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-black text-secondary-900 uppercase tracking-widest leading-none mb-1">Parcours Professionnel</CardTitle>
                                                <CardDescription className="text-[10px] font-bold uppercase text-secondary-400 tracking-wider">Détails de la fonction et affectation</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                            <DetailItem icon={Briefcase} label="Poste Actuel" value={positionsMap[employee.position] || employee.position} />
                                            <DetailItem icon={Building2} label="Département" value={departmentsMap[employee.department] || employee.department} />
                                            <DetailItem icon={CalendarDays} label="Date d'intégration" value={employee.hireDate ? format(new Date(employee.hireDate), 'dd MMMM yyyy', { locale: fr }) : '-'} />
                                            <DetailItem icon={Activity} label="Status RH" value={status.label} />
                                        </div>

                                        <div className="pt-8 border-t border-secondary-50">
                                            <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-4 block">Ligne Hiérarchique</label>
                                            {managerDetails ? (
                                                <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 shadow-sm group hover:shadow-md transition-all duration-300">
                                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-indigo-100 group-hover:scale-110 transition-transform">
                                                        <UserCircle2 className="w-6 h-6 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-secondary-900 uppercase text-xs">{managerDetails.name}</p>
                                                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mt-0.5">
                                                            {managerDetails.position ? (positionsMap[managerDetails.position] || managerDetails.position) : 'Manager'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4 p-5 bg-secondary-50/50 rounded-2xl border border-secondary-100/50 italic grayscale group hover:grayscale-0 transition-all cursor-help">
                                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-secondary-100">
                                                        <UserCircle2 className="w-6 h-6 text-secondary-300" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-secondary-400 uppercase text-xs">Manager non assigné</p>
                                                        <p className="text-[10px] font-bold text-secondary-300 uppercase tracking-wider mb-3">Aucun responsable identifié</p>
                                                        <Button
                                                            onClick={openAssignModal}
                                                            variant="outline"
                                                            className="h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest border-secondary-200 text-secondary-600 hover:bg-secondary-50 hover:text-primary-600 transition-all border-dashed"
                                                        >
                                                            <Plus className="w-3.5 h-3.5 mr-2" />
                                                            Assigner un manager
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent>
                                <Card className="border-none shadow-xl shadow-secondary-100 bg-white rounded-[40px] overflow-hidden border border-secondary-100/50">
                                    <CardHeader className="p-8 border-b border-secondary-50 bg-secondary-50/20">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-secondary-100">
                                                <FileText className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-black text-secondary-900 uppercase tracking-widest leading-none mb-1">Contrats de l'employé</CardTitle>
                                                <CardDescription className="text-[10px] font-bold uppercase text-secondary-400 tracking-wider">Historique et détails des engagements contractuels</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-secondary-50/50 border-b border-secondary-100">
                                                    <tr>
                                                        <th className="px-8 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Type</th>
                                                        <th className="px-8 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Date Début</th>
                                                        <th className="px-8 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Date Fin</th>
                                                        <th className="px-8 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Salaire</th>
                                                        <th className="px-8 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Statut</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-secondary-50">
                                                    {contracts.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-8 py-10 text-center text-secondary-400 font-medium italic">
                                                                Aucun contrat trouvé pour cet employé.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        contracts.map((contract) => (
                                                            <tr key={contract.id} className="hover:bg-secondary-50/50 transition-colors">
                                                                <td className="px-8 py-5">
                                                                    <Badge variant="outline" className="font-black text-[10px] uppercase border-secondary-200">
                                                                        {contract.type}
                                                                    </Badge>
                                                                </td>
                                                                <td className="px-8 py-5 text-xs font-bold text-secondary-600">
                                                                    {contract.startDate ? format(new Date(contract.startDate), 'dd MMM yyyy', { locale: fr }) : '-'}
                                                                </td>
                                                                <td className="px-8 py-5 text-xs font-bold text-secondary-400 italic">
                                                                    {contract.endDate ? format(new Date(contract.endDate), 'dd MMM yyyy', { locale: fr }) : 'Indéfini'}
                                                                </td>
                                                                <td className="px-8 py-5 text-xs font-bold text-emerald-700">
                                                                    {contract.salary} <span className="text-[10px] text-secondary-400 ml-1">CDF</span>
                                                                </td>
                                                                <td className="px-8 py-5">
                                                                    <Badge className="font-black text-[9px] uppercase tracking-widest py-1 px-3 rounded-full bg-secondary-100 text-secondary-600 border-none">
                                                                        {contract.status}
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Experiences & Skills Tab */}
                            <TabsContent>
                                <div className="space-y-8">
                                    {/* Experiences Section */}
                                    <Card className="border-none shadow-xl shadow-secondary-100 bg-white rounded-[40px] overflow-hidden border border-secondary-100/50">
                                        <CardHeader className="p-8 border-b border-secondary-50 bg-secondary-50/20">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-secondary-100">
                                                        <Briefcase className="w-6 h-6 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-sm font-black text-secondary-900 uppercase tracking-widest leading-none mb-1">Expériences Probantes</CardTitle>
                                                        <CardDescription className="text-[10px] font-bold uppercase text-secondary-400 tracking-wider">Parcours professionnel antérieur et interne</CardDescription>
                                                    </div>
                                                </div>
                                                <Button onClick={() => setIsExpModalOpen(true)} className="gap-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-200 uppercase text-[10px] font-black tracking-widest h-10 px-5">
                                                    <Plus className="w-4 h-4" /> Ajouter
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-8">
                                            <div className="space-y-6">
                                                {workExperiences.length === 0 ? (
                                                    <p className="text-center py-10 text-secondary-400 font-medium italic">Aucune expérience enregistrée.</p>
                                                ) : (
                                                    workExperiences.map((exp, idx) => (
                                                        <div key={exp.id || idx} className="flex gap-6 relative">
                                                            {idx !== workExperiences.length - 1 && (
                                                                <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-secondary-100" />
                                                            )}
                                                            <div className="w-10 h-10 rounded-full bg-secondary-50 border-2 border-white shadow-sm flex items-center justify-center shrink-0 z-10">
                                                                <Building2 className="w-4 h-4 text-secondary-400" />
                                                            </div>
                                                            <div className="flex-1 pb-8">
                                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                                                    <h4 className="text-base font-black text-secondary-900 uppercase tracking-tight">{exp.position}</h4>
                                                                    <Badge variant={exp.isInternal ? "success" : "outline"} className="w-fit text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                                                                        {exp.isInternal ? "Interne ARCA" : "Externe"}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-sm font-bold text-primary-600 mb-2">{exp.company}</p>
                                                                <div className="flex items-center gap-4 text-xs font-bold text-secondary-400 mb-3">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Calendar className="w-3.5 h-3.5" />
                                                                        {exp.startDate ? format(new Date(exp.startDate), 'MMM yyyy', { locale: fr }) : '-'} — {exp.endDate ? format(new Date(exp.endDate), 'MMM yyyy', { locale: fr }) : 'Présent'}
                                                                    </div>
                                                                </div>
                                                                {exp.description && (
                                                                    <p className="text-sm text-secondary-500 font-medium leading-relaxed bg-secondary-50/50 p-4 rounded-2xl border border-secondary-100/50">
                                                                        {exp.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Skills Section */}
                                    <Card className="border-none shadow-xl shadow-secondary-100 bg-white rounded-[40px] overflow-hidden border border-secondary-100/50">
                                        <CardHeader className="p-8 border-b border-secondary-50 bg-secondary-50/20">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-secondary-100">
                                                        <Activity className="w-6 h-6 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-sm font-black text-secondary-900 uppercase tracking-widest leading-none mb-1">Compétences Clés</CardTitle>
                                                        <CardDescription className="text-[10px] font-bold uppercase text-secondary-400 tracking-wider">Matrice de compétences et niveaux de maîtrise</CardDescription>
                                                    </div>
                                                </div>
                                                <Button onClick={() => setIsSkillModalOpen(true)} className="gap-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-200 uppercase text-[10px] font-black tracking-widest h-10 px-5">
                                                    <Plus className="w-4 h-4" /> Ajouter
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {skills.length === 0 ? (
                                                    <p className="col-span-full text-center py-10 text-secondary-400 font-medium italic">Aucune compétence répertoriée.</p>
                                                ) : (
                                                    skills.map((skill, idx) => (
                                                        <div key={skill.id || idx} className="p-5 rounded-2xl border border-secondary-100 bg-white shadow-sm hover:shadow-md hover:border-primary-100 transition-all group">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h4 className="text-sm font-black text-secondary-900 uppercase tracking-tight truncate pr-2">{skill.name}</h4>
                                                                <Badge className={cn(
                                                                    "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border-none",
                                                                    skill.level === 'EXPERT' ? "bg-purple-100 text-purple-700" :
                                                                        skill.level === 'ADVANCED' ? "bg-emerald-100 text-emerald-700" :
                                                                            skill.level === 'INTERMEDIATE' ? "bg-blue-100 text-blue-700" :
                                                                                "bg-secondary-100 text-secondary-600"
                                                                )}>
                                                                    {skill.level}
                                                                </Badge>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-secondary-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn(
                                                                        "h-full rounded-full transition-all duration-1000",
                                                                        skill.level === 'EXPERT' ? "w-full bg-purple-500" :
                                                                            skill.level === 'ADVANCED' ? "w-3/4 bg-emerald-500" :
                                                                                skill.level === 'INTERMEDIATE' ? "w-1/2 bg-blue-500" :
                                                                                    "w-1/4 bg-secondary-400"
                                                                    )}
                                                                    style={{ width: skill.level === 'EXPERT' ? '100%' : skill.level === 'ADVANCED' ? '75%' : skill.level === 'INTERMEDIATE' ? '50%' : '25%' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Audit / History Tab */}
                            <TabsContent>
                                <Card className="border-none shadow-xl shadow-secondary-100 bg-white rounded-[40px] overflow-hidden border border-secondary-100/50">
                                    <CardHeader className="p-8 border-b border-secondary-50 bg-gradient-to-r from-secondary-50/60 to-white">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                                    <Clock className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-sm font-black text-secondary-900 uppercase tracking-widest leading-none mb-1">Journal d'Audit</CardTitle>
                                                    <CardDescription className="text-[10px] font-bold uppercase text-secondary-400 tracking-wider">Traçabilité complète du dossier</CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Dossier Actif</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        {/* Stats Row */}
                                        <div className="grid grid-cols-3 gap-4 mb-10">
                                            <div className="p-4 rounded-2xl border bg-indigo-50 border-indigo-100 text-center">
                                                <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                                                    <FileCheck className="w-4 h-4 text-indigo-600" />
                                                </div>
                                                <p className="text-sm font-black text-indigo-700">
                                                    {[
                                                        employee.createdAt,
                                                        employee.activatedAt,
                                                        employee.deactivatedAt,
                                                        employee.onLeaveAt,
                                                        employee.suspendedAt,
                                                        employee.terminatedAt,
                                                        employee.retiredAt,
                                                        employee.probationAt,
                                                        employee.managerAssignedAt
                                                    ].filter(Boolean).length}
                                                </p>
                                                <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest mt-0.5">Événements</p>
                                            </div>
                                            <div className="p-4 rounded-2xl border bg-amber-50 border-amber-100 text-center">
                                                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                                                    <CalendarDays className="w-4 h-4 text-amber-600" />
                                                </div>
                                                <p className="text-sm font-black text-amber-700">
                                                    {employee.updatedAt ? format(new Date(employee.updatedAt), 'dd MMM', { locale: fr }) : '-'}
                                                </p>
                                                <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest mt-0.5">Dernière activité</p>
                                            </div>
                                            <div className="p-4 rounded-2xl border bg-primary-50 border-primary-100 text-center">
                                                <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                                                    <UserCircle2 className="w-4 h-4 text-primary-600" />
                                                </div>
                                                <p className="text-sm font-black text-primary-700 truncate">
                                                    {employee.createdBy ? (usersMap[employee.createdBy]?.name || usersMap[employee.createdBy]?.email || employee.createdBy) : 'Système'}
                                                </p>
                                                <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest mt-0.5">Créé par</p>
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        <div className="relative space-y-0">
                                            {/* Vertical line */}
                                            <div className="absolute left-[22px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-emerald-400 via-indigo-300 to-secondary-100 rounded-full" />

                                            {/* Event 1: Creation */}
                                            <div className="flex gap-6 pb-8 relative group">
                                                <div className="relative z-10 shrink-0">
                                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform duration-300">
                                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 bg-gradient-to-br from-emerald-50 to-white p-5 rounded-3xl border border-emerald-100 shadow-sm group-hover:shadow-md transition-all duration-300">
                                                    <div className="flex items-start justify-between gap-4 mb-3">
                                                        <div>
                                                            <p className="text-xs font-black text-secondary-900 uppercase tracking-widest">Dossier Créé</p>
                                                            <p className="text-sm font-medium text-secondary-500 mt-1">
                                                                Initialisé via le portail Admin ARCA par{' '}
                                                                <span className="font-black text-secondary-800">
                                                                    {usersMap[employee.createdBy]?.name || usersMap[employee.createdBy]?.email || employee.createdBy || 'Système'}
                                                                </span>
                                                            </p>
                                                        </div>
                                                        <span className="shrink-0 px-3 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-200">
                                                            Création
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-3 border-t border-emerald-100">
                                                        <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                                                            {employee.createdAt ? format(new Date(employee.createdAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr }) : '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Event 2: Last update */}
                                            {employee.updatedAt && employee.updatedAt !== employee.createdAt && (
                                                <div className="flex gap-6 pb-8 relative group">
                                                    <div className="relative z-10 shrink-0">
                                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform duration-300">
                                                            <Edit2 className="w-5 h-5 text-white" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 bg-gradient-to-br from-indigo-50 to-white p-5 rounded-3xl border border-indigo-100 shadow-sm group-hover:shadow-md transition-all duration-300">
                                                        <div className="flex items-start justify-between gap-4 mb-3">
                                                            <div>
                                                                <p className="text-xs font-black text-secondary-900 uppercase tracking-widest">Dossier Mis à Jour</p>
                                                                <p className="text-sm font-medium text-secondary-500 mt-1">
                                                                    Modification des données du dossier employé
                                                                </p>
                                                            </div>
                                                            <span className="shrink-0 px-3 py-1 bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-widest rounded-full border border-indigo-200">
                                                                Mise à jour
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 pt-3 border-t border-indigo-100">
                                                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                                                                {format(new Date(employee.updatedAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Dynamic Audit Events */}
                                            {[
                                                { date: employee.activatedAt, by: employee.activatedBy, label: "Dossier Activé", type: "Activation", icon: CheckCircle2, bg: "from-emerald-400 to-emerald-600", lightBg: "bg-emerald-50" },
                                                { date: employee.managerAssignedAt, by: employee.managerAssignedBy, label: "Manager Assigné", type: "Hierarchie", icon: UserCircle2, bg: "from-indigo-400 to-indigo-600", lightBg: "bg-indigo-50" },
                                                { date: employee.probationAt, by: employee.probationBy, label: "Période d'Essai", type: "RH", icon: Clock, bg: "from-amber-400 to-amber-600", lightBg: "bg-amber-50" },
                                                { date: employee.onLeaveAt, by: employee.onLeaveBy, label: "Départ en Congé", type: "Congés", icon: CalendarDays, bg: "from-blue-400 to-blue-600", lightBg: "bg-blue-50" },
                                                { date: employee.suspendedAt, by: employee.suspendedBy, label: "Dossier Suspendu", type: "Sanction", icon: AlertCircle, bg: "from-orange-400 to-orange-600", lightBg: "bg-orange-50" },
                                                { date: employee.deactivatedAt, by: employee.deactivatedBy, label: "Dossier Désactivé", type: "Statut", icon: X, bg: "from-slate-400 to-slate-600", lightBg: "bg-slate-50" },
                                                { date: employee.terminatedAt, by: employee.terminatedBy, label: "Contrat Terminé", type: "Départ", icon: Shield, bg: "from-rose-400 to-rose-600", lightBg: "bg-rose-50" },
                                                { date: employee.retiredAt, by: employee.retiredBy, label: "Départ Retraite", type: "Retraite", icon: Heart, bg: "from-purple-400 to-purple-600", lightBg: "bg-purple-50" },
                                            ].filter(ev => ev.date).sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime()).map((ev, idx) => (
                                                <div key={idx} className="flex gap-6 pb-8 relative group">
                                                    <div className="relative z-10 shrink-0">
                                                        <div className={cn("w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110", ev.bg)}>
                                                            <ev.icon className="w-5 h-5 text-white" />
                                                        </div>
                                                    </div>
                                                    <div className={cn("flex-1 p-5 rounded-3xl border shadow-sm group-hover:shadow-md transition-all duration-300 bg-gradient-to-br from-white to-white", ev.lightBg.replace('bg-', 'from-'))}>
                                                        <div className="flex items-start justify-between gap-4 mb-3">
                                                            <div>
                                                                <p className="text-xs font-black text-secondary-900 uppercase tracking-widest">{ev.label}</p>
                                                                <p className="text-sm font-medium text-secondary-500 mt-1">
                                                                    Action effectuée par <span className="font-black text-secondary-800">
                                                                        {ev.by ? (usersMap[ev.by]?.name || usersMap[ev.by]?.email || ev.by) : 'Système'}
                                                                    </span>
                                                                </p>
                                                            </div>
                                                            <span className={cn("shrink-0 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border", ev.lightBg.replace('bg-', 'bg-').replace('50', '100'), ev.lightBg.replace('bg-', 'text-').replace('50', '700'))}>
                                                                {ev.type}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 pt-3 border-t border-secondary-100">
                                                            <Calendar className="w-3.5 h-3.5 text-secondary-400" />
                                                            <p className="text-[10px] font-black text-secondary-500 uppercase tracking-wider">
                                                                {format(new Date(ev.date!), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* End state */}
                                            <div className="flex gap-6 relative">
                                                <div className="relative z-10 shrink-0">
                                                    <div className="w-11 h-11 rounded-2xl bg-secondary-100 border-2 border-dashed border-secondary-200 flex items-center justify-center">
                                                        <MoreVertical className="w-4 h-4 text-secondary-300" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 py-3">
                                                    <p className="text-[10px] font-black text-secondary-300 uppercase tracking-widest italic">
                                                        Aucun autre événement enregistré
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Documents Tab */}
                            <TabsContent>
                                <Card className="border-none shadow-xl shadow-secondary-100 bg-white rounded-[40px] overflow-hidden border border-secondary-100/50">
                                    <CardHeader className="p-8 border-b border-secondary-50 bg-secondary-50/20 flex flex-row items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-secondary-100">
                                                <FileText className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-black text-secondary-900 uppercase tracking-widest leading-none mb-1">Documents de l'employé</CardTitle>
                                                <CardDescription className="text-[10px] font-bold uppercase text-secondary-400 tracking-wider">Liste des documents liés au dossier</CardDescription>
                                            </div>
                                        </div>
                                        <Button onClick={() => setIsDocModalOpen(true)} className="gap-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-200 uppercase text-[10px] font-black tracking-widest h-10 px-5">
                                            <Plus className="w-4 h-4" /> Nouveau Document
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-secondary-50/50 border-b border-secondary-100">
                                                    <tr>
                                                        <th className="px-8 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Type</th>
                                                        <th className="px-8 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Titre</th>
                                                        <th className="px-8 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Date</th>
                                                        <th className="px-8 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-secondary-50">
                                                    {documents.filter(d => d.type !== 'PHOTO').length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="px-8 py-10 text-center text-secondary-400 font-medium italic">
                                                                Aucun document trouvé pour cet employé.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        documents.filter(d => d.type !== 'PHOTO').map((doc) => (
                                                            <tr key={doc.id} className="hover:bg-secondary-50/50 transition-colors">
                                                                <td className="px-8 py-5">
                                                                    <Badge variant="outline" className="font-black text-[10px] uppercase border-secondary-200">
                                                                        {doc.type}
                                                                    </Badge>
                                                                </td>
                                                                <td className="px-8 py-5 text-xs font-bold text-secondary-900">
                                                                    {doc.title || doc.documentRefNumber || 'Document sans titre'}
                                                                </td>
                                                                <td className="px-8 py-5 text-xs font-bold text-secondary-500">
                                                                    {doc.createdAt ? format(new Date(doc.createdAt), 'dd MMM yyyy', { locale: fr }) : '-'}
                                                                </td>
                                                                <td className="px-8 py-5 text-right flex justify-end gap-2">
                                                                    {doc.contentUrl && (
                                                                        <Button onClick={() => setPreviewDocUrl(`${BASE_URL}${doc.contentUrl}`)} variant="ghost" size="icon" className="h-8 w-8 text-secondary-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                                                            <Eye className="w-4 h-4" />
                                                                        </Button>
                                                                    )}
                                                                    {doc.contentUrl && (
                                                                        <a href={`${BASE_URL}${doc.contentUrl}`} download target="_blank" rel="noreferrer">
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                                                                                <Download className="w-4 h-4" />
                                                                            </Button>
                                                                        </a>
                                                                    )}
                                                                    <Button onClick={() => handleDeleteDocument(doc.id || (doc as any)['@id'])} variant="ghost" size="icon" className="h-8 w-8 text-secondary-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </TabsPanels>
                    </TabsProvider>
                </div>
            </div>
            {/* Modals */}
            {isDocModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg border-none shadow-2xl bg-white rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
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
                    <Card className="w-full max-w-lg border-none shadow-2xl bg-white rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
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

            {/* Skill Modal */}
            {isSkillModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-sm border-none shadow-2xl bg-white rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
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
                                    <Label>Nom de la compétence</Label>
                                    <Input value={skillForm.name} onChange={e => setSkillForm({ ...skillForm, name: e.target.value })} placeholder="ex: Management de projet" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Niveau de maîtrise</Label>
                                    <Select value={skillForm.level} onChange={e => setSkillForm({ ...skillForm, level: e.target.value })} required>
                                        {Object.entries(SKILL_LEVEL).map(([k, v]) => (
                                            <option key={k} value={v}>{v}</option>
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
                    <div className="relative w-full max-w-4xl h-[80vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
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
                    <Card className="w-full max-w-md border-none shadow-2xl rounded-[32px] overflow-hidden bg-white animate-in zoom-in-95 duration-300">
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
                    <Card className="w-full max-w-sm border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] rounded-[32px] overflow-hidden bg-white animate-in zoom-in-95 duration-300">
                        <CardContent className="p-8 text-center space-y-6">
                            <div className={cn(
                                "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-sm",
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
        </div>
    );
}

function DetailItem({ icon: Icon, label, value, isEmail }: any) {
    return (
        <div className="space-y-2 group">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-secondary-50 flex items-center justify-center border border-secondary-100/50 group-hover:bg-primary-50 group-hover:border-primary-100 transition-all">
                    <Icon className="w-4 h-4 text-primary-600" />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.15em] leading-none mb-1">{label}</span>
                    <p className={cn(
                        "text-[13px] font-black text-secondary-900 truncate uppercase tracking-tight",
                        isEmail && "lowercase text-secondary-700 font-bold"
                    )}>
                        {value || '-'}
                    </p>
                </div>
            </div>
        </div>
    );
}
