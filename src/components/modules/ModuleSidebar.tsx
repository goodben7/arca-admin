'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { AppModule, ModuleMenuItem } from '@/lib/modules/registry';
import { getExpandedSidebarSections, pushRecent, saveExpandedSidebarSections } from '@/lib/modules/prefs';
import { getSectionMeta, SECTION_TONE_STYLES } from '@/lib/modules/sectionMeta';
import { ChevronDown, Grid3X3, LayoutGrid } from 'lucide-react';
import { useSidebar } from '@/components/layout/SidebarContext';

interface ModuleSidebarProps {
    module: AppModule;
}

type MenuSection = { label: string; items: ModuleMenuItem[] };

export function ModuleSidebar({ module }: ModuleSidebarProps) {
    const pathname = usePathname();
    const { collapsed, mobileOpen, closeMobile } = useSidebar();
    const Icon = module.icon;

    const { overviewItems, sections } = splitMenu(module);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set());
    const [flyoutSection, setFlyoutSection] = useState<string | null>(null);
    const initialized = useRef(false);

    const isItemActive = useCallback((item: ModuleMenuItem) => {
        if (item.href === module.href) return pathname === module.href;
        return pathname === item.href || pathname.startsWith(item.href + '/');
    }, [module.href, pathname]);

    const sectionHasActive = useCallback((section: MenuSection) =>
        section.items.some(isItemActive), [isItemActive]);

    useEffect(() => {
        pushRecent(module.slug);
    }, [module.slug]);

    useEffect(() => {
        closeMobile();
        setFlyoutSection(null);
    }, [pathname, closeMobile]);

    useEffect(() => {
        initialized.current = false;
    }, [module.slug]);

    useEffect(() => {
        if (initialized.current) return;

        const stored = getExpandedSidebarSections(module.slug);
        if (stored) {
            setExpandedSections(new Set(stored));
            initialized.current = true;
            return;
        }

        const activeLabels = sections.filter(sectionHasActive).map(s => s.label);
        setExpandedSections(new Set(activeLabels));
        initialized.current = true;
    }, [module.slug, sections, sectionHasActive]);

    useEffect(() => {
        if (!initialized.current) return;
        const activeLabels = sections.filter(sectionHasActive).map(s => s.label);
        if (activeLabels.length === 0) return;
        setExpandedSections(prev => {
            const next = new Set(prev);
            let changed = false;
            for (const label of activeLabels) {
                if (!next.has(label)) {
                    next.add(label);
                    changed = true;
                }
            }
            if (changed) saveExpandedSidebarSections(module.slug, [...next]);
            return changed ? next : prev;
        });
    }, [pathname, module.slug, sections, sectionHasActive]);

    function toggleSection(label: string) {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(label)) next.delete(label);
            else next.add(label);
            saveExpandedSidebarSections(module.slug, [...next]);
            return next;
        });
    }

    const content = (
        <div className="relative z-[1] flex h-full min-h-0 flex-col">
            {/* En-tête module — aligné sous la topbar, sans bandeau (déjà sur ModuleTopbar) */}
            <div className={cn('shrink-0 border-b border-border-subtle/80 bg-surface/90', collapsed ? 'px-2 py-3' : 'px-4 py-4')}>
                <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ring-2 ring-white/50', module.accent.bg)}>
                        <Icon className="h-5 w-5" />
                    </div>
                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-secondary-900">{module.shortName}</p>
                            <p className="truncate text-[11px] text-secondary-500">{module.name}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Zone scrollable : menus + filigrane (clippé, hors footer) */}
            <div className="relative min-h-0 flex-1 overflow-hidden">
                <div className="module-sidebar-ambient" aria-hidden>
                    <div
                        className="absolute -left-8 top-8 h-32 w-32 rounded-full opacity-60"
                        style={{ background: 'radial-gradient(circle, rgba(0,115,152,0.18) 0%, transparent 70%)' }}
                    />
                    <div
                        className="absolute -right-6 bottom-16 h-24 w-24 rounded-full opacity-50"
                        style={{ background: 'radial-gradient(circle, rgba(253,185,19,0.2) 0%, transparent 70%)' }}
                    />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/logo_arca_nouveau-2.png"
                    alt=""
                    className={cn('module-sidebar-watermark pointer-events-none', collapsed && 'module-sidebar-watermark-collapsed')}
                    aria-hidden
                />
                <nav className={cn('relative z-[1] h-full overflow-y-auto py-3', collapsed ? 'px-2' : 'px-3')}>
                    {overviewItems.length > 0 && (
                        <div className="mb-2 space-y-0.5">
                            {overviewItems.map(item => (
                                <NavItem
                                    key={item.href}
                                    item={item}
                                    module={module}
                                    active={isItemActive(item)}
                                    collapsed={collapsed}
                                    onNavigate={closeMobile}
                                />
                            ))}
                        </div>
                    )}

                    {sections.map(section => (
                        collapsed ? (
                            <CollapsedSectionFlyout
                                key={section.label}
                                section={section}
                                module={module}
                                isItemActive={isItemActive}
                                open={flyoutSection === section.label}
                                onToggle={() => setFlyoutSection(v => v === section.label ? null : section.label)}
                                onClose={() => setFlyoutSection(null)}
                                onNavigate={closeMobile}
                            />
                        ) : (
                            <NavSection
                                key={section.label}
                                section={section}
                                module={module}
                                expanded={expandedSections.has(section.label)}
                                hasActive={sectionHasActive(section)}
                                isItemActive={isItemActive}
                                onToggle={() => toggleSection(section.label)}
                                onNavigate={closeMobile}
                            />
                        )
                    ))}
                </nav>
            </div>

            {/* Footer fixe — fond opaque, jamais chevauché */}
            <div
                className={cn(
                    'relative z-[2] shrink-0 border-t border-border-subtle bg-surface px-3 py-3',
                    collapsed && 'px-2'
                )}
            >
                <Link
                    href="/apps"
                    className={cn(
                        'flex items-center gap-2 rounded-xl text-[12px] font-medium text-secondary-500 transition-colors hover:bg-primary-50 hover:text-primary-700',
                        collapsed ? 'mx-auto h-10 w-10 justify-center' : 'px-2.5 py-2'
                    )}
                    title="Tous les modules"
                >
                    <Grid3X3 className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Tous les modules</span>}
                </Link>
            </div>
        </div>
    );

    return (
        <>
            {mobileOpen && (
                <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={closeMobile} aria-hidden />
            )}
            <aside
                className={cn(
                    'module-sidebar-shell relative hidden h-full shrink-0 flex-col overflow-hidden border-r border-border-subtle transition-all duration-300 lg:flex',
                    collapsed ? 'w-[68px]' : 'w-56'
                )}
            >
                {content}
            </aside>
            <aside
                className={cn(
                    'module-sidebar-shell fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-hidden border-r border-border-subtle shadow-float transition-transform duration-300 lg:hidden',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {content}
            </aside>
        </>
    );
}

function SectionIcon({ label, active, size = 'sm' }: { label: string; active?: boolean; size?: 'sm' | 'md' }) {
    const meta = getSectionMeta(label);
    const tone = SECTION_TONE_STYLES[meta.tone];
    const SectionIconComponent = meta.icon;
    const dim = size === 'md' ? 'h-7 w-7' : 'h-6 w-6';
    const iconDim = size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3';

    return (
        <span
            className={cn(
                'flex shrink-0 items-center justify-center rounded-lg transition-colors',
                dim,
                active ? cn(tone.iconBg, tone.iconText, 'ring-1 ring-black/5') : cn(tone.iconBg, tone.iconText, 'opacity-80')
            )}
        >
            <SectionIconComponent className={iconDim} strokeWidth={2} />
        </span>
    );
}

function NavItem({
    item,
    module,
    active,
    collapsed,
    onNavigate,
    variant = 'root',
}: {
    item: ModuleMenuItem;
    module: AppModule;
    active: boolean;
    collapsed: boolean;
    onNavigate: () => void;
    variant?: 'root' | 'child';
}) {
    const ItemIcon = item.icon ?? LayoutGrid;
    const isChild = variant === 'child';

    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.title : undefined}
            className={cn(
                'relative flex items-center transition-colors',
                collapsed
                    ? 'mx-auto h-10 w-10 justify-center rounded-xl'
                    : isChild
                        ? 'gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px]'
                        : 'gap-2.5 rounded-xl px-2.5 py-2 text-[13px]',
                active
                    ? isChild
                        ? cn('font-medium', module.accent.soft, module.accent.text)
                        : cn('bg-white/70 font-semibold text-secondary-900 shadow-sm ring-1 ring-black/[0.04]', 'pl-[9px]')
                    : isChild
                        ? 'text-secondary-500 hover:bg-black/[0.03] hover:text-secondary-800'
                        : 'text-secondary-600 hover:bg-white/40 hover:text-secondary-900'
            )}
        >
            {active && !collapsed && !isChild && (
                <span className={cn('absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full', module.accent.bar)} />
            )}
            <ItemIcon
                className={cn(
                    'shrink-0',
                    isChild ? 'h-3.5 w-3.5' : 'h-4 w-4',
                    active ? (isChild ? module.accent.text : module.accent.text) : 'text-secondary-400'
                )}
            />
            {!collapsed && <span className="truncate">{item.title}</span>}
        </Link>
    );
}

function NavSection({
    section,
    module,
    expanded,
    hasActive,
    isItemActive,
    onToggle,
    onNavigate,
}: {
    section: MenuSection;
    module: AppModule;
    expanded: boolean;
    hasActive: boolean;
    isItemActive: (item: ModuleMenuItem) => boolean;
    onToggle: () => void;
    onNavigate: () => void;
}) {
    const panelId = `nav-section-${section.label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <div className="mb-2">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={expanded}
                aria-controls={panelId}
                className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors',
                    hasActive ? 'text-secondary-800' : 'text-secondary-500 hover:text-secondary-700'
                )}
            >
                <SectionIcon label={section.label} active={hasActive} />
                <span className="flex-1 truncate text-[11px] font-semibold uppercase tracking-wider">
                    {section.label}
                </span>
                <ChevronDown
                    className={cn(
                        'h-3.5 w-3.5 shrink-0 text-secondary-400 transition-transform duration-200',
                        !expanded && '-rotate-90'
                    )}
                />
            </button>

            <div
                id={panelId}
                className={cn(
                    'grid transition-[grid-template-rows] duration-200 ease-out',
                    expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                )}
            >
                <div className="overflow-hidden">
                    <div className="ml-2 mt-1 space-y-0.5 border-l border-border-subtle/60 pl-2">
                        {section.items.map(item => (
                            <NavItem
                                key={item.href}
                                item={item}
                                module={module}
                                active={isItemActive(item)}
                                collapsed={false}
                                variant="child"
                                onNavigate={onNavigate}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CollapsedSectionFlyout({
    section,
    module,
    isItemActive,
    open,
    onToggle,
    onClose,
    onNavigate,
}: {
    section: MenuSection;
    module: AppModule;
    isItemActive: (item: ModuleMenuItem) => boolean;
    open: boolean;
    onToggle: () => void;
    onClose: () => void;
    onNavigate: () => void;
}) {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const hasActive = section.items.some(isItemActive);
    const tone = SECTION_TONE_STYLES[getSectionMeta(section.label).tone];

    useEffect(() => {
        if (!open) return;
        function onPointerDown(e: MouseEvent) {
            const target = e.target as Node;
            if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [open, onClose]);

    return (
        <div className="relative mb-1">
            <button
                ref={triggerRef}
                type="button"
                onClick={onToggle}
                title={section.label}
                className={cn(
                    'relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                    hasActive || open
                        ? cn(tone.headerBg, 'ring-1 ring-black/[0.04]')
                        : 'hover:bg-white/50'
                )}
            >
                {hasActive && (
                    <span className={cn('absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full', module.accent.bar)} />
                )}
                <SectionIcon label={section.label} active={hasActive || open} size="md" />
            </button>

            {open && (
                <div
                    ref={panelRef}
                    className="absolute left-full top-0 z-50 ml-2 w-52 rounded-xl border border-border-subtle bg-surface p-2 shadow-float"
                >
                    <div className="mb-1.5 flex items-center gap-2 px-2">
                        <SectionIcon label={section.label} active size="md" />
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary-500">
                            {section.label}
                        </p>
                    </div>
                    <div className="space-y-0.5 p-1">
                        {section.items.map(item => {
                            const ItemIcon = item.icon ?? LayoutGrid;
                            const active = isItemActive(item);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => { onNavigate(); onClose(); }}
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors',
                                        active
                                            ? cn('font-medium', module.accent.soft, module.accent.text)
                                            : 'text-secondary-500 hover:bg-black/[0.03] hover:text-secondary-800'
                                    )}
                                >
                                    <ItemIcon className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{item.title}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function splitMenu(module: AppModule) {
    const overviewItems: ModuleMenuItem[] = [];
    const sectionMap = new Map<string, ModuleMenuItem[]>();

    for (const item of module.menu) {
        if (!item.section) {
            overviewItems.push(item);
            continue;
        }
        const list = sectionMap.get(item.section) ?? [];
        list.push(item);
        sectionMap.set(item.section, list);
    }

    const sections: MenuSection[] = [];
    for (const [label, items] of sectionMap) {
        sections.push({ label, items });
    }

    return { overviewItems, sections };
}
