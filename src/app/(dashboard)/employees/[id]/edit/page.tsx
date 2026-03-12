import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Save,
    X,
    User,
    Briefcase,
    Info,
    History,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import Link from 'next/link';
import { getEmployeeById, updateEmployee, getDepartments } from '@/lib/api/employee';
import { getAllPositions } from '@/lib/api/position';
import { Employee, Department } from '@/types/employee';

export default function EditEmployeePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        hireDate: ''
    });

    useEffect(() => {
        async function loadData() {
            try {
                const [empData, deptsData, posData] = await Promise.all([
                    getEmployeeById(params.id),
                    getDepartments(),
                    getAllPositions()
                ]);

                setEmployee(empData);
                setDepartments(Array.isArray(deptsData) ? deptsData : (deptsData as any)['hydra:member'] || []);
                setPositions(Array.isArray(posData) ? posData : (posData as any)['hydra:member'] || []);

                setFormData({
                    firstName: empData.firstName || '',
                    lastName: empData.lastName || '',
                    email: empData.email || '',
                    phone: empData.phone || '',
                    department: (empData.department as any)?.['@id'] || empData.department || '',
                    position: (empData.position as any)?.['@id'] || empData.position || '',
                    hireDate: empData.hireDate ? empData.hireDate.split('T')[0] : ''
                });
            } catch (err: any) {
                setError(err.message || 'Erreur lors du chargement des données.');
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [params.id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            await updateEmployee(params.id, formData);
            router.push(`/employees/${params.id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la mise à jour.');
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-secondary-400">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                <p className="font-bold uppercase tracking-widest text-xs">Chargement du dossier...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-secondary-100 hover:scale-110 active:scale-95 transition-all text-secondary-600">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-900 uppercase tracking-tighter">Modifier : {formData.firstName} {formData.lastName}</h1>
                        <p className="text-secondary-500 font-medium italic">ID: {params.id}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {error && (
                    <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-600">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
                    </div>
                )}

                {/* Section 1: Personal */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                            <User className="w-4 h-4" />
                        </div>
                        <h2 className="text-lg font-bold text-secondary-900 uppercase tracking-tight">Informations Personnelles</h2>
                    </div>

                    <Card className="border-none shadow-xl shadow-secondary-200/50 overflow-hidden rounded-[32px] bg-white">
                        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-[10px] font-black uppercase text-secondary-400 tracking-widest ml-1">Prénom</Label>
                                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required className="h-12 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-[10px] font-black uppercase text-secondary-400 tracking-widest ml-1">Nom</Label>
                                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required className="h-12 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase text-secondary-400 tracking-widest ml-1">Email Professionnel</Label>
                                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className="h-12 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-[10px] font-black uppercase text-secondary-400 tracking-widest ml-1">Téléphone</Label>
                                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className="h-12 rounded-xl" />
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 2: Pro */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <Briefcase className="w-4 h-4" />
                        </div>
                        <h2 className="text-lg font-bold text-secondary-900 uppercase tracking-tight">Détails Professionnels</h2>
                    </div>

                    <Card className="border-none shadow-xl shadow-secondary-200/50 overflow-hidden rounded-[32px] bg-white">
                        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="department" className="text-[10px] font-black uppercase text-secondary-400 tracking-widest ml-1">Département</Label>
                                <select 
                                    id="department" 
                                    name="department"
                                    value={formData.department} 
                                    onChange={handleChange}
                                    required
                                    className="w-full h-12 px-4 bg-secondary-50 border border-secondary-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Choisir un département...</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept['@id'] || dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="position" className="text-[10px] font-black uppercase text-secondary-400 tracking-widest ml-1">Poste occupant</Label>
                                <select 
                                    id="position" 
                                    name="position"
                                    value={formData.position} 
                                    onChange={handleChange}
                                    required
                                    className="w-full h-12 px-4 bg-secondary-50 border border-secondary-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Choisir un poste...</option>
                                    {positions.map((pos) => (
                                        <option key={pos.id} value={pos['@id'] || pos.id}>{pos.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="hireDate" className="text-[10px] font-black uppercase text-secondary-400 tracking-widest ml-1">Date d'embauche</Label>
                                <Input id="hireDate" name="hireDate" type="date" value={formData.hireDate} onChange={handleChange} required className="h-12 rounded-xl" />
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Actions */}
                <div className="pt-6 border-t border-secondary-100 flex items-center justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => router.back()} className="text-secondary-500 font-black uppercase tracking-widest text-[10px] px-8">
                        Annuler
                    </Button>
                    <Button disabled={isSaving} type="submit" className="gap-2 px-10 h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 shadow-xl shadow-primary-200 transition-all active:scale-95 font-black uppercase tracking-widest text-[10px]">
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Mettre à jour le dossier
                    </Button>
                </div>
            </form>
        </div>
    );
}
