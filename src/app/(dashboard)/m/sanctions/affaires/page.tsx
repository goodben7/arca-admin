'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Eye, Loader2, Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';
import { FilterBar } from '@/components/layout/FilterBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { getDisciplinaryCases } from '@/lib/api/disciplinaryCase';
import { getSanctionScales } from '@/lib/api/sanctionScale';
import { getAllEmployees } from '@/lib/api/employee';
import { extractId } from '@/lib/api-iri';
import {
    DISCIPLINARY_STATUS_LABELS,
    disciplinaryStatusBadgeVariant,
    type DisciplinaryCase,
    type DisciplinaryStatus,
    type SanctionScale,
} from '@/types/sanctions';

export default function DisciplinaryCasesPage() {
    const [cases, setCases] = useState<DisciplinaryCase[]>([]);
    const [scales, setScales] = useState<SanctionScale[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        Promise.all([
            getDisciplinaryCases(),
            getSanctionScales().catch(() => []),
            getAllEmployees({ itemsPerPage: 500 }).catch(() => []),
        ])
            .then(([c, s, e]) => {
                setCases(c);
                setScales(s);
                setEmployees(Array.isArray(e) ? e : (e as any)['hydra:member'] || []);
            })
            .catch(err => setError(err instanceof Error ? err.message : 'Erreur'))
            .finally(() => setLoading(false));
    }, []);

    const empName = (ref: DisciplinaryCase['employee']) => {
        const id = typeof ref === 'string' ? extractId(ref) : ref?.id;
        const e = employees.find((x: any) => x.id === id || extractId(x['@id'] || '') === id);
        return e ? `${e.firstName} ${e.lastName}` : id || '—';
    };

    const scaleLabel = (ref: DisciplinaryCase['sanctionScale']) => {
        if (typeof ref === 'object' && ref?.label) return ref.label;
        const id = typeof ref === 'string' ? extractId(ref) : ref?.id;
        return scales.find(s => s.id === id)?.label || scales.find(s => s.id === id)?.code || id || '—';
    };

    const filtered = useMemo(() => {
        return cases.filter(c => {
            if (statusFilter && c.status !== statusFilter) return false;
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
                c.id.toLowerCase().includes(q) ||
                empName(c.employee).toLowerCase().includes(q) ||
                scaleLabel(c.sanctionScale).toLowerCase().includes(q) ||
                (c.facts || '').toLowerCase().includes(q)
            );
        });
    }, [cases, search, statusFilter, employees, scales]);

    return (
        <PageShell>
            <PageHeader
                title="Affaires disciplinaires"
                description="Suivi des procédures et transitions de workflow"
                actions={
                    <Link href="/m/sanctions/affaires/create">
                        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Nouvelle affaire</Button>
                    </Link>
                }
            />

            {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    <AlertCircle className="h-4 w-4" /> {error}
                </div>
            )}

            <FilterBar className="mb-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher employé, ID, faits…"
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-surface text-sm"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="h-10 rounded-xl border border-border bg-surface px-3 text-sm"
                >
                    <option value="">Tous les statuts</option>
                    {Object.entries(DISCIPLINARY_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>
            </FilterBar>

            <DataPanel title={`Liste (${filtered.length})`} contentClassName="p-0">
                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
                ) : filtered.length === 0 ? (
                    <p className="py-16 text-center text-sm text-secondary-500">Aucune affaire.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Affaire</TableHead>
                                <TableHead>Employé</TableHead>
                                <TableHead>Échelle</TableHead>
                                <TableHead>Faits (date)</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-mono text-xs text-primary-700">{c.id}</TableCell>
                                    <TableCell className="font-medium">{empName(c.employee)}</TableCell>
                                    <TableCell>{scaleLabel(c.sanctionScale)}</TableCell>
                                    <TableCell className="text-sm text-secondary-600">
                                        {c.occurredAt
                                            ? format(new Date(c.occurredAt), 'd MMM yyyy', { locale: fr })
                                            : '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={disciplinaryStatusBadgeVariant(c.status)}>
                                            {DISCIPLINARY_STATUS_LABELS[c.status as DisciplinaryStatus] ?? c.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/m/sanctions/affaires/${c.id}`}>
                                            <Button variant="ghost" size="sm" className="gap-1"><Eye className="h-3.5 w-3.5" /> Voir</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DataPanel>
        </PageShell>
    );
}
