export const ONBOARDING_PROCESS_STATUS = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

export type OnboardingProcessStatus = typeof ONBOARDING_PROCESS_STATUS[keyof typeof ONBOARDING_PROCESS_STATUS];

export const ONBOARDING_PROCESS_STATUS_LABELS: Record<OnboardingProcessStatus, string> = {
    PENDING: 'En attente',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminé',
    CANCELLED: 'Annulé',
};

export const ONBOARDING_TASK_STATUS = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

export type OnboardingTaskStatus = typeof ONBOARDING_TASK_STATUS[keyof typeof ONBOARDING_TASK_STATUS];

export const ONBOARDING_TASK_STATUS_LABELS: Record<OnboardingTaskStatus, string> = {
    PENDING: 'À faire',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminée',
    CANCELLED: 'Annulée',
};

export const ONBOARDING_TASK_TYPE = {
    DOCUMENT: 'DOCUMENT',
    IT_ACCESS: 'IT_ACCESS',
    TRAINING: 'TRAINING',
    EQUIPMENT: 'EQUIPMENT',
    HR_FORM: 'HR_FORM',
} as const;

export type OnboardingTaskType = typeof ONBOARDING_TASK_TYPE[keyof typeof ONBOARDING_TASK_TYPE];

export const ONBOARDING_TASK_TYPE_LABELS: Record<OnboardingTaskType, string> = {
    DOCUMENT: 'Document',
    IT_ACCESS: 'Accès informatique',
    TRAINING: 'Formation',
    EQUIPMENT: 'Matériel',
    HR_FORM: 'Formulaire RH',
};

export interface OnboardingProcess {
    '@id'?: string;
    id: string;
    employee: string;
    status: OnboardingProcessStatus | string;
    startedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface OnboardingTask {
    '@id'?: string;
    id: string;
    process: string;
    title: string;
    description?: string;
    type: OnboardingTaskType | string;
    status: OnboardingTaskStatus | string;
    startedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
    assignedTo?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface EmployeeJourneyEntry {
    '@id'?: string;
    id: string;
    employee: string;
    stage: string;
    eventType: string;
    description?: string;
    sourceEntityType?: string;
    sourceEntityId?: string;
    metadata?: Record<string, unknown>;
    occurredAt: string;
    actorId?: string;
}
