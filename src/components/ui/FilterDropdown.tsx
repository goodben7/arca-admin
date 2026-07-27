'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterDropdownOption {
    id: string;
    label: string;
    color?: string;
}

interface FilterDropdownProps {
    value: string;
    onChange: (id: string) => void;
    options: FilterDropdownOption[];
    placeholder?: string;
    className?: string;
}

/** Menu déroulant de filtre — z-index élevé pour passer au-dessus des DataPanel. */
export function FilterDropdown({
    value,
    onChange,
    options,
    placeholder = 'Tous les statuts',
    className,
}: FilterDropdownProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const selected = options.find(o => o.id === value);

    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    return (
        <div ref={rootRef} className={cn('relative', open && 'z-50', className)}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
                className={cn(
                    'flex h-10 items-center gap-3 rounded-xl border bg-white px-4 transition-all',
                    open ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-secondary-200 hover:border-secondary-300',
                    value ? 'border-primary-300 bg-primary-50/50' : ''
                )}
            >
                <Filter className={cn('h-4 w-4', value ? 'text-primary-500' : 'text-secondary-400')} />
                <span className="min-w-[100px] text-left text-xs font-medium text-secondary-700">
                    {selected?.label ?? placeholder}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-secondary-400 transition-transform duration-300', open && 'rotate-180')} />
            </button>
            {open && (
                <div className="absolute left-0 top-full z-50 mt-2 w-52 rounded-2xl border border-secondary-100 bg-white p-2 shadow-2xl shadow-secondary-900/10 animate-in fade-in zoom-in-95 duration-200">
                    {options.map(opt => (
                        <button
                            key={opt.id || '__all'}
                            type="button"
                            onClick={() => { onChange(opt.id); setOpen(false); }}
                            className={cn(
                                'flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-all',
                                value === opt.id ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                {opt.color && <div className={cn('h-1.5 w-1.5 rounded-full', opt.color)} />}
                                <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                            </div>
                            {value === opt.id && <div className="h-1 w-1 rounded-full bg-primary-600" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
