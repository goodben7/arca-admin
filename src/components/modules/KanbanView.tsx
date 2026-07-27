'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface KanbanColumn<T> {
    id: string;
    title: string;
    items: T[];
    color?: string;
}

interface KanbanViewProps<T> {
    columns: KanbanColumn<T>[];
    renderCard: (item: T) => ReactNode;
    keyExtractor: (item: T) => string;
    className?: string;
}

export function KanbanView<T>({ columns, renderCard, keyExtractor, className }: KanbanViewProps<T>) {
    return (
        <div className={cn('flex gap-3 overflow-x-auto pb-2 -mx-1 px-1', className)}>
            {columns.map(col => (
                <div
                    key={col.id}
                    className="w-72 shrink-0 rounded-2xl bg-muted/60 border border-border-subtle flex flex-col max-h-[70vh]"
                >
                    <div className="px-3 py-2.5 flex items-center gap-2 border-b border-border-subtle shrink-0">
                        <span className={cn('w-2 h-2 rounded-full', col.color || 'bg-secondary-400')} />
                        <p className="text-xs font-semibold text-foreground flex-1 truncate">{col.title}</p>
                        <span className="text-[10px] font-bold text-muted-foreground bg-surface px-1.5 py-0.5 rounded-md">
                            {col.items.length}
                        </span>
                    </div>
                    <div className="p-2 space-y-2 overflow-y-auto flex-1">
                        {col.items.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground text-center py-6">Vide</p>
                        ) : (
                            col.items.map(item => (
                                <div key={keyExtractor(item)} className="rounded-xl bg-surface border border-border-subtle shadow-sm p-3">
                                    {renderCard(item)}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
