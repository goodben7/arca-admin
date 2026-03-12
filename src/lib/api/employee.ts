import { Employee, Department, WorkExperience, Skill } from '@/types/employee';
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
    const response = await request('/api/employees', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
    const response = await request(path, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/merge-patch+json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Erreur lors de la mise à jour de l\'employé.');
    }

    return response.json();
}
