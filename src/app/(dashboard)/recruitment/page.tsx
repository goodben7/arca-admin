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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { getAllRecruitmentRequests } from '@/lib/api/recruitment';
import { RecruitmentRequest, RECRUITMENT_REQUEST_STATUS, STATUS_APPROVED, STATUS_PENDING, STATUS_REJECTED } from '@/types/recruitment';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function normalizeList(data: any): RecruitmentRequest[] {
    if (Array.isArray(data)) return data as RecruitmentRequest[];
    if (Array.isArray(data?.['hydra:member'])) return data['hydra:member'] as RecruitmentRequest[];
    return [];
}

export default function RecruitmentPage() {
    const [requests, setRequests] = useState<RecruitmentRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getAllRecruitmentRequests();
                setRequests(normalizeList(data));
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
        return (
            (r.justification || '').toLowerCase().includes(q) ||
            (r.department || '').toLowerCase().includes(q) ||
            (r.position || '').toLowerCase().includes(q)
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-secondary-900 uppercase tracking-tighter">Recrutement</h1>
                    <p className="text-secondary-500 font-medium italic">
                        Demandes de postes et validation RH.
                    </p>
                </div>
                <div className="flex items-center gap-3">
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
                </div>
            </div>

            <Card className="overflow-hidden border-none shadow-xl shadow-secondary-200/50 animate-in fade-in">
                <CardHeader className="border-b border-secondary-100 bg-white">
                    <CardTitle className="text-secondary-900 font-black uppercase tracking-tight text-lg">
                        Historique des demandes
                    </CardTitle>
                    <CardDescription className="text-secondary-500 font-medium italic">
                        Cliquez sur une demande pour approuver ou refuser.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
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

                                        return (
                                            <TableRow key={req.id} className="group hover:bg-secondary-50/50 transition-colors">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                                                            <FileText className="w-4 h-4 text-primary-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-secondary-900 uppercase tracking-tighter text-sm">
                                                                {req.justification ? req.justification : `Demande ${req.id}`}
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
                                                        {req.position}
                                                    </span>
                                                    <div className="text-[10px] font-bold text-secondary-400 uppercase tracking-wider mt-1">
                                                        {req.numberOfPositions} poste(s)
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
                </CardContent>
            </Card>
        </div>
    );
}

