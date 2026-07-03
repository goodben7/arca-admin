/**
 * Traduit les messages d'éligibilité renvoyés en anglais par l'API.
 */
export function translateEligibilityReason(reason: string, skillNames?: Record<string, string>): string {
    const trimmed = reason.trim();
    const lower = trimmed.toLowerCase();

    const exact: Record<string, string> = {
        'employee must be active': "L'employé doit être actif",
        'employee has no current job role': "L'employé n'a pas de fiche métier attribuée",
        'employee is not active': "L'employé n'est pas actif",
        'target job role not found': 'Fiche métier cible introuvable',
        'employee not found': 'Employé introuvable',
    };

    if (exact[lower]) return exact[lower];

    const missingSkill = trimmed.match(/^missing required skill:\s*(.+)$/i);
    if (missingSkill) {
        const code = missingSkill[1].trim();
        const label = skillNames?.[code] || code;
        return `Compétence requise manquante : ${label}`;
    }

    const skillLevel = trimmed.match(/^skill\s+(.+)\s+level insufficient$/i);
    if (skillLevel) {
        const code = skillLevel[1].trim();
        const label = skillNames?.[code] || code;
        return `Niveau insuffisant pour la compétence : ${label}`;
    }

    const grade = trimmed.match(/^target grade not met$/i);
    if (grade) return 'Le grade cible n\'est pas atteint';

    return trimmed;
}
