import { Position } from '@/types/position';
import { request } from './client';

export async function getAllPositions(): Promise<{ member: Position[] } | Position[]> {
    const res = await request('/api/positions?pagination=false&itemsPerPage=1000');
    if (!res.ok) throw new Error('Impossible de charger les postes.');
    return res.json();
}

export async function createPosition(data: Partial<Position>): Promise<Position> {
    const res = await request('/api/positions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.message || 'Erreur lors de la création du poste.');
    }
    return res.json();
}
