import { LeaveRequest } from '@/types/leave';
import { request } from './client';

export async function getAllLeaveRequests(): Promise<{ 'hydra:member': LeaveRequest[] } | LeaveRequest[]> {
    const response = await request('/api/leave_requests');
    if (!response.ok) throw new Error('Impossible de charger les demandes de congés.');
    return response.json();
}

export async function createLeaveRequest(data: Partial<LeaveRequest>): Promise<LeaveRequest> {
    const response = await request('/api/leave_requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la création de la demande de congé.');
    }
    return response.json();
}

export async function approveLeaveRequest(leaveRequestId: string): Promise<void> {
    const response = await request('/api/leave_requests/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveRequestId }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || 'Erreur lors de l\'approbation.');
    }
}

export async function rejectLeaveRequest(leaveRequestId: string, raison: string): Promise<void> {
    const response = await request('/api/leave_requests/rejections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveRequestId, raison }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.detail || 'Erreur lors du refus.');
    }
}
