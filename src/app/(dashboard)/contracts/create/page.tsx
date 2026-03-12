'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    ChevronDown,
    Check,
    FileText,
    Save,
    X,
    Loader2,
    Briefcase,
    Calendar,
    DollarSign,
    User
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getAllEmployees } from '@/lib/api/employee';
import { createContract } from '@/lib/api/contract';
import { Employee } from '@/types/employee';
import { CONTRACT_TYPE } from '@/types/contract';
import { cn } from '@/lib/utils';

export default function CreateContractPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingEmployees, setIsFetchingEmployees] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        employee: '',
        type: 'CDI',
        startDate: '',
        endDate: '',
        salary: '',
        status: 'PENDING'
    });

    useEffect(() => {
        async function fetchEmployees() {
            try {
                const data = await getAllEmployees({ itemsPerPage: 100 });
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : '',
                endDate: (formData.type !== 'CDI' && formData.endDate) ? new Date(formData.endDate).toISOString() : null,
                salary: formData.salary.toString()
            };

            await createContract(payload);
            router.push('/contracts');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la création du contrat.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 rounded-2xl bg-white shadow-xl shadow-secondary-200/50 flex items-center justify-center text-secondary-400 hover:text-primary-600 hover:scale-110 transition-all active:scale-95 group"
                    >
                        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-secondary-900 uppercase tracking-tighter">Établir un contrat</h1>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                            <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Enregistrement administratif</p>
                        </div>
                    </div>
                </div>
                <Badge variant="outline" className="border-secondary-100 bg-white text-secondary-500 font-black px-4 py-1.5 rounded-full uppercase text-[9px] tracking-widest shadow-sm">
                    Mode Création
                </Badge>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <Card className="border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden rounded-[40px] bg-white">
                    <div className="p-10 space-y-10">
                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                                <X className="w-5 h-5" />
                                {error}
                            </div>
                        )}

                        {/* Top Section: Employee & Type */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Employee select */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <User className="w-3 h-3 text-primary-500" />
                                    Collaborateur
                                </label>
                                <div className="relative group">
                                    <select
                                        required
                                        name="employee"
                                        value={formData.employee}
                                        onChange={handleChange}
                                        className="w-full h-14 pl-6 pr-12 bg-secondary-50/50 border border-secondary-100 rounded-[20px] text-sm font-bold text-secondary-900 focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:bg-white focus:border-primary-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Sélectionnez l'employé...</option>
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-secondary-400 group-focus-within:text-primary-500 transition-colors">
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            {/* Contract Type Tabs */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Briefcase className="w-3 h-3 text-primary-500" />
                                    Nature du contrat
                                </label>
                                <div className="flex p-1.5 bg-secondary-50/80 rounded-[20px] border border-secondary-100/50">
                                    {Object.values(CONTRACT_TYPE).map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, type }))}
                                            className={cn(
                                                "flex-1 py-3 px-2 rounded-xl text-[10px] font-black tracking-tighter transition-all uppercase",
                                                formData.type === type
                                                    ? 'bg-white text-primary-600 shadow-lg shadow-secondary-200/50 scale-[1.02]'
                                                    : 'text-secondary-400 hover:text-secondary-600'
                                            )}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Mid Section: Dates & Salary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-secondary-50">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Calendar className="w-3 h-3 text-primary-500" />
                                    Date d'entrée
                                </label>
                                <input
                                    required
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className="w-full h-14 px-6 bg-secondary-50/50 border border-secondary-100 rounded-[20px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:bg-white focus:border-primary-500 transition-all cursor-pointer"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Calendar className="w-3 h-3 text-primary-500" />
                                    Échéance
                                </label>
                                <input
                                    disabled={formData.type === 'CDI'}
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className={cn(
                                        "w-full h-14 px-6 border border-secondary-100 rounded-[20px] text-sm font-bold focus:outline-none transition-all cursor-pointer",
                                        formData.type === 'CDI' 
                                            ? "bg-secondary-100 opacity-40 cursor-not-allowed border-dashed" 
                                            : "bg-secondary-50/50 focus:ring-4 focus:ring-primary-500/5 focus:bg-white focus:border-primary-500"
                                    )}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <DollarSign className="w-3 h-3 text-primary-500" />
                                    Salaire de base
                                </label>
                                <div className="relative group">
                                    <input
                                        required
                                        type="text"
                                        name="salary"
                                        value={formData.salary}
                                        onChange={handleChange}
                                        placeholder="Montant brut"
                                        className="w-full h-14 pl-6 pr-14 bg-secondary-50/50 border border-secondary-100 rounded-[20px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:bg-white focus:border-primary-500 transition-all placeholder:text-secondary-300"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-secondary-400 uppercase">CDF</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Selection */}
                        <div className="p-6 bg-primary-50/30 rounded-[30px] border border-primary-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary-600">
                                    <Check className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-primary-700 uppercase tracking-widest">Statut Initial</p>
                                    <p className="text-[10px] text-primary-600/70 font-bold italic">L'approbation peut être requise après validation.</p>
                                </div>
                            </div>
                            <div className="flex p-1 bg-white rounded-2xl border border-primary-100 shadow-sm">
                                {['PENDING', 'ACTIVE'].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, status: s }))}
                                        className={cn(
                                            "px-6 py-2 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest",
                                            formData.status === s
                                                ? 'bg-primary-600 text-white'
                                                : 'text-secondary-400 hover:text-secondary-600'
                                        )}
                                    >
                                        {s === 'PENDING' ? 'En attente' : 'Actif'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-6 pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                        className="px-8 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-secondary-400 hover:text-secondary-900 transition-all hover:bg-secondary-100"
                    >
                        Annuler
                    </Button>
                    <Button
                        disabled={isLoading}
                        type="submit"
                        className="px-12 h-14 rounded-[22px] bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-[0.1em] text-[10px] shadow-2xl shadow-primary-500/20 shadow-primary-200 transition-all active:scale-[0.98] flex items-center gap-4 group"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Finalisation...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Valider & Engager
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
