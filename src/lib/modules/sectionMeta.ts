import {
    Activity,
    Building2,
    CalendarDays,
    GitMerge,
    GraduationCap,
    KeyRound,
    LayoutGrid,
    Library,
    Route,
    Scale,
    Settings,
    ShieldCheck,
    Sparkles,
    Target,
    Users,
    Wallet,
    type LucideIcon,
} from 'lucide-react';

export type SectionTone = 'blue' | 'teal' | 'violet' | 'amber' | 'rose' | 'emerald' | 'slate';

export interface SectionMeta {
    icon: LucideIcon;
    tone: SectionTone;
}

/** Icônes et teintes par libellé de section (partagé sidebar + overview). */
export const SECTION_META: Record<string, SectionMeta> = {
    Collaborateurs: { icon: Users, tone: 'blue' },
    Parcours: { icon: Route, tone: 'teal' },
    Organisation: { icon: Building2, tone: 'violet' },
    Référentiel: { icon: Library, tone: 'amber' },
    Absences: { icon: CalendarDays, tone: 'blue' },
    Rémunération: { icon: Wallet, tone: 'emerald' },
    Conformité: { icon: ShieldCheck, tone: 'rose' },
    Processus: { icon: GitMerge, tone: 'rose' },
    Formations: { icon: GraduationCap, tone: 'amber' },
    Évaluation: { icon: Target, tone: 'blue' },
    Talents: { icon: Sparkles, tone: 'violet' },
    Développement: { icon: Sparkles, tone: 'violet' },
    Accès: { icon: KeyRound, tone: 'slate' },
    Système: { icon: Settings, tone: 'slate' },
    Suivi: { icon: Activity, tone: 'teal' },
    Général: { icon: LayoutGrid, tone: 'blue' },
    Procédures: { icon: Scale, tone: 'rose' },
};

export const SECTION_TONE_STYLES: Record<SectionTone, { iconBg: string; iconText: string; headerBg: string }> = {
    blue: {
        iconBg: 'bg-primary-100',
        iconText: 'text-primary-700',
        headerBg: 'bg-primary-50/80',
    },
    teal: {
        iconBg: 'bg-[#E6F6F8]',
        iconText: 'text-[#0D6B7A]',
        headerBg: 'bg-[#E6F6F8]/70',
    },
    violet: {
        iconBg: 'bg-violet-100',
        iconText: 'text-violet-700',
        headerBg: 'bg-violet-50/80',
    },
    amber: {
        iconBg: 'bg-[#FFF4D6]',
        iconText: 'text-[#9A7200]',
        headerBg: 'bg-[#FFF8E7]/80',
    },
    rose: {
        iconBg: 'bg-accent-red-50',
        iconText: 'text-accent-red-700',
        headerBg: 'bg-accent-red-50/70',
    },
    emerald: {
        iconBg: 'bg-emerald-100',
        iconText: 'text-emerald-700',
        headerBg: 'bg-emerald-50/80',
    },
    slate: {
        iconBg: 'bg-secondary-100',
        iconText: 'text-secondary-700',
        headerBg: 'bg-secondary-50/80',
    },
};

export function getSectionMeta(label: string): SectionMeta {
    return SECTION_META[label] ?? { icon: LayoutGrid, tone: 'blue' };
}
