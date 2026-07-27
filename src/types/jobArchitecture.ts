// ── Job Families ────────────────────────────────────────────────────────────

export interface JobFamily {
    '@id'?: string;
    id: string;
    name: string;
    code?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

// ── Grades ───────────────────────────────────────────────────────────────────

export interface Grade {
    '@id'?: string;
    id: string;
    name: string;
    code?: string;
    rank?: number;
    minSalary?: number;
    maxSalary?: number;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

// ── Job Roles ─────────────────────────────────────────────────────────────────

export interface JobRole {
    '@id'?: string;
    id: string;
    title: string;
    code?: string;
    jobFamily?: string | JobFamily;
    grade?: string | Grade;
    description?: string;
    responsibilities?: string;
    qualifications?: string;
    createdAt?: string;
    updatedAt?: string;
}

// ── Career Paths ──────────────────────────────────────────────────────────────

/** Conditions vérifiées à la soumission d'une mobilité PROMOTION. */
export interface CareerPathConditions {
    minimumYears?: number;
    minTenureMonths?: number;
    minimumPerformance?: number;
    requiredTrainings?: string[];
}

export interface CareerPath {
    '@id'?: string;
    id: string;
    fromJobRole: string | JobRole;
    toJobRole: string | JobRole;
    conditions?: CareerPathConditions | Record<string, unknown>;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateCareerPathDto {
    fromJobRole: string;
    toJobRole: string;
    conditions?: CareerPathConditions;
}
