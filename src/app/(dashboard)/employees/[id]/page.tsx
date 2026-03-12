'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, Mail, Phone, Briefcase, Calendar, MapPin, User, Shield, Clock, Heart,
    Globe, CheckCircle2, CalendarDays, Info, MoreVertical, Edit2, Download, Loader2,
    Building2, UserCircle2, FileText, Activity, FileCheck, Eye, Trash2, Plus, X, Upload, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TabsProvider, TabsList, TabsTrigger, TabsContent, TabsPanels } from '@/components/ui/Tabs';
import { Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getEmployeeById, getDepartments, getWorkExperiencesByEmployee, getSkillsByEmployee } from '@/lib/api/employee';
import { getAllPositions } from '@/lib/api/position';
import { getContractsByEmployee } from '@/lib/api/contract';
import { getDocumentsByHolder, uploadDocument, deleteDocument } from '@/lib/api/document';
import { Employee, STATUS, Department, WorkExperience, Skill } from '@/types/employee';
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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Document Modal State
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
    const [docForm, setDocForm] = useState({ title: '', type: 'OTHER', file: null as File | null });
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

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

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                // First fetch employee to get @id for skills
                const empData = await getEmployeeById(id);
                setEmployee(empData);

                const employeeIri = empData['@id'] || `/api/employees/${id}`;

                const [deptsData, posData, contractsData, experiencesData, skillsData, documentsData] = await Promise.all([
                    getDepartments(),
                    getAllPositions(),
                    getContractsByEmployee(id),
                    getWorkExperiencesByEmployee(id),
                    getSkillsByEmployee(id),
                    getDocumentsByHolder('EMPLOYEE', id).catch(() => [])
                ]);

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
            case STATUS.INACTIVE: return { label: 'Inactif', variant: 'destructive' as const, bg: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-400' };
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
                    <Button variant="outline" className="h-11 px-6 rounded-2xl border-secondary-200 font-bold uppercase tracking-widest text-[10px] gap-2 hover:bg-white hover:text-primary-600 hover:border-primary-100 transition-all shadow-sm">
                        <Download className="w-4 h-4" />
                        Exporter Dossier
                    </Button>
                    <Link href={`/employees/${employee.id}/edit`}>
                        <Button className="h-11 px-8 rounded-2xl bg-primary-600 text-white font-bold uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary-200/50 hover:bg-primary-700 hover:shadow-primary-300/50 transition-all active:scale-[0.98]">
                            <Edit2 className="w-4 h-4" />
                            Modifier
                        </Button>
                    </Link>
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
                            <p className="text-xs font-black text-secondary-400 uppercase tracking-[0.3em]">Collaborateur MCBS</p>
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
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-xl shadow-secondary-100 bg-white rounded-[40px] overflow-hidden p-8 space-y-8 border border-secondary-100/50">
                        <div>
                            <label className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.3em] mb-6 block">Coordonnées</label>
                            <div className="space-y-5">
                                <div className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center border border-primary-100/50 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                                        <Mail className="w-4 h-4 transition-colors" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">Email Professionnel</p>
                                        <p className="text-sm font-bold text-secondary-900 truncate lowercase tracking-tight">{employee.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                                        <Phone className="w-4 h-4 text-emerald-600 group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">Mobile / WhatsApp</p>
                                        <p className="text-sm font-bold text-secondary-900 tracking-tight">{employee.phone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-secondary-50">
                            <label className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.3em] mb-4 block">Unité de Gestion</label>
                            <div className="p-5 bg-gradient-to-br from-secondary-50 to-white rounded-3xl border border-secondary-100 shadow-sm">
                                <p className="font-black text-primary-900 uppercase text-xs tracking-tight mb-1">
                                    {departmentsMap[employee.department] || employee.department}
                                </p>
                                <p className="text-[10px] font-bold text-secondary-400 uppercase">MCBS Africa Division</p>
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
                                            <div className="flex items-center gap-4 p-5 bg-secondary-50/50 rounded-2xl border border-secondary-100/50 italic grayscale group hover:grayscale-0 transition-all cursor-help">
                                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-secondary-100">
                                                    <UserCircle2 className="w-6 h-6 text-secondary-300" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-secondary-400 uppercase text-xs">Manager non assigné</p>
                                                    <p className="text-[10px] font-bold text-secondary-300 uppercase tracking-wider">Aucun responsable identifié dans le dashboard</p>
                                                </div>
                                            </div>
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
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-secondary-100">
                                                    <Briefcase className="w-6 h-6 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-sm font-black text-secondary-900 uppercase tracking-widest leading-none mb-1">Expériences Probantes</CardTitle>
                                                    <CardDescription className="text-[10px] font-bold uppercase text-secondary-400 tracking-wider">Parcours professionnel antérieur et interne</CardDescription>
                                                </div>
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
                                                                        {exp.isInternal ? "Interne MCBS" : "Externe"}
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
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-secondary-100">
                                                    <Activity className="w-6 h-6 text-amber-600" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-sm font-black text-secondary-900 uppercase tracking-widest leading-none mb-1">Compétences Clés</CardTitle>
                                                    <CardDescription className="text-[10px] font-bold uppercase text-secondary-400 tracking-wider">Matrice de compétences et niveaux de maîtrise</CardDescription>
                                                </div>
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
                                    <CardHeader className="p-8 border-b border-secondary-50 bg-secondary-50/20">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-secondary-100">
                                                <Clock className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-black text-secondary-900 uppercase tracking-widest leading-none mb-1">Journal d'Audit</CardTitle>
                                                <CardDescription className="text-[10px] font-bold uppercase text-secondary-400 tracking-wider">Historique des modifications du dossier</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <div className="relative pl-8 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-secondary-50 before:rounded-full">
                                            <div className="relative">
                                                <div className="absolute -left-[35px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                                                <div>
                                                    <p className="text-xs font-black text-secondary-900 uppercase tracking-widest mb-1">Création initiale</p>
                                                    <p className="text-sm font-medium text-secondary-600">Le dossier a été initialisé via le portail Admin par <span className="font-bold text-secondary-900">USP ({employee.createdBy || 'Unknown'})</span></p>
                                                    <p className="text-[10px] font-bold text-emerald-600 mt-2 uppercase tracking-tighter">
                                                        {employee.createdAt ? format(new Date(employee.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr }) : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="relative opacity-40 italic">
                                                <div className="absolute -left-[35px] top-1 w-3.5 h-3.5 rounded-full bg-secondary-300 border-4 border-white shadow-sm" />
                                                <div>
                                                    <p className="text-xs font-black text-secondary-400 uppercase tracking-widest mb-1 italic">Aucune modification ultérieure</p>
                                                    <p className="text-[10px] font-bold text-secondary-300 mt-2 uppercase tracking-tighter italic">Dossier en état initial</p>
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
