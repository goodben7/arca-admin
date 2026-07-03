import { cn } from '@/lib/utils';

interface DataPanelProps {
    title?: string;
    description?: string;
    toolbar?: React.ReactNode;
    badge?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
}

export function DataPanel({
    title,
    description,
    toolbar,
    badge,
    children,
    className,
    contentClassName,
}: DataPanelProps) {
    return (
        <div className={cn('rounded-3xl panel-surface panel-accent-top overflow-hidden', className)}>
            {(title || toolbar) && (
                <div className="p-5 md:p-6 panel-header-wash flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        {title && (
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-foreground">{title}</h2>
                                {badge}
                            </div>
                        )}
                        {description && (
                            <p className="text-xs text-muted-foreground mt-0.5 font-medium">{description}</p>
                        )}
                    </div>
                    {toolbar && <div className="flex items-center gap-2 flex-wrap">{toolbar}</div>}
                </div>
            )}
            <div className={cn('p-4 md:p-6', contentClassName)}>
                {children}
            </div>
        </div>
    );
}
