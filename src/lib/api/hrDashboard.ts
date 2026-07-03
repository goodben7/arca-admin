import { request } from './client';
import { HrDashboard, Activity } from '@/types/succession';

export async function getHrDashboard(): Promise<HrDashboard> {
    const res = await request('/api/hr/dashboard');
    if (!res.ok) throw new Error('Impossible de charger le tableau de bord RH.');
    return res.json();
}

export async function getActivities(filters: { user?: string; activity?: string; ressourceName?: string; ressourceIdentifier?: string } = {}): Promise<Activity[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    const res = await request(`/api/activities${params.toString() ? `?${params}` : ''}`);
    if (!res.ok) throw new Error('Impossible de charger les activités.');
    const data = await res.json();
    if (Array.isArray(data)) return data as Activity[];
    const d = data as Record<string, unknown>;
    if (Array.isArray(d['hydra:member'])) return d['hydra:member'] as Activity[];
    return [];
}
