'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface AnchoredDropdownProps {
    open: boolean;
    onClose: () => void;
    triggerRef: RefObject<HTMLElement | null>;
    children: ReactNode;
    className?: string;
    align?: 'left' | 'right';
    width?: number;
}

export function AnchoredDropdown({
    open,
    onClose,
    triggerRef,
    children,
    className,
    align = 'right',
    width = 240,
}: AnchoredDropdownProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    const updatePosition = useCallback(() => {
        const el = triggerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const left = align === 'right' ? rect.right - width : rect.left;
        setPos({ top: rect.bottom + 8, left: Math.max(8, left) });
    }, [triggerRef, align, width]);

    useEffect(() => {
        if (!open) return;
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [open, updatePosition]);

    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            const target = e.target as Node;
            if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
            onClose();
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open, onClose, triggerRef]);

    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <>
            <div className="fixed inset-0 z-[200]" aria-hidden onClick={onClose} />
            <div
                ref={menuRef}
                style={{ position: 'fixed', top: pos.top, left: pos.left, width, zIndex: 201 }}
                className={cn(
                    'bg-surface rounded-xl border border-border shadow-float animate-in fade-in slide-in-from-top-2 duration-150',
                    className,
                )}
                role="menu"
            >
                {children}
            </div>
        </>,
        document.body,
    );
}
