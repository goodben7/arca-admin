'use client';

import { Suspense } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Loader2 } from 'lucide-react';
import CreateDisciplinaryCaseClient from './CreateDisciplinaryCaseClient';

export default function Page() {
    return (
        <Suspense
            fallback={
                <PageShell>
                    <div className="flex justify-center p-24">
                        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
                    </div>
                </PageShell>
            }
        >
            <CreateDisciplinaryCaseClient />
        </Suspense>
    );
}
