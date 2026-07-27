'use client';

import { ModuleOverview } from '@/components/modules/ModuleOverview';
import { getModule } from '@/lib/modules/registry';

const mod = getModule('paie')!;

export default function PaieOverviewPage() {
    return (
        <ModuleOverview
            module={mod}
            actions={[
                { label: 'Enregistrer une compensation', href: '/m/paie/compensation' },
                { label: 'Nouvel avantage', href: '/m/paie/benefits' },
            ]}
        />
    );
}
