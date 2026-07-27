'use client';

import { ModuleOverview } from '@/components/modules/ModuleOverview';
import { getModule } from '@/lib/modules/registry';

const mod = getModule('temps')!;

export default function TempsOverviewPage() {
    return (
        <ModuleOverview
            module={mod}
            actions={[{ label: 'Nouvelle demande de congé', href: '/m/temps/leave/create' }]}
        />
    );
}
