'use client';

import {
    Clock,
    MapPin,
    Monitor,
    Home,
    Calendar,
    ChevronLeft,
    ChevronRight,
    UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/Table';
import { cn } from '@/lib/utils';

const ATTENDANCE = [
    { id: 1, employee: 'Jean Dupont', date: 'Mardi 10 Mars 2026', timeIn: '08:52', timeOut: '17:45', status: 'Présent', mode: 'Bureau' },
    { id: 2, employee: 'Marie Laurent', date: 'Mardi 10 Mars 2026', timeIn: '09:05', timeOut: '-', status: 'Présent', mode: 'Remote' },
    { id: 3, employee: 'Thomas Rivard', date: 'Mardi 10 Mars 2026', timeIn: '-', timeOut: '-', status: 'Absent', mode: '-' },
    { id: 4, employee: 'Sophie Martin', date: 'Mardi 10 Mars 2026', timeIn: '08:15', timeOut: '17:00', status: 'Présent', mode: 'Bureau' },
    { id: 5, employee: 'Lucas Petit', date: 'Mardi 10 Mars 2026', timeIn: '09:30', timeOut: '-', status: 'Présent', mode: 'Remote' },
];

export default function AttendancePage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">Suivi des Présences</h1>
                    <p className="text-secondary-500 font-medium">Contrôlez les entrées/sorties et le télétravail en temps réel.</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-secondary-100">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="w-4 h-4" /></Button>
                    <div className="px-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary-600" />
                        <span className="text-sm font-bold text-secondary-900 leading-none">Aujourd'hui, 10 Mars</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="w-4 h-4" /></Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AttendanceStat label="Taux de présence" value="92%" icon={UserCheck} color="text-emerald-600" />
                <AttendanceStat label="En Télétravail" value="18 pers." icon={Home} color="text-primary-600" />
                <AttendanceStat label="Retards signalés" value="2" icon={Clock} color="text-amber-600" />
            </div>

            <Card className="overflow-hidden border-none shadow-xl shadow-secondary-200/50">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Collaborateur</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead>Arrivée</TableHead>
                            <TableHead>Départ</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ATTENDANCE.map((att) => (
                            <TableRow key={att.id}>
                                <TableCell className="font-bold text-secondary-900">{att.employee}</TableCell>
                                <TableCell>
                                    <Badge variant={att.status === 'Présent' ? 'success' : 'destructive'} size="sm">
                                        {att.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-secondary-600 font-medium">
                                        {att.mode === 'Bureau' ? <Monitor className="w-3 h-3" /> : att.mode === 'Remote' ? <Home className="w-3 h-3" /> : null}
                                        <span className="text-xs">{att.mode || '-'}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium tabular-nums text-secondary-500">{att.timeIn}</TableCell>
                                <TableCell className="font-medium tabular-nums text-secondary-400">{att.timeOut}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="font-bold text-primary-600">Détails</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}

function AttendanceStat({ label, value, icon: Icon, color }: any) {
    return (
        <Card className="border-none shadow-md shadow-secondary-100 p-6 bg-white flex items-center gap-4">
            <div className={cn("p-3 rounded-2xl bg-secondary-50", color)}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest mb-1">{label}</p>
                <h3 className="text-2xl font-black text-secondary-900">{value}</h3>
            </div>
        </Card>
    );
}
