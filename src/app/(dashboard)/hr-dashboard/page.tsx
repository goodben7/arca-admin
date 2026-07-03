'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, LayoutDashboard, Users, TrendingDown, TrendingUp, GraduationCap, Network, Target, AlertTriangle } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { getHrDashboard } from '@/lib/api/hrDashboard';
import { HrDashboard } from '@/types/succession';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface KpiCardProps {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
    color?: string;
}

function KpiCard({ label, value, icon: Icon, description, color = 'text-primary-600' }: KpiCardProps) {
    return (
        <Card className="p-6">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-secondary-500 uppercase tracking-wide">{label}</p>
                    <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                    {description && <p className="text-xs text-secondary-400 mt-1">{description}</p>}
                </div>
                <div className={`w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
            </div>
        </Card>
    );
}

export default function HrDashboardPage() {
    const [data, setData] = useState<HrDashboard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setData(await getHrDashboard());
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Erreur de chargement.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    return (
        <PageShell>
            <PageHeader
                title="Tableau de bord RH"
                description="Vue d'ensemble des indicateurs clés des ressources humaines."
            />

            {isLoading ? (
                <div className="p-32 flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                    <p className="text-sm text-muted-foreground">Chargement des indicateurs...</p>
                </div>
            ) : error ? (
                <div className="p-20 flex flex-col items-center gap-6 text-center">
                    <div className="w-20 h-20 bg-rose-50 rounded-xl flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-rose-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-lg text-secondary-900">Données indisponibles</p>
                        <p className="text-secondary-500 mt-2">{error}</p>
                    </div>
                    <Button variant="outline" onClick={load}>Réessayer</Button>
                </div>
            ) : data ? (
                <div className="space-y-6">
                    <div>
                        <h2 className="text-sm font-semibold text-secondary-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4" />Effectifs & Turnover
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <KpiCard label="Effectif total" value={data.headcount} icon={Users} description="Collaborateurs actifs" />
                            <KpiCard label="Départs (12 mois)" value={data.departuresLast12Months} icon={TrendingDown} color="text-rose-600" description="Sorties sur la période" />
                            <KpiCard label="Taux de turnover" value={`${data.turnoverRatePercent.toFixed(1)}%`} icon={TrendingDown} color={data.turnoverRatePercent > 15 ? 'text-rose-600' : 'text-emerald-600'} description={`Sur ${data.periodMonths} mois`} />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold text-secondary-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />Mobilité & Carrière
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <KpiCard label="Promotions (12 mois)" value={data.promotionsLast12Months} icon={TrendingUp} color="text-emerald-600" description="Évolutions internes" />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold text-secondary-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />Formation
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <KpiCard label="Formations en cours" value={data.trainingsInProgress} icon={GraduationCap} color="text-primary-600" />
                            <KpiCard label="Certifiés (12 mois)" value={data.trainingsCertifiedLast12Months} icon={GraduationCap} color="text-emerald-600" description="Formations complètes" />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold text-secondary-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <Network className="w-4 h-4" />Succession & Compétences
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <KpiCard label="Postes critiques" value={`${data.criticalJobRolesCovered}/${data.criticalJobRolesTotal}`} icon={Network} color="text-primary-600" description="Avec successeur identifié" />
                            <KpiCard label="Couverture succession" value={`${data.successionCoveragePercent.toFixed(0)}%`} icon={Target} color={data.successionCoveragePercent >= 80 ? 'text-emerald-600' : 'text-amber-600'} />
                            <KpiCard label="Lacunes critiques" value={data.criticalSkillGaps} icon={AlertTriangle} color={data.criticalSkillGaps > 5 ? 'text-rose-600' : 'text-amber-600'} description="Compétences manquantes" />
                        </div>
                    </div>

                    <p className="text-xs text-secondary-400 text-right">
                        Données calculées le {format(new Date(data.computedAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                </div>
            ) : null}
        </PageShell>
    );
}
