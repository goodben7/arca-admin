'use client';

import { useState, useEffect } from 'react';
import { useRouter as useNextRouter } from 'next/navigation';
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
import { login } from '@/lib/api/auth';
import { cn } from '@/lib/utils';

const SLIDES = [
    {
        id: 'initial',
        type: 'content',
        title: "Gérez votre",
        subtitle: "capital humain",
        suffix: "avec",
        accent: "excellence",
        description: "Plateforme centralisée pour la gouvernance des talents de l'ARCA. Sécurisée, agile et axée sur la performance."
    },
    {
        id: 'slide1',
        type: 'image',
        src: '/slide1.jpg',
        title: "Rigueur &",
        subtitle: "Déontologie",
        suffix: "au",
        accent: "quotidien",
        description: "Un cadre de travail structuré pour accompagner l'évolution du marché des assurances."
    },
    {
        id: 'slide2',
        type: 'image',
        src: '/slide2.jpg',
        title: "Innovation &",
        subtitle: "Collaboration",
        suffix: "entre",
        accent: "départements",
        description: "Nos outils digitaux facilitent la synergie entre toutes les directions de l'ARCA."
    },
    {
        id: 'slide3',
        type: 'image',
        src: '/slide3.jpg',
        title: "Vision &",
        subtitle: "Leadership",
        suffix: "pour",
        accent: "demain",
        description: "Former et valoriser nos talents pour assurer l'excellence opérationnelle durable."
    }
];

export default function LoginPage() {
    const router = useNextRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

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
            const isSecure = window.location.protocol === 'https:';
            document.cookie = `token=${data.token}; path=/; max-age=86400; samesite=lax${isSecure ? '; secure' : ''}`;
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue lors de la connexion.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-white overflow-hidden">
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

            {/* Visual Side (Left) - SLIDER */}
            <div className="hidden lg:flex p-16 flex-col justify-between relative overflow-hidden group border-r border-secondary-100">
                {/* Background Slides */}
                {SLIDES.map((slide, idx) => (
                    <div
                        key={slide.id}
                        className={cn(
                            "absolute inset-0 transition-all duration-[2000ms] ease-in-out",
                            idx === currentSlide ? "opacity-100 scale-100 z-0" : "opacity-0 scale-110 z-[-1]"
                        )}
                    >
                        {slide.type === 'content' ? (
                            <div className="absolute inset-0 bg-[#004b61]">
                                {/* Background Decorations */}
                                <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
                                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px] animate-float" />
                                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-accent-red-500/5 rounded-full blur-[100px] animate-float-delayed" />
                                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
                                </div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 overflow-hidden">
                                <img src={slide.src} alt="" className="w-full h-full object-cover transition-transform duration-[10s] ease-linear transform scale-110 group-hover:scale-100" />
                                <div className="absolute inset-0 bg-[#004b61]/60 backdrop-blur-[1px]" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#004b61] via-[#004b61]/40 to-black/20" />
                            </div>
                        )}
                    </div>
                ))}

                <div className="relative z-10 space-y-12">
                    {/* Brand Section */}
                    <div className="flex items-center gap-6">
                        <div className="relative p-1">
                            <div className="absolute inset-0 bg-white/20 rounded-3xl blur-md group-hover:bg-white/30 transition-all" />
                            <div className="relative w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl p-3 border border-white/40">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/logo_arca_nouveau-2.png" alt="ARCA Logo" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-1">
                                <h1 className="text-4xl font-black tracking-tighter text-white">AR<span className="text-accent-red-500">CA</span></h1>
                                <div className="w-2 h-2 rounded-full bg-accent-yellow-400 mb-1 animate-pulse" />
                            </div>
                            <p className="text-[11px] text-white/60 font-black uppercase tracking-[0.25em] mt-2 leading-none">
                                Autorité de Régulation
                            </p>
                            <p className="text-[11px] text-white/40 font-bold uppercase tracking-[0.15em] mt-1 leading-none">
                                &amp; de Contrôle des Assurances
                            </p>
                        </div>
                    </div>

                    {/* Content Area - Changing per slide */}
                    <div className="max-w-xl min-h-[400px] flex flex-col justify-center">
                        {SLIDES.map((slide, idx) => (
                            <div
                                key={`text-${slide.id}`}
                                className={cn(
                                    "space-y-12 transition-all duration-1000 delay-300",
                                    idx === currentSlide ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12 absolute pointer-events-none"
                                )}
                            >
                                <div className="space-y-6">
                                    <h2 className="text-7xl font-black text-white leading-[1] tracking-tighter">
                                        <span className="block mb-2">{slide.title}</span>
                                        <span className="bg-gradient-to-r from-white/70 to-white/20 bg-clip-text text-transparent">{slide.subtitle}</span>
                                        <span className="block mt-2">
                                            {slide.suffix} <span className="relative">
                                                {slide.accent}
                                                <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-accent-red-500 to-transparent rounded-full" />
                                            </span>.
                                        </span>
                                    </h2>
                                </div>
                                <p className="text-white/40 text-xl font-medium leading-relaxed max-w-md italic border-l-2 border-white/10 pl-6">
                                    "{slide.description}"
                                </p>
                            </div>
                        ))}

                        {/* Pagination / Indicators */}
                        <div className="flex items-center gap-6 mt-auto pt-10">
                            <div className="flex gap-2">
                                {SLIDES.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentSlide(idx)}
                                        className={cn(
                                            "transition-all duration-700 rounded-full h-1.5 relative overflow-hidden",
                                            idx === currentSlide ? "w-12 bg-white/20" : "w-1.5 bg-white/10"
                                        )}
                                    >
                                        {idx === currentSlide && (
                                            <div className="absolute inset-0 bg-primary-400 animate-progress" />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                                0{currentSlide + 1} / 0{SLIDES.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Security */}
                <div className="relative z-10 flex items-center gap-6 pt-12">
                    <div className="group/shield relative">
                        <div className="absolute inset-0 bg-primary-400/20 rounded-2xl blur-lg scale-150 opacity-0 group-hover/shield:opacity-100 transition-opacity" />
                        <div className="relative p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-black text-white/30 uppercase tracking-[0.3em] mb-1">Infrastructure</p>
                        <p className="text-white font-black tracking-tight text-lg">Portail Sécurisé </p>
                    </div>
                </div>
            </div>

            {/* Login Side (Right) */}
            <div className="flex items-center justify-center p-8 sm:p-20 bg-secondary-50/30 overflow-y-auto">
                <div className="w-full max-w-[480px] space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    {/* Mobile Header */}
                    <div className="flex lg:hidden flex-col items-center gap-6 mb-4">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl p-4 border border-secondary-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo_arca_nouveau-2.png" alt="ARCA Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="text-center">
                            <h1 className="text-3xl font-black tracking-tighter">AR<span className="text-accent-red-500">CA</span></h1>
                            <p className="text-[10px] text-secondary-400 font-black uppercase tracking-[0.2em] mt-2 italic">Portail RH Centralisé</p>
                        </div>
                    </div>

                    <div className="space-y-3 px-2 text-center lg:text-left">
                        <h3 className="text-5xl font-black text-secondary-950 tracking-tighter">
                            Bon retour <span className="text-primary-600 italic font-medium truncate">!</span>
                        </h3>
                        <p className="text-secondary-500 text-lg font-medium flex items-center justify-center lg:justify-start gap-2">
                            Accès sécurisé à votre espace <ArrowRight className="w-4 h-4 text-secondary-300" />
                        </p>
                    </div>

                    <Card className="border-none shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] overflow-hidden bg-white/80 backdrop-blur-2xl rounded-[40px] border border-white">
                        <CardContent className="p-10 space-y-8">
                            {error && (
                                <div className="p-5 bg-rose-50 border border-rose-100 rounded-3xl flex items-start gap-4 animate-in shake-1 duration-500">
                                    <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-widest text-rose-600">Erreur d'accès</p>
                                        <p className="text-sm text-rose-700 font-medium italic leading-tight">{error}</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="grid gap-8">
                                <div className="space-y-3">
                                    <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400 ml-1">
                                        Identifiant
                                    </Label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-secondary-100 group-focus-within:bg-primary-50 transition-colors">
                                            <User className="w-4 h-4 text-secondary-400 group-focus-within:text-primary-600 transition-colors" />
                                        </div>
                                        <Input
                                            id="username"
                                            type="text"
                                            placeholder="nom.utilisateur"
                                            className="pl-16 h-16 bg-white border-secondary-200 focus:border-primary-500 focus:ring-8 focus:ring-primary-500/5 rounded-2xl text-base font-bold transition-all shadow-sm"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between ml-1">
                                        <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">
                                            Mot de passe
                                        </Label>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-secondary-100 group-focus-within:bg-primary-50 transition-colors">
                                            <Lock className="w-4 h-4 text-secondary-400 group-focus-within:text-primary-600 transition-colors" />
                                        </div>
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••••••"
                                            className="pl-16 pr-14 h-16 bg-white border-secondary-200 focus:border-primary-500 focus:ring-8 focus:ring-primary-500/5 rounded-2xl text-base font-bold transition-all shadow-sm"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-16 text-xs font-black uppercase tracking-[0.3em] rounded-2xl bg-primary-600 hover:bg-primary-700 shadow-[0_20px_40px_-10px_rgba(0,75,97,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(0,75,97,0.4)] transition-all active:scale-[0.98] group relative overflow-hidden"
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
    );
}
