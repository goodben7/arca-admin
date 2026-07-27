'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { AppModule, ModuleMenuItem } from '@/lib/modules/registry';
import { getSectionMeta, SECTION_TONE_STYLES } from '@/lib/modules/sectionMeta';
import { ModuleMenuTile } from './ModuleMenuTile';
import { ModuleOverviewDashboard } from './ModuleOverviewDashboard';
import { cn } from '@/lib/utils';

interface ModuleOverviewProps {
    module: AppModule;
    actions?: { label: string; href: string }[];
    children?: React.ReactNode;
    showDashboard?: boolean;
}

function groupBySection(items: ModuleMenuItem[]) {
    const groups: { section: string; items: ModuleMenuItem[] }[] = [];
    for (const item of items) {
        const section = item.section || 'Général';
        let group = groups.find(g => g.section === section);
        if (!group) {
            group = { section, items: [] };
            groups.push(group);
        }
        group.items.push(item);
    }
    return groups;
}

export function ModuleOverview({ module, actions = [], children, showDashboard = true }: ModuleOverviewProps) {
    const Icon = module.icon;
    const menuItems = module.menu.filter(i => i.href !== module.href);
    const sections = groupBySection(menuItems);

    return (
        <div className="page-enter-stack">
            {/* En-tête module */}
            <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-start gap-4">
                    <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm', module.accent.bg)}>
                        <Icon className="h-6 w-6" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary-400">
                            {module.shortName}
                        </p>
                        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-secondary-900 md:text-[1.65rem]">
                            {module.name}
                        </h1>
                        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-secondary-500">
                            {module.description}
                        </p>
                    </div>
                </div>

                {actions.length > 0 && (
                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
                        {actions.map((a, i) => (
                            <Link
                                key={a.href}
                                href={a.href}
                                className={cn(
                                    'inline-flex h-9 items-center gap-2 rounded-xl px-3.5 text-[13px] font-semibold transition-colors',
                                    i === 0
                                        ? cn('text-white shadow-sm hover:opacity-90', module.accent.bg)
                                        : 'border border-border-subtle bg-surface text-secondary-700 hover:border-primary-200 hover:text-primary-700'
                                )}
                            >
                                {a.label}
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {showDashboard && <ModuleOverviewDashboard module={module} />}

            {/* Sections menu */}
            <div className="mb-4 flex items-center gap-2.5 border-b border-border-subtle/80 pb-2.5">
                <span
                    className="h-8 w-1 shrink-0 rounded-full bg-gradient-to-b from-primary-500 via-accent-red-500 to-accent-yellow-500"
                    aria-hidden
                />
                <div>
                    <h2 className="text-[13px] font-semibold text-secondary-900">Fonctions du module</h2>
                    <p className="text-[11px] text-secondary-400">Accès rapide aux écrans</p>
                </div>
            </div>
            {sections.map(group => (
                <section key={group.section} className="mb-9 last:mb-2">
                    <SectionHead title={group.section} />
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 apps-tile-grid">
                        {group.items.map(item => (
                            <ModuleMenuTile key={item.href} item={item} module={module} section={group.section} />
                        ))}
                    </div>
                </section>
            ))}

            {children}
        </div>
    );
}

function SectionHead({ title }: { title: string }) {
    const meta = getSectionMeta(title);
    const tone = SECTION_TONE_STYLES[meta.tone];
    const SectionIcon = meta.icon;

    return (
        <div className="flex items-end justify-between gap-3 border-b border-border-subtle/80 pb-2.5">
            <div className="flex items-center gap-2.5">
                <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', tone.iconBg, tone.iconText)}>
                    <SectionIcon className="h-4 w-4" strokeWidth={2} />
                </span>
                <h2 className="text-[13px] font-semibold text-secondary-900">{title}</h2>
            </div>
        </div>
    );
}
