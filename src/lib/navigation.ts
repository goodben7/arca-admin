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
    UserCog
} from 'lucide-react';

export const NAV_ITEMS = [
    {
        title: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
        status: 'active'
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
        title: 'Accès & Sécurité',
        items: [
            { title: 'Profils', href: '/profiles', icon: ShieldCheck, status: 'active' },
            { title: 'Utilisateurs', href: '/users', icon: UserCog, status: 'active' },
        ]
    },
    {
        title: 'Autres Modules',
        items: [
            { title: 'Recrutement', href: '/recruitment', icon: UserPlus, status: 'under-construction' },
            { title: 'Carrière', href: '/career', icon: GraduationCap, status: 'under-construction' },
            { title: 'Paie', href: '/payroll', icon: Calculator, status: 'under-construction' },
            { title: 'Rapports', href: '/reports', icon: BarChart3, status: 'under-construction' },
        ]
    }
];

export const USER_MENU_ITEMS = [
    { title: 'Profil', href: '/profile', icon: Users },
    { title: 'Paramètres', href: '/settings', icon: Settings },
];
