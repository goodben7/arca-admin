'use client';

import { ModuleOverview } from '@/components/modules/ModuleOverview';
import { getModule } from '@/lib/modules/registry';

const mod = getModule('personnel')!;

export default function PersonnelOverviewPage() {
    return (
        <ModuleOverview
            module={mod}
            actions={[
                { label: 'Nouvel employé', href: '/m/personnel/employees/create' },
                { label: 'Nouveau contrat', href: '/m/personnel/contracts/create' },
            ]}
        />
    );
}
