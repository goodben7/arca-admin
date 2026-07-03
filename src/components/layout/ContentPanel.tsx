import { cn } from '@/lib/utils';

interface ContentPanelProps {
    children: React.ReactNode;
    className?: string;
}

export function ContentPanel({ children, className }: ContentPanelProps) {
    return (
        <div className={cn('rounded-2xl panel-surface panel-accent-top overflow-hidden shadow-card', className)}>
            {children}
        </div>
    );
}
