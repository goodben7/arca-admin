'use client';

import { Fragment, useEffect, useState } from 'react';
import { AlertCircle, Loader2, Plus, Scale } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Label } from '@/components/ui/Input';
import { createSanctionScale, getSanctionScales, updateSanctionScale } from '@/lib/api/sanctionScale';
import {
    SANCTION_SCALE_CODES,
    SANCTION_SCALE_CODE_LABELS,
    SANCTION_SCALE_PRESETS,
    sanctionScaleCodeLabel,
    type SanctionScale,
    type SanctionScaleCode,
} from '@/types/sanctions';
import { toast } from '@/lib/toast';

const emptyForm = {
    code: '' as string,
    label: '',
    severityLevel: 1,
    requiresHearing: false,
    maxDurationDays: '' as string | number,
    active: true,
};

function applyCodePreset(code: SanctionScaleCode) {
    const preset = SANCTION_SCALE_PRESETS[code];
    return {
        code,
        label: preset.label,
        severityLevel: preset.severityLevel,
        requiresHearing: preset.requiresHearing,
        maxDurationDays: preset.maxDurationDays ?? '',
        active: true,
    };
}

export default function SanctionScalesPage() {
    const [scales, setScales] = useState<SanctionScale[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<SanctionScale | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        try {
            setLoading(true);
            setScales(await getSanctionScales({ 'order[severityLevel]': 'asc' }));
            setError(null);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    function openCreate() {
        setEditing(null);
        setForm(emptyForm);
        setOpen(true);
    }

    function openEdit(s: SanctionScale) {
        setEditing(s);
        setForm({
            code: s.code,
            label: s.label,
            severityLevel: s.severityLevel,
            requiresHearing: s.requiresHearing,
            maxDurationDays: s.maxDurationDays ?? '',
            active: s.active,
        });
        setOpen(true);
    }

    async function handleSave() {
        if (!form.code.trim() || !form.label.trim()) {
            toast.error('Code et libellé obligatoires.');
            return;
        }
        try {
            setSaving(true);
            const payload = {
                code: form.code.trim().toUpperCase(),
                label: form.label.trim(),
                severityLevel: Number(form.severityLevel),
                requiresHearing: form.requiresHearing,
                maxDurationDays: form.maxDurationDays === '' ? null : Number(form.maxDurationDays),
                active: form.active,
            };
            if (editing) {
                await updateSanctionScale(editing.id, payload);
                toast.success('Échelle mise à jour.');
            } else {
                await createSanctionScale(payload);
                toast.success('Échelle créée.');
            }
            setOpen(false);
            load();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Erreur');
        } finally {
            setSaving(false);
        }
    }

    return (
        <PageShell>
            <PageHeader
                title="Échelles de sanctions"
                description="Référentiel disciplinaire (gravité, audience, durée max)"
                actions={
                    <Button size="sm" className="gap-1.5" onClick={openCreate}>
                        <Plus className="h-4 w-4" /> Nouvelle échelle
                    </Button>
                }
            />

            {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    <AlertCircle className="h-4 w-4" /> {error}
                </div>
            )}

            <DataPanel title="Référentiel" contentClassName="p-0">
                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
                ) : scales.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-16 text-secondary-500">
                        <Scale className="h-8 w-8 opacity-40" />
                        <p className="text-sm">Aucune échelle — lancez le seed backend ou créez-en une.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Libellé</TableHead>
                                <TableHead>Gravité</TableHead>
                                <TableHead>Audience</TableHead>
                                <TableHead>Durée max</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {scales.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-mono text-xs font-semibold text-primary-700">
                                        {s.code}
                                        <span className="block font-sans font-medium text-secondary-500 normal-case tracking-normal mt-0.5">
                                            {sanctionScaleCodeLabel(s.code)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-medium">{s.label}</TableCell>
                                    <TableCell>{s.severityLevel}</TableCell>
                                    <TableCell>{s.requiresHearing ? 'Oui' : 'Non'}</TableCell>
                                    <TableCell>{s.maxDurationDays != null ? `${s.maxDurationDays} j` : '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant={s.active ? 'success' : 'secondary'}>
                                            {s.active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>Modifier</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DataPanel>

            <Transition appear show={open} as={Fragment}>
                <Dialog as="div" className="relative z-[80]" onClose={() => setOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-secondary-950/40" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto p-4">
                        <div className="flex min-h-full items-center justify-center">
                            <Dialog.Panel className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-float space-y-4">
                                <Dialog.Title className="text-lg font-semibold">
                                    {editing ? 'Modifier l’échelle' : 'Nouvelle échelle'}
                                </Dialog.Title>
                                <div className="space-y-3">
                                    <div>
                                        <Label>Type de sanction *</Label>
                                        <select
                                            className="mt-1 w-full h-10 rounded-xl border border-border px-3 text-sm bg-surface"
                                            value={form.code}
                                            disabled={!!editing}
                                            onChange={e => {
                                                const code = e.target.value as SanctionScaleCode;
                                                if (!code) {
                                                    setForm(emptyForm);
                                                    return;
                                                }
                                                setForm(f => ({
                                                    ...applyCodePreset(code),
                                                    active: f.active,
                                                    // en édition on ne change pas le code
                                                    ...(editing ? { code: f.code, label: f.label } : {}),
                                                }));
                                            }}
                                        >
                                            <option value="">Sélectionner…</option>
                                            {(Object.keys(SANCTION_SCALE_CODES) as SanctionScaleCode[]).map(code => (
                                                <option key={code} value={code}>
                                                    {code} — {SANCTION_SCALE_CODE_LABELS[code]}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-[11px] text-secondary-500">
                                            WARN = Avertissement · BLAME = Blâme · SUSPEND = Suspension · DISMISS = Licenciement
                                        </p>
                                    </div>
                                    <div>
                                        <Label>Libellé affiché *</Label>
                                        <input
                                            className="mt-1 w-full h-10 rounded-xl border border-border px-3 text-sm"
                                            value={form.label}
                                            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                                            placeholder="Ex. Avertissement écrit"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>Gravité *</Label>
                                            <select
                                                className="mt-1 w-full h-10 rounded-xl border border-border px-3 text-sm bg-surface"
                                                value={form.severityLevel}
                                                onChange={e => setForm(f => ({ ...f, severityLevel: Number(e.target.value) }))}
                                            >
                                                <option value={1}>1 — Légère</option>
                                                <option value={2}>2 — Moyenne</option>
                                                <option value={3}>3 — Grave</option>
                                                <option value={4}>4 — Très grave</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Durée max (jours)</Label>
                                            <input
                                                type="number"
                                                min={0}
                                                className="mt-1 w-full h-10 rounded-xl border border-border px-3 text-sm"
                                                value={form.maxDurationDays}
                                                onChange={e => setForm(f => ({ ...f, maxDurationDays: e.target.value }))}
                                                placeholder="—"
                                            />
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={form.requiresHearing}
                                            onChange={e => setForm(f => ({ ...f, requiresHearing: e.target.checked }))}
                                        />
                                        Audience obligatoire
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={form.active}
                                            onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                                        />
                                        Active
                                    </label>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                                    <Button onClick={handleSave} disabled={saving}>
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </PageShell>
    );
}
