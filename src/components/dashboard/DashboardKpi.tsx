import Link from 'next/link';
import { LucideIcon, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardKpiProps {
    label: string;
    value: number | string;
    detail?: string;
    icon: LucideIcon;
    href: string;
    tone?: 'default' | 'primary' | 'warning';
}

export function DashboardKpi({ label, value, detail, icon: Icon, href, tone = 'default' }: DashboardKpiProps) {
    return (
        <Link
            href={href}
            className={cn(
                'group relative flex flex-col justify-between rounded-lg border p-5 min-h-[120px] transition-all hover:shadow-card',
                tone === 'primary' && 'border-primary-200 bg-primary-500 text-white hover:bg-primary-600',
                tone === 'warning' && 'border-amber-200 bg-amber-50 hover:bg-amber-100/80',
                tone === 'default' && 'border-border bg-surface hover:border-primary-200'
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    tone === 'primary' && 'bg-white/20',
                    tone === 'warning' && 'bg-amber-100 text-amber-700',
                    tone === 'default' && 'bg-primary-50 text-primary-500'
                )}>
                    <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className={cn(
                    'w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity',
                    tone === 'primary' ? 'text-white/70' : 'text-muted-foreground'
                )} />
            </div>
            <div className="mt-4">
                <p className={cn(
                    'text-xs font-medium',
                    tone === 'primary' ? 'text-white/80' : 'text-muted-foreground'
                )}>
                    {label}
                </p>
                <p className={cn(
                    'text-3xl font-semibold tabular-nums tracking-tight mt-1',
                    tone === 'warning' && 'text-amber-900',
                    tone === 'default' && 'text-foreground'
                )}>
                    {value}
                </p>
                {detail && (
                    <p className={cn(
                        'text-xs mt-1',
                        tone === 'primary' ? 'text-white/70' : tone === 'warning' ? 'text-amber-800' : 'text-muted-foreground'
                    )}>
                        {detail}
                    </p>
                )}
            </div>
        </Link>
    );
}

interface QuickLinkProps {
    label: string;
    value: number;
    href: string;
    icon: LucideIcon;
}

export function DashboardQuickLink({ label, value, href, icon: Icon }: QuickLinkProps) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-2.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
        >
            <Icon className="w-4 h-4 text-primary-500 shrink-0" />
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold text-foreground tabular-nums">{value}</span>
        </Link>
    );
}
