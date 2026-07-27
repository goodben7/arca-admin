'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface ToastItem {
    id: number;
    msg: string;
    type: 'success' | 'error';
}

/** Sous la topbar module (h-14 + bandeau charte). */
const TOAST_TOP = 'top-[4.75rem]';

export function ToastContainer() {
    const [items, setItems] = useState<ToastItem[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        let counter = 0;
        const handler = (e: Event) => {
            const { msg, type } = (e as CustomEvent).detail;
            const id = ++counter;
            setItems(prev => [...prev, { id, msg, type }]);
            setTimeout(() => {
                setItems(prev => prev.filter(t => t.id !== id));
            }, 4000);
        };
        window.addEventListener(toast.TOAST_EVENT, handler);
        return () => window.removeEventListener(toast.TOAST_EVENT, handler);
    }, []);

    if (!mounted || items.length === 0) return null;

    return createPortal(
        <div
            className={cn(
                'fixed right-4 md:right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-[min(100vw-2rem,28rem)]',
                TOAST_TOP,
            )}
            aria-live="polite"
            aria-atomic="false"
        >
            {items.map(t => (
                <div
                    key={t.id}
                    className={cn(
                        'pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-right duration-300',
                        t.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white',
                    )}
                >
                    {t.type === 'success'
                        ? <CheckCircle2 className="w-5 h-5 shrink-0" />
                        : <XCircle className="w-5 h-5 shrink-0" />}
                    <span>{t.msg}</span>
                </div>
            ))}
        </div>,
        document.body,
    );
}
