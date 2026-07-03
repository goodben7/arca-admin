'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Save,
    Loader2,
    Building2,
    BookOpen,
    FileText,
    Info,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Input';
import { getDepartments } from '@/lib/api/employee';
import { createTrainingRequest } from '@/lib/api/training';
import { Department } from '@/types/employee';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';

const PRIORITIES = [
    { value: 'LOW',    label: 'Faible' },
    { value: 'MEDIUM', label: 'Moyenne' },
    { value: 'HIGH',   label: 'Haute' },
];

export default function CreateTrainingRequestPage() {
    const router = useRouter();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        department: '',
        title: '',
        description: '',
        numberOfParticipants: 1,
        priority: 'LOW',
    });

    useEffect(() => {
        async function fetchData() {
            try {
                setIsFetching(true);
                const deptsData = await getDepartments();
                const depts = Array.isArray(deptsData) ? deptsData : (deptsData as any)['hydra:member'] || [];
                setDepartments(depts);
            } catch (e: any) {
                setError(e?.message || 'Erreur lors du chargement des départements.');
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
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'numberOfParticipants' ? parseInt(value, 10) || 1 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await createTrainingRequest({
                department: formData.department,
                title: formData.title,
                description: formData.description,
                numberOfParticipants: formData.numberOfParticipants,
                priority: formData.priority,
            });
            router.push('/training');
            router.refresh();
        } catch (err: any) {
            setError(err?.message || 'Erreur lors de la création de la demande.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageShell className="max-w-4xl mx-auto">
            <PageHeader
                title="Nouvelle demande de formation"
                description="Proposez une formation et justifiez votre besoin"
                backHref="/training"
            />

            {error && (
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-2xl text-destructive text-sm font-bold flex items-center gap-3">
                    <FileText className="w-5 h-5 shrink-0" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-none  shadow-sm-200/50 overflow-hidden rounded-xl">
                    <CardHeader className="bg-secondary-50/50 border-b border-secondary-100 p-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
                                <BookOpen className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-secondary-900 uppercase tracking-tight">
                                    Paramètres de la demande
                                </CardTitle>
                                <CardDescription className="font-medium">
                                    Renseignez les détails nécessaires à la formation
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8 space-y-8">
                        {isFetching ? (
                            <div className="p-10 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                                <p className="text-secondary-400 font-bold uppercase tracking-widest text-[10px]">
                                    Chargement des départements...
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Département + Titre */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="uppercase tracking-widest text-xs font-black text-secondary-400">
                                            <Building2 className="inline-block w-4 h-4 mr-2 text-secondary-500" />
                                            Département
                                        </Label>
                                        <Select
                                            required
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            className="h-12"
                                        >
                                            <option value="">Sélectionnez un département...</option>
                                            {departments.map((d) => (
                                                <option key={d.id} value={(d as any)['@id'] || d.id}>
                                                    {d.code} - {d.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="uppercase tracking-widest text-xs font-black text-secondary-400">
                                            <BookOpen className="inline-block w-4 h-4 mr-2 text-secondary-500" />
                                            Titre de la formation
                                        </Label>
                                        <Input
                                            required
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="Ex : Formation Excel avancé..."
                                            className="h-12"
                                        />
                                    </div>
                                </div>

                                {/* Participants + Priorité */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="uppercase tracking-widest text-xs font-black text-secondary-400">
                                            <Users className="inline-block w-4 h-4 mr-2 text-secondary-500" />
                                            Nombre de participants
                                        </Label>
                                        <Input
                                            required
                                            type="number"
                                            name="numberOfParticipants"
                                            value={formData.numberOfParticipants}
                                            onChange={handleChange}
                                            min={1}
                                            className="h-12"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="uppercase tracking-widest text-xs font-black text-secondary-400">
                                            Priorité
                                        </Label>
                                        <Select
                                            required
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleChange}
                                            className="h-12"
                                        >
                                            {PRIORITIES.map((p) => (
                                                <option key={p.value} value={p.value}>{p.label}</option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>

                                {/* Info statut */}
                                <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-2xl border border-secondary-100">
                                    <Info className="w-5 h-5 text-primary-600 shrink-0" />
                                    <p className="text-[10px] font-bold text-secondary-500 uppercase leading-relaxed">
                                        Le statut initial est <span className="text-amber-600">PENDING</span> et sera validé par les RH.
                                    </p>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label className="uppercase tracking-widest text-xs font-black text-secondary-400">
                                        <FileText className="inline-block w-4 h-4 mr-2 text-secondary-500" />
                                        Description
                                    </Label>
                                    <Textarea
                                        required
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={5}
                                        placeholder="Décrivez les objectifs, le contenu attendu, le contexte de la demande..."
                                        className="bg-secondary-50/30"
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-4 p-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                        className="px-8 py-6 rounded-2xl font-bold uppercase tracking-widest text-xs text-secondary-400 hover:text-secondary-900"
                    >
                        Annuler
                    </Button>
                    <Button
                        disabled={isLoading || isFetching}
                        type="submit"
                        className="px-10 py-6 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary-200 transition-all active:scale-[0.98] flex items-center gap-3"
                    >
                        {isLoading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" />Soumission...</>
                        ) : (
                            <><Save className="w-4 h-4" />Envoyer la demande</>
                        )}
                    </Button>
                </div>
            </form>
        </PageShell>
    );
}
