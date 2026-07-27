import { Employee, Department, WorkExperience, Skill } from '@/types/employee';
import { extractId, toIri } from '@/lib/api-iri';
import { request } from './client';

export async function getAllEmployees(params: Record<string, any> = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
        }
    });

    const queryString = queryParams.toString();
    const response = await request(`/api/employees${queryString ? `?${queryString}` : ''}`);

    if (!response.ok) {
        throw new Error('Impossible de charger la liste des employés.');
    }

    return response.json();
}

export async function createEmployee(data: Partial<Employee>): Promise<Employee> {
    const payload: Record<string, unknown> = { ...data };
    // jobRole / grade : IDs bruts (JR…, GR…), max 16 chars — pas d'IRI
    if (data.jobRole) payload.jobRole = extractId(data.jobRole as string) || data.jobRole;
    if (data.grade) payload.grade = extractId(data.grade as string) || data.grade;
    if (data.department) payload.department = toIri('departments', data.department as string);
    if (data.position) payload.position = toIri('positions', data.position as string);
    if (data.profile) payload.profile = toIri('profiles', data.profile as string);

    const response = await request('/api/employees', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Erreur lors de la création de l\'employé.');
    }

    return response.json();
}

export async function getDepartments(): Promise<{ 'hydra:member': Department[] } | Department[]> {
    const response = await request('/api/departments');

    if (!response.ok) {
        throw new Error('Impossible de charger les départements.');
    }

    return response.json();
}

export async function getEmployeeById(id: string): Promise<Employee> {
    const path = id.startsWith('/') ? id : `/api/employees/${id}`;
    const response = await request(path);

    if (!response.ok) {
        throw new Error(`Impossible de charger les détails de l'employé ${id}.`);
    }

    return response.json();
}

export async function createDepartment(data: Partial<Department>): Promise<Department> {
    const response = await request('/api/departments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Erreur lors de la création du département.');
    }

    return response.json();
}

export async function updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    const path = id.startsWith('/') ? id : `/api/departments/${id}`;
    const response = await request(path, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/merge-patch+json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Erreur lors de la mise à jour du département.');
    }

    return response.json();
}

export async function createWorkExperience(data: WorkExperience): Promise<WorkExperience> {
    const response = await request('/api/work_experiences', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Erreur lors de l\'ajout de l\'expérience.');
    }

    return response.json();
}

export async function createSkill(data: Skill): Promise<Skill> {
    const response = await request('/api/skills', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Erreur lors de l\'ajout de la compétence.');
    }

    return response.json();
}

export async function getWorkExperiencesByEmployee(employeeId: string): Promise<{ 'hydra:member': WorkExperience[] } | WorkExperience[]> {
    const response = await request(`/api/work_experiences?employee=${employeeId}`);

    if (!response.ok) {
        throw new Error('Impossible de charger les expériences de l\'employé.');
    }

    return response.json();
}

export async function getSkillsByEmployee(employeeId: string): Promise<{ 'hydra:member': Skill[] } | Skill[]> {
    const response = await request(`/api/skills?employee=${employeeId}`);

    if (!response.ok) {
        throw new Error('Impossible de charger les compétences de l\'employé.');
    }

    return response.json();
}

export async function updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    const path = id.startsWith('/') ? id : `/api/employees/${id}`;
    const payload: Record<string, unknown> = { ...data };
    if (data.jobRole !== undefined) {
        payload.jobRole = data.jobRole ? (extractId(data.jobRole as string) || data.jobRole) : null;
    }
    if (data.grade !== undefined) {
        payload.grade = data.grade ? (extractId(data.grade as string) || data.grade) : null;
    }
    if (data.department !== undefined) {
        payload.department = data.department ? toIri('departments', data.department as string) : null;
    }
    if (data.position !== undefined) {
        payload.position = data.position ? toIri('positions', data.position as string) : null;
    }
    const response = await request(path, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/merge-patch+json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Erreur lors de la mise à jour de l\'employé.');
    }

    return response.json();
}

export async function assignManager(employeeId: string, managerId: string) {
    const response = await request('/api/employees/assign-manager', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId, managerId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Erreur lors de l\'assignation du manager.');
    }

    return response.json();
}

export async function createEmployeeSkill(data: { employee: string; skill: string; level: string }) {
    const response = await request('/api/employee_skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Erreur lors de l\'ajout de la compétence.');
    }
    return response.json();
}

export async function validateEmployeeSkill(employeeSkillId: string) {
    const response = await request('/api/employee_skills/validations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeSkillId }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Erreur lors de la validation de la compétence.');
    }
    const text = await response.text();
    return text ? JSON.parse(text) : {};
}

export async function getEmployeeJourney(employeeId: string) {
    const response = await request(`/api/employees/${employeeId}/journey?order[occurredAt]=desc`);
    if (!response.ok) {
        throw new Error('Impossible de charger le parcours de l\'employé.');
    }
    return response.json();
}

export async function checkPromotionEligibility(employeeId: string, targetJobRole: string) {
    const response = await request(`/api/employees/${employeeId}/promotion-eligibility?targetJobRole=${targetJobRole}`);
    if (!response.ok) {
        throw new Error('Impossible de vérifier l\'éligibilité à la promotion.');
    }
    return response.json();
}

export async function changeEmployeeStatus(action: string, employeeId: string) {
    const response = await request(`/api/employees/${action}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Erreur lors du changement de statut.');
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
}
