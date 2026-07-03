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
import { ContentPanel } from '@/components/layout/ContentPanel';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';

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
        <PageShell className="max-w-4xl mx-auto">
            <PageHeader
                title="Nouveau Département"
                description="Définition structurelle & assignation managériale"
                backHref="/departments"
            />

            <ContentPanel>
            <form onSubmit={handleSubmit} className="divide-y divide-border">
                <div className="p-6 md:p-8 panel-header-wash border-b">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-foreground">Identité du pôle</h2>
                            <p className="text-sm text-muted-foreground">Informations fondamentales et code structurel</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 md:p-8 space-y-6">
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
                </div>

                <div className="flex items-center justify-end gap-3 p-6 md:p-8 border-t border-border bg-muted/20">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        Annuler
                    </Button>
                    <Button
                        disabled={isLoading}
                        type="submit"
                        variant="pill"
                        className="gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Création...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Créer le département
                            </>
                        )}
                    </Button>
                </div>
            </form>
            </ContentPanel>
        </PageShell>
    );
}
