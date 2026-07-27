'use client';

import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import type { AppModule, ModuleMenuItem } from '@/lib/modules/registry';
import { cn } from '@/lib/utils';

interface ModuleMenuTileProps {
    item: ModuleMenuItem;
    module: AppModule;
    section?: string;
}

export function ModuleMenuTile({ item, module, section }: ModuleMenuTileProps) {
    const ItemIcon = item.icon ?? LayoutGrid;

    return (
        <Link
            href={item.href}
            className="group relative flex items-start gap-4 rounded-2xl border border-border-subtle/80 bg-surface/90 p-4 backdrop-blur-[2px] shadow-sm transition-all duration-200 hover:border-primary-200 hover:bg-surface hover:shadow-float hover:-translate-y-0.5"
        >
            <div
                className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover:scale-[1.03]',
                    module.accent.bg
                )}
            >
                <ItemIcon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
                <h3 className="truncate text-[15px] font-semibold tracking-tight text-secondary-900 group-hover:text-primary-700">
                    {item.title}
                </h3>
                {section && (
                    <p className="mt-1 truncate text-[12px] text-secondary-500">{section}</p>
                )}
            </div>
        </Link>
    );
}
