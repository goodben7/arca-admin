'use client';

import { ModuleOverview } from '@/components/modules/ModuleOverview';
import { getModule } from '@/lib/modules/registry';

const mod = getModule('formation')!;

export default function FormationOverviewPage() {
    return (
        <ModuleOverview
            module={mod}
            actions={[
                { label: 'Nouvelle session', href: '/m/formation/sessions/create' },
                { label: 'Catalogue', href: '/m/formation/catalog' },
            ]}
        />
    );
}
