/** Libellés FR pour les événements journey employé. */
export const JOURNEY_EVENT_LABELS: Record<string, string> = {
    CREATED: 'Dossier créé',
    ACTIVATED: 'Dossier activé',
    DEACTIVATED: 'Dossier désactivé',
    PROBATION: 'Période d’essai',
    ON_LEAVE: 'Mise en congé',
    SUSPENDED: 'Suspension',
    TERMINATED: 'Fin de contrat',
    RETIRED: 'Départ à la retraite',
    PROMOTED: 'Promotion',
    TRANSFERRED: 'Transfert',
    DEMOTED: 'Rétrogradation',
    SKILL_VALIDATED: 'Compétence validée',
    ONBOARDING_STARTED: 'Intégration démarrée',
    ONBOARDING_COMPLETED: 'Intégration terminée',
    OFFBOARDING_STARTED: 'Sortie démarrée',
    OFFBOARDING_COMPLETED: 'Sortie terminée',
    DISCIPLINARY_STARTED: 'Procédure disciplinaire ouverte',
    SANCTION_APPLIED: 'Sanction appliquée',
    CONTRACT_ACTIVATED: 'Contrat activé',
    CONTRACT_ENDED: 'Contrat terminé',
    MANAGER_ASSIGNED: 'Manager assigné',
};

export const JOURNEY_STAGE_LABELS: Record<string, string> = {
    ONBOARDING: 'Intégration',
    ACTIVE: 'Actif',
    PROMOTION: 'Promotion',
    TRANSFER: 'Transfert',
    OFFBOARDING: 'Sortie',
    RETIREMENT: 'Retraite',
    ARCHIVED: 'Archivé',
    DISCIPLINARY: 'Discipline',
    PROBATION: 'Essai',
};

export function journeyEventLabel(eventType: string): string {
    return JOURNEY_EVENT_LABELS[eventType] || eventType.replace(/_/g, ' ').toLowerCase();
}

export function journeyStageLabel(stage: string): string {
    return JOURNEY_STAGE_LABELS[stage] || stage;
}

/** Traduction approximative des raisons d’éligibilité retraite (messages API EN). */
export function translateEligibilityReason(reason: string): string {
    const r = reason.toLowerCase();
    if (r.includes('age') && r.includes('780')) {
        return 'Âge insuffisant (règle : ≥ 65 ans)';
    }
    if (r.includes('tenure') || r.includes('career') || r.includes('420')) {
        return 'Ancienneté insuffisante (règle : ≥ 35 ans)';
    }
    if (r.includes('retirement requires')) {
        return 'La retraite exige âge ≥ 65 ans OU ancienneté ≥ 35 ans';
    }
    if (r.includes('career path') || r.includes('no career')) {
        return 'Aucun parcours de carrière ne mène à ce poste';
    }
    if (r.includes('performance')) {
        return 'Critères de performance non atteints';
    }
    if (r.includes('skill')) {
        return 'Compétences requises manquantes';
    }
    if (r.includes('training')) {
        return 'Formations obligatoires manquantes';
    }
    if (r.includes('tenure') || r.includes('years')) {
        return 'Ancienneté insuffisante pour cette promotion';
    }
    return reason;
}

export function sourceEntityHref(type?: string, id?: string): string | null {
    if (!type || !id) return null;
    const clean = id.replace(/^\/api\/[^/]+\//, '').split('/').pop() || id;
    const t = type.toUpperCase();
    if (t.includes('DISCIPLINARY')) return `/m/sanctions/affaires/${clean}`;
    if (t.includes('MOBILITY')) return `/m/personnel/mobility/${clean}`;
    if (t.includes('EXIT') || t.includes('OFFBOARD')) return `/m/personnel/offboarding/${clean}`;
    if (t.includes('ONBOARD')) return `/m/personnel/onboarding/${clean}`;
    if (t.includes('CONTRACT')) return `/m/personnel/contracts/${clean}`;
    return null;
}
