import { cn } from '@/lib/utils';

interface FilterBarProps {
    children: React.ReactNode;
    className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
    return (
        <div className={cn(
            'flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-2xl filter-bar-surface shadow-card',
            className
        )}>
            {children}
        </div>
    );
}
