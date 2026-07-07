export interface TrainingCatalog {
    '@id'?: string;
    id: string;
    title: string;
    description?: string;
    duration?: number;
    durationUnit?: string;
    provider?: string;
    format?: string;
    cost?: string;
    skills?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateTrainingCatalogDto {
    title: string;
    description?: string;
    provider?: string;
    duration: number;
    cost?: string;
}

export interface UpdateTrainingCatalogDto {
    title?: string;
    description?: string;
    provider?: string;
    duration?: number;
    cost?: string;
}

export interface JobRoleRequiredTraining {
    '@id'?: string;
    id: string;
    jobRole: string;
    trainingCatalog: string;
    mandatory?: boolean;
    validityMonths?: number;
    createdAt?: string;
    updatedAt?: string;
}
