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
    CheckCircle2,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Preloader } from '@/components/ui/Preloader';
import { login } from '@/lib/api/auth';
import { setToken, clearToken, getToken, hasSession } from '@/lib/auth-token';
import { cn } from '@/lib/utils';

const SLIDES = [
    {
        id: 'initial',
        type: 'content',
        title: "ARCA",
        subtitle: "SIRH",
        suffix: "—",
        accent: "votre RH",
        description: "Plateforme de gestion des ressources humaines de l'Autorité de Régulation et de Contrôle des Assurances."
    },
    {
        id: 'slide1',
        type: 'image',
        src: '/slide1.jpg',
        title: "Personnel &",
        subtitle: "Organisation",
        suffix: "au",
        accent: "quotidien",
        description: "Dossiers collaborateurs, contrats, mobilité et référentiels métiers — tout le cycle de vie RH."
    },
    {
        id: 'slide2',
        type: 'image',
        src: '/slide2.jpg',
        title: "Recrutement &",
        subtitle: "Formation",
        suffix: "en",
        accent: "un flux",
        description: "De l'offre d'emploi à l'intégration, puis au catalogue et aux séances de formation."
    },
    {
        id: 'slide3',
        type: 'image',
        src: '/slide3.jpg',
        title: "Carrière &",
        subtitle: "Pilotage",
        suffix: "sous",
        accent: "contrôle",
        description: "Objectifs, évaluations, congés et accès sécurisés pour piloter l'activité RH."
    }
];

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
        password: ''
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
            setError(urlError);
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
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue lors de la connexion.');
            setIsLoading(false);
            setShowPreloader(false);
        }
    }

    return (
        <>
        <Preloader visible={showPreloader} message={isLoading ? "Connexion en cours…" : "Chargement…"} />
        <div className="min-h-screen grid lg:grid-cols-2 bg-background overflow-hidden">
            <style jsx global>{`
                @keyframes float {
                    0% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0, 0) scale(1); }
                }
                .animate-float {
                    animation: float 20s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float 25s ease-in-out infinite reverse;
                }
                @keyframes progress {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(0); }
                    100% { transform: translateX(100%); }
                }
                .animate-progress {
                    animation: progress 8s linear infinite;
                }
            `}</style>

            {/* Visual Side (Left) — background fixe, textes en slide */}
            <div className="hidden lg:flex m-3 rounded-2xl flex-col justify-between relative overflow-hidden group shadow-float">

                {/* ── Background fixe ── */}
                <div className="absolute inset-0 bg-primary-900 rounded-2xl">
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px] animate-float" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-accent-red-500/5 rounded-full blur-[100px] animate-float-delayed" />
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
                </div>

                <div className="relative z-10 space-y-8 p-8 md:p-10 flex flex-col flex-1">
                    {/* Brand Section */}
                    <div className="flex items-center gap-4">
                        <div className="relative p-1">
                            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-md group-hover:bg-white/30 transition-all" />
                            <div className="relative w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-xl p-2.5 border border-white/40">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/logo_arca_nouveau-2.png" alt="ARCA Logo" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-1">
                                <h1 className="text-2xl font-black tracking-tighter text-white">AR<span className="text-accent-red-500">CA</span></h1>
                                <div className="w-1.5 h-1.5 rounded-full bg-accent-yellow-400 mb-0.5 animate-pulse" />
                            </div>
                            <p className="text-[9px] text-white/60 font-black uppercase tracking-[0.22em] mt-1.5 leading-tight">
                                Autorité de Régulation
                            </p>
                            <p className="text-[9px] text-white/40 font-bold uppercase tracking-[0.12em] mt-0.5 leading-tight">
                                &amp; de Contrôle des Assurances
                            </p>
                        </div>
                    </div>

                    {/* ── Zone de texte — seuls les textes slident ── */}
                    <div className="max-w-md min-h-[260px] relative flex flex-col justify-center flex-1">
                        {SLIDES.map((slide, idx) => (
                            <div
                                key={`text-${slide.id}`}
                                className={cn(
                                    "absolute inset-0 flex flex-col justify-center space-y-5 transition-all duration-700 ease-in-out",
                                    idx === currentSlide
                                        ? "opacity-100 translate-y-0 pointer-events-auto"
                                        : idx < currentSlide
                                            ? "opacity-0 -translate-y-6 pointer-events-none"
                                            : "opacity-0 translate-y-6 pointer-events-none"
                                )}
                            >
                                <div className="space-y-3">
                                    <h2 className="text-3xl xl:text-4xl font-black text-white leading-[1.1] tracking-tight">
                                        <span className="block mb-1">{slide.title}</span>
                                        <span className="bg-gradient-to-r from-white/80 to-white/30 bg-clip-text text-transparent">{slide.subtitle}</span>
                                        <span className="block mt-1.5 text-[0.92em]">
                                            {slide.suffix}{' '}
                                            <span className="relative">
                                                {slide.accent}
                                                <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-accent-red-500 to-transparent rounded-full" />
                                            </span>.
                                        </span>
                                    </h2>
                                </div>
                                <p className="text-white/45 text-sm font-medium leading-relaxed max-w-sm border-l-2 border-white/10 pl-4">
                                    {slide.description}
                                </p>
                            </div>
                        ))}

                        {/* Pagination / Indicators */}
                        <div className="relative mt-auto pt-[240px] flex items-center gap-4">
                            <div className="flex gap-1.5">
                                {SLIDES.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentSlide(idx)}
                                        className={cn(
                                            "transition-all duration-700 rounded-full h-1 relative overflow-hidden",
                                            idx === currentSlide ? "w-10 bg-white/20" : "w-1.5 bg-white/10"
                                        )}
                                    >
                                        {idx === currentSlide && (
                                            <div className="absolute inset-0 bg-primary-400 animate-progress" />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <span className="text-[9px] font-black text-white/25 uppercase tracking-[0.25em]">
                                0{currentSlide + 1} / 0{SLIDES.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Security */}
                <div className="relative z-10 flex items-center gap-4 px-8 md:px-10 pb-8 md:pb-10">
                    <div className="group/shield relative">
                        <div className="absolute inset-0 bg-primary-400/20 rounded-xl blur-lg scale-150 opacity-0 group-hover/shield:opacity-100 transition-opacity" />
                        <div className="relative p-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em] mb-0.5">ARCA SIRH</p>
                        <p className="text-white font-bold tracking-tight text-sm">Espace collaborateur</p>
                    </div>
                </div>
            </div>

            {/* Login Side (Right) */}
            <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
                <div className="w-full max-w-[420px] space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    {/* Mobile Header */}
                    <div className="flex lg:hidden flex-col items-center gap-4 mb-2">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg p-3 border border-secondary-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo_arca_nouveau-2.png" alt="ARCA Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl font-black tracking-tighter">AR<span className="text-accent-red-500">CA</span> SIRH</h1>
                            <p className="text-[9px] text-secondary-400 font-black uppercase tracking-[0.2em] mt-1.5">Plateforme RH</p>
                        </div>
                    </div>

                    <div className="space-y-2 px-1 text-center lg:text-left">
                        <h3 className="text-3xl font-black text-secondary-950 tracking-tight">
                            Connexion<span className="text-primary-600">.</span>
                        </h3>
                        <p className="text-secondary-500 text-sm font-medium flex items-center justify-center lg:justify-start gap-2">
                            Accédez à votre espace ARCA SIRH <ArrowRight className="w-3.5 h-3.5 text-secondary-300" />
                        </p>
                    </div>

                    <Card className="border border-secondary-100/80 shadow-float overflow-hidden rounded-2xl bg-white">
                        <CardContent className="p-7 space-y-6">
                            {error && (
                                <div className="p-5 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-4 animate-in shake-1 duration-500">
                                    <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-widest text-rose-600">Erreur d'accès</p>
                                        <p className="text-sm text-rose-700 font-medium italic leading-tight">{error}</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="grid gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-[0.18em] text-secondary-400 ml-1">
                                        Identifiant
                                    </Label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-secondary-100 group-focus-within:bg-primary-50 transition-colors">
                                            <User className="w-3.5 h-3.5 text-secondary-400 group-focus-within:text-primary-600 transition-colors" />
                                        </div>
                                        <Input
                                            id="username"
                                            type="text"
                                            placeholder="nom.utilisateur"
                                            className="pl-12 h-11 bg-white border-secondary-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl text-sm font-semibold transition-all"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.18em] text-secondary-400 ml-1">
                                        Mot de passe
                                    </Label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-secondary-100 group-focus-within:bg-primary-50 transition-colors">
                                            <Lock className="w-3.5 h-3.5 text-secondary-400 group-focus-within:text-primary-600 transition-colors" />
                                        </div>
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••••••"
                                            className="pl-12 pr-11 h-11 bg-white border-secondary-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl text-sm font-semibold transition-all"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                        >
                                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-11 text-[10px] font-black uppercase tracking-[0.22em] rounded-xl bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-900/20 transition-all active:scale-[0.98] group relative overflow-hidden mt-1"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1.5s]" />
                                    {isLoading ? (
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Authentification...
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-3">
                                            <span>Ouvrir la session</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                                        </div>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="text-center">
                        <p className="text-[11px] font-bold tracking-[0.1em] text-secondary-300 uppercase">
                            Power By <span className="bg-gradient-to-r from-[#8b31cc] via-[#d946ef] to-[#ff6b3d] bg-clip-text text-transparent font-black">DIGIS</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
