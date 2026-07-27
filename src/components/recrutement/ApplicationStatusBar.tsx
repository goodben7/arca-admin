'use client';

import { Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    APPLICATION_STATUS,
    type ApplicationStatus,
} from '@/types/application';

/** Étapes linéaires du pipeline (hors rejet). */
export const APPLICATION_PIPELINE = [
    { status: APPLICATION_STATUS.APPLIED, label: 'Candidature', shortLabel: 'Reçue' },
    { status: APPLICATION_STATUS.SHORTLISTED, label: 'Présélection', shortLabel: 'Présél.' },
    { status: APPLICATION_STATUS.INTERVIEW, label: 'Entretien', shortLabel: 'Entretien' },
    { status: APPLICATION_STATUS.HIRED, label: 'Recruté', shortLabel: 'Recruté' },
] as const;

const PIPELINE_INDEX: Record<string, number> = {
    [APPLICATION_STATUS.APPLIED]: 0,
    [APPLICATION_STATUS.SHORTLISTED]: 1,
    [APPLICATION_STATUS.INTERVIEW]: 2,
    [APPLICATION_STATUS.HIRED]: 3,
};

export interface ApplicationStatusBarProps {
    status: string;
    loading?: boolean;
    disabled?: boolean;
    onSelectStage: (status: ApplicationStatus) => void;
    onReject: () => void;
    className?: string;
}

/**
 * Barre de progression fléchée façon Odoo (statusbar).
 * Clic sur une étape = transition vers ce statut via l’API.
 */
export function ApplicationStatusBar({
    status,
    loading,
    disabled,
    onSelectStage,
    onReject,
    className,
}: ApplicationStatusBarProps) {
    const isRejected = status === APPLICATION_STATUS.REJECTED;
    const currentIdx = isRejected ? -1 : (PIPELINE_INDEX[status] ?? 0);

    return (
        <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
            <div className="flex items-stretch overflow-x-auto pb-0.5 -mx-1 px-1">
                <div className="inline-flex items-stretch min-w-0">
                    {APPLICATION_PIPELINE.map((step, index) => {
                        const isDone = !isRejected && index < currentIdx;
                        const isCurrent = !isRejected && index === currentIdx;
                        const isFuture = isRejected || index > currentIdx;
                        const clickable = !disabled && !loading && !isRejected && !isCurrent;

                        return (
                            <button
                                key={step.status}
                                type="button"
                                disabled={!clickable}
                                title={
                                    isCurrent
                                        ? `Statut actuel : ${step.label}`
                                        : isDone
                                            ? `Revenir à : ${step.label}`
                                            : `Passer à : ${step.label}`
                                }
                                onClick={() => clickable && onSelectStage(step.status)}
                                className={cn(
                                    'relative h-9 pl-5 pr-4 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors',
                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:z-20',
                                    index === 0 ? 'pl-4 rounded-l-md' : '',
                                    // Forme flèche Odoo
                                    '[clip-path:polygon(0_0,calc(100%-10px)_0,100%_50%,calc(100%-10px)_100%,0_100%,10px_50%)]',
                                    index === 0 && '[clip-path:polygon(0_0,calc(100%-10px)_0,100%_50%,calc(100%-10px)_100%,0_100%)]',
                                    isCurrent && 'bg-primary-600 text-white z-10 shadow-sm',
                                    isDone && 'bg-primary-100 text-primary-800 hover:bg-primary-200 cursor-pointer z-[1]',
                                    isFuture && !isRejected && 'bg-secondary-100 text-secondary-500 hover:bg-secondary-200 hover:text-secondary-700 cursor-pointer',
                                    isRejected && 'bg-secondary-100 text-secondary-400 cursor-not-allowed',
                                    !clickable && !isCurrent && 'cursor-default',
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
                {isRejected ? (
                    <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-rose-600 text-white text-[11px] font-bold uppercase tracking-wider">
                        <XCircle className="w-3.5 h-3.5" />
                        Rejeté(e)
                    </span>
                ) : status !== APPLICATION_STATUS.HIRED ? (
                    <button
                        type="button"
                        onClick={onReject}
                        disabled={disabled || loading}
                        className={cn(
                            'inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-rose-200 bg-rose-50 text-rose-700',
                            'text-[11px] font-bold uppercase tracking-wider transition-colors',
                            'hover:bg-rose-600 hover:text-white hover:border-rose-600',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                        )}
                    >
                        <XCircle className="w-3.5 h-3.5" />
                        Rejeter
                    </button>
                ) : null}
            </div>
        </div>
    );
}
