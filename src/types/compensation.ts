export interface CompensationHistory {
    '@id'?: string;
    id: string;
    employee: string;
    oldSalary?: string;
    /** @deprecated alias */
    previousSalary?: string | number;
    newSalary: string;
    effectiveDate: string;
    reason?: string;
    sourceEvent?: string;
    recordedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface RecordCompensationDto {
    employee: string;
    newSalary: string;
    effectiveDate: string;
    reason?: string;
}

export const COMPENSATION_SOURCE_LABELS: Record<string, string> = {
    MOBILITY_IMPLEMENTED: 'Mobilité implémentée',
    MANUAL_RECORDING: 'Saisie manuelle',
};
