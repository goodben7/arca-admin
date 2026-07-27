'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ListViewProps {
    children: ReactNode;
    isLoading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    empty?: ReactNode;
    isEmpty?: boolean;
    className?: string;
    dense?: boolean;
}

export function ListView({
    children,
    isLoading,
    error,
    onRetry,
    empty,
    isEmpty,
    className,
    dense,
}: ListViewProps) {
    if (isLoading) {
        return (
            <div className="rounded-2xl border border-border-subtle bg-surface shadow-card py-24 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-border-subtle bg-surface shadow-card py-16 flex flex-col items-center gap-4 text-center px-6">
                <AlertCircle className="w-10 h-10 text-rose-500" />
                <p className="text-sm text-secondary-600">{error}</p>
                {onRetry && <Button variant="outline" onClick={onRetry}>Réessayer</Button>}
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="rounded-2xl border border-border-subtle bg-surface shadow-card py-16 flex flex-col items-center justify-center px-6">
                {empty || <p className="text-sm text-muted-foreground">Aucun élément.</p>}
            </div>
        );
    }

    return (
        <div className={cn(
            'rounded-2xl border border-border-subtle bg-surface shadow-card overflow-hidden',
            dense && 'text-sm',
            className
        )}>
            {children}
        </div>
    );
}
