'use client';

import { cn } from '@/lib/utils';
import {
    DISCIPLINARY_STATUS,
    DISCIPLINARY_STATUS_LABELS,
    getWorkflowSteps,
    type DisciplinaryStatus,
} from '@/types/sanctions';
import { Check } from 'lucide-react';

interface DisciplinaryStepperProps {
    status: string;
    requiresHearing: boolean;
    className?: string;
}

export function DisciplinaryStepper({ status, requiresHearing, className }: DisciplinaryStepperProps) {
    const steps = getWorkflowSteps(requiresHearing);
    const isTerminalBad =
        status === DISCIPLINARY_STATUS.CANCELLED || status === DISCIPLINARY_STATUS.REJECTED;
    const isClosed = status === DISCIPLINARY_STATUS.CLOSED;
    const currentIndex = isTerminalBad ? -1 : steps.indexOf(status as DisciplinaryStatus);

    return (
        <div className={cn('w-full', className)}>
            {isTerminalBad && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
                    Affaire {DISCIPLINARY_STATUS_LABELS[status as DisciplinaryStatus] ?? status} — workflow interrompu
                </div>
            )}
            <ol className="flex w-full items-start justify-between gap-0 overflow-x-auto pb-1">
                {steps.map((step, i) => {
                    const isLast = i === steps.length - 1;
                    const isDone =
                        !isTerminalBad && (currentIndex > i || (isClosed && currentIndex === i));
                    const current = !isTerminalBad && !isClosed && currentIndex === i;
                    const lineFilled = !isTerminalBad && (currentIndex > i || isClosed);

                    return (
                        <li key={step} className="relative flex flex-1 flex-col items-center min-w-[4.5rem]">
                            {!isLast && (
                                <div
                                    aria-hidden
                                    className={cn(
                                        'absolute left-[calc(50%+1.15rem)] right-[calc(-50%+1.15rem)] top-[1.05rem] h-[3px] rounded-full',
                                        lineFilled ? 'bg-primary-500' : 'bg-secondary-200',
                                        isTerminalBad && 'opacity-40',
                                    )}
                                />
                            )}
                            <span
                                className={cn(
                                    'relative z-[1] flex h-[2.15rem] w-[2.15rem] items-center justify-center rounded-full text-xs font-bold border-2 transition-all',
                                    isDone && 'bg-primary-600 border-primary-600 text-white shadow-sm shadow-primary-200',
                                    current && 'bg-white border-primary-600 text-primary-700 shadow-[0_0_0_4px_rgba(0,115,152,0.15)]',
                                    !isDone && !current && 'bg-white border-secondary-200 text-secondary-400',
                                    isTerminalBad && 'opacity-45',
                                )}
                            >
                                {isDone ? <Check className="h-4 w-4 stroke-[2.5]" /> : i + 1}
                            </span>
                            <span
                                className={cn(
                                    'mt-2.5 text-[10px] sm:text-[11px] text-center leading-snug font-semibold max-w-[6.5rem] px-0.5',
                                    current && 'text-primary-700',
                                    isDone && 'text-secondary-800',
                                    !isDone && !current && 'text-secondary-400',
                                )}
                            >
                                {DISCIPLINARY_STATUS_LABELS[step]}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
