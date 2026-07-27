import { LucideIcon, Loader2, AlertCircle, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StateBlockProps {
    variant: 'loading' | 'error' | 'empty';
    title?: string;
    description?: string;
    icon?: LucideIcon;
    action?: React.ReactNode;
    className?: string;
}

const defaults: Record<StateBlockProps['variant'], { title: string; icon: LucideIcon }> = {
    loading: { title: 'Chargement en cours…', icon: Loader2 },
    error: { title: 'Une erreur est survenue', icon: AlertCircle },
    empty: { title: 'Aucun résultat', icon: Inbox },
};

/**
 * Bloc d'état unifié (chargement / erreur / vide) — remplace les blocs
 * ad-hoc sur-stylés pour une cohérence visuelle à travers les modules.
 */
export function StateBlock({ variant, title, description, icon, action, className }: StateBlockProps) {
    const Icon = variant === 'loading' ? Loader2 : (icon ?? defaults[variant].icon);
    const resolvedTitle = title ?? defaults[variant].title;

    const tone =
        variant === 'error'
            ? 'bg-rose-50 text-rose-500'
            : variant === 'loading'
                ? 'bg-primary-50 text-primary-500'
                : 'bg-secondary-100 text-secondary-400';

    return (
        <div className={cn('flex flex-col items-center justify-center gap-4 px-6 py-16 text-center', className)}>
            <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl', tone)}>
                <Icon className={cn('h-7 w-7', variant === 'loading' && 'animate-spin')} />
            </div>
            <div>
                <p className="text-base font-semibold text-foreground">{resolvedTitle}</p>
                {description && (
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
