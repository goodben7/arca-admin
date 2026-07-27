'use client';

import { ModuleOverview } from '@/components/modules/ModuleOverview';
import { getModule } from '@/lib/modules/registry';

const mod = getModule('recrutement')!;

export default function RecrutementOverviewPage() {
    return (
        <ModuleOverview
            module={mod}
            actions={[
                { label: 'Nouvelle demande', href: '/m/recrutement/demandes/create' },
                { label: 'Voir candidatures', href: '/m/recrutement/candidatures' },
            ]}
        />
    );
}
