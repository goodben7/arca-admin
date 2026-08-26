'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, Search, User, X } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Label, Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { DisciplinarySummaryCard } from '@/components/sanctions/DisciplinarySummaryCard';
import { createDisciplinaryCase, getDisciplinarySummary } from '@/lib/api/disciplinaryCase';
import { getSanctionScales } from '@/lib/api/sanctionScale';
import { fetchAllCollection } from '@/lib/api/collection';
import { extractId } from '@/lib/api-iri';
import { cn } from '@/lib/utils';
import {
    evaluateSanctionChoice,
    sanctionScaleCodeLabel,
    type DisciplinarySummary,
    type SanctionScale,
} from '@/types/sanctions';
import { STATUS, type Employee } from '@/types/employee';
import { toast } from '@/lib/toast';

function empId(emp: Employee): string {
    return extractId(emp.id || emp['@id']) || emp.id;
}

function normalizeSearch(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function isEligible(emp: Employee): boolean {
    return emp.status === STATUS.ACTIVE || emp.status === STATUS.ON_LEAVE || emp.status === STATUS.PROBATION;
}

function employeeStatusLabel(status?: string): string {
    switch (status) {
        case STATUS.ACTIVE: return 'Actif';
        case STATUS.ON_LEAVE: return 'En congé';
        case STATUS.PROBATION: return 'Période d’essai';
        case STATUS.INACTIVE: return 'Inactif';
        case STATUS.SUSPENDED: return 'Suspendu';
        case STATUS.TERMINATED: return 'Licencié';
        case STATUS.RETIRED: return 'Retraité';
        default: return status || '';
    }
}

function employeeHaystack(emp: Employee): string {
    return normalizeSearch(
        `${emp.firstName || ''} ${emp.lastName || ''} ${emp.employeeNumber || ''} ${emp.email || ''} ${empId(emp)}`,
    );
}

export default function CreateDisciplinaryCaseClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const prefillEmployee = searchParams.get('employee') || '';

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [scales, setScales] = useState<SanctionScale[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [summary, setSummary] = useState<DisciplinarySummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState(false);
    const [ackRecidivism, setAckRecidivism] = useState(false);
    const [empQuery, setEmpQuery] = useState('');
    const [empOpen, setEmpOpen] = useState(false);
    const empBoxRef = useRef<HTMLDivElement>(null);
    const empInputRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState({
        employee: prefillEmployee,
        sanctionScale: '',
        facts: '',
        occurredAt: new Date().toISOString().slice(0, 16),
        reason: '',
    });

    useEffect(() => {
        Promise.all([
            fetchAllCollection<Employee>('/api/employees').then(c => c.items).catch(() => []),
            getSanctionScales({ active: 'true', 'order[severityLevel]': 'asc' }).catch(() => []),
        ]).then(([e, s]) => {
            setEmployees(e);
            setScales(s);
            if (prefillEmployee) setForm(f => ({ ...f, employee: prefillEmployee }));
        }).finally(() => setLoading(false));
    }, [prefillEmployee]);

    useEffect(() => {
        if (!form.employee) {
            setSummary(null);
            setSummaryError(false);
            setAckRecidivism(false);
            return;
        }
        let cancelled = false;
        setSummaryLoading(true);
        setAckRecidivism(false);
        setSummaryError(false);
        getDisciplinarySummary(form.employee)
            .then(s => {
                if (cancelled) return;
                setSummary(s);
                setSummaryError(false);
            })
            .catch(() => {
                if (!cancelled) {
                    setSummary(null);
                    setSummaryError(true);
                }
            })
            .finally(() => {
                if (!cancelled) setSummaryLoading(false);
            });
        return () => { cancelled = true; };
    }, [form.employee]);

    useEffect(() => {
        function onPointerDown(e: MouseEvent) {
            if (!empBoxRef.current?.contains(e.target as Node)) setEmpOpen(false);
        }
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, []);

    useEffect(() => {
        if (form.employee || !empOpen) return;
        empInputRef.current?.focus();
    }, [form.employee, empOpen]);

    useEffect(() => {
        if (!summary?.suggestedNextCode || !scales.length) return;
        const match = scales.find(
            sc => sc.code?.toUpperCase() === summary.suggestedNextCode?.toUpperCase()
                && evaluateSanctionChoice(summary, sc) !== 'blocked',
        );
        if (!match) return;
        setForm(f => (f.sanctionScale ? f : { ...f, sanctionScale: match.id }));
    }, [summary?.suggestedNextCode, scales, summary]);

    const selectedScale = scales.find(s => s.id === form.sanctionScale);
    const verdict = evaluateSanctionChoice(summary, selectedScale);
    const blockedActive = Boolean(summary?.hasActiveCase);
    const selectableScales = scales.filter(s => evaluateSanctionChoice(summary, s) !== 'blocked');
    const hiddenCount = summary && !summaryError ? scales.length - selectableScales.length : 0;
    const selectedEmployee = employees.find(e => empId(e) === form.employee);
    const ineligibleSelected = Boolean(selectedEmployee && !isEligible(selectedEmployee));
    const filteredEmployees = useMemo(() => {
        const q = normalizeSearch(empQuery);
        const matched = q
            ? employees.filter(emp => employeeHaystack(emp).includes(q))
            : employees.filter(isEligible);
        matched.sort((a, b) => {
            const elig = Number(isEligible(b)) - Number(isEligible(a));
            if (elig !== 0) return elig;
            return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'fr');
        });
        return matched.slice(0, 20);
    }, [employees, empQuery]);
    const matchCount = useMemo(() => {
        const q = normalizeSearch(empQuery);
        const pool = q ? employees.filter(emp => employeeHaystack(emp).includes(q)) : employees.filter(isEligible);
        return pool.length;
    }, [employees, empQuery]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (blockedActive) {
            toast.error('Une affaire active existe déjà pour cet employé.');
            return;
        }
        const emp = employees.find(e => empId(e) === form.employee);
        if (emp && !isEligible(emp)) {
            toast.error('Ce collaborateur n’est pas éligible à une affaire disciplinaire.');
            return;
        }
        if (!form.employee || !form.sanctionScale || !form.facts.trim() || !form.occurredAt) {
            toast.error('Employé, échelle, faits et date sont obligatoires.');
            return;
        }
        if (verdict === 'blocked') {
            toast.error('Impossible de choisir un niveau inférieur à la dernière sanction appliquée.');
            return;
        }
        if (verdict === 'needsAck' && !ackRecidivism) {
            toast.error('Confirmez que vous restez au même niveau de sanction (récidive).');
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
                acknowledgeRecidivism: verdict === 'needsAck' || (summaryError && ackRecidivism) || undefined,
            });
            toast.success('Affaire créée en brouillon. Vous pouvez maintenant l’ouvrir.');
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

    const submitDisabled = saving || blockedActive || verdict === 'blocked' || (verdict === 'needsAck' && !ackRecidivism);

    return (
        <PageShell>
            <PageHeader
                title="Nouvelle affaire disciplinaire"
                description="Brouillon : l’ouverture déclenche le constat de la faute, puis les explications."
                actions={
                    <Link href="/m/sanctions/affaires">
                        <Button variant="outline" size="sm" className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Retour</Button>
                    </Link>
                }
            />

            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-border-subtle bg-surface p-6">
                <div>
                    <Label>Collaborateur *</Label>
                    {selectedEmployee ? (
                        <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                                <User className="h-4 w-4 text-secondary-500 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate">
                                        {selectedEmployee.firstName} {selectedEmployee.lastName}
                                    </p>
                                    <p className="text-xs text-secondary-500">
                                        {[selectedEmployee.employeeNumber || empId(selectedEmployee), employeeStatusLabel(selectedEmployee.status)]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setForm(f => ({ ...f, employee: '', sanctionScale: '' }));
                                    setEmpQuery('');
                                    setEmpOpen(true);
                                }}
                            >
                                Changer
                            </Button>
                        </div>
                    ) : (
                        <div ref={empBoxRef} className="relative mt-1">
                            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-secondary-400" />
                            <Input
                                ref={empInputRef}
                                className="pl-9 pr-9 h-11 rounded-xl"
                                placeholder="Nom, prénom, matricule ou e-mail…"
                                value={empQuery}
                                autoComplete="off"
                                onFocus={() => setEmpOpen(true)}
                                onChange={e => {
                                    setEmpQuery(e.target.value);
                                    setEmpOpen(true);
                                }}
                                onKeyDown={e => {
                                    if (e.key === 'Escape') {
                                        setEmpOpen(false);
                                        return;
                                    }
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const firstEligible = filteredEmployees.find(isEligible);
                                        if (!firstEligible) return;
                                        setForm(f => ({ ...f, employee: empId(firstEligible), sanctionScale: '' }));
                                        setEmpQuery('');
                                        setEmpOpen(false);
                                    }
                                }}
                            />
                            {empQuery && (
                                <button
                                    type="button"
                                    className="absolute right-3 top-3.5 text-secondary-400 hover:text-secondary-600"
                                    onClick={() => {
                                        setEmpQuery('');
                                        empInputRef.current?.focus();
                                    }}
                                    aria-label="Effacer la recherche"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                            {empOpen && (
                                <ul className="absolute z-20 mt-1.5 w-full max-h-64 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg divide-y divide-border-subtle">
                                    {filteredEmployees.length === 0 ? (
                                        <li className="px-3 py-4 text-sm text-secondary-500">
                                            {empQuery.trim()
                                                ? <>Aucun résultat pour « {empQuery.trim()} ».</>
                                                : 'Aucun collaborateur chargé.'}
                                        </li>
                                    ) : (
                                        <>
                                            {filteredEmployees.map((emp) => {
                                                const eligible = isEligible(emp);
                                                const id = empId(emp);
                                                return (
                                                    <li key={id}>
                                                        {eligible ? (
                                                            <button
                                                                type="button"
                                                                className="w-full text-left px-3 py-2.5 hover:bg-primary-50/60 transition-colors"
                                                                onMouseDown={e => e.preventDefault()}
                                                                onClick={() => {
                                                                    setForm(f => ({ ...f, employee: id, sanctionScale: '' }));
                                                                    setEmpQuery('');
                                                                    setEmpOpen(false);
                                                                }}
                                                            >
                                                                <p className="text-sm font-medium">{emp.firstName} {emp.lastName}</p>
                                                                <p className="text-xs text-secondary-500">
                                                                    {[emp.employeeNumber || id, employeeStatusLabel(emp.status)]
                                                                        .filter(Boolean)
                                                                        .join(' · ')}
                                                                </p>
                                                            </button>
                                                        ) : (
                                                            <div className="px-3 py-2.5 opacity-60 cursor-not-allowed">
                                                                <p className="text-sm font-medium">{emp.firstName} {emp.lastName}</p>
                                                                <p className="text-xs text-secondary-500">
                                                                    Non éligible — {employeeStatusLabel(emp.status) || emp.status}
                                                                    {emp.employeeNumber ? ` · ${emp.employeeNumber}` : ''}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                            {matchCount > filteredEmployees.length && (
                                                <li className="px-3 py-2 text-[11px] text-secondary-500">
                                                    {filteredEmployees.length} premiers sur {matchCount} — affinez la recherche.
                                                </li>
                                            )}
                                        </>
                                    )}
                                </ul>
                            )}
                        </div>
                    )}
                    <p className="mt-1.5 text-xs text-secondary-500">
                        Recherchez n’importe qui. Seuls les collaborateurs actifs, en congé ou en période d’essai peuvent être sélectionnés.
                    </p>
                    {ineligibleSelected && selectedEmployee && (
                        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                            {selectedEmployee.firstName} {selectedEmployee.lastName} n’est pas éligible
                            ({employeeStatusLabel(selectedEmployee.status) || selectedEmployee.status}).
                            Choisissez un collaborateur actif, en congé ou en période d’essai.
                        </p>
                    )}
                </div>

                {form.employee && !ineligibleSelected && (
                    <>
                        {summaryError && !summaryLoading && (
                            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                                Synthèse indisponible. Confirmez si vous restez au même niveau de sanction — l’enregistrement pourra sinon être refusé.
                            </p>
                        )}
                        {!summaryError && (
                            <DisciplinarySummaryCard summary={summary} loading={summaryLoading} />
                        )}
                    </>
                )}

                {blockedActive && !ineligibleSelected && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-sm text-amber-900">Clôturez d’abord l’affaire en cours avant d’en ouvrir une nouvelle.</p>
                        <Link href={`/m/sanctions/affaires?employee=${form.employee}`}>
                            <Button type="button" size="sm" variant="outline">Voir les affaires</Button>
                        </Link>
                    </div>
                )}

                {!blockedActive && !ineligibleSelected && (
                    <>
                        <div>
                            <Label>Échelle de sanction *</Label>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                {selectableScales.map(s => {
                                    const optionVerdict = evaluateSanctionChoice(summary, s);
                                    const suggested = summary?.suggestedNextCode
                                        && s.code?.toUpperCase() === summary.suggestedNextCode.toUpperCase();
                                    const selected = form.sanctionScale === s.id;
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => {
                                                setAckRecidivism(false);
                                                setForm(f => ({ ...f, sanctionScale: s.id }));
                                            }}
                                            className={cn(
                                                'rounded-xl border px-3.5 py-3 text-left transition-all',
                                                selected
                                                    ? 'border-primary-500 bg-primary-50/70 ring-2 ring-primary-500/15'
                                                    : 'border-border hover:border-primary-200 hover:bg-muted/40',
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-semibold text-foreground">
                                                    {sanctionScaleCodeLabel(s.code)}
                                                </p>
                                                {selected && <Check className="h-4 w-4 text-primary-600 shrink-0" />}
                                            </div>
                                            <p className="mt-1 text-xs text-secondary-500">
                                                Niveau {s.severityLevel} sur 5 · {s.requiresHearing ? 'Audience obligatoire' : 'Sans audience'}
                                                {s.maxDurationDays != null ? ` · ${s.maxDurationDays} jours au plus` : ''}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {suggested && (
                                                    <span className="text-[10px] font-semibold uppercase tracking-wide rounded-full bg-primary-100 text-primary-800 px-2 py-0.5">
                                                        Recommandé
                                                    </span>
                                                )}
                                                {optionVerdict === 'needsAck' && (
                                                    <span className="text-[10px] font-semibold uppercase tracking-wide rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">
                                                        Même niveau
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {hiddenCount > 0 && (
                                <p className="mt-2 text-xs text-secondary-500">
                                    {hiddenCount} niveau{hiddenCount > 1 ? 'x' : ''} inférieur{hiddenCount > 1 ? 's' : ''} masqué{hiddenCount > 1 ? 's' : ''} : ils ne peuvent plus être choisis.
                                </p>
                            )}
                            {selectedScale && (
                                <p className="mt-2 text-xs text-secondary-500">
                                    {selectedScale.requiresHearing
                                        ? 'Après les explications : entretien préalable, puis décision.'
                                        : 'Après les explications : décision directe, sans entretien.'}
                                </p>
                            )}
                            {(verdict === 'needsAck' || summaryError) && verdict !== 'blocked' && (
                                <label className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-950 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 h-4 w-4 accent-amber-700"
                                        checked={ackRecidivism}
                                        onChange={e => setAckRecidivism(e.target.checked)}
                                    />
                                    <span>
                                        Je confirme rester au même niveau de sanction (récidive).
                                        Sans cette confirmation, l’enregistrement sera refusé.
                                    </span>
                                </label>
                            )}
                        </div>

                        <div>
                            <Label>Date des faits *</Label>
                            <input
                                type="datetime-local"
                                className="mt-1 w-full h-11 rounded-xl border border-border px-3 text-sm"
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
                                placeholder="Description factuelle, dates, circonstances…"
                                required
                            />
                        </div>

                        <div>
                            <Label>Commentaire interne (facultatif)</Label>
                            <Textarea
                                className="mt-1"
                                rows={2}
                                value={form.reason}
                                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <Link href="/m/sanctions/affaires"><Button type="button" variant="outline">Annuler</Button></Link>
                            <Button type="submit" disabled={submitDisabled}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer le brouillon'}
                            </Button>
                        </div>
                    </>
                )}
            </form>
        </PageShell>
    );
}
