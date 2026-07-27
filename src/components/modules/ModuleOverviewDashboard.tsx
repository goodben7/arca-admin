'use client';

import { Loader2 } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { AppModule } from '@/lib/modules/registry';
import { DashboardKpi } from '@/components/dashboard/DashboardKpi';
import { DashboardActionInbox } from '@/components/dashboard/DashboardActionInbox';
import { ChartTooltip } from '@/components/dashboard/ChartTooltip';
import { getKpiIcon, useModuleDashboard } from '@/hooks/useModuleDashboard';

interface ModuleOverviewDashboardProps {
    module: AppModule;
}

export function ModuleOverviewDashboard({ module }: ModuleOverviewDashboardProps) {
    const { loading, kpis, alerts, chart } = useModuleDashboard(module.slug);

    if (!loading && kpis.length === 0) return null;

    return (
        <section className="mb-9" aria-label="Indicateurs du module">
            <div className="mb-4 flex items-center gap-2.5 border-b border-border-subtle/80 pb-2.5">
                <span
                    className="h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-primary-500 via-accent-red-500 to-accent-yellow-500"
                    aria-hidden
                />
                <div>
                    <h2 className="text-[13px] font-semibold text-secondary-900">Indicateurs clés</h2>
                    <p className="text-[11px] text-secondary-400">Vue synthétique du module</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-border-subtle/80 bg-surface/80 py-14 backdrop-blur-[2px]">
                    <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                    <span className="text-sm text-secondary-500">Chargement des indicateurs…</span>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 kpi-enter-stack">
                        {kpis.map((kpi, i) => (
                            <DashboardKpi
                                key={kpi.label}
                                label={kpi.label}
                                value={kpi.value}
                                detail={kpi.detail}
                                href={kpi.href}
                                icon={getKpiIcon(module.slug, i)}
                                tone={kpi.tone}
                            />
                        ))}
                    </div>

                    {(chart || alerts.length > 0) && (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {chart && chart.data.length > 0 && (
                                <div className="rounded-2xl border border-border-subtle/80 bg-surface/90 p-5 shadow-sm backdrop-blur-[2px]">
                                    <h3 className="text-sm font-semibold text-secondary-900">{chart.title}</h3>
                                    <div className="mt-4 h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={chart.data}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={48}
                                                    outerRadius={72}
                                                    paddingAngle={3}
                                                >
                                                    {chart.data.map(entry => (
                                                        <Cell key={entry.name} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<ChartTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-3">
                                        {chart.data.map(d => (
                                            <div key={d.name} className="flex items-center gap-1.5 text-xs text-secondary-500">
                                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                                                {d.name} ({d.value})
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <DashboardActionInbox
                                items={alerts}
                                pendingCount={alerts.length}
                            />
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
