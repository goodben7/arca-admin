'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Preloader } from '@/components/ui/Preloader';

export function DashboardPreloader() {
    const pathname = usePathname();
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // Masquer le preloader après le premier rendu de la page
        const t = setTimeout(() => setVisible(false), 900);
        return () => clearTimeout(t);
    }, [pathname]);

    return <Preloader visible={visible} message="Chargement du tableau de bord…" />;
}
