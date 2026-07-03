'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    CalendarClock,
    FileText,
    Loader2,
    Search,
    AlertCircle,
    ChevronRight,
    Plus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { getAllRecruitmentRequests } from '@/lib/api/recruitment';
import { getDepartments } from '@/lib/api/employee';
import { getAllPositions } from '@/lib/api/position';
import { extractId } from '@/lib/api-iri';
import { RecruitmentRequest, RECRUITMENT_REQUEST_STATUS, STATUS_APPROVED, STATUS_PENDING, STATUS_REJECTED } from '@/types/recruitment';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataPanel } from '@/components/layout/DataPanel';

function normalizeList(data: any): RecruitmentRequest[] {
    if (Array.isArray(data)) return data as RecruitmentRequest[];
    if (Array.isArray(data?.['hydra:member'])) return data['hydra:member'] as RecruitmentRequest[];
    return [];
}

function isPlaceholderText(value?: string) {
    const v = value?.trim();
    return !v || v === '---' || v === '--';
}

function resolveFromMap(value: string, map: Record<string, string>): string {
    const id = extractId(value) || value;
    return map[value] || map[id] || id;
}

export default function RecruitmentPage() {
    const [requests, setRequests] = useState<RecruitmentRequest[]>([]);
    const [departmentsMap, setDepartmentsMap] = useState<Record<string, string>>({});
    const [positionsMap, setPositionsMap] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                setError(null);
                const [data, deptsData, posData] = await Promise.all([
                    getAllRecruitmentRequests(),
                    getDepartments().catch(() => []),
                    getAllPositions().catch(() => []),
                ]);
                setRequests(normalizeList(data));

                const dList = Array.isArray(deptsData) ? deptsData : (deptsData as { 'hydra:member'?: { id: string; name: string; '@id'?: string }[] })['hydra:member'] || [];
                const dMap: Record<string, string> = {};
                dList.forEach(d => { dMap[d.id] = d.name; if (d['@id']) dMap[d['@id']] = d.name; });
                setDepartmentsMap(dMap);

                type PosItem = { id: string; title: string; '@id'?: string };
                const pList: PosItem[] = Array.isArray(posData) ? posData as PosItem[] : (posData as { member?: PosItem[]; 'hydra:member'?: PosItem[] }).member || (posData as { 'hydra:member'?: PosItem[] })['hydra:member'] || [];
                const pMap: Record<string, string> = {};
                pList.forEach(p => { pMap[p.id] = p.title; if (p['@id']) pMap[p['@id']] = p.title; });
                setPositionsMap(pMap);
            } catch (e: any) {
                setError(e?.message || "Erreur lors du chargement des demandes.");
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, []);

    const filtered = requests.filter((r) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        const posLabel = resolveFromMap(r.position, positionsMap).toLowerCase();
        const deptLabel = resolveFromMap(r.department, departmentsMap).toLowerCase();
        return (
            r.id.toLowerCase().includes(q) ||
            (r.justification || '').toLowerCase().includes(q) ||
            deptLabel.includes(q) ||
            posLabel.includes(q) ||
            (r.position || '').toLowerCase().includes(q) ||
            (r.department || '').toLowerCase().includes(q)
        );
    });

    function getStatusVariant(status: string) {
        switch (status) {
            case STATUS_PENDING:
                return { variant: 'warning', className: 'bg-amber-50 text-amber-700 border-amber-100' };
            case STATUS_APPROVED:
                return { variant: 'success', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
            case STATUS_REJECTED:
                return { variant: 'destructive', className: 'bg-rose-50 text-rose-700 border-rose-100' };
            default:
                return { variant: 'outline', className: 'bg-secondary-50 text-secondary-600 border-secondary-100' };
        }
    }

    return (
        <PageShell>
            <PageHeader
                title="Recrutement"
                description="Demandes de postes et validation RH."
                actions={
                    <>
                        <Link href="/recruitment/create">
                            <Button className="gap-2 shadow-xl shadow-primary-200 py-3 px-5 rounded-2xl transition-all active:scale-[0.98]">
                                <Plus className="w-4 h-4" />
                                <span className="font-bold uppercase tracking-widest text-[10px]">
                                    Nouvelle demande
                                </span>
                            </Button>
                        </Link>
                        <Badge className="font-black bg-primary-50 text-primary-600 border-primary-100 px-3 py-1 rounded-lg text-[10px] tracking-widest">
                            {requests.length} demande(s)
                        </Badge>
                    </>
                }
            />

            <DataPanel
                title="Historique des demandes"
                description="Cliquez sur une demande pour approuver ou refuser."
            >
                    <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-secondary-300" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher par département, poste ou justification..."
                                className="pl-12"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                            <p className="text-secondary-400 font-bold uppercase tracking-widest text-[10px]">
                                Chargement des demandes...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="p-12 flex flex-col items-center justify-center gap-4 text-center">
                            <AlertCircle className="w-12 h-12 text-destructive" />
                            <p className="text-secondary-500 font-medium">{error}</p>
                            <Button onClick={() => window.location.reload()} variant="outline">
                                Réessayer
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-secondary-50/50">
                                <TableRow>
                                    <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest">Demande</TableHead>
                                    <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest">Poste</TableHead>
                                    <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest">Statut</TableHead>
                                    <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-right">
                                        Action
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-64 text-center text-secondary-400 font-medium italic">
                                            Aucune demande trouvée.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((req) => {
                                        const statusInfo = getStatusVariant(req.status);
                                        const createdAt = req.createdAt
                                            ? format(new Date(req.createdAt), 'dd MMM yyyy', { locale: fr })
                                            : '-';
                                        const positionId = extractId(req.position) || req.position;
                                        const positionLabel = resolveFromMap(req.position, positionsMap);
                                        const departmentId = extractId(req.department) || req.department;
                                        const departmentLabel = resolveFromMap(req.department, departmentsMap);

                                        return (
                                            <TableRow key={req.id} className="group hover:bg-secondary-50/50 transition-colors">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                                                            <FileText className="w-4 h-4 text-primary-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-secondary-900 uppercase tracking-tighter text-sm">
                                                                {isPlaceholderText(req.justification) ? `Demande ${req.id}` : req.justification}
                                                            </div>
                                                            <div className="text-[10px] font-mono text-secondary-400 mt-0.5">
                                                                {req.id}
                                                            </div>
                                                            <div className="text-[10px] font-black uppercase text-secondary-400 tracking-[0.2em] mt-1 flex items-center gap-2">
                                                                <CalendarClock className="w-3.5 h-3.5" />
                                                                {createdAt}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-bold text-secondary-700">
                                                        {positionLabel}
                                                    </span>
                                                    <div className="text-[10px] font-mono text-secondary-400 mt-0.5">
                                                        {positionId}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-secondary-400 uppercase tracking-wider mt-1">
                                                        {departmentLabel} · {req.numberOfPositions} poste(s)
                                                    </div>
                                                    <div className="text-[10px] font-mono text-secondary-300">
                                                        {departmentId}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={statusInfo.variant as any}
                                                        className={`font-black text-[10px] uppercase py-2 px-3 rounded-xl border shadow-sm ${statusInfo.className}`}
                                                    >
                                                        {req.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/recruitment/${req.id}`}>
                                                        <Button className="h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest bg-primary-600 hover:bg-primary-700 text-white gap-2">
                                                            Voir détails
                                                            <ChevronRight className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    )}
            </DataPanel>
        </PageShell>
    );
}

