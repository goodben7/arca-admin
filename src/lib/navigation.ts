import {
    LayoutDashboard,
    Users,
    FileText,
    Calendar,
    Clock,
    Building2,
    Briefcase,
    FolderSearch,
    UserPlus,
    GraduationCap,
    Calculator,
    BarChart3,
    Settings,
    ShieldCheck,
    UserCog,
    ClipboardList,
    BookOpen,
    CalendarDays,
    ArrowRightLeft,
    Layers,
    Award,
    BriefcaseBusiness,
    GitBranch,
    Zap,
    UserCheck,
    Target,
    BookMarked,
    TrendingUp,
    DollarSign,
    Gift,
    LogOut,
    Network,
    Activity,
    BarChart2,
} from 'lucide-react';

export const NAV_ITEMS = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        status: 'active'
    },
    {
        title: 'Pilotage RH',
        items: [
            { title: 'Tableau de bord RH', href: '/hr-dashboard', icon: BarChart2, status: 'active' },
            { title: 'Journal d\'activité', href: '/activities', icon: Activity, status: 'active' },
        ]
    },
    {
        title: 'Administration RH',
        items: [
            { title: 'Employés', href: '/employees', icon: Users, status: 'active' },
            { title: 'Contrats', href: '/contracts', icon: FileText, status: 'active' },
            { title: 'Congés', href: '/leave', icon: Calendar, status: 'active' },
            { title: 'Présences', href: '/attendance', icon: Clock, status: 'under-construction' },
            { title: 'Départements', href: '/departments', icon: Building2, status: 'active' },
            { title: 'Postes', href: '/positions', icon: Briefcase, status: 'active' },
            { title: 'Documents', href: '/documents', icon: FolderSearch, status: 'active' },
        ]
    },
    {
        title: 'Référentiel RH',
        items: [
            { title: 'Familles de métiers', href: '/job-families', icon: Layers, status: 'active' },
            { title: 'Grades', href: '/grades', icon: Award, status: 'active' },
            { title: 'Fiches métiers', href: '/job-roles', icon: BriefcaseBusiness, status: 'active' },
            { title: 'Parcours de carrière', href: '/career-paths', icon: GitBranch, status: 'active' },
            { title: 'Compétences', href: '/skills', icon: Zap, status: 'active' },
        ]
    },
    {
        title: 'Accès & Sécurité',
        items: [
            { title: 'Profils', href: '/profiles', icon: ShieldCheck, status: 'active' },
            { title: 'Utilisateurs', href: '/users', icon: UserCog, status: 'active' },
        ]
    },
    {
        title: 'Recrutement',
        items: [
            { title: 'Recrutement', href: '/recruitment', icon: UserPlus, status: 'active' },
            { title: "Offres d'emploi", href: '/job-offers', icon: Briefcase, status: 'active' },
            { title: 'Candidatures', href: '/applications', icon: ClipboardList, status: 'active' },
            { title: 'Mobilité RH', href: '/mobility', icon: ArrowRightLeft, status: 'active' },
        ]
    },
    {
        title: 'Parcours & Onboarding',
        items: [
            { title: 'Onboarding', href: '/onboarding', icon: UserCheck, status: 'active' },
            { title: 'Plans de carrière', href: '/career-plans', icon: TrendingUp, status: 'active' },
            { title: 'Plans de succession', href: '/succession-plans', icon: Network, status: 'active' },
            { title: 'Offboarding', href: '/offboarding', icon: LogOut, status: 'active' },
        ]
    },
    {
        title: 'Performance',
        items: [
            { title: 'Cycles d\'évaluation', href: '/evaluation-cycles', icon: BarChart3, status: 'active' },
            { title: 'Objectifs', href: '/objectives', icon: Target, status: 'active' },
        ]
    },
    {
        title: 'Formation',
        items: [
            { title: 'Demandes de formation', href: '/training', icon: BookOpen, status: 'active' },
            { title: 'Sessions de formation', href: '/training/sessions', icon: CalendarDays, status: 'active' },
            { title: 'Catalogue', href: '/training/catalog', icon: BookMarked, status: 'active' },
        ]
    },
    {
        title: 'Compensation & Avantages',
        items: [
            { title: 'Compensation', href: '/compensation', icon: DollarSign, status: 'active' },
            { title: 'Avantages sociaux', href: '/benefits', icon: Gift, status: 'active' },
        ]
    },
    {
        title: 'Autres Modules',
        items: [
            { title: 'Paie', href: '/payroll', icon: Calculator, status: 'under-construction' },
            { title: 'Rapports', href: '/reports', icon: BarChart3, status: 'under-construction' },
        ]
    }
];

export const USER_MENU_ITEMS = [
    { title: 'Profil', href: '/profile', icon: Users },
    { title: 'Paramètres', href: '/settings', icon: Settings },
];
