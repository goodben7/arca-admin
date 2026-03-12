'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Save,
    User,
    Briefcase,
    Info,
    Loader2,
    AlertCircle,
    FileText,
    Activity,
    Mail,
    Phone,
    MapPin,
    CalendarDays,
    Globe,
    UserCircle,
    Hash,
    Building2,
    CheckCircle2,
    ChevronDown,
    Plus,
    Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import Link from 'next/link';
import { createEmployee, getDepartments, getAllEmployees, createWorkExperience, createSkill } from '@/lib/api/employee';
import { getAllPositions } from '@/lib/api/position';
import { getAllProfiles } from '@/lib/api/profile';
import { GENDER, MARITAL, STATUS, Department, Employee, SKILL_LEVEL } from '@/types/employee';
import { Position } from '@/types/position';
import { Profile } from '@/types/profile';

export default function CreateEmployeePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState(1);
    const totalSteps = 3;

    const [departments, setDepartments] = useState<Department[]>([]);
    const [managers, setManagers] = useState<Employee[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: GENDER.MALE as any,
        birthDate: '',
        nationality: '',
        maritalStatus: MARITAL.SINGLE as any,
        address: '',
        department: '',
        position: '',
        managerId: '',
        employeeNumber: '',
        profile: '',
        hireDate: new Date().toISOString().split('T')[0],
        status: STATUS.ACTIVE as any,
        departureDate: ''
    });

    // Experiences state
    const [experiences, setExperiences] = useState<any[]>([]);

    // Skills state
    const [skills, setSkills] = useState<any[]>([]);

    const addExperience = () => {
        setExperiences([...experiences, {
            company: '',
            position: '',
            startDate: '',
            endDate: '',
            description: '',
            isInternal: false
        }]);
    };

    const removeExperience = (index: number) => {
        setExperiences(experiences.filter((_, i) => i !== index));
    };

    const updateExperience = (index: number, field: string, value: any) => {
        const newExps = [...experiences];
        newExps[index] = { ...newExps[index], [field]: value };
        setExperiences(newExps);
    };

    const addSkill = () => {
        setSkills([...skills, { name: '', level: SKILL_LEVEL.BEGINNER as any }]);
    };

    const removeSkill = (index: number) => {
        setSkills(skills.filter((_, i) => i !== index));
    };

    const updateSkill = (index: number, field: string, value: any) => {
        const newSkills = [...skills];
        newSkills[index] = { ...newSkills[index], [field]: value };
        setSkills(newSkills);
    };

    useEffect(() => {
        async function loadData() {
            try {
                const [deptsData, empsData, posData, profData] = await Promise.all([
                    getDepartments(),
                    getAllEmployees(),
                    getAllPositions(),
                    getAllProfiles()
                ]);

                const depts = Array.isArray(deptsData) ? deptsData : deptsData['hydra:member'] || [];
                const emps = Array.isArray(empsData) ? empsData : empsData['hydra:member'] || [];
                const pos = Array.isArray(posData) ? posData : (posData as any)['hydra:member'] || (posData as any)['member'] || [];
                const profs = Array.isArray(profData) ? profData : (profData as any)['hydra:member'] || (profData as any)['member'] || [];

                setDepartments(depts);
                setManagers(emps);
                setPositions(pos);
                setProfiles(profs);
            } catch (err) {
                console.error('Erreur chargement données:', err);
                setError('Impossible de charger les listes de départements ou de managers.');
            } finally {
                setIsFetching(false);
            }
        }
        loadData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // 1. Sécurité : Ne pas soumettre l'API si on n'est pas au dernier step
        if (activeStep < totalSteps) {
            setActiveStep(prev => prev + 1);
            return;
        }

        if (activeStep !== 3 || isLoading) return;

        setIsLoading(true);
        setError(null);

        const formatDate = (d: string) => {
            if (!d) return undefined;
            const date = new Date(d);
            return isNaN(date.getTime()) ? undefined : date.toISOString();
        };

        try {
            console.log("Étape 1: Création de l'employé...");

            const payload = {
                ...formData,
                birthDate: formatDate(formData.birthDate),
                hireDate: formatDate(formData.hireDate),
                departureDate: formatDate(formData.departureDate),
                profile: formData.profile || undefined,
            };

            const newEmployee = await createEmployee(payload as any);
            console.log("Employé créé:", newEmployee);

            // 2. Identification de l'ID pour les relations 
            // On cherche le matricule (employeeNumber) ou l'ID technique
            const targetId = (newEmployee as any).id || (newEmployee as any).employeeNumber || formData.employeeNumber || (newEmployee as any)['@id']?.split('/').pop();

            if (!targetId) {
                console.error("Réponse serveur sans ID:", newEmployee);
                throw new Error("L'employé a été créé mais son identifiant n'a pas pu être récupéré.");
            }

            console.log(`Utilisation de l'ID ${targetId} pour les données liées.`);

            // 3. Créer les expériences professionnelles (Séquentiellement)
            const validExps = experiences.filter(exp => exp.company?.trim() && exp.position?.trim());
            console.log(`Enregistrement de ${validExps.length} expériences pour ${targetId}`);
            for (const exp of validExps) {
                const expPayload = {
                    company: exp.company.trim(),
                    position: exp.position.trim(),
                    startDate: formatDate(exp.startDate) || new Date().toISOString(),
                    endDate: formatDate(exp.endDate),
                    description: exp.description?.trim(),
                    isInternal: exp.isInternal,
                    employeeId: targetId
                };
                await createWorkExperience(expPayload as any);
            }

            // 4. Créer les compétences (Séquentiellement)
            const validSkills = skills.filter(skill => skill.name?.trim());
            console.log(`Enregistrement de ${validSkills.length} compétences pour ${targetId}`);
            for (const skill of validSkills) {
                const skillPayload = {
                    employee: targetId,
                    name: skill.name.trim(),
                    level: skill.level
                };
                console.log("POST /api/skills:", skillPayload);
                await createSkill(skillPayload as any);
            }

            console.log("Tout a été enregistré avec succès !");
            router.push('/employees');
        } catch (err: any) {
            console.error('Erreur lors de la création complète:', err);
            let message = err.message || 'Une erreur est survenue';

            if (message.includes('Duplicate entry') && message.includes('UNIQ_USER_EMAIL')) {
                message = "Désolé, cette adresse email est déjà utilisée par un autre employé.";
            } else if (message.includes('SQLSTATE[23000]')) {
                message = "Une contrainte d'intégrité a été violée (doublon possible).";
            }

            setError(message);
            setIsLoading(false);
        }
    }

    if (isFetching) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-secondary-400">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                <p className="font-bold uppercase tracking-widest text-xs">Chargement des référentiels...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/employees">
                        <Button variant="outline" size="icon" className="h-10 w-10 border-none bg-white shadow-sm hover:scale-110 active:scale-95 transition-all">
                            <ChevronLeft className="w-5 h-5 text-secondary-600" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-900 uppercase tracking-tighter">Nouvel Employé</h1>
                        <p className="text-secondary-500 font-medium italic">Enregistrez un nouveau membre dans l'organisation.</p>
                    </div>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-0 bg-white/80 backdrop-blur-md p-1.5 rounded-[24px] shadow-sm border border-secondary-100">
                    {[
                        { step: 1, label: 'PERSONNEL' },
                        { step: 2, label: 'PROFESSIONNEL' },
                        { step: 3, label: 'EXPÉRIENCE' }
                    ].map((s, idx) => (
                        <div key={s.step} className="flex items-center">
                            <button
                                type="button"
                                onClick={() => activeStep > s.step && setActiveStep(s.step)}
                                className={cn(
                                    "flex items-center gap-2.5 px-4 py-2.5 rounded-[18px] transition-all duration-300",
                                    activeStep === s.step
                                        ? "bg-secondary-900 text-white shadow-lg shadow-secondary-200"
                                        : activeStep > s.step
                                            ? "text-emerald-600 hover:bg-emerald-50"
                                            : "text-secondary-400 opacity-60"
                                )}
                            >
                                <div className={cn(
                                    "w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px]",
                                    activeStep === s.step
                                        ? "bg-white/20"
                                        : activeStep > s.step
                                            ? "bg-emerald-100"
                                            : "bg-secondary-100"
                                )}>
                                    {activeStep > s.step ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.step}
                                </div>
                                <span className="text-[10px] font-black tracking-[0.1em]">{s.label}</span>
                            </button>
                            {idx < 2 && <div className="w-8 h-[2px] bg-secondary-100/50 mx-1 rounded-full" />}
                        </div>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-4 animate-in fade-in zoom-in-95">
                        <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                        <p className="text-sm text-destructive font-bold">{error}</p>
                    </div>
                )}

                {/* Step 1: Personal Information */}
                {activeStep === 1 && (
                    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-secondary-900 text-white flex items-center justify-center shadow-lg shadow-secondary-200">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-secondary-900 uppercase tracking-tighter">Informations Personnelles</h2>
                                <p className="text-xs text-secondary-500 font-medium">Identité et coordonnées de l'employé.</p>
                            </div>
                        </div>

                        <Card className="border-none shadow-2xl shadow-secondary-200/40 bg-white/80 backdrop-blur-xl rounded-[32px] overflow-hidden">
                            <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Prénom</Label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-600 transition-colors">
                                            <UserCircle className="w-5 h-5" />
                                        </div>
                                        <Input id="firstName" value={formData.firstName} onChange={handleChange} placeholder="ex: Jean" required
                                            className="h-14 pl-12 bg-secondary-50/50 border-secondary-100 rounded-2xl focus:bg-white transition-all font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Nom</Label>
                                    <Input id="lastName" value={formData.lastName} onChange={handleChange} placeholder="ex: Dupont" required
                                        className="h-14 bg-secondary-50/50 border-secondary-100 rounded-2xl focus:bg-white transition-all font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Email Pro</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 group-focus-within:text-primary-600 transition-colors" />
                                        <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="j.dupont@mcbs-africa.com" required
                                            className="h-14 pl-12 bg-secondary-50/50 border-secondary-100 rounded-2xl focus:bg-white transition-all font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Téléphone</Label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 group-focus-within:text-primary-600 transition-colors" />
                                        <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+243 ..."
                                            className="h-14 pl-12 bg-secondary-50/50 border-secondary-100 rounded-2xl focus:bg-white transition-all font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender" className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Genre</Label>
                                    <div className="relative group">
                                        <Select id="gender" value={formData.gender} onChange={handleChange}
                                            className="h-14 bg-secondary-50/50 border-secondary-100 rounded-2xl focus:bg-white transition-all font-bold appearance-none">
                                            <option value={GENDER.MALE}>Homme</option>
                                            <option value={GENDER.FEMALE}>Femme</option>
                                            <option value={GENDER.OTHER}>Autre</option>
                                        </Select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maritalStatus" className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">État Civil</Label>
                                    <div className="relative group">
                                        <Select id="maritalStatus" value={formData.maritalStatus} onChange={handleChange}
                                            className="h-14 bg-secondary-50/50 border-secondary-100 rounded-2xl focus:bg-white transition-all font-bold appearance-none">
                                            <option value={MARITAL.SINGLE}>Célibataire</option>
                                            <option value={MARITAL.MARRIED}>Marié(e)</option>
                                            <option value={MARITAL.DIVORCED}>Divorcé(e)</option>
                                            <option value={MARITAL.WIDOWED}>Veuf/Veuve</option>
                                        </Select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="birthDate" className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Naissance</Label>
                                    <div className="relative group">
                                        <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 group-focus-within:text-primary-600 transition-colors" />
                                        <Input id="birthDate" type="date" value={formData.birthDate} onChange={handleChange}
                                            className="h-14 pl-12 bg-secondary-50/50 border-secondary-100 rounded-2xl focus:bg-white transition-all font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="nationality" className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Nationalité</Label>
                                    <div className="relative group">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 group-focus-within:text-primary-600 transition-colors" />
                                        <Input id="nationality" value={formData.nationality} onChange={handleChange} placeholder="ex: Congolaise"
                                            className="h-14 pl-12 bg-secondary-50/50 border-secondary-100 rounded-2xl focus:bg-white transition-all font-bold" />
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="address" className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Adresse complète</Label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 group-focus-within:text-primary-600 transition-colors" />
                                        <Input id="address" value={formData.address} onChange={handleChange} placeholder="Numéro, rue, code postal, ville"
                                            className="h-14 pl-12 bg-secondary-50/50 border-secondary-100 rounded-2xl focus:bg-white transition-all font-bold" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* Step 2: Professional Information */}
                {activeStep === 2 && (
                    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-secondary-900 uppercase tracking-tighter">Détails Professionnels</h2>
                                <p className="text-xs text-secondary-500 font-medium">Affectation et contrat de l'employé.</p>
                            </div>
                        </div>

                        <Card className="border-none shadow-2xl shadow-secondary-200/40 bg-white/80 backdrop-blur-xl rounded-[32px] overflow-hidden">
                            <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="employeeNumber" className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Matricule</Label>
                                    <div className="relative group">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 group-focus-within:text-emerald-600 transition-colors" />
                                        <Input id="employeeNumber" value={formData.employeeNumber} onChange={handleChange} placeholder="ex: MCBS-001"
                                            className="h-14 pl-12 bg-secondary-50/50 border-secondary-100 rounded-2xl focus:bg-white transition-all font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="department" className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Département</Label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 group-focus-within:text-emerald-600 transition-colors" />
                                        <Select id="department" value={formData.department} onChange={handleChange} required
                                            className="h-14 pl-12 bg-secondary-50/50 border-secondary-100 rounded-2xl focus:bg-white transition-all font-bold appearance-none">
                                            <option value="">Choisir un département...</option>
                                            {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                                        </Select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="position" className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Poste occupé</Label>
                                    <div className="relative group">
                                        <Select id="position" value={formData.position} onChange={handleChange} required
                                            className="h-14 bg-secondary-50/50 border-secondary-100 rounded-2xl focus:bg-white transition-all font-bold appearance-none">
                                            <option value="">Sélectionner un poste...</option>
                                            {positions.map(pos => <option key={pos.id} value={pos.id}>{pos.title}</option>)}
                                        </Select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="managerId" className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Manager Direct</Label>
                                    <div className="relative group">
                                        <Select id="managerId" value={formData.managerId} onChange={handleChange}
                                            className="h-14 bg-secondary-50/50 border-secondary-100 rounded-2xl focus:bg-white transition-all font-bold appearance-none">
                                            <option value="">Aucun manager</option>
                                            {managers.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                                        </Select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hireDate" className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Date d'embauche</Label>
                                    <div className="relative group">
                                        <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 group-focus-within:text-emerald-600 transition-colors" />
                                        <Input id="hireDate" type="date" value={formData.hireDate} onChange={handleChange} required
                                            className="h-14 pl-12 bg-secondary-50/50 border-secondary-100 rounded-2xl focus:bg-white transition-all font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Statut contrat</Label>
                                    <div className="relative group">
                                        <Select id="status" value={formData.status} onChange={handleChange} required
                                            className="h-14 bg-secondary-50/50 border-secondary-100 rounded-2xl focus:bg-white transition-all font-bold appearance-none">
                                            <option value={STATUS.ACTIVE}>Actif</option>
                                            <option value={STATUS.INACTIVE}>Sortie effective</option>
                                            <option value={STATUS.ON_LEAVE}>Absence prolongée / Congé</option>
                                        </Select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="profile" className="text-[11px] font-black text-secondary-400 uppercase tracking-widest ml-1">Profil Plateforme <span className="text-[8px] opacity-50">(Optionnel)</span></Label>
                                    <div className="relative group">
                                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 group-focus-within:text-emerald-600 transition-colors" />
                                        <Select id="profile" value={formData.profile} onChange={handleChange}
                                            className="h-14 pl-12 bg-secondary-50/50 border-secondary-100 rounded-2xl focus:bg-white transition-all font-bold appearance-none">
                                            <option value="">Aucun profil spécifié</option>
                                            {profiles.map(p => (
                                                <option key={p.id} value={(p as any)['@id'] || `/api/profiles/${p.id}`}>
                                                    {p.label}
                                                </option>
                                            ))}
                                        </Select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* Step 3: Work Experience & Skills */}
                {activeStep === 3 && (
                    <section className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Work Experiences Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-secondary-900 uppercase tracking-tighter">Expérience Probante</h2>
                                        <p className="text-xs text-secondary-500 font-medium">Parcours professionnel de l'employé.</p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={addExperience}
                                    variant="outline"
                                    className="rounded-xl border-indigo-100 text-indigo-600 hover:bg-indigo-50 font-bold gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Ajouter
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {experiences.map((exp, index) => (
                                    <Card key={index} className="border-none shadow-xl shadow-secondary-200/40 bg-white/60 backdrop-blur-sm rounded-[24px] overflow-hidden relative group">
                                        {experiences.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeExperience(index)}
                                                className="absolute top-4 right-4 p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Entreprise</Label>
                                                <Input
                                                    value={exp.company}
                                                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                                                    placeholder="ex: Google"
                                                    className="h-12 bg-white/50 border-secondary-100 rounded-xl focus:bg-white transition-all font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Poste</Label>
                                                <Input
                                                    value={exp.position}
                                                    onChange={(e) => updateExperience(index, 'position', e.target.value)}
                                                    placeholder="ex: Développeur Senior"
                                                    className="h-12 bg-white/50 border-secondary-100 rounded-xl focus:bg-white transition-all font-bold"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Date Début</Label>
                                                    <Input
                                                        type="date"
                                                        value={exp.startDate}
                                                        onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                                                        className="h-12 bg-white/50 border-secondary-100 rounded-xl focus:bg-white transition-all font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Date Fin</Label>
                                                    <Input
                                                        type="date"
                                                        value={exp.endDate}
                                                        onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                                                        className="h-12 bg-white/50 border-secondary-100 rounded-xl focus:bg-white transition-all font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 md:pt-6">
                                                <div
                                                    onClick={() => updateExperience(index, 'isInternal', !exp.isInternal)}
                                                    className={cn(
                                                        "w-10 h-6 rounded-full transition-all cursor-pointer relative",
                                                        exp.isInternal ? "bg-emerald-500" : "bg-secondary-200"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                                                        exp.isInternal ? "left-5" : "left-1"
                                                    )} />
                                                </div>
                                                <Label className="cursor-pointer text-xs font-bold text-secondary-600">Expérience interne MCBS</Label>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Skills Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-200">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-secondary-900 uppercase tracking-tighter">Compétences Clés</h2>
                                        <p className="text-xs text-secondary-500 font-medium">Expertises et savoir-faire.</p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    onClick={addSkill}
                                    variant="outline"
                                    className="rounded-xl border-amber-100 text-amber-600 hover:bg-amber-50 font-bold gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Ajouter
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {skills.map((skill, index) => (
                                    <Card key={index} className="border-none shadow-xl shadow-secondary-200/40 bg-white/60 backdrop-blur-sm rounded-[24px] overflow-hidden relative group">
                                        {skills.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeSkill(index)}
                                                className="absolute top-4 right-4 p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <CardContent className="p-6 space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Compétence</Label>
                                                <Input
                                                    value={skill.name}
                                                    onChange={(e) => updateSkill(index, 'name', e.target.value)}
                                                    placeholder="ex: Compétence technique"
                                                    className="h-12 bg-white/50 border-secondary-100 rounded-xl focus:bg-white transition-all font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Niveau</Label>
                                                <div className="relative group/select">
                                                    <Select
                                                        value={skill.level}
                                                        onChange={(e) => updateSkill(index, 'level', e.target.value as any)}
                                                        className="h-12 bg-white/50 border-secondary-100 rounded-xl focus:bg-white transition-all font-bold appearance-none"
                                                    >
                                                        <option value={SKILL_LEVEL.BEGINNER}>Débutant</option>
                                                        <option value={SKILL_LEVEL.INTERMEDIATE}>Intermédiaire</option>
                                                        <option value={SKILL_LEVEL.ADVANCED}>Avancé</option>
                                                        <option value={SKILL_LEVEL.EXPERT}>Expert</option>
                                                    </Select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Form Actions */}
                <div key={`actions-step-${activeStep}`} className="pt-10 flex items-center justify-between pb-10">
                    <div className="flex items-center gap-4">
                        {activeStep > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setActiveStep(activeStep - 1)}
                                className="h-14 px-8 rounded-2xl font-black text-secondary-400 hover:text-secondary-900 transition-all uppercase tracking-widest text-[10px]"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Précédent
                            </Button>
                        )}
                        {activeStep === 1 && (
                            <Link href="/employees">
                                <Button variant="ghost" className="h-14 px-8 rounded-2xl font-black text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all uppercase tracking-widest text-[10px]">
                                    Annuler
                                </Button>
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {activeStep < totalSteps ? (
                            <Button
                                type="button"
                                onClick={() => setActiveStep(activeStep + 1)}
                                className="h-16 px-14 rounded-[24px] bg-secondary-900 text-white font-black hover:bg-black transition-all shadow-xl shadow-secondary-200 hover:-translate-y-1 active:translate-y-0 uppercase tracking-[0.2em] text-xs"
                            >
                                Suivant
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isLoading}
                                className="h-16 px-14 rounded-[24px] bg-primary-600 text-white font-black hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 hover:-translate-y-1 active:translate-y-0 uppercase tracking-[0.2em] text-xs gap-3">
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        <span>Valider & Créer</span>
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </form>

            {/* Helper Alert */}
            <div className="flex items-start gap-4 p-4 bg-secondary-50 rounded-2xl border border-secondary-100">
                <Info className="w-5 h-5 text-secondary-400 mt-0.5 shrink-0" />
                <p className="text-sm text-secondary-500 font-medium">
                    Une fois la fiche créée, une invitation par email sera automatiquement envoyée à l'employé pour qu'il puisse compléter son profil et accéder à la plateforme.
                </p>
            </div>
        </div>
    );
}
