'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Building2,
    Save,
    X,
    Loader2,
    Users,
    FileText,
    Hash
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { getAllEmployees, createDepartment } from '@/lib/api/employee';
import { Employee } from '@/types/employee';

export default function CreateDepartmentPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingEmployees, setIsFetchingEmployees] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        managerId: ''
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
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await createDepartment(formData);
            router.push('/departments');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la création du département.');
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
                    <h1 className="text-2xl font-black text-secondary-900 uppercase tracking-tighter">Nouveau Département</h1>
                    <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest italic">Définition structurelle & assignation managériale</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-none shadow-2xl shadow-secondary-200/50 overflow-hidden rounded-3xl">
                    <CardHeader className="bg-secondary-50/50 border-b border-secondary-100 p-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
                                <Building2 className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-secondary-900 uppercase tracking-tight">Identité du Pôle</CardTitle>
                                <CardDescription className="font-medium">Informations fondamentales & code structurel</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        {error && (
                            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-2xl text-destructive text-sm font-bold flex items-center gap-3">
                                <X className="w-5 h-5" />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2 group">
                                <label className="flex items-center gap-2 text-xs font-black text-secondary-400 uppercase tracking-widest ml-1 pointer-events-none group-focus-within:text-primary-600 transition-colors">
                                    <Building2 className="w-3.5 h-3.5" />
                                    Nom du Département
                                </label>
                                <input
                                    required
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Ex: Direction de la Data Science"
                                    className="w-full px-6 py-4 bg-secondary-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all placeholder:text-secondary-300"
                                />
                            </div>

                            <div className="space-y-2 group">
                                <label className="flex items-center gap-2 text-xs font-black text-secondary-400 uppercase tracking-widest ml-1 pointer-events-none group-focus-within:text-primary-600 transition-colors">
                                    <Hash className="w-3.5 h-3.5" />
                                    Code Structurel
                                </label>
                                <input
                                    required
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    placeholder="Ex: IT-DATA-2024"
                                    className="w-full px-6 py-4 bg-secondary-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all placeholder:text-secondary-300 uppercase"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="flex items-center gap-2 text-xs font-black text-secondary-400 uppercase tracking-widest ml-1 pointer-events-none group-focus-within:text-primary-600 transition-colors">
                                <Users className="w-3.5 h-3.5" />
                                Responsable (Manager)
                            </label>
                            <select
                                name="managerId"
                                value={formData.managerId}
                                onChange={handleChange}
                                className="w-full px-6 py-4 bg-secondary-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Choisir un manager...</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.firstName} {emp.lastName} ({emp.position || 'Sans poste'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2 group">
                            <label className="flex items-center gap-2 text-xs font-black text-secondary-400 uppercase tracking-widest ml-1 pointer-events-none group-focus-within:text-primary-600 transition-colors">
                                <FileText className="w-3.5 h-3.5" />
                                Mission & Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Décrivez les objectifs et les responsabilités de ce département..."
                                className="w-full px-6 py-4 bg-secondary-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all placeholder:text-secondary-300 resize-none"
                            />
                        </div>
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
                        disabled={isLoading}
                        type="submit"
                        className="px-10 py-6 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary-200 transition-all active:scale-[0.98] flex items-center gap-3"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Création...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Valider la Structure
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
