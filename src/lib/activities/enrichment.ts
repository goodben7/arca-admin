import { request } from '@/lib/api/client';
import { extractId } from '@/lib/api-iri';
import { getAllUsers } from '@/lib/api/profile';
import { getAllEmployees } from '@/lib/api/employee';
import type { Activity } from '@/types/succession';
import type { AppUser } from '@/types/profile';
import type { Employee } from '@/types/employee';
import { ONBOARDING_TASK_TYPE_LABELS } from '@/types/onboarding';

export const ACTIVITY_LABELS: Record<string, string> = {
    created: 'Création',
    edited: 'Modification',
    updated: 'Modification',
    deleted: 'Suppression',
    activated: 'Activation',
    deactivated: 'Désactivation',
    completed: 'Finalisation',
    cancelled: 'Annulation',
    approved: 'Approbation',
    rejected: 'Rejet',
    published: 'Publication',
    closed: 'Clôture',
    assigned: 'Affectation',
    submitted: 'Soumission',
};

type ResourceData = Record<string, unknown>;

interface ResourceConfig {
    api: string;
    typeLabel: string;
    href: (id: string, data?: ResourceData) => string | null;
    label: (id: string, data: ResourceData, employeesById: Record<string, Employee>) => string;
}

function employeeName(employeesById: Record<string, Employee>, ref?: unknown) {
    const id = extractId(ref as string);
    if (!id) return undefined;
    const emp = employeesById[id];
    return emp ? `${emp.firstName} ${emp.lastName}`.trim() : undefined;
}

const RESOURCE_REGISTRY: Record<string, ResourceConfig> = {
    employee: {
        api: 'employees',
        typeLabel: 'Employé',
        href: (id) => `/m/personnel/employees/${id}`,
        label: (_id, data) => `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Employé',
    },
    contract: {
        api: 'contracts',
        typeLabel: 'Contrat',
        href: (id) => `/m/personnel/contracts/${id}`,
        label: (id, data, employeesById) => {
            const name = employeeName(employeesById, data.employee);
            return name ? `Contrat ${data.type || ''} — ${name}`.trim() : `Contrat #${id.slice(0, 8)}`;
        },
    },
    work_experience: {
        api: 'work_experiences',
        typeLabel: 'Expérience',
        href: (_id, data) => {
            const employeeId = extractId(data?.employee as string | undefined);
            return employeeId ? `/m/personnel/employees/${employeeId}` : null;
        },
        label: (_id, data) => (data.company as string) || (data.position as string) || 'Expérience professionnelle',
    },
    onboarding_process: {
        api: 'onboarding_processes',
        typeLabel: 'Intégration',
        href: (id) => `/m/personnel/onboarding/${id}`,
        label: (_id, _data, employeesById) => {
            const name = employeeName(employeesById, _data.employee);
            return name ? `Intégration — ${name}` : 'Processus d\'intégration';
        },
    },
    onboarding_task: {
        api: 'onboarding_tasks',
        typeLabel: 'Tâche d\'intégration',
        href: (_id, data) => {
            const processId = extractId(data?.process as string | undefined);
            return processId ? `/m/personnel/onboarding/${processId}` : null;
        },
        label: (_id, data) => {
            const title = data.title as string | undefined;
            const type = data.type as string | undefined;
            if (title) return title;
            if (type && ONBOARDING_TASK_TYPE_LABELS[type as keyof typeof ONBOARDING_TASK_TYPE_LABELS]) {
                return ONBOARDING_TASK_TYPE_LABELS[type as keyof typeof ONBOARDING_TASK_TYPE_LABELS];
            }
            return "Tâche d'intégration";
        },
    },
    career_plan: {
        api: 'career_plans',
        typeLabel: 'Plan de carrière',
        href: (id) => `/m/performance/career-plans/${id}`,
        label: (_id, data, employeesById) => {
            const name = employeeName(employeesById, data.employee);
            return name ? `Plan de carrière — ${name}` : 'Plan de carrière';
        },
    },
    career_path: {
        api: 'career_paths',
        typeLabel: 'Parcours',
        href: () => '/m/personnel/career-paths',
        label: (_id, data) => (data.title as string) || (data.name as string) || 'Parcours de carrière',
    },
    exit_process: {
        api: 'exit_processes',
        typeLabel: 'Sortie collaborateur',
        href: (id) => `/m/personnel/offboarding/${id}`,
        label: (_id, data, employeesById) => {
            const name = employeeName(employeesById, data.employee);
            return name ? `Sortie — ${name}` : 'Processus de sortie';
        },
    },
    mobility_request: {
        api: 'mobility_requests',
        typeLabel: 'Mobilité',
        href: (id) => `/m/personnel/mobility/${id}`,
        label: (_id, data, employeesById) => {
            const name = employeeName(employeesById, data.employee);
            return name ? `Mobilité — ${name}` : 'Demande de mobilité';
        },
    },
    leave_request: {
        api: 'leave_requests',
        typeLabel: 'Congé',
        href: () => '/m/temps/leave',
        label: (_id, data, employeesById) => {
            const name = employeeName(employeesById, data.employee);
            return name ? `Congé — ${name}` : 'Demande de congé';
        },
    },
    document: {
        api: 'documents',
        typeLabel: 'Document',
        href: () => '/m/personnel/documents',
        label: (_id, data) => (data.title as string) || 'Document',
    },
    application: {
        api: 'applications',
        typeLabel: 'Candidature',
        href: (id) => `/m/recrutement/candidatures/${id}`,
        label: (_id, data) => {
            const first = data.firstName as string | undefined;
            const last = data.lastName as string | undefined;
            if (first || last) return `${first || ''} ${last || ''}`.trim();
            return 'Candidature';
        },
    },
    job_offer: {
        api: 'job_offers',
        typeLabel: 'Offre',
        href: (id) => `/m/recrutement/offres/${id}`,
        label: (_id, data) => (data.title as string) || 'Offre d\'emploi',
    },
    recruitment_request: {
        api: 'recruitment_requests',
        typeLabel: 'Demande de recrutement',
        href: (id) => `/m/recrutement/demandes/${id}`,
        label: (_id, data) => (data.title as string) || 'Demande de recrutement',
    },
    department: {
        api: 'departments',
        typeLabel: 'Département',
        href: () => '/m/personnel/departments',
        label: (_id, data) => (data.name as string) || 'Département',
    },
    position: {
        api: 'positions',
        typeLabel: 'Poste',
        href: () => '/m/personnel/positions',
        label: (_id, data) => (data.title as string) || 'Poste',
    },
    job_role: {
        api: 'job_roles',
        typeLabel: 'Fonction',
        href: () => '/m/personnel/job-roles',
        label: (_id, data) => (data.title as string) || 'Fonction',
    },
    training_request: {
        api: 'training_requests',
        typeLabel: 'Demande de formation',
        href: (id) => `/m/formation/demandes/${id}`,
        label: (_id, data, employeesById) => {
            const name = employeeName(employeesById, data.employee);
            return name ? `Formation — ${name}` : 'Demande de formation';
        },
    },
    training_session: {
        api: 'training_sessions',
        typeLabel: 'Session de formation',
        href: (id) => `/m/formation/sessions/${id}`,
        label: (_id, data) => (data.title as string) || 'Session de formation',
    },
    performance_review: {
        api: 'performance_reviews',
        typeLabel: 'Évaluation',
        href: () => '/m/performance',
        label: (_id, data, employeesById) => {
            const name = employeeName(employeesById, data.employee);
            return name ? `Évaluation — ${name}` : 'Évaluation de performance';
        },
    },
    objective: {
        api: 'objectives',
        typeLabel: 'Objectif',
        href: () => '/m/performance/objectifs',
        label: (_id, data) => (data.title as string) || 'Objectif',
    },
    succession_plan: {
        api: 'succession_plans',
        typeLabel: 'Plan de succession',
        href: () => '/m/performance/succession-plans',
        label: (_id, data) => (data.title as string) || 'Plan de succession',
    },
};

export interface EnrichedResource {
    typeLabel: string;
    label: string;
    href: string | null;
    identifier: string;
}

export interface ActivityEnrichment {
    usersById: Record<string, { label: string; email: string }>;
    resourcesByKey: Record<string, EnrichedResource>;
}

function resourceKey(name?: string, id?: string) {
    if (!name || !id) return '';
    return `${name}:${id}`;
}

function normalizeList<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    const d = data as Record<string, unknown>;
    if (Array.isArray(d['hydra:member'])) return d['hydra:member'] as T[];
    if (Array.isArray(d.member)) return d.member as T[];
    return [];
}

function resolveUserLabel(user: AppUser, employeesById: Record<string, Employee>) {
    const displayName = (user as AppUser & { displayName?: string }).displayName;
    if (displayName?.trim()) return displayName.trim();

    const employeeRef = (user as AppUser & { employee?: string }).employee;
    const employeeId = extractId(employeeRef);
    if (employeeId && employeesById[employeeId]) {
        const emp = employeesById[employeeId];
        return `${emp.firstName} ${emp.lastName}`.trim();
    }

    return user.email;
}

async function fetchResource(
    resourceName: string,
    id: string,
    employeesById: Record<string, Employee>,
): Promise<EnrichedResource> {
    const config = RESOURCE_REGISTRY[resourceName];
    const typeLabel = config?.typeLabel || resourceName.replace(/_/g, ' ');

    if (!config) {
        return { typeLabel, label: id, href: null, identifier: id };
    }

    try {
        const res = await request(`/api/${config.api}/${id}`);
        if (!res.ok) throw new Error('not found');
        const data = (await res.json()) as ResourceData;
        return {
            typeLabel,
            label: config.label(id, data, employeesById),
            href: config.href(id, data),
            identifier: id,
        };
    } catch {
        return {
            typeLabel,
            label: `${typeLabel} #${id.slice(0, 8)}`,
            href: config.href(id),
            identifier: id,
        };
    }
}

export function getActivityLabel(activity?: string) {
    if (!activity) return '—';
    return ACTIVITY_LABELS[activity.toLowerCase()] || activity;
}

export function getUserLabel(enrichment: ActivityEnrichment | null, userRef?: string) {
    if (!userRef) return 'Système';
    const id = extractId(userRef) || userRef;
    const user = enrichment?.usersById[id] || enrichment?.usersById[userRef];
    return user?.label || userRef;
}

export function getResourceEnrichment(
    enrichment: ActivityEnrichment | null,
    resourceName?: string,
    resourceId?: string,
): EnrichedResource | null {
    if (!resourceName || !resourceId) return null;
    const id = extractId(resourceId) || resourceId;
    return enrichment?.resourcesByKey[resourceKey(resourceName, id)] || null;
}

export async function buildActivityEnrichment(activities: Activity[]): Promise<ActivityEnrichment> {
    const [usersData, employeesData] = await Promise.all([
        getAllUsers().catch(() => []),
        getAllEmployees({ itemsPerPage: 1000 }).catch(() => []),
    ]);

    const usersList = normalizeList<AppUser>(usersData);
    const employeesList = normalizeList<Employee>(employeesData);

    const employeesById: Record<string, Employee> = {};
    employeesList.forEach((emp) => {
        employeesById[emp.id] = emp;
        if (emp['@id']) employeesById[emp['@id']] = emp;
    });

    const usersById: Record<string, { label: string; email: string }> = {};
    usersList.forEach((user) => {
        const entry = { label: resolveUserLabel(user, employeesById), email: user.email };
        usersById[user.id] = entry;
        if (user['@id']) usersById[user['@id']] = entry;
    });

    const uniqueResources = new Map<string, { name: string; id: string }>();
    activities.forEach((activity) => {
        const name = activity.ressourceName;
        const id = extractId(activity.ressourceIdentifier);
        if (!name || !id) return;
        uniqueResources.set(resourceKey(name, id), { name, id });
    });

    const resourceEntries = await Promise.all(
        [...uniqueResources.values()].map(async ({ name, id }) => {
            const enriched = await fetchResource(name, id, employeesById);
            return [resourceKey(name, id), enriched] as const;
        }),
    );

    const resourcesByKey: Record<string, EnrichedResource> = {};
    resourceEntries.forEach(([key, value]) => {
        resourcesByKey[key] = value;
    });

    return { usersById, resourcesByKey };
}
