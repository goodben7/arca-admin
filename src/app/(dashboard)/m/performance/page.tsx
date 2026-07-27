'use client';

import { ModuleOverview } from '@/components/modules/ModuleOverview';
import { getModule } from '@/lib/modules/registry';

const mod = getModule('performance')!;

export default function PerformanceOverviewPage() {
    return (
        <ModuleOverview
            module={mod}
            actions={[
                { label: 'Cycles d\'évaluation', href: '/m/performance/cycles' },
                { label: 'Objectifs', href: '/m/performance/objectifs' },
                { label: 'Évaluations', href: '/m/performance/evaluations' },
            ]}
        />
    );
}
