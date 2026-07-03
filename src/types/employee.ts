export const GENDER = {
    MALE: 'M',
    FEMALE: 'F',
    OTHER: 'O'
} as const;

export const MARITAL = {
    SINGLE: 'SINGLE',
    MARRIED: 'MARRIED',
    DIVORCED: 'DIVORCED',
    WIDOWED: 'WIDOWED'
} as const;

export const STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    ON_LEAVE: 'ON_LEAVE',
    SUSPENDED: 'SUSPENDED',
    TERMINATED: 'TERMINATED',
    PROBATION: 'PROBATION',
    RETIRED: 'RETIRED'
} as const;

export const SKILL_LEVEL = {
    BEGINNER: 'BEGINNER',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
    EXPERT: 'EXPERT'
} as const;

export type EmployeeGender = typeof GENDER[keyof typeof GENDER];
export type EmployeeMaritalStatus = typeof MARITAL[keyof typeof MARITAL];
export type EmployeeStatus = typeof STATUS[keyof typeof STATUS];

export interface Employee {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: EmployeeGender;
    birthDate: string;
    nationality: string;
    maritalStatus: EmployeeMaritalStatus;
    hireDate: string;
    departureDate?: string;
    status: EmployeeStatus;
    department: string;
    position: string;
    jobRole?: string;
    grade?: string;
    profile?: string; // Profile IRI
    manager?: string; // For display
    managerId?: string; // For creation payload
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    activatedAt?: string;
    activatedBy?: string;
    deactivatedAt?: string;
    deactivatedBy?: string;
    onLeaveAt?: string;
    onLeaveBy?: string;
    suspendedAt?: string;
    suspendedBy?: string;
    terminatedAt?: string;
    terminatedBy?: string;
    retiredAt?: string;
    retiredBy?: string;
    probationAt?: string;
    probationBy?: string;
    managerAssignedAt?: string;
    managerAssignedBy?: string;
    "@id"?: string;
}

export interface Department {
    id: string;
    name: string;
    code: string;
    description: string;
    managerId?: string;
    createdAt: string;
    updatedAt: string;
    "@id"?: string;
}

export type SkillLevel = typeof SKILL_LEVEL[keyof typeof SKILL_LEVEL];

export interface WorkExperience {
    id?: string;
    employeeId: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description?: string;
    isInternal: boolean;
}

export interface Skill {
    id?: string;
    employee: string; // Employee IRI or ID
    name: string;
    level: SkillLevel;
}
