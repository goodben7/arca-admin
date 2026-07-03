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

export interface CareerPath {
    '@id'?: string;
    id: string;
    fromJobRole: string | JobRole;
    toJobRole: string | JobRole;
    conditions?: Record<string, unknown>;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}
