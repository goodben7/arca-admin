export const LEAVE_TYPE = {
    ANNUAL: 'ANNUAL',
    SICK: 'SICK',
    MATERNITY: 'MAT',
    PATERNITY: 'PAT',
    UNPAID: 'UNPAID',
    OTHER: 'OTHER'
} as const;

export const LEAVE_STATUS = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    CANCELLED: 'CANCELLED'
} as const;

export type LeaveType = typeof LEAVE_TYPE[keyof typeof LEAVE_TYPE];
export type LeaveStatus = typeof LEAVE_STATUS[keyof typeof LEAVE_STATUS];

export interface LeaveRequest {
    id: string;
    employee: string; // Employee ID or IRI
    type: LeaveType;
    startDate: string;
    endDate: string;
    numberOfDays: number;
    status: LeaveStatus;
    reason?: string;
    createdAt: string;
    "@id"?: string;
}
