'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Calendar,
    Save,
    X,
    Loader2,
    Briefcase,
    FileText,
    User,
    Clock,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { getAllEmployees } from '@/lib/api/employee';
import { createLeaveRequest } from '@/lib/api/leave';
import { Employee } from '@/types/employee';
import { LEAVE_TYPE, LEAVE_STATUS, LeaveType, LeaveStatus } from '@/types/leave';

export default function CreateLeaveRequestPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingEmployees, setIsFetchingEmployees] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<{
        employee: string;
        type: LeaveType;
        startDate: string;
        endDate: string;
        numberOfDays: number;
        status: LeaveStatus;
        reason: string;
    }>({
        employee: '',
        type: 'ANNUAL',
        startDate: '',
        endDate: '',
        numberOfDays: 1,
        status: 'PENDING',
        reason: ''
    });

    useEffect(() => {
        async function fetchEmployees() {
            try {
                const data = await getAllEmployees();
                const emps = Array.isArray(data) ? data : data['hydra:member'] || [];
                setEmployees(emps);
            } catch (err) {
                console.error('Failed to fetch employees:', err);
            } finally {
                setIsFetchingEmployees(false);
            }
        }
        fetchEmployees();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'numberOfDays' ? parseInt(value) || 0 : value
        } as typeof prev));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Format dates to ISO as required by the payload example
            const payload = {
                ...formData,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
            };

            await createLeaveRequest(payload);
            router.push('/leave');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la création de la demande de congé.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
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
                <div>
                    <h1 className="text-2xl font-black text-secondary-900 uppercase tracking-tighter">Nouvelle Demande de Congé</h1>
                    <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest italic text-xs font-bold uppercase tracking-widest text-secondary-400">Planification des absences & gestion des soldes</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-none shadow-2xl shadow-secondary-200/50 overflow-hidden rounded-3xl">
                    <CardHeader className="bg-secondary-50/50 border-b border-secondary-100 p-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
                                <Calendar className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-secondary-900 uppercase tracking-tight">Paramètres du Congé</CardTitle>
                                <CardDescription className="font-medium">Veuillez renseigner les détails de l'absence</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        {error && (
                            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-2xl text-destructive text-sm font-bold flex items-center gap-3">
                                <X className="w-5 h-5" />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2 group">
                                <label className="flex items-center gap-2 text-xs font-black text-secondary-400 uppercase tracking-widest ml-1 pointer-events-none group-focus-within:text-primary-600 transition-colors">
                                    <User className="w-3.5 h-3.5" />
                                    Collaborateur
                                </label>
                                <select
                                    required
                                    name="employee"
                                    value={formData.employee}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 bg-secondary-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Sélectionnez un employé...</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2 group">
                                <label className="flex items-center gap-2 text-xs font-black text-secondary-400 uppercase tracking-widest ml-1 pointer-events-none group-focus-within:text-primary-600 transition-colors">
                                    <Clock className="w-3.5 h-3.5" />
                                    Type de Congé
                                </label>
                                <select
                                    required
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 bg-secondary-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all appearance-none cursor-pointer"
                                >
                                    <option value="ANNUAL">Congé Annuel</option>
                                    <option value="SICK">Maladie</option>
                                    <option value="MAT">Maternité</option>
                                    <option value="PAT">Paternité</option>
                                    <option value="UNPAID">Congé Sabatique / Sans Solde</option>
                                    <option value="OTHER">Autre</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2 group">
                                <label className="flex items-center gap-2 text-xs font-black text-secondary-400 uppercase tracking-widest ml-1 pointer-events-none group-focus-within:text-primary-600 transition-colors">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Date de Début
                                </label>
                                <input
                                    required
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 bg-secondary-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all"
                                />
                            </div>

                            <div className="space-y-2 group">
                                <label className="flex items-center gap-2 text-xs font-black text-secondary-400 uppercase tracking-widest ml-1 pointer-events-none group-focus-within:text-primary-600 transition-colors">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Date de Fin
                                </label>
                                <input
                                    required
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 bg-secondary-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all"
                                />
                            </div>

                            <div className="space-y-2 group">
                                <label className="flex items-center gap-2 text-xs font-black text-secondary-400 uppercase tracking-widest ml-1 pointer-events-none group-focus-within:text-primary-600 transition-colors">
                                    <Briefcase className="w-3.5 h-3.5" />
                                    Nombre de Jours
                                </label>
                                <input
                                    required
                                    type="number"
                                    name="numberOfDays"
                                    value={formData.numberOfDays}
                                    onChange={handleChange}
                                    min="1"
                                    className="w-full px-6 py-4 bg-secondary-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="flex items-center gap-2 text-xs font-black text-secondary-400 uppercase tracking-widest ml-1 pointer-events-none group-focus-within:text-primary-600 transition-colors">
                                <FileText className="w-3.5 h-3.5" />
                                Motif / Justification
                            </label>
                            <textarea
                                required
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Précisez la raison de votre demande (obligatoire)..."
                                className="w-full px-6 py-4 bg-secondary-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all placeholder:text-secondary-300 resize-none"
                            />
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-2xl border border-secondary-100">
                            <Info className="w-5 h-5 text-primary-600 shrink-0" />
                            <p className="text-[10px] font-bold text-secondary-500 uppercase leading-relaxed">
                                Le statut de cette demande sera initialement mis en <span className="text-amber-600">EN ATTENTE (PENDING)</span>. Elle devra être approuvée par un responsable RH pour être validée.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-4 overflow-hidden p-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                        className="px-8 py-6 rounded-2xl font-bold uppercase tracking-widest text-xs text-secondary-400 hover:text-secondary-900 transition-all font-bold"
                    >
                        Annuler
                    </Button>
                    <Button
                        disabled={isLoading}
                        type="submit"
                        className="px-10 py-6 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary-200 transition-all active:scale-[0.98] flex items-center gap-3 font-bold"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Soumission...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Envoyer la Demande
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
