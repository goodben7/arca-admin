'use client';

import { Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    ONBOARDING_PROCESS_STATUS,
    type OnboardingProcessStatus,
} from '@/types/onboarding';

export const ONBOARDING_PIPELINE = [
    { status: ONBOARDING_PROCESS_STATUS.PENDING, label: 'À démarrer', shortLabel: 'Attente' },
    { status: ONBOARDING_PROCESS_STATUS.IN_PROGRESS, label: 'En cours', shortLabel: 'En cours' },
    { status: ONBOARDING_PROCESS_STATUS.COMPLETED, label: 'Terminé', shortLabel: 'Terminé' },
] as const;

const PIPELINE_INDEX: Record<string, number> = {
    [ONBOARDING_PROCESS_STATUS.PENDING]: 0,
    [ONBOARDING_PROCESS_STATUS.IN_PROGRESS]: 1,
    [ONBOARDING_PROCESS_STATUS.COMPLETED]: 2,
};

export interface OnboardingStatusBarProps {
    status: string;
    loading?: boolean;
    disabled?: boolean;
    /** Terminer le processus (équivalent clic sur « Terminé ») */
    onComplete?: () => void;
    onCancel?: () => void;
    className?: string;
}

/**
 * Barre fléchée façon Odoo pour le processus d'intégration.
 * PENDING → IN_PROGRESS → COMPLETED (+ Annuler à droite).
 */
export function OnboardingStatusBar({
    status,
    loading,
    disabled,
    onComplete,
    onCancel,
    className,
}: OnboardingStatusBarProps) {
    const isCancelled = status === ONBOARDING_PROCESS_STATUS.CANCELLED;
    const currentIdx = isCancelled ? -1 : (PIPELINE_INDEX[status] ?? 0);
    const canComplete =
        !isCancelled &&
        status !== ONBOARDING_PROCESS_STATUS.COMPLETED &&
        !!onComplete;

    return (
        <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
            <div className="flex items-stretch overflow-x-auto pb-0.5 -mx-1 px-1">
                <div className="inline-flex items-stretch min-w-0">
                    {ONBOARDING_PIPELINE.map((step, index) => {
                        const isDone = !isCancelled && index < currentIdx;
                        const isCurrent = !isCancelled && index === currentIdx;
                        const isFuture = isCancelled || index > currentIdx;
                        const isCompleteStep = step.status === ONBOARDING_PROCESS_STATUS.COMPLETED;
                        const clickable =
                            !disabled &&
                            !loading &&
                            !isCancelled &&
                            !isCurrent &&
                            isCompleteStep &&
                            canComplete;

                        return (
                            <button
                                key={step.status}
                                type="button"
                                disabled={!clickable}
                                title={
                                    isCurrent
                                        ? `Statut actuel : ${step.label}`
                                        : clickable
                                            ? 'Marquer le processus comme terminé'
                                            : step.label
                                }
                                onClick={() => clickable && onComplete?.()}
                                className={cn(
                                    'relative h-9 pl-5 pr-4 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors',
                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:z-20',
                                    index === 0 ? 'pl-4 rounded-l-md' : '',
                                    '[clip-path:polygon(0_0,calc(100%-10px)_0,100%_50%,calc(100%-10px)_100%,0_100%,10px_50%)]',
                                    index === 0 && '[clip-path:polygon(0_0,calc(100%-10px)_0,100%_50%,calc(100%-10px)_100%,0_100%)]',
                                    isCurrent && 'bg-primary-600 text-white z-10 shadow-sm',
                                    isDone && 'bg-primary-100 text-primary-800 z-[1]',
                                    isFuture && !isCancelled && 'bg-secondary-100 text-secondary-500',
                                    clickable && 'hover:bg-emerald-100 hover:text-emerald-800 cursor-pointer',
                                    isCancelled && 'bg-secondary-100 text-secondary-400 cursor-not-allowed',
                                    !clickable && 'cursor-default',
                                    loading && 'opacity-70',
                                )}
                                style={{ marginLeft: index === 0 ? 0 : -8 }}
                            >
                                <span className="relative z-10 hidden sm:inline">{step.label}</span>
                                <span className="relative z-10 sm:hidden">{step.shortLabel}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {loading && <Loader2 className="w-4 h-4 animate-spin text-secondary-400" />}
                {isCancelled ? (
                    <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-rose-600 text-white text-[11px] font-bold uppercase tracking-wider">
                        <XCircle className="w-3.5 h-3.5" />
                        Annulé
                    </span>
                ) : status !== ONBOARDING_PROCESS_STATUS.COMPLETED && onCancel ? (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={disabled || loading}
                        className={cn(
                            'inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-rose-200 bg-rose-50 text-rose-700',
                            'text-[11px] font-bold uppercase tracking-wider transition-colors',
                            'hover:bg-rose-600 hover:text-white hover:border-rose-600',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                        )}
                    >
                        <XCircle className="w-3.5 h-3.5" />
                        Annuler
                    </button>
                ) : null}
            </div>
        </div>
    );
}

export type { OnboardingProcessStatus };
