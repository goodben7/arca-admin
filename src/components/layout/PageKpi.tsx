import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PageKpiTone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface PageKpiItem {
    label: string;
    value: number | string;
    detail?: string;
    icon: LucideIcon;
    tone?: PageKpiTone;
}

const toneStyles: Record<PageKpiTone, { card: string; icon: string; value: string; label: string }> = {
    default: {
        card: 'border-border/80 bg-gradient-to-br from-white via-white to-secondary-50/80',
        icon: 'bg-secondary-100 text-secondary-600 ring-1 ring-secondary-200/80',
        value: 'text-foreground',
        label: 'text-muted-foreground',
    },
    primary: {
        card: 'border-primary-200/70 bg-gradient-to-br from-primary-50/90 via-white to-primary-50/30',
        icon: 'bg-primary-100 text-primary-600 ring-1 ring-primary-200/80',
        value: 'text-primary-700',
        label: 'text-primary-600/80',
    },
    success: {
        card: 'border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/20',
        icon: 'bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200/80',
        value: 'text-emerald-700',
        label: 'text-emerald-600/80',
    },
    warning: {
        card: 'border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/20',
        icon: 'bg-amber-100 text-amber-600 ring-1 ring-amber-200/80',
        value: 'text-amber-700',
        label: 'text-amber-600/80',
    },
    danger: {
        card: 'border-rose-200/70 bg-gradient-to-br from-rose-50/80 via-white to-rose-50/20',
        icon: 'bg-rose-100 text-rose-600 ring-1 ring-rose-200/80',
        value: 'text-rose-700',
        label: 'text-rose-600/80',
    },
    info: {
        card: 'border-sky-200/70 bg-gradient-to-br from-sky-50/80 via-white to-sky-50/20',
        icon: 'bg-sky-100 text-sky-600 ring-1 ring-sky-200/80',
        value: 'text-sky-700',
        label: 'text-sky-600/80',
    },
};

interface PageKpiStripProps {
    items: PageKpiItem[];
    className?: string;
}

export function PageKpiStrip({ items, className }: PageKpiStripProps) {
    const colClass =
        items.length === 3 ? 'sm:grid-cols-2 xl:grid-cols-3' :
        items.length === 2 ? 'sm:grid-cols-2' :
        'sm:grid-cols-2 xl:grid-cols-4';

    return (
        <div className={cn('grid grid-cols-1 gap-4', colClass, 'kpi-enter-stack', className)}>
            {items.map((item) => {
                const tone = item.tone ?? 'default';
                const styles = toneStyles[tone];
                const Icon = item.icon;

                return (
                    <div
                        key={item.label}
                        className={cn(
                            'panel-surface panel-accent-top rounded-2xl p-5 flex items-start gap-4 transition-all hover:shadow-float',
                            styles.card
                        )}
                    >
                        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', styles.icon)}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className={cn('text-xs font-medium', styles.label)}>{item.label}</p>
                            <p className={cn('text-2xl md:text-3xl font-bold tabular-nums tracking-tight mt-1', styles.value)}>
                                {item.value}
                            </p>
                            {item.detail && (
                                <p className="text-xs text-muted-foreground mt-1 truncate">{item.detail}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

interface PageInsightPanelProps {
    title: string;
    description?: string;
    badge?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export function PageInsightPanel({ title, description, badge, children, className }: PageInsightPanelProps) {
    return (
        <div className={cn('panel-surface panel-accent-top rounded-2xl overflow-hidden shadow-card', className)}>
            <div className="panel-header-wash px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                    {description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                    )}
                </div>
                {badge}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}
