'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Lock,
    User,
    Eye,
    EyeOff,
    AlertCircle,
    ArrowRight,
    ShieldCheck,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { login } from '@/lib/api/auth';
import { cn } from '@/lib/utils';

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const data = await login(formData.username, formData.password);

            // Stockage du token dans un cookie
            const isSecure = window.location.protocol === 'https:';
            document.cookie = `token=${data.token}; path=/; max-age=86400; samesite=lax${isSecure ? '; secure' : ''}`;

            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue lors de la connexion.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Visual Side (Hidden on mobile) */}
            <div className="hidden lg:flex bg-gradient-to-br from-primary-600 via-primary-800 to-black p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[10%] right-[10%] w-64 h-64 border-4 border-white/20 rounded-full" />
                    <div className="absolute bottom-[20%] left-[10%] w-96 h-96 border-2 border-white/10 rounded-full" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl p-2 border border-white/20">
                            <img src="/logo.png" alt="MCBS Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h1 className="leading-none tracking-tight text-3xl font-black">
                                <span className="text-white">M</span>
                                <span className="text-[#E42E28]">C</span>
                                <span className="text-white">B</span>
                                <span className="text-[#E42E28]">S</span>
                                <span className="text-white/60 ml-2 text-xl font-extrabold border-l border-white/20 pl-2 uppercase">Africa</span>
                            </h1>
                            <p className="text-[10px] text-primary-200 font-black uppercase tracking-[0.3em] mt-1.5 opacity-80">HR Excellence</p>
                        </div>
                    </div>

                    <div className="max-w-md space-y-6 mt-20">
                        <h2 className="text-5xl font-extrabold text-white leading-tight tracking-tighter">
                            Gérez votre capital humain avec excellence.
                        </h2>
                        <div className="w-20 h-1.5 bg-accent-red-500 rounded-full" />
                        <p className="text-primary-100 text-lg font-medium opacity-80 leading-relaxed">
                            La plateforme SIRH nouvelle génération pour l'administration RH, le recrutement, la paie et le développement des talents de MCBS Africa.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-white font-bold tracking-tight">Accès Sécurisé MCBS</p>
                    </div>
                </div>
            </div>

            {/* Login Side */}
            <div className="flex items-center justify-center p-6 sm:p-12 bg-secondary-50">
                <div className="w-full max-w-[440px] space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                    <div className="text-center lg:text-left">
                        <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg p-1.5 border border-secondary-100">
                                <img src="/logo.png" alt="MCBS Logo" className="w-full h-full object-contain" />
                            </div>
                            <h1 className="leading-none tracking-tight text-2xl font-black">
                                <span className="text-[#2B59A1]">M</span>
                                <span className="text-[#E42E28]">C</span>
                                <span className="text-[#2B59A1]">B</span>
                                <span className="text-[#E42E28]">S</span>
                                <span className="text-[#808285] ml-1.5 px-1 font-extrabold border-l-2 border-secondary-200 uppercase text-base">Africa</span>
                            </h1>
                        </div>
                        <h3 className="text-3xl font-black text-secondary-900 mb-2 mt-4 tracking-tight">Bon retour !</h3>
                        <p className="text-secondary-500 font-medium">Authentifiez-vous pour accéder à l'espace RH MCBS.</p>
                    </div>

                    <Card className="border-none shadow-2xl shadow-secondary-200/50 overflow-hidden bg-white">
                        <CardContent className="p-8 space-y-6">
                            {error && (
                                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-4 animate-in fade-in zoom-in-95">
                                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                                    <p className="text-sm text-destructive font-bold">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-xs uppercase tracking-widest text-secondary-500">Nom d'utilisateur</Label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-600 transition-colors" />
                                        <Input
                                            id="username"
                                            type="text"
                                            placeholder="votre.nom"
                                            className="pl-12 h-14 bg-secondary-50/50 border-secondary-200"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-xs uppercase tracking-widest text-secondary-500">Mot de passe</Label>
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 group-focus-within:text-primary-600 transition-colors" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="pl-12 pr-12 h-14 bg-secondary-50/50 border-secondary-200"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-14 text-lg rounded-2xl bg-primary-600 hover:bg-primary-700 shadow-xl shadow-primary-200 transition-all active:scale-[0.98] group"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="font-bold">Se connecter</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
