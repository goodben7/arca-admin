export const SKILL_LEVEL = {
    BEGINNER: 'BEGINNER',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
    EXPERT: 'EXPERT',
} as const;

export type SkillLevel = typeof SKILL_LEVEL[keyof typeof SKILL_LEVEL];

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
    BEGINNER: 'Débutant',
    INTERMEDIATE: 'Intermédiaire',
    ADVANCED: 'Avancé',
    EXPERT: 'Expert',
};

export interface SkillCategory {
    '@id'?: string;
    id: string;
    name: string;
    code?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Skill {
    '@id'?: string;
    id: string;
    name: string;
    code?: string;
    category?: string | SkillCategory;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface EmployeeSkill {
    '@id'?: string;
    id: string;
    employee: string;
    skill: string;
    level: SkillLevel | string;
    validatedAt?: string;
    validatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface JobRoleRequiredSkill {
    '@id'?: string;
    id: string;
    jobRole: string;
    skill: string;
    requiredLevel: SkillLevel | string;
    mandatory?: boolean;
    createdAt?: string;
    updatedAt?: string;
}
