import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon?: LucideIcon;
    href?: string;
    accent?: 'primary' | 'default';
    badge?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}

export function StatCard({
    label,
    value,
    sub,
    icon: Icon,
    href,
    accent = 'default',
    badge,
    children,
    className,
}: StatCardProps) {
    const content = (
        <div
            className={cn(
                'relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-0.5',
                accent === 'primary'
                    ? 'bg-primary-500 text-white shadow-card hover:shadow-float'
                    : 'surface-elevated hover:shadow-card',
                className
            )}
        >
            {accent === 'primary' && (
                <>
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-accent-yellow-500/20 blur-xl" />
                </>
            )}
            {accent === 'default' && (
                <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-primary-500/5 blur-2xl" />
            )}
            <div className="relative space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        {Icon && (
                            <div className={cn(
                                'w-9 h-9 rounded-xl flex items-center justify-center',
                                accent === 'primary' ? 'bg-white/15' : 'bg-primary-50 dark:bg-primary-950/40'
                            )}>
                                <Icon className={cn('w-4 h-4', accent === 'primary' ? 'text-white' : 'text-primary-500')} />
                            </div>
                        )}
                        <span className={cn(
                            'text-xs font-semibold',
                            accent === 'primary' ? 'text-white/80' : 'text-muted-foreground'
                        )}>
                            {label}
                        </span>
                    </div>
                    {badge}
                </div>
                <p className={cn(
                    'text-4xl md:text-5xl font-bold tabular-nums tracking-tight leading-none',
                    accent === 'default' && 'text-foreground'
                )}>
                    {value}
                </p>
                {sub && (
                    <p className={cn(
                        'text-xs font-medium',
                        accent === 'primary' ? 'text-white/60' : 'text-muted-foreground'
                    )}>
                        {sub}
                    </p>
                )}
                {children}
            </div>
        </div>
    );

    if (href) return <Link href={href} className="block">{content}</Link>;
    return content;
}
