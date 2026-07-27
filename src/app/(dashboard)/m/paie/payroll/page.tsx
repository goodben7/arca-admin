'use client';

import { ComingSoon } from '@/components/modules/ComingSoon';

export default function PayrollPage() {
    return (
        <ComingSoon
            title="Paie"
            description="Le calcul de paie, bulletins PDF et déclarations seront disponibles prochainement."
            backHref="/m/paie"
        />
    );
}
