'use client';

import { ReactNode } from 'react';
import { Construction } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface ComingSoonProps {
    title: string;
    description?: string;
    backHref?: string;
}

export function ComingSoon({ title, description, backHref = '/apps' }: ComingSoonProps) {
    return (
        <div className="rounded-2xl border border-border-subtle bg-surface shadow-card py-20 px-6 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Construction className="w-7 h-7 text-secondary-400" />
            </div>
            <div>
                <h1 className="text-xl font-semibold text-foreground">{title}</h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    {description || 'Ce module sera disponible prochainement.'}
                </p>
            </div>
            <Link href={backHref}>
                <Button variant="outline">Retour</Button>
            </Link>
        </div>
    );
}
