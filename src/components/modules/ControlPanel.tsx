'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LayoutList, Kanban, CalendarDays } from 'lucide-react';

export type ViewMode = 'list' | 'kanban' | 'calendar';

interface ControlPanelProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    search?: ReactNode;
    filters?: ReactNode;
    viewMode?: ViewMode;
    onViewModeChange?: (mode: ViewMode) => void;
    availableViews?: ViewMode[];
    className?: string;
}

export function ControlPanel({
    title,
    description,
    actions,
    search,
    filters,
    viewMode = 'list',
    onViewModeChange,
    availableViews = ['list'],
    className,
}: ControlPanelProps) {
    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight">{title}</h1>
                    {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {availableViews.length > 1 && onViewModeChange && (
                        <div className="flex p-1 bg-muted rounded-xl">
                            {availableViews.includes('list') && (
                                <ViewBtn active={viewMode === 'list'} onClick={() => onViewModeChange('list')} icon={LayoutList} label="Liste" />
                            )}
                            {availableViews.includes('kanban') && (
                                <ViewBtn active={viewMode === 'kanban'} onClick={() => onViewModeChange('kanban')} icon={Kanban} label="Kanban" />
                            )}
                            {availableViews.includes('calendar') && (
                                <ViewBtn active={viewMode === 'calendar'} onClick={() => onViewModeChange('calendar')} icon={CalendarDays} label="Calendrier" />
                            )}
                        </div>
                    )}
                    {actions}
                </div>
            </div>
            {(search || filters) && (
                <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
                    {search && <div className="flex-1 min-w-0">{search}</div>}
                    {filters}
                </div>
            )}
        </div>
    );
}

function ViewBtn({
    active,
    onClick,
    icon: Icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                active ? 'bg-surface text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
        >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}
