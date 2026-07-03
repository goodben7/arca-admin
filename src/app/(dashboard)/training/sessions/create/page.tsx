'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ChevronLeft,
    Save,
    Loader2,
    BookOpen,
    MapPin,
    Users,
    CalendarDays,
    UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Input';
import { getAllTrainingRequests } from '@/lib/api/training';
import { createTrainingSession } from '@/lib/api/trainingSession';
import { TrainingRequest } from '@/types/training';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';

function CreateTrainingSessionForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedRequestId = searchParams.get('requestId') || '';

    const [requests, setRequests] = useState<TrainingRequest[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        trainer: '',
        startDate: '',
        endDate: '',
        location: '',
        capacity: 1,
        trainingRequest: preselectedRequestId,
    });

    useEffect(() => {
        getAllTrainingRequests()
            .then((reqs) => {
                // Seules les demandes approuvées peuvent avoir une session
                const approved = reqs.filter((r) => r.status === 'APPROVED');
                setRequests(approved);
            })
            .catch(() => setRequests([]))
            .finally(() => setIsFetching(false));
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'capacity' ? parseInt(value, 10) || 1 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.trainingRequest) {
            setError('Veuillez sélectionner une demande de formation.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await createTrainingSession({
                title: formData.title,
                trainer: formData.trainer,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
                location: formData.location,
                capacity: formData.capacity,
                trainingRequest: formData.trainingRequest,
            });
            router.push('/training/sessions');
            router.refresh();
        } catch (err: unknown) {
            const e = err as Error;
            setError(e?.message || 'Erreur lors de la création de la session.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageShell className="max-w-4xl mx-auto">
            <PageHeader
                title="Nouvelle session de formation"
                description="Planifiez une session liée à une demande approuvée"
                backHref="/training/sessions"
            />

            {error && (
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-2xl text-destructive text-sm font-bold flex items-center gap-3">
                    <BookOpen className="w-5 h-5 shrink-0" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-none shadow-2xl shadow-secondary-200/50 overflow-hidden rounded-3xl">
                    <CardHeader className="bg-secondary-50/50 border-b border-secondary-100 p-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
                                <CalendarDays className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-secondary-900 uppercase tracking-tight">
                                    Détails de la session
                                </CardTitle>
                                <CardDescription className="font-medium">
                                    Renseignez les informations de la session
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8 space-y-8">
                        {isFetching ? (
                            <div className="p-10 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                                <p className="text-secondary-400 font-bold uppercase tracking-widest text-[10px]">
                                    Chargement des demandes approuvées...
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Demande de formation liée */}
                                <div className="space-y-2">
                                    <Label className="uppercase tracking-widest text-xs font-black text-secondary-400">
                                        <BookOpen className="inline-block w-4 h-4 mr-2 text-secondary-500" />
                                        Demande de formation *
                                    </Label>
                                    <Select
                                        required
                                        name="trainingRequest"
                                        value={formData.trainingRequest}
                                        onChange={handleChange}
                                        className="h-12"
                                    >
                                        <option value="">Sélectionnez une demande approuvée...</option>
                                        {requests.map((r) => (
                                            <option key={r.id} value={(r as TrainingRequest & { '@id'?: string })['@id'] || r.id}>
                                                {r.title}
                                            </option>
                                        ))}
                                    </Select>
                                    {requests.length === 0 && (
                                        <p className="text-xs text-amber-600 font-bold">
                                            Aucune demande approuvée disponible.
                                        </p>
                                    )}
                                </div>

                                {/* Titre + Formateur */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="uppercase tracking-widest text-xs font-black text-secondary-400">
                                            <BookOpen className="inline-block w-4 h-4 mr-2 text-secondary-500" />
                                            Titre de la session *
                                        </Label>
                                        <Input
                                            required
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="Ex : Excel avancé - Groupe A"
                                            className="h-12"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="uppercase tracking-widest text-xs font-black text-secondary-400">
                                            <UserCheck className="inline-block w-4 h-4 mr-2 text-secondary-500" />
                                            Formateur *
                                        </Label>
                                        <Input
                                            required
                                            name="trainer"
                                            value={formData.trainer}
                                            onChange={handleChange}
                                            placeholder="Nom du formateur..."
                                            className="h-12"
                                        />
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="uppercase tracking-widest text-xs font-black text-secondary-400">
                                            <CalendarDays className="inline-block w-4 h-4 mr-2 text-secondary-500" />
                                            Date de début *
                                        </Label>
                                        <Input
                                            required
                                            type="datetime-local"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleChange}
                                            className="h-12"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="uppercase tracking-widest text-xs font-black text-secondary-400">
                                            <CalendarDays className="inline-block w-4 h-4 mr-2 text-secondary-500" />
                                            Date de fin *
                                        </Label>
                                        <Input
                                            required
                                            type="datetime-local"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleChange}
                                            className="h-12"
                                        />
                                    </div>
                                </div>

                                {/* Lieu + Capacité */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="uppercase tracking-widest text-xs font-black text-secondary-400">
                                            <MapPin className="inline-block w-4 h-4 mr-2 text-secondary-500" />
                                            Lieu *
                                        </Label>
                                        <Input
                                            required
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            placeholder="Salle de conférence, en ligne..."
                                            className="h-12"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="uppercase tracking-widest text-xs font-black text-secondary-400">
                                            <Users className="inline-block w-4 h-4 mr-2 text-secondary-500" />
                                            Capacité *
                                        </Label>
                                        <Input
                                            required
                                            type="number"
                                            name="capacity"
                                            value={formData.capacity}
                                            onChange={handleChange}
                                            min={1}
                                            className="h-12"
                                        />
                                    </div>
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
                            <><Loader2 className="w-4 h-4 animate-spin" />Création...</>
                        ) : (
                            <><Save className="w-4 h-4" />Créer la session</>
                        )}
                    </Button>
                </div>
            </form>
        </PageShell>
    );
}

export default function CreateTrainingSessionPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            </div>
        }>
            <CreateTrainingSessionForm />
        </Suspense>
    );
}
