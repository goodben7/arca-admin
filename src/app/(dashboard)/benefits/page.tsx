'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { Plus, Loader2, AlertCircle, Gift, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { FilterBar } from '@/components/layout/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { PageKpiStrip } from '@/components/layout/PageKpi';
import { getBenefits, createBenefit } from '@/lib/api/benefit';
import { Benefit, BENEFIT_TYPE_LABELS, BenefitType, BENEFIT_TYPE } from '@/types/benefit';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from '@/lib/toast';

export default function BenefitsPage() {
    const [benefits, setBenefits] = useState<Benefit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ name: '', type: '', description: '', amount: '' });

    const load = async () => {
        try {
            setIsLoading(true);
            setBenefits(await getBenefits());
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        if (!search.trim()) return benefits;
        const q = search.toLowerCase();
        return benefits.filter(b => b.name.toLowerCase().includes(q));
    }, [benefits, search]);

    const typeBadgeVariant = (t: string): 'default' | 'secondary' | 'success' | 'warning' => {
        switch (t) {
            case BENEFIT_TYPE.HEALTH: return 'success';
            case BENEFIT_TYPE.TRANSPORT: return 'default';
            case BENEFIT_TYPE.MEAL: return 'warning';
            default: return 'secondary';
        }
    };

    const handleCreate = async () => {
        if (!form.name.trim() || !form.type) return toast.error('Nom et type obligatoires.');
        try {
            setCreating(true);
            await createBenefit({ name: form.name, type: form.type, description: form.description || undefined, amount: form.amount ? parseFloat(form.amount) : undefined });
            toast.success('Avantage créé.');
            setIsModalOpen(false);
            setForm({ name: '', type: '', description: '', amount: '' });
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <PageShell>
            <PageHeader
                title="Avantages sociaux"
                description="Catalogue des avantages proposés aux collaborateurs."
                actions={
                    <Button variant="pill" size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4" />Nouvel avantage
                    </Button>
                }
            />

            <PageKpiStrip items={[
                { label: 'Total avantages', value: benefits.length, icon: Gift, tone: 'primary', detail: 'Dans le catalogue' },
                { label: 'Santé', value: benefits.filter(b => b.type === BENEFIT_TYPE.HEALTH).length, icon: Gift, tone: 'success', detail: 'Avantages santé' },
                { label: 'Transport', value: benefits.filter(b => b.type === BENEFIT_TYPE.TRANSPORT).length, icon: Gift, tone: 'info', detail: 'Avantages transport' },
            ]} />

            <FilterBar>
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom..." className="w-full h-10 pl-10 pr-4 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
                </div>
            </FilterBar>

            <DataPanel title="Avantages" description={`${filtered.length} avantage(s)`} contentClassName="p-0">
                {isLoading ? (
                    <div className="p-32 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary-600" /></div>
                ) : error ? (
                    <div className="p-20 flex flex-col items-center gap-4"><AlertCircle className="w-12 h-12 text-rose-500" /><p>{error}</p></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6">Nom</TableHead>
                                <TableHead className="px-6">Type</TableHead>
                                <TableHead className="px-6">Montant</TableHead>
                                <TableHead className="px-6">Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="h-48 text-center text-muted-foreground">Aucun avantage.</TableCell></TableRow>
                            ) : filtered.map(b => (
                                <TableRow key={b.id}>
                                    <TableCell className="px-6 font-semibold">{b.name}</TableCell>
                                    <TableCell className="px-6"><Badge variant={typeBadgeVariant(b.type as string)}>{BENEFIT_TYPE_LABELS[b.type as BenefitType] || b.type}</Badge></TableCell>
                                    <TableCell className="px-6 text-secondary-600">{b.amount != null ? `${b.amount.toLocaleString('fr-FR')} FCFA` : '—'}</TableCell>
                                    <TableCell className="px-6 text-secondary-500 max-w-xs truncate">{b.description || '—'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DataPanel>

            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="bg-white rounded-2xl shadow-float w-full max-w-md p-6 space-y-5">
                                <div className="flex items-center justify-between">
                                    <Dialog.Title className="text-lg font-bold text-secondary-900">Nouvel avantage</Dialog.Title>
                                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg hover:bg-secondary-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Nom <span className="text-rose-500">*</span></label>
                                        <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="Ex: Mutuelle santé" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Type <span className="text-rose-500">*</span></label>
                                            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
                                                <option value="">Choisir</option>
                                                {Object.entries(BENEFIT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1.5">Montant (FCFA)</label>
                                            <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="w-full h-10 px-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" placeholder="0" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Description</label>
                                        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                                    <Button variant="pill" onClick={handleCreate} disabled={creating}>
                                        {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Créer
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition>
        </PageShell>
    );
}
