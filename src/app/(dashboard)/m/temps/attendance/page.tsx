'use client';

import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { ComingSoon } from '@/components/modules/ComingSoon';

export default function AttendancePage() {
    return (
        <PageShell>
            <PageHeader
                title="Présences"
                description="Suivi des présences et pointages."
            />
            <ComingSoon
                title="Présences"
                description="Le suivi des présences et pointages sera disponible prochainement. En attendant, utilisez le module Absences pour gérer les congés."
                backHref="/m/temps"
            />
        </PageShell>
    );
}
