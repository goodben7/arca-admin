'use client';

import { useCallback, useEffect, useState } from 'react';
import { getDepartments, getAllEmployees } from '@/lib/api/employee';
import { getAllContracts } from '@/lib/api/contract';
import { getJobFamilies, getGrades, getJobRoles } from '@/lib/api/jobArchitecture';
import { getAllPositions } from '@/lib/api/position';
import { getAllProfiles, getAllUsers } from '@/lib/api/profile';
import { getSkillCategories } from '@/lib/api/skill';
import { normalizeList } from '@/lib/modules/dashboard/normalize';

export type SetupStepId =
    | 'jobFamilies'
    | 'grades'
    | 'jobRoles'
    | 'departments'
    | 'positions'
    | 'skillCategories'
    | 'profiles'
    | 'users'
    | 'employees'
    | 'contracts';

export interface SetupStep {
    id: SetupStepId;
    phase: 'foundation' | 'security' | 'people';
    title: string;
    description: string;
    href: string;
    minCount: number;
    count: number;
    done: boolean;
}

export interface SetupProgress {
    loading: boolean;
    error: string | null;
    steps: SetupStep[];
    foundationDone: boolean;
    securityDone: boolean;
    peopleDone: boolean;
    allDone: boolean;
    progressPercent: number;
    reload: () => Promise<void>;
}

const STEP_DEFS: Omit<SetupStep, 'count' | 'done'>[] = [
    {
        id: 'jobFamilies',
        phase: 'foundation',
        title: 'Familles de métiers',
        description: 'Classer les métiers de l’organisation.',
        href: '/m/personnel/job-families',
        minCount: 1,
    },
    {
        id: 'grades',
        phase: 'foundation',
        title: 'Grades',
        description: 'Niveaux hiérarchiques et salariaux.',
        href: '/m/personnel/grades',
        minCount: 1,
    },
    {
        id: 'jobRoles',
        phase: 'foundation',
        title: 'Fiches métiers',
        description: 'Référentiel des fonctions.',
        href: '/m/personnel/job-roles',
        minCount: 1,
    },
    {
        id: 'departments',
        phase: 'foundation',
        title: 'Départements',
        description: 'Structure organisationnelle.',
        href: '/m/personnel/departments',
        minCount: 1,
    },
    {
        id: 'positions',
        phase: 'foundation',
        title: 'Postes',
        description: 'Postes ouverts par département.',
        href: '/m/personnel/positions',
        minCount: 1,
    },
    {
        id: 'skillCategories',
        phase: 'foundation',
        title: 'Compétences',
        description: 'Catégories et référentiel de compétences.',
        href: '/m/personnel/skills',
        minCount: 1,
    },
    {
        id: 'profiles',
        phase: 'security',
        title: 'Profils & droits',
        description: 'Rôles applicatifs et permissions.',
        href: '/m/securite/profiles',
        minCount: 1,
    },
    {
        id: 'users',
        phase: 'security',
        title: 'Utilisateurs',
        description: 'Comptes d’accès à la plateforme.',
        href: '/m/securite/users',
        minCount: 1,
    },
    {
        id: 'employees',
        phase: 'people',
        title: 'Employés',
        description: 'Premiers dossiers collaborateurs.',
        href: '/m/personnel/employees/create',
        minCount: 1,
    },
    {
        id: 'contracts',
        phase: 'people',
        title: 'Contrats',
        description: 'Au moins un contrat actif ou en attente.',
        href: '/m/personnel/contracts/create',
        minCount: 1,
    },
];

function phaseDone(steps: SetupStep[], phase: SetupStep['phase']) {
    const subset = steps.filter(s => s.phase === phase);
    return subset.length > 0 && subset.every(s => s.done);
}

export function useSetupProgress(): SetupProgress {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [steps, setSteps] = useState<SetupStep[]>([]);

    const reload = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [
                jobFamilies,
                grades,
                jobRoles,
                departments,
                positions,
                skillCategories,
                profilesData,
                usersData,
                employeesData,
                contractsData,
            ] = await Promise.all([
                getJobFamilies().catch(() => []),
                getGrades().catch(() => []),
                getJobRoles().catch(() => []),
                getDepartments().catch(() => []),
                getAllPositions().catch(() => []),
                getSkillCategories().catch(() => []),
                getAllProfiles().catch(() => []),
                getAllUsers().catch(() => []),
                getAllEmployees().catch(() => []),
                getAllContracts().catch(() => []),
            ]);

            const counts: Record<SetupStepId, number> = {
                jobFamilies: jobFamilies.length,
                grades: grades.length,
                jobRoles: jobRoles.length,
                departments: normalizeList(departments).length,
                positions: normalizeList(positions).length,
                skillCategories: skillCategories.length,
                profiles: normalizeList(profilesData).length,
                users: normalizeList(usersData).length,
                employees: normalizeList(employeesData).length,
                contracts: normalizeList(contractsData).length,
            };

            const nextSteps = STEP_DEFS.map(def => {
                const count = counts[def.id];
                return { ...def, count, done: count >= def.minCount };
            });

            setSteps(nextSteps);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Impossible de charger la progression.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    const foundationDone = phaseDone(steps, 'foundation');
    const securityDone = phaseDone(steps, 'security');
    const peopleDone = phaseDone(steps, 'people');
    const allDone = steps.length > 0 && steps.every(s => s.done);
    const progressPercent = steps.length
        ? Math.round((steps.filter(s => s.done).length / steps.length) * 100)
        : 0;

    return {
        loading,
        error,
        steps,
        foundationDone,
        securityDone,
        peopleDone,
        allDone,
        progressPercent,
        reload,
    };
}
