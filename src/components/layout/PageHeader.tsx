import Link from 'next/link';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    backHref?: string;
    leading?: React.ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    actions,
    breadcrumbs,
    backHref,
    leading,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn('page-header-surface space-y-3', className)}>
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Fil d'Ariane">
                    {breadcrumbs.map((item, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                            {i > 0 && <ChevronRight className="w-3 h-3" />}
                            {item.href ? (
                                <Link href={item.href} className="hover:text-primary-600 transition-colors">
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-foreground font-medium">{item.label}</span>
                            )}
                        </span>
                    ))}
                </nav>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    {backHref && (
                        <Link
                            href={backHref}
                            className="mt-1 w-9 h-9 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors shrink-0"
                            aria-label="Retour"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    )}
                    {leading}
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{title}</h1>
                        {description && (
                            <p className="text-sm text-muted-foreground mt-1 font-medium">{description}</p>
                        )}
                    </div>
                </div>
                {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
            </div>
        </div>
    );
}
