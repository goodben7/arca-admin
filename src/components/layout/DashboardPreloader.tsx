'use client';

import { useEffect, useState } from 'react';
import { Preloader } from '@/components/ui/Preloader';

export function DashboardPreloader() {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const hide = () => setVisible(false);
        const t = window.setTimeout(hide, 800);
        const failsafe = window.setTimeout(hide, 2500);
        return () => {
            window.clearTimeout(t);
            window.clearTimeout(failsafe);
        };
    }, []);

    return <Preloader visible={visible} message="Chargement du tableau de bord…" />;
}
