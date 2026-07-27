'use client';

import { ComingSoon } from '@/components/modules/ComingSoon';

export default function SettingsPage() {
    return (
        <ComingSoon
            title="Paramètres"
            description="Préférences utilisateur et configuration système."
            backHref="/m/securite"
        />
    );
}
