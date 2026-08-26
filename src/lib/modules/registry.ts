import {
    Users,
    Clock,
    Calculator,
    UserPlus,
    GraduationCap,
    Target,
    ShieldCheck,
    BarChart2,
    Scale,
    FileCheck,
    LayoutGrid,
    FileText,
    FolderOpen,
    UserMinus,
    ArrowLeftRight,
    Building2,
    Briefcase,
    Layers,
    Award,
    ClipboardList,
    TrendingUp,
    Sparkles,
    CalendarDays,
    CalendarCheck,
    Wallet,
    Gift,
    Banknote,
    Megaphone,
    Contact,
    BookOpen,
    Presentation,
    RefreshCcw,
    GitBranch,
    Settings,
    KeyRound,
    Activity,
    FileBarChart,
    type LucideIcon,
} from 'lucide-react';

export type ModuleStatus = 'active' | 'soon';

export interface ModuleMenuItem {
    title: string;
    href: string;
    section?: string;
    icon?: LucideIcon;
}

export interface AppModule {
    slug: string;
    name: string;
    shortName: string;
    description: string;
    icon: LucideIcon;
    href: string;
    status: ModuleStatus;
    /** Tailwind color tokens for accent */
    accent: {
        bg: string;
        soft: string;
        text: string;
        ring: string;
        bar: string;
    };
    menu: ModuleMenuItem[];
}

export const APP_MODULES: AppModule[] = [
    {
        slug: 'personnel',
        name: 'Personnel & Organisation',
        shortName: 'Personnel',
        description: 'Employés, contrats, documents et structure.',
        icon: Users,
        href: '/m/personnel',
        status: 'active',
        accent: {
            bg: 'bg-primary-500',
            soft: 'bg-primary-50',
            text: 'text-primary-700',
            ring: 'ring-primary-500/25',
            bar: 'bg-primary-500',
        },
        menu: [
            { title: 'Vue d\'ensemble', href: '/m/personnel', icon: LayoutGrid },
            { title: 'Employés', href: '/m/personnel/employees', section: 'Collaborateurs', icon: Users },
            { title: 'Contrats', href: '/m/personnel/contracts', section: 'Collaborateurs', icon: FileText },
            { title: 'Documents', href: '/m/personnel/documents', section: 'Collaborateurs', icon: FolderOpen },
            { title: 'Intégration', href: '/m/personnel/onboarding', section: 'Parcours', icon: UserPlus },
            { title: 'Sortie collaborateurs', href: '/m/personnel/offboarding', section: 'Parcours', icon: UserMinus },
            { title: 'Mobilité', href: '/m/personnel/mobility', section: 'Parcours', icon: ArrowLeftRight },
            { title: 'Départements', href: '/m/personnel/departments', section: 'Organisation', icon: Building2 },
            { title: 'Postes', href: '/m/personnel/positions', section: 'Organisation', icon: Briefcase },
            { title: 'Familles de métiers', href: '/m/personnel/job-families', section: 'Référentiel', icon: Layers },
            { title: 'Grades', href: '/m/personnel/grades', section: 'Référentiel', icon: Award },
            { title: 'Fiches métiers', href: '/m/personnel/job-roles', section: 'Référentiel', icon: ClipboardList },
            { title: 'Parcours de carrière', href: '/m/personnel/career-paths', section: 'Référentiel', icon: TrendingUp },
            { title: 'Compétences', href: '/m/personnel/skills', section: 'Référentiel', icon: Sparkles },
        ],
    },
    {
        slug: 'temps',
        name: 'Absences & Présences',
        shortName: 'Absences',
        description: 'Congés, absences et pointage.',
        icon: Clock,
        href: '/m/temps',
        status: 'active',
        accent: {
            bg: 'bg-[#EA580C]',
            soft: 'bg-[#FFF7ED]',
            text: 'text-[#C2410C]',
            ring: 'ring-[#EA580C]/25',
            bar: 'bg-[#EA580C]',
        },
        menu: [
            { title: 'Vue d\'ensemble', href: '/m/temps', icon: LayoutGrid },
            { title: 'Congés', href: '/m/temps/leave', section: 'Absences', icon: CalendarDays },
            { title: 'Présences', href: '/m/temps/attendance', section: 'Absences', icon: CalendarCheck },
        ],
    },
    {
        slug: 'paie',
        name: 'Paie & Avantages',
        shortName: 'Paie',
        description: 'Bulletins, rémunération et avantages sociaux.',
        icon: Calculator,
        href: '/m/paie',
        status: 'active',
        accent: {
            bg: 'bg-primary-800',
            soft: 'bg-primary-50',
            text: 'text-primary-900',
            ring: 'ring-primary-700/25',
            bar: 'bg-primary-800',
        },
        menu: [
            { title: 'Vue d\'ensemble', href: '/m/paie', icon: LayoutGrid },
            { title: 'Historique salarial', href: '/m/paie/compensation', section: 'Rémunération', icon: Wallet },
            { title: 'Avantages sociaux', href: '/m/paie/benefits', section: 'Rémunération', icon: Gift },
            { title: 'Paie', href: '/m/paie/payroll', section: 'Rémunération', icon: Banknote },
            { title: 'Conformité RDC', href: '/m/paie/conformite', section: 'Conformité', icon: FileCheck },
        ],
    },
    {
        slug: 'recrutement',
        name: 'Recrutement',
        shortName: 'Recrutement',
        description: 'Demandes, offres et candidatures.',
        icon: UserPlus,
        href: '/m/recrutement',
        status: 'active',
        accent: {
            bg: 'bg-accent-red-500',
            soft: 'bg-accent-red-50',
            text: 'text-accent-red-700',
            ring: 'ring-accent-red-500/25',
            bar: 'bg-accent-red-500',
        },
        menu: [
            { title: 'Vue d\'ensemble', href: '/m/recrutement', icon: LayoutGrid },
            { title: 'Demandes', href: '/m/recrutement/demandes', section: 'Processus', icon: ClipboardList },
            { title: 'Offres', href: '/m/recrutement/offres', section: 'Processus', icon: Megaphone },
            { title: 'Candidatures', href: '/m/recrutement/candidatures', section: 'Processus', icon: Contact },
        ],
    },
    {
        slug: 'formation',
        name: 'Formation',
        shortName: 'Formation',
        description: 'Référentiel, séances et demandes.',
        icon: GraduationCap,
        href: '/m/formation',
        status: 'active',
        accent: {
            bg: 'bg-accent-yellow-500',
            soft: 'bg-[#FFF8E7]',
            text: 'text-[#9A7200]',
            ring: 'ring-accent-yellow-500/30',
            bar: 'bg-accent-yellow-500',
        },
        menu: [
            { title: 'Vue d\'ensemble', href: '/m/formation', icon: LayoutGrid },
            { title: 'Référentiel', href: '/m/formation/catalog', section: 'Formations', icon: BookOpen },
            { title: 'Séances', href: '/m/formation/sessions', section: 'Formations', icon: Presentation },
            { title: 'Demandes', href: '/m/formation/demandes', section: 'Formations', icon: FileText },
        ],
    },
    {
        slug: 'performance',
        name: 'Carrière & Évaluation',
        shortName: 'Carrière',
        description: 'Objectifs, évaluations et succession.',
        icon: Target,
        href: '/m/performance',
        status: 'active',
        accent: {
            bg: 'bg-indigo-600',
            soft: 'bg-indigo-50',
            text: 'text-indigo-800',
            ring: 'ring-indigo-500/25',
            bar: 'bg-indigo-600',
        },
        menu: [
            { title: 'Vue d\'ensemble', href: '/m/performance', icon: LayoutGrid },
            { title: 'Cycles d\'évaluation', href: '/m/performance/cycles', section: 'Évaluation', icon: RefreshCcw },
            { title: 'Objectifs', href: '/m/performance/objectifs', section: 'Évaluation', icon: Target },
            { title: 'Évaluations', href: '/m/performance/evaluations', section: 'Évaluation', icon: ClipboardList },
            { title: 'Plans de carrière', href: '/m/performance/career-plans', section: 'Développement', icon: TrendingUp },
            { title: 'Plans de succession', href: '/m/performance/succession-plans', section: 'Développement', icon: GitBranch },
        ],
    },
    {
        slug: 'securite',
        name: 'Sécurité & Accès',
        shortName: 'Sécurité',
        description: 'Profils, comptes et paramètres.',
        icon: ShieldCheck,
        href: '/m/securite',
        status: 'active',
        accent: {
            bg: 'bg-secondary-700',
            soft: 'bg-secondary-50',
            text: 'text-secondary-800',
            ring: 'ring-secondary-600/25',
            bar: 'bg-secondary-700',
        },
        menu: [
            { title: 'Vue d\'ensemble', href: '/m/securite', icon: LayoutGrid },
            { title: 'Profils', href: '/m/securite/profiles', section: 'Accès', icon: KeyRound },
            { title: 'Utilisateurs', href: '/m/securite/users', section: 'Accès', icon: Users },
            { title: 'Paramètres', href: '/m/securite/settings', section: 'Système', icon: Settings },
        ],
    },
    {
        slug: 'pilotage',
        name: 'Pilotage & Indicateurs',
        shortName: 'Pilotage',
        description: 'Tableaux de bord, activité et rapports.',
        icon: BarChart2,
        href: '/m/pilotage',
        status: 'active',
        accent: {
            bg: 'bg-violet-600',
            soft: 'bg-violet-50',
            text: 'text-violet-800',
            ring: 'ring-violet-500/25',
            bar: 'bg-violet-600',
        },
        menu: [
            { title: 'Tableau de bord', href: '/m/pilotage', icon: LayoutGrid },
            { title: 'Configuration', href: '/m/pilotage/configuration', section: 'Suivi', icon: Settings },
            { title: 'Journal d\'activité', href: '/m/pilotage/activities', section: 'Suivi', icon: Activity },
            { title: 'Rapports', href: '/m/pilotage/reports', section: 'Suivi', icon: FileBarChart },
        ],
    },
    {
        slug: 'sanctions',
        name: 'Sanctions et discipline',
        shortName: 'Sanctions',
        description: 'Mesures disciplinaires — Code du travail RDC.',
        icon: Scale,
        href: '/m/sanctions',
        status: 'active',
        accent: {
            bg: 'bg-[#BE123C]',
            soft: 'bg-rose-50',
            text: 'text-rose-900',
            ring: 'ring-rose-500/25',
            bar: 'bg-[#BE123C]',
        },
        menu: [
            { title: 'Vue d\'ensemble', href: '/m/sanctions', icon: LayoutGrid },
            { title: 'Affaires', href: '/m/sanctions/affaires', section: 'Procédures', icon: ClipboardList },
            { title: 'Échelles', href: '/m/sanctions/echelles', section: 'Référentiel', icon: Scale },
        ],
    },
];

export function getModule(slug: string): AppModule | undefined {
    return APP_MODULES.find(m => m.slug === slug);
}

export function getModuleFromPath(pathname: string): AppModule | undefined {
    const match = pathname.match(/^\/m\/([^/]+)/);
    if (!match) return undefined;
    return getModule(match[1]);
}

export const ACTIVE_MODULES = APP_MODULES.filter(m => m.status === 'active');
export const SOON_MODULES = APP_MODULES.filter(m => m.status === 'soon');

/** Legacy path → new module path */
export const LEGACY_REDIRECTS: Record<string, string> = {
    '/dashboard': '/apps',
    '/hr-dashboard': '/m/pilotage',
    '/activities': '/m/pilotage/activities',
    '/reports': '/m/pilotage/reports',
    '/employees': '/m/personnel/employees',
    '/contracts': '/m/personnel/contracts',
    '/departments': '/m/personnel/departments',
    '/positions': '/m/personnel/positions',
    '/documents': '/m/personnel/documents',
    '/onboarding': '/m/personnel/onboarding',
    '/offboarding': '/m/personnel/offboarding',
    '/mobility': '/m/personnel/mobility',
    '/job-families': '/m/personnel/job-families',
    '/grades': '/m/personnel/grades',
    '/job-roles': '/m/personnel/job-roles',
    '/career-paths': '/m/personnel/career-paths',
    '/skills': '/m/personnel/skills',
    '/leave': '/m/temps/leave',
    '/attendance': '/m/temps/attendance',
    '/compensation': '/m/paie/compensation',
    '/benefits': '/m/paie/benefits',
    '/payroll': '/m/paie/payroll',
    '/recruitment': '/m/recrutement/demandes',
    '/job-offers': '/m/recrutement/offres',
    '/applications': '/m/recrutement/candidatures',
    '/training': '/m/formation/demandes',
    '/training/sessions': '/m/formation/sessions',
    '/training/catalog': '/m/formation/catalog',
    '/evaluation-cycles': '/m/performance/cycles',
    '/objectives': '/m/performance/objectifs',
    '/performance-reviews': '/m/performance/evaluations',
    '/career-plans': '/m/performance/career-plans',
    '/succession-plans': '/m/performance/succession-plans',
    '/profiles': '/m/securite/profiles',
    '/users': '/m/securite/users',
    '/settings': '/m/securite/settings',
    '/profile': '/m/securite/settings',
};

export function resolveLegacyPath(pathname: string): string | null {
    if (LEGACY_REDIRECTS[pathname]) return LEGACY_REDIRECTS[pathname];
    // Nested legacy paths e.g. /m/personnel/employees/xyz → /m/personnel/employees/xyz
    const entries = Object.entries(LEGACY_REDIRECTS).sort((a, b) => b[0].length - a[0].length);
    for (const [from, to] of entries) {
        if (pathname === from) return to;
        if (pathname.startsWith(from + '/')) {
            return to + pathname.slice(from.length);
        }
    }
    return null;
}

export { FileCheck };
