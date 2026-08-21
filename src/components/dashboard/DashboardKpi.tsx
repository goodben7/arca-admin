import Link from 'next/link';
import { LucideIcon, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardKpiProps {
    label: string;
    value: number | string;
    detail?: string;
    icon: LucideIcon;
    href: string;
    tone?: 'default' | 'primary' | 'warning' | 'success' | 'danger';
}

const KPI_TONE = {
    primary: {
        card: 'border-primary-700/20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white shadow-[0_4px_12px_-6px_rgba(0,75,97,0.28)]',
        glow: 'bg-white/10',
        icon: 'bg-white/12 ring-1 ring-white/15 text-white',
        label: 'text-white/65',
        detail: 'text-white/70',
        arrow: 'text-white/55',
        value: 'text-white',
    },
    success: {
        card: 'border-teal-700/20 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white shadow-[0_4px_12px_-6px_rgba(15,118,110,0.26)]',
        glow: 'bg-white/10',
        icon: 'bg-white/12 ring-1 ring-white/15 text-white',
        label: 'text-white/65',
        detail: 'text-teal-50/80',
        arrow: 'text-white/55',
        value: 'text-white',
    },
    warning: {
        card: 'border-amber-400/25 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-amber-950 shadow-[0_4px_12px_-6px_rgba(180,140,40,0.28)]',
        glow: 'bg-white/20',
        icon: 'bg-amber-950/10 ring-1 ring-amber-950/8 text-amber-950',
        label: 'text-amber-950/60',
        detail: 'text-amber-950/70',
        arrow: 'text-amber-950/50',
        value: 'text-amber-950',
    },
    danger: {
        card: 'border-rose-800/20 bg-gradient-to-br from-rose-700 via-rose-800 to-[#7a2e38] text-white shadow-[0_4px_12px_-6px_rgba(120,40,48,0.28)]',
        glow: 'bg-white/8',
        icon: 'bg-white/12 ring-1 ring-white/15 text-white',
        label: 'text-white/65',
        detail: 'text-rose-50/80',
        arrow: 'text-white/55',
        value: 'text-white',
    },
    default: {
        card: 'border-white bg-white text-secondary-900 shadow-sm hover:border-primary-200',
        glow: 'bg-primary-400/10',
        icon: 'bg-primary-50 text-primary-700',
        label: 'text-secondary-400',
        detail: 'text-secondary-500',
        arrow: 'text-secondary-400',
        value: 'text-secondary-950',
    },
} as const;

export function DashboardKpi({ label, value, detail, icon: Icon, href, tone = 'default' }: DashboardKpiProps) {
    const styles = KPI_TONE[tone];

    return (
        <Link
            href={href}
            className={cn(
                'group relative flex flex-col justify-between overflow-hidden rounded-[1.35rem] border p-5 min-h-[142px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md',
                styles.card,
            )}
        >
            <div className={cn('pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full blur-3xl', styles.glow)} />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40" />

            <div className="relative flex items-start justify-between gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', styles.icon)}>
                    <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className={cn(
                    'h-4 w-4 opacity-50 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
                    styles.arrow,
                )} />
            </div>

            <div className="relative mt-5">
                <p className={cn('text-[10px] font-bold uppercase tracking-[0.16em]', styles.label)}>
                    {label}
                </p>
                <p className={cn('mt-1.5 text-[2rem] font-black tabular-nums tracking-tight leading-none', styles.value)}>
                    {value}
                </p>
                {detail && (
                    <p className={cn('mt-2 text-xs font-medium leading-snug', styles.detail)}>
                        {detail}
                    </p>
                )}
            </div>
        </Link>
    );
}

const BADGE_TONES = {
    blue: 'bg-primary-50 text-primary-700',
    green: 'bg-emerald-50 text-emerald-700',
    orange: 'bg-amber-50 text-amber-800',
    red: 'bg-rose-50 text-accent-red-700',
    teal: 'bg-cyan-50 text-cyan-700',
    yellow: 'bg-amber-50 text-amber-800',
} as const;

interface DashboardModuleCardProps {
    title: string;
    value: number | string;
    description: string;
    badge: string;
    badgeTone?: keyof typeof BADGE_TONES;
    href: string;
    icon: LucideIcon;
    tint?: string;
}

export function DashboardModuleCard({
    title,
    value,
    description,
    badge,
    badgeTone = 'blue',
    href,
    icon: Icon,
    tint = 'bg-primary-50 text-primary-700',
}: DashboardModuleCardProps) {
    return (
        <Link
            href={href}
            className="group relative flex flex-col justify-between overflow-hidden rounded-[1.35rem] border border-secondary-100 bg-white p-5 min-h-[148px] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-3">
                <p className="text-[1.75rem] font-black tabular-nums tracking-tight text-secondary-950 leading-none">
                    {value}
                </p>
                <span className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                    tint,
                )}>
                    <Icon className="h-4 w-4" />
                </span>
            </div>
            <div className="mt-4">
                <p className="text-[15px] font-bold text-secondary-900">{title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-secondary-500">{description}</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
                <span className={cn(
                    'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                    BADGE_TONES[badgeTone],
                )}>
                    {badge}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-secondary-300 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary-500" />
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
            className="inline-flex items-center gap-2.5 rounded-xl border border-white/80 bg-white/80 px-3.5 py-2 text-sm shadow-sm hover:border-primary-300 hover:bg-primary-50/70 transition-all"
        >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Icon className="w-3.5 h-3.5" />
            </span>
            <span className="text-muted-foreground font-medium">{label}</span>
            <span className="font-bold text-foreground tabular-nums">{value}</span>
        </Link>
    );
}
