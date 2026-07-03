export const EXIT_REASON = {
    RESIGNATION: 'RESIGNATION',
    DISMISSAL: 'DISMISSAL',
    RETIREMENT: 'RETIREMENT',
    END_OF_CONTRACT: 'END_OF_CONTRACT',
} as const;

export type ExitReason = typeof EXIT_REASON[keyof typeof EXIT_REASON];

export const EXIT_REASON_LABELS: Record<ExitReason, string> = {
    RESIGNATION: 'Démission',
    DISMISSAL: 'Licenciement',
    RETIREMENT: 'Retraite',
    END_OF_CONTRACT: 'Fin de contrat',
};

export const EXIT_PROCESS_STATUS = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

export type ExitProcessStatus = typeof EXIT_PROCESS_STATUS[keyof typeof EXIT_PROCESS_STATUS];

export const EXIT_PROCESS_STATUS_LABELS: Record<ExitProcessStatus, string> = {
    PENDING: 'En attente',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminé',
    CANCELLED: 'Annulé',
};

export const EXIT_TASK_STATUS = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

export type ExitTaskStatus = typeof EXIT_TASK_STATUS[keyof typeof EXIT_TASK_STATUS];

export const EXIT_TASK_STATUS_LABELS: Record<ExitTaskStatus, string> = {
    PENDING: 'À faire',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminée',
    CANCELLED: 'Annulée',
};

export interface ExitProcess {
    '@id'?: string;
    id: string;
    employee: string;
    reason: ExitReason | string;
    departureDate?: string;
    status: ExitProcessStatus | string;
    startedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ExitTask {
    '@id'?: string;
    id: string;
    process: string;
    title: string;
    description?: string;
    status: ExitTaskStatus | string;
    startedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
    assignedTo?: string;
    createdAt?: string;
    updatedAt?: string;
}
