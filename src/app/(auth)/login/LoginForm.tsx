'use client';

import { useState, useEffect } from 'react';
import { useRouter as useNextRouter, useSearchParams } from 'next/navigation';
import {
    Lock,
    User,
    Eye,
    EyeOff,
    AlertCircle,
    ArrowRight,
    ShieldCheck,
    Loader2,
    Users,
    Briefcase,
    Target,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Preloader } from '@/components/ui/Preloader';
import { login } from '@/lib/api/auth';
import { setToken, clearToken, getToken } from '@/lib/auth-token';
import { cn } from '@/lib/utils';

const SLIDES: {
    id: string;
    icon: LucideIcon;
    kicker: string;
    title: string;
    accent: string;
    description: string;
    chips: string[];
}[] = [
    {
        id: 'hub',
        icon: ShieldCheck,
        kicker: 'Espace institutionnel',
        title: 'Le SIRH de l’ARCA',
        accent: 'en un lieu',
        description: 'Pilotez le cycle de vie collaborateur — du recrutement à la carrière — pour l’Autorité de Régulation et de Contrôle des Assurances.',
        chips: ['Personnel', 'Contrats', 'Sécurité'],
    },
    {
        id: 'people',
        icon: Users,
        kicker: 'Personnel & organisation',
        title: 'Dossiers, mobilité',
        accent: 'et métiers',
        description: 'Fiches collaborateurs, affectations, échelles disciplinaires et référentiels — tout le quotidien RH, structuré.',
        chips: ['Collaborateurs', 'Mobilités', 'Discipline'],
    },
    {
        id: 'talent',
        icon: Briefcase,
        kicker: 'Recrutement & formation',
        title: 'De l’offre',
        accent: 'à l’intégration',
        description: 'Demandes, offres, candidatures, puis catalogue et sessions — un flux unique jusqu’à la montée en compétences.',
        chips: ['Offres', 'Candidatures', 'Sessions'],
    },
    {
        id: 'career',
        icon: Target,
        kicker: 'Carrière & pilotage',
        title: 'Objectifs, évaluations',
        accent: 'sous contrôle',
        description: 'Performance, congés et indicateurs pour décider avec une vue d’ensemble fiable de l’activité RH.',
        chips: ['Objectifs', 'Congés', 'Pilotage'],
    },
];

function humanizeLoginError(message?: string | null) {
    if (!message) return 'Identifiants invalides. Veuillez réessayer.';
    const lower = message.toLowerCase();
    if (lower.includes('expired jwt token') || lower.includes('jwt') || lower.includes('session')) {
        return 'Session expirée. Veuillez vous reconnecter.';
    }
    if (lower.includes('invalid credentials') || lower.includes('identifiants invalides')) {
        return 'Identifiants invalides. Vérifiez votre e-mail ou votre mot de passe.';
    }
    return message;
}

export function LoginForm() {
    const router = useNextRouter();
    const searchParams = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPreloader, setShowPreloader] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    useEffect(() => {
        if (getToken()) {
            router.replace('/apps');
        }
    }, [router]);

    useEffect(() => {
        const urlError = searchParams.get('error');
        if (urlError) {
            clearToken();
            Promise.resolve().then(() => setError(humanizeLoginError(urlError)));
        }
    }, [searchParams]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        }, 8000);
        return () => clearInterval(timer);
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const data = await login(formData.username, formData.password);
            setToken(data.token);
            window.location.href = '/apps';
        } catch (err: unknown) {
            setError(humanizeLoginError(err instanceof Error ? err.message : null));
            setIsLoading(false);
            setShowPreloader(false);
        }
    }

    const SlideIcon = SLIDES[currentSlide].icon;

    return (
        <>
            <Preloader visible={showPreloader} message={isLoading ? 'Connexion en cours…' : 'Chargement…'} />
            <div className="min-h-screen grid lg:grid-cols-[1.05fr_0.95fr] bg-background overflow-hidden">
                {/* Visual Side */}
                <div className="hidden lg:flex m-3 mr-0 rounded-[1.75rem] flex-col justify-between relative overflow-hidden shadow-float">
                    <div className="absolute inset-0 bg-primary-950">
                        <div className="absolute inset-0 login-hero-grid opacity-40" />
                        <div className="absolute top-[-12%] right-[-8%] w-[520px] h-[520px] bg-primary-500/20 rounded-full blur-[110px] login-float" />
                        <div className="absolute bottom-[-18%] left-[-12%] w-[560px] h-[560px] bg-accent-red-500/12 rounded-full blur-[120px] login-float-delayed" />
                        <div className="absolute top-[42%] right-[8%] w-[240px] h-[240px] bg-accent-yellow-500/15 rounded-full blur-[80px] login-float" />
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 w-[5px] flex flex-col">
                        <div className="flex-[3] bg-primary-400" />
                        <div className="flex-1 bg-accent-red-500" />
                        <div className="flex-1 bg-accent-yellow-500" />
                    </div>

                    <div className="relative z-10 flex flex-col flex-1 p-9 xl:p-12">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-white/30 rounded-2xl blur-md" />
                                <div className="relative w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl p-2.5 ring-1 ring-white/50">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="/logo_arca_nouveau-2.png" alt="ARCA" className="w-full h-full object-contain" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-baseline gap-1.5">
                                    <h1 className="text-2xl font-black tracking-tighter text-white">
                                        AR<span className="text-accent-red-400">CA</span>
                                    </h1>
                                    <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">SIRH</span>
                                </div>
                                <p className="text-[9px] text-white/55 font-black uppercase tracking-[0.18em] mt-1">
                                    Autorité de Régulation
                                </p>
                                <p className="text-[9px] text-white/35 font-bold uppercase tracking-[0.1em]">
                                    &amp; de Contrôle des Assurances
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center min-h-[320px] relative mt-10">
                            {SLIDES.map((slide, idx) => {
                                const Icon = slide.icon;
                                return (
                                    <div
                                        key={slide.id}
                                        className={cn(
                                            'absolute inset-0 flex flex-col justify-center transition-all duration-700 ease-out',
                                            idx === currentSlide
                                                ? 'opacity-100 translate-y-0'
                                                : idx < currentSlide
                                                    ? 'opacity-0 -translate-y-5 pointer-events-none'
                                                    : 'opacity-0 translate-y-5 pointer-events-none',
                                        )}
                                    >
                                        <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/8 px-3 py-1 mb-5">
                                            <Icon className="w-3.5 h-3.5 text-accent-yellow-400" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
                                                {slide.kicker}
                                            </span>
                                        </div>
                                        <h2 className="text-[2.15rem] xl:text-[2.55rem] font-black text-white leading-[1.08] tracking-tight max-w-lg">
                                            {slide.title}{' '}
                                            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
                                                {slide.accent}
                                                <span className="absolute -bottom-1 left-0 w-full h-[3px] rounded-full bg-gradient-to-r from-accent-red-500 via-accent-yellow-400 to-transparent" />
                                            </span>
                                        </h2>
                                        <p className="mt-5 text-white/55 text-[15px] font-medium leading-relaxed max-w-md border-l-2 border-white/15 pl-4">
                                            {slide.description}
                                        </p>
                                        <div className="mt-6 flex flex-wrap gap-2">
                                            {slide.chips.map((chip) => (
                                                <span
                                                    key={chip}
                                                    className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-semibold text-white/75"
                                                >
                                                    {chip}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between pt-6">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    {SLIDES.map((_, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setCurrentSlide(idx)}
                                            className={cn(
                                                'h-1 rounded-full overflow-hidden transition-all duration-500',
                                                idx === currentSlide ? 'w-10 bg-white/20' : 'w-1.5 bg-white/15 hover:bg-white/30',
                                            )}
                                            aria-label={`Slide ${idx + 1}`}
                                        >
                                            {idx === currentSlide && (
                                                <div className="h-full w-full bg-gradient-to-r from-primary-300 to-accent-yellow-400 login-progress" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.22em]">
                                    0{currentSlide + 1} / 0{SLIDES.length}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-white/8 border border-white/12 backdrop-blur-md">
                                    <SlideIcon className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-white/35 uppercase tracking-[0.22em]">Espace sécurisé</p>
                                    <p className="text-white font-semibold text-sm tracking-tight">Collaborateurs ARCA</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="relative flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto login-form-ambient">
                    <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
                        <div className="absolute top-12 right-8 w-40 h-40 rounded-full bg-primary-400/15 blur-3xl" />
                        <div className="absolute bottom-16 left-6 w-32 h-32 rounded-full bg-accent-yellow-400/20 blur-3xl" />
                    </div>

                    <div className="relative w-full max-w-[440px] space-y-7">
                        <div className="flex lg:hidden flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-float p-3 border border-white">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/logo_arca_nouveau-2.png" alt="ARCA" className="w-full h-full object-contain" />
                            </div>
                            <div className="text-center">
                                <h1 className="text-2xl font-black tracking-tighter">
                                    AR<span className="text-accent-red-500">CA</span> SIRH
                                </h1>
                                <p className="text-[9px] text-secondary-400 font-black uppercase tracking-[0.22em] mt-1">
                                    Plateforme RH
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 text-center lg:text-left">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary-600">
                                Authentification
                            </p>
                            <h3 className="text-[2rem] font-black text-secondary-950 tracking-tight leading-none">
                                Bienvenue<span className="text-primary-600">.</span>
                            </h3>
                            <p className="text-secondary-500 text-sm font-medium">
                                Identifiez-vous pour ouvrir votre espace ARCA SIRH.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="rounded-2xl border border-primary-100 bg-white/70 px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-600">
                                    Accès administrateur
                                </p>
                                <p className="mt-1 text-xs text-secondary-500 leading-relaxed">
                                    Gestion RH, paramétrage, pilotage et arbitrages.
                                </p>
                            </div>
                            <div className="rounded-2xl border border-secondary-100 bg-white/70 px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-secondary-600">
                                    Accès agent
                                </p>
                                <p className="mt-1 text-xs text-secondary-500 leading-relaxed">
                                    Consultation et suivi selon les droits attribués au profil.
                                </p>
                            </div>
                        </div>

                        <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-float backdrop-blur-xl">
                            <div className="h-[3px] flex">
                                <div className="flex-[3] bg-primary-500" />
                                <div className="flex-1 bg-accent-red-500" />
                                <div className="flex-1 bg-accent-yellow-500" />
                            </div>
                            <div className="p-7 sm:p-8 space-y-6">
                                {error && (
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">
                                                Accès refusé
                                            </p>
                                            <p className="text-sm text-rose-700 font-medium mt-0.5 leading-snug">{error}</p>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="grid gap-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-[0.18em] text-secondary-400 ml-1">
                                            Identifiant
                                        </Label>
                                        <div className="relative group">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-secondary-100 group-focus-within:bg-primary-50 transition-colors">
                                                <User className="w-3.5 h-3.5 text-secondary-400 group-focus-within:text-primary-600" />
                                            </div>
                                            <Input
                                                id="username"
                                                type="text"
                                                autoComplete="username"
                                                placeholder="admin@arca.com ou identifiant"
                                                className="pl-12 h-12 bg-secondary-50/60 border-secondary-200 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl text-sm font-semibold"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <p className="px-1 text-[11px] text-secondary-400">
                                            Utilisez votre e-mail professionnel ou votre identifiant de connexion.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.18em] text-secondary-400 ml-1">
                                            Mot de passe
                                        </Label>
                                        <div className="relative group">
                                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-secondary-100 group-focus-within:bg-primary-50 transition-colors">
                                                <Lock className="w-3.5 h-3.5 text-secondary-400 group-focus-within:text-primary-600" />
                                            </div>
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                autoComplete="current-password"
                                                placeholder="••••••••••••"
                                                className="pl-12 pr-11 h-12 bg-secondary-50/60 border-secondary-200 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl text-sm font-semibold"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="relative w-full h-12 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-900/20 overflow-hidden group mt-1"
                                    >
                                        <span
                                            className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
                                            style={{ animation: 'login-shine 1.4s ease-in-out infinite' }}
                                        />
                                        {isLoading ? (
                                            <span className="flex items-center gap-2.5">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Authentification…
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2.5">
                                                Ouvrir la session
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2 text-secondary-400">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-semibold">Session chiffrée JWT</span>
                            </div>
                            <p className="text-[11px] font-bold tracking-[0.08em] text-secondary-300 uppercase">
                                Powered by{' '}
                                <span className="bg-gradient-to-r from-[#8b31cc] via-[#d946ef] to-[#ff6b3d] bg-clip-text text-transparent font-black">
                                    DIGIS
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
