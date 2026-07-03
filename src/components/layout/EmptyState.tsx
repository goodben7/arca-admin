import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {description && (
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
            )}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
