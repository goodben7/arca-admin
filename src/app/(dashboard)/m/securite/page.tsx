'use client';

import { ModuleOverview } from '@/components/modules/ModuleOverview';
import { getModule } from '@/lib/modules/registry';

const mod = getModule('securite')!;

export default function SecuriteOverviewPage() {
    return (
        <ModuleOverview
            module={mod}
            actions={[
                { label: 'Utilisateurs', href: '/m/securite/users' },
                { label: 'Profils', href: '/m/securite/profiles' },
            ]}
        />
    );
}
