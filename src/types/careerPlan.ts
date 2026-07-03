export interface CareerPlan {
    '@id'?: string;
    id: string;
    employee: string;
    targetJobRole?: string;
    targetJobRoleId?: string;
    targetGrade?: string;
    targetGradeId?: string;
    targetDate?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}
