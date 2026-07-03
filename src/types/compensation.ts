export interface CompensationHistory {
    '@id'?: string;
    id: string;
    employee: string;
    previousSalary?: number;
    newSalary: number;
    effectiveDate: string;
    reason?: string;
    recordedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}
