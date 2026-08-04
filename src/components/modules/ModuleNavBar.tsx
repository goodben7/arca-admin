'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown, Grid3X3, LayoutGrid, Menu, X } from 'lucide-react';
import type { AppModule, ModuleMenuItem } from '@/lib/modules/registry';
import { splitModuleMenu, type ModuleMenuSection } from '@/lib/modules/menu';
import { getSectionMeta, SECTION_TONE_STYLES } from '@/lib/modules/sectionMeta';
import { AnchoredDropdown } from '@/components/ui/AnchoredDropdown';
import { cn } from '@/lib/utils';

interface ModuleNavBarProps {
    module: AppModule;
}

export function ModuleNavBar({ module }: ModuleNavBarProps) {
    const pathname = usePathname();
    const { overviewItems, sections } = useMemo(() => splitModuleMenu(module), [module]);
    const [openSection, setOpenSection] = useState<string | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const Icon = module.icon;

    useEffect(() => {
        setOpenSection(null);
        setMobileOpen(false);
    }, [pathname, module.slug]);

    function isItemActive(item: ModuleMenuItem) {
        if (item.href === module.href) return pathname === module.href;
        return pathname === item.href || pathname.startsWith(item.href + '/');
    }

    function sectionHasActive(section: ModuleMenuSection) {
        return section.items.some(isItemActive);
    }

    return (
        <div className="relative flex h-12 items-center gap-1.5 border-t border-border-subtle/80 px-3 md:gap-2 md:px-5">
            {/* Identité module */}
            <div className="mr-1 flex shrink-0 items-center gap-2">
                <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-sm', module.accent.bg)}>
                    <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="hidden text-[13px] font-semibold text-secondary-900 sm:inline">
                    {module.shortName}
                </span>
            </div>

            <div className="hidden h-5 w-px shrink-0 bg-border-subtle sm:block" />

            {/* Desktop nav */}
            <nav className="hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto pb-0.5 lg:flex">
                {overviewItems.map(item => (
                    <NavLink
                        key={item.href}
                        item={item}
                        module={module}
                        active={isItemActive(item)}
                    />
                ))}

                {sections.map(section => (
                    <SectionDropdown
                        key={section.label}
                        section={section}
                        module={module}
                        open={openSection === section.label}
                        hasActive={sectionHasActive(section)}
                        isItemActive={isItemActive}
                        onToggle={() => setOpenSection(v => v === section.label ? null : section.label)}
                        onClose={() => setOpenSection(null)}
                    />
                ))}
            </nav>

            {/* Tablet / mobile trigger */}
            <button
                type="button"
                onClick={() => setMobileOpen(v => !v)}
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[13px] font-medium lg:hidden',
                    mobileOpen ? cn(module.accent.soft, module.accent.text) : 'text-secondary-700 hover:bg-muted',
                )}
            >
                <Menu className="h-4 w-4" />
                Menu
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', mobileOpen && 'rotate-180')} />
            </button>

            <Link
                href="/apps"
                className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[12px] font-medium text-secondary-500 hover:bg-primary-50 hover:text-primary-700"
            >
                <Grid3X3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tous les modules</span>
            </Link>

            {/* Mobile panel */}
            {mobileOpen && (
                <>
                    <div
                        className="fixed inset-0 z-30 bg-secondary-950/20 lg:hidden"
                        aria-hidden
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-full z-40 max-h-[70vh] overflow-y-auto border-b border-border-subtle bg-surface p-3 shadow-float lg:hidden">
                        <div className="mb-2 flex items-center justify-between px-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-secondary-400">
                                {module.shortName}
                            </p>
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-0.5">
                            {overviewItems.map(item => (
                                <MobileLink
                                    key={item.href}
                                    item={item}
                                    module={module}
                                    active={isItemActive(item)}
                                    onNavigate={() => setMobileOpen(false)}
                                />
                            ))}
                        </div>
                        {sections.map(section => {
                            const meta = getSectionMeta(section.label);
                            const tone = SECTION_TONE_STYLES[meta.tone];
                            const SectionIcon = meta.icon;
                            return (
                                <div key={section.label} className="mt-3">
                                    <div className={cn('mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5', tone.headerBg)}>
                                        <span className={cn('flex h-5 w-5 items-center justify-center rounded-md', tone.iconBg, tone.iconText)}>
                                            <SectionIcon className="h-3 w-3" />
                                        </span>
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary-600">
                                            {section.label}
                                        </span>
                                    </div>
                                    <div className="space-y-0.5">
                                        {section.items.map(item => (
                                            <MobileLink
                                                key={item.href}
                                                item={item}
                                                module={module}
                                                active={isItemActive(item)}
                                                onNavigate={() => setMobileOpen(false)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

function NavLink({
    item,
    module,
    active,
}: {
    item: ModuleMenuItem;
    module: AppModule;
    active: boolean;
}) {
    const ItemIcon = item.icon;
    return (
        <Link
            href={item.href}
            className={cn(
                'relative inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors',
                active
                    ? cn(module.accent.soft, module.accent.text)
                    : 'text-secondary-600 hover:bg-muted hover:text-secondary-900',
            )}
        >
            {ItemIcon && <ItemIcon className="h-3.5 w-3.5" />}
            {item.title}
            {active && (
                <span className={cn('absolute inset-x-2 -bottom-[7px] h-0.5 rounded-full', module.accent.bar)} />
            )}
        </Link>
    );
}

function SectionDropdown({
    section,
    module,
    open,
    hasActive,
    isItemActive,
    onToggle,
    onClose,
}: {
    section: ModuleMenuSection;
    module: AppModule;
    open: boolean;
    hasActive: boolean;
    isItemActive: (item: ModuleMenuItem) => boolean;
    onToggle: () => void;
    onClose: () => void;
}) {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const meta = getSectionMeta(section.label);
    const tone = SECTION_TONE_STYLES[meta.tone];
    const SectionIcon = meta.icon;

    return (
        <div className="relative shrink-0">
            <button
                ref={triggerRef}
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                className={cn(
                    'relative inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors',
                    open || hasActive
                        ? cn(module.accent.soft, module.accent.text)
                        : 'text-secondary-600 hover:bg-muted hover:text-secondary-900',
                )}
            >
                <span className={cn('flex h-5 w-5 items-center justify-center rounded-md', tone.iconBg, tone.iconText)}>
                    <SectionIcon className="h-3 w-3" />
                </span>
                {section.label}
                <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
                {hasActive && !open && (
                    <span className={cn('absolute inset-x-2 -bottom-[7px] h-0.5 rounded-full', module.accent.bar)} />
                )}
            </button>

            <AnchoredDropdown
                open={open}
                onClose={onClose}
                triggerRef={triggerRef}
                align="left"
                width={240}
                className="overflow-hidden p-1.5"
            >
                <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-400">
                    {section.label}
                </p>
                {section.items.map(item => {
                    const ItemIcon = item.icon ?? LayoutGrid;
                    const active = isItemActive(item);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors',
                                active
                                    ? cn('font-semibold', module.accent.soft, module.accent.text)
                                    : 'font-medium text-secondary-600 hover:bg-muted hover:text-secondary-900',
                            )}
                        >
                            <ItemIcon className={cn('h-4 w-4 shrink-0', active ? module.accent.text : 'text-secondary-400')} />
                            <span className="truncate">{item.title}</span>
                        </Link>
                    );
                })}
            </AnchoredDropdown>
        </div>
    );
}

function MobileLink({
    item,
    module,
    active,
    onNavigate,
}: {
    item: ModuleMenuItem;
    module: AppModule;
    active: boolean;
    onNavigate: () => void;
}) {
    const ItemIcon = item.icon ?? LayoutGrid;
    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(
                'flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition-colors',
                active
                    ? cn('font-semibold', module.accent.soft, module.accent.text)
                    : 'font-medium text-secondary-600 hover:bg-muted',
            )}
        >
            <ItemIcon className={cn('h-4 w-4', active ? module.accent.text : 'text-secondary-400')} />
            {item.title}
        </Link>
    );
}
