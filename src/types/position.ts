export interface Position {
    id: string;
    title: string;
    department: string;
    level: string;
    description: string;
    headcount: number;
    openPositions: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export const POSITION_STATUS_LABELS: Record<string, string> = {
    OPEN: 'Ouvert',
    CLOSED: 'Fermé',
};

export const POSITION_LEVEL_LABELS: Record<string, string> = {
    JUNIOR: 'Junior',
    MID_LEVEL: 'Intermédiaire',
    SENIOR: 'Sénior',
    MANAGER: 'Manager',
};
