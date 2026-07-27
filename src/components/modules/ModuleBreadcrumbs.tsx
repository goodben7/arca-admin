'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import type { AppModule } from '@/lib/modules/registry';
import { cn } from '@/lib/utils';

interface ModuleBreadcrumbsProps {
    module: AppModule;
    className?: string;
}

export function ModuleBreadcrumbs({ module, className }: ModuleBreadcrumbsProps) {
    const pathname = usePathname();
    const crumbs: { label: string; href?: string }[] = [
        { label: 'Modules', href: '/apps' },
        { label: module.shortName, href: module.href },
    ];

    const match = module.menu
        .filter(i => i.href !== module.href)
        .sort((a, b) => b.href.length - a.href.length)
        .find(i => pathname === i.href || pathname.startsWith(i.href + '/'));

    if (match) {
        crumbs.push({ label: match.title, href: match.href });
        if (pathname !== match.href) {
            crumbs.push({ label: 'Détail' });
        }
    } else if (pathname !== module.href) {
        crumbs.push({ label: 'Page' });
    }

    return (
        <nav aria-label="Fil d'Ariane" className={cn('flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap', className)}>
            {crumbs.map((c, i) => (
                <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight className="w-3 h-3 opacity-50" />}
                    {c.href && i < crumbs.length - 1 ? (
                        <Link href={c.href} className="hover:text-primary-600 transition-colors">{c.label}</Link>
                    ) : (
                        <span className={i === crumbs.length - 1 ? 'font-medium text-foreground' : ''}>{c.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
