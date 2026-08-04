'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { createDisciplinaryCase, getDisciplinarySummary } from '@/lib/api/disciplinaryCase';
import { getSanctionScales } from '@/lib/api/sanctionScale';
import { getAllEmployees } from '@/lib/api/employee';
import { extractId } from '@/lib/api-iri';
import { sanctionScaleCodeLabel, type SanctionScale } from '@/types/sanctions';
import { toast } from '@/lib/toast';

export default function CreateDisciplinaryCaseClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefillEmployee = searchParams.get('employee') || '';

    const [employees, setEmployees] = useState<any[]>([]);
    const [scales, setScales] = useState<SanctionScale[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [blocked, setBlocked] = useState(false);
    const [form, setForm] = useState({
        employee: prefillEmployee,
        sanctionScale: '',
        facts: '',
        occurredAt: new Date().toISOString().slice(0, 16),
        reason: '',
    });

    useEffect(() => {
        Promise.all([
            getAllEmployees({ itemsPerPage: 500 }).catch(() => []),
            getSanctionScales({ active: 'true', 'order[severityLevel]': 'asc' }).catch(() => []),
        ]).then(([e, s]) => {
            setEmployees(Array.isArray(e) ? e : (e as any)['hydra:member'] || []);
            setScales(s);
            if (prefillEmployee) setForm(f => ({ ...f, employee: prefillEmployee }));
        }).finally(() => setLoading(false));
    }, [prefillEmployee]);

    useEffect(() => {
        if (!form.employee) {
            setBlocked(false);
            return;
        }
        getDisciplinarySummary(form.employee)
            .then(s => setBlocked(s.hasActiveCase))
            .catch(() => setBlocked(false));
    }, [form.employee]);

    const selectedScale = scales.find(s => s.id === form.sanctionScale);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (blocked) {
            toast.error('Une affaire active existe déjà pour cet employé.');
            return;
        }
        if (!form.employee || !form.sanctionScale || !form.facts.trim() || !form.occurredAt) {
            toast.error('Employé, échelle, faits et date sont obligatoires.');
            return;
        }
        try {
            setSaving(true);
            const created = await createDisciplinaryCase({
                employee: form.employee,
                sanctionScale: form.sanctionScale,
                facts: form.facts.trim(),
                occurredAt: new Date(form.occurredAt).toISOString(),
                reason: form.reason.trim() || null,
            });
            toast.success('Affaire créée en brouillon.');
            router.push(`/m/sanctions/affaires/${created.id}`);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Erreur');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <PageShell>
                <div className="flex justify-center p-24"><Loader2 className="h-10 w-10 animate-spin text-primary-600" /></div>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <PageHeader
                title="Nouvelle affaire disciplinaire"
                description="Création en brouillon — le workflow démarre à l’ouverture"
                actions={
                    <Link href="/m/sanctions/affaires">
                        <Button variant="outline" size="sm" className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Retour</Button>
                    </Link>
                }
            />

            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-border-subtle bg-surface p-6">
                <div>
                    <Label>Employé *</Label>
                    <select
                        className="mt-1 w-full h-10 rounded-xl border border-border px-3 text-sm"
                        value={form.employee}
                        onChange={e => setForm(f => ({ ...f, employee: e.target.value }))}
                        required
                    >
                        <option value="">Sélectionner…</option>
                        {employees.map((emp: any) => (
                            <option key={emp.id} value={extractId(emp.id || emp['@id'])}>
                                {emp.firstName} {emp.lastName} ({emp.employeeNumber || emp.id})
                            </option>
                        ))}
                    </select>
                    {blocked && (
                        <p className="mt-1.5 text-xs font-medium text-amber-700">
                            Affaire active déjà en cours pour cet employé.
                        </p>
                    )}
                </div>

                <div>
                    <Label>Échelle de sanction *</Label>
                    <select
                        className="mt-1 w-full h-10 rounded-xl border border-border px-3 text-sm"
                        value={form.sanctionScale}
                        onChange={e => setForm(f => ({ ...f, sanctionScale: e.target.value }))}
                        required
                    >
                        <option value="">Sélectionner…</option>
                        {scales.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.code} ({sanctionScaleCodeLabel(s.code)}) — {s.label} · gravité {s.severityLevel}
                                {s.requiresHearing ? ' · audience' : ''}
                            </option>
                        ))}
                    </select>
                    {selectedScale && (
                        <p className="mt-1.5 text-xs text-secondary-500">
                            {selectedScale.requiresHearing
                                ? 'Cette échelle exige une audience avant décision.'
                                : 'Pas d’audience requise — passage direct à la décision après ouverture.'}
                            {selectedScale.maxDurationDays != null && ` Durée max : ${selectedScale.maxDurationDays} j.`}
                        </p>
                    )}
                </div>

                <div>
                    <Label>Date des faits *</Label>
                    <input
                        type="datetime-local"
                        className="mt-1 w-full h-10 rounded-xl border border-border px-3 text-sm"
                        value={form.occurredAt}
                        onChange={e => setForm(f => ({ ...f, occurredAt: e.target.value }))}
                        required
                    />
                </div>

                <div>
                    <Label>Faits reprochés *</Label>
                    <Textarea
                        className="mt-1"
                        rows={5}
                        value={form.facts}
                        onChange={e => setForm(f => ({ ...f, facts: e.target.value }))}
                        placeholder="Description factuelle…"
                        required
                    />
                </div>

                <div>
                    <Label>Motif / commentaire (optionnel)</Label>
                    <Textarea
                        className="mt-1"
                        rows={2}
                        value={form.reason}
                        onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Link href="/m/sanctions/affaires"><Button type="button" variant="outline">Annuler</Button></Link>
                    <Button type="submit" disabled={saving || blocked}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer le brouillon'}
                    </Button>
                </div>
            </form>
        </PageShell>
    );
}
