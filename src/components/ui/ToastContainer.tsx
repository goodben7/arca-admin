'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface ToastItem {
    id: number;
    msg: string;
    type: 'success' | 'error';
}

export function ToastContainer() {
    const [items, setItems] = useState<ToastItem[]>([]);

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

    if (items.length === 0) return null;

    return (
        <div className="fixed top-6 right-6 z-[9000] flex flex-col gap-3 pointer-events-none">
            {items.map(t => (
                <div
                    key={t.id}
                    className={cn(
                        'flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-right duration-300',
                        t.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    )}
                >
                    {t.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                    <span>{t.msg}</span>
                </div>
            ))}
        </div>
    );
}
