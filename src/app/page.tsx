import Link from 'next/link';
import { ArrowRight, Briefcase, Shield, Users, TrendingUp } from 'lucide-react';
import { getPublishedJobOffers } from '@/lib/api/jobOffer';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
    let count = 0;
    try {
        const offers = await getPublishedJobOffers();
        count = offers.length;
    } catch {
        count = 0;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* ── HEADER ── */}
            <header className="sticky top-0 z-40 p-4 md:p-6">
                <div className="max-w-6xl mx-auto rounded-2xl shadow-float px-5 py-2.5 flex items-center justify-between bg-primary-900 border border-white/10">
                    <Link href="/" className="flex items-center py-1">
                        <div className="bg-white rounded-lg px-2.5 py-1 shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo_arca_nouveau-2.png" alt="ARCA" className="h-7 w-auto object-contain" />
                        </div>
                    </Link>
                    <nav className="flex items-center gap-1 p-1 rounded-xl bg-white/10">
                        <Link href="/offres-emploi" className="px-3.5 py-1.5 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                            Offres d&apos;emploi
                        </Link>
                        <Link href="/login" className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                            <Shield className="w-3.5 h-3.5" />
                            Admin
                        </Link>
                    </nav>
                </div>
                <div className="max-w-6xl mx-auto mt-2 flex h-0.5 rounded-full overflow-hidden gap-0.5 px-1">
                    <div className="flex-[3] bg-primary-500 rounded-l-full" />
                    <div className="flex-[1] bg-accent-red-500" />
                    <div className="flex-[1] bg-accent-yellow-500 rounded-r-full" />
                </div>
            </header>

            {/* ── HERO ── */}
            <section className="relative overflow-hidden bg-primary-900 flex-shrink-0 rounded-b-[2rem] mx-3 mt-0 shadow-float">
                {/* Fond décoratif */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary-400/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-20%] left-[-5%] w-[500px] h-[500px] bg-accent-red-500/5 rounded-full blur-[100px]" />
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }}
                    />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-6 py-14 md:py-20 flex flex-col md:flex-row md:items-center gap-10">
                    {/* Texte */}
                    <div className="flex-1 space-y-5">
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3.5 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-yellow-400 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/70">
                                Portail Recrutement ARCA
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.02]">
                            Rejoignez<br />
                            <span className="text-white/35">l&apos;</span>AR<span className="text-accent-red-400">CA</span>
                            <span className="text-accent-yellow-400">.</span>
                        </h1>

                        <p className="text-white/55 font-medium text-sm md:text-base max-w-md leading-relaxed">
                            Autorité de Régulation et de Contrôle des Assurances.
                            Construisez votre carrière au cœur de la régulation du marché des assurances.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                            <Link
                                href="/offres-emploi"
                                className="inline-flex items-center gap-2.5 bg-accent-red-500 hover:bg-accent-red-600 active:scale-95 text-white font-black uppercase tracking-widest text-[10px] px-5 py-3 rounded-xl shadow-lg shadow-accent-red-900/25 transition-all duration-200"
                            >
                                <Briefcase className="w-3.5 h-3.5" />
                                Voir les offres
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>

                            {count > 0 && (
                                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5">
                                    <TrendingUp className="w-3.5 h-3.5 text-accent-yellow-400" />
                                    <span className="text-white font-bold text-xs">
                                        {count} poste{count > 1 ? 's' : ''} ouvert{count > 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Logo décoratif */}
                    <div className="hidden md:flex shrink-0 items-center justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/5 rounded-2xl blur-2xl scale-110" />
                            <div className="relative bg-white rounded-2xl flex items-center justify-center p-6 shadow-2xl shadow-primary-900/30">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/logo_arca_nouveau-2.png" alt="ARCA" className="w-36 h-auto object-contain" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vague de transition */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-background"
                    style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
            </section>

            {/* ── VALEURS ── */}
            <section className="max-w-6xl mx-auto px-6 py-16 w-full">
                <div className="text-center mb-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent-red-500 mb-2">Pourquoi nous rejoindre</p>
                    <h2 className="text-2xl font-black text-secondary-900 uppercase tracking-tighter">
                        Une institution, une mission
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[
                        {
                            icon: Briefcase,
                            color: 'bg-primary-50 border-primary-100 text-primary-600',
                            title: 'Opportunités variées',
                            desc: 'Des postes dans tous les métiers de la régulation — juridique, technique, financier, IT.',
                        },
                        {
                            icon: Shield,
                            color: 'bg-accent-red-50 border-accent-red-100 text-accent-red-500',
                            title: 'Institution publique',
                            desc: 'Stabilité, impact et sens au sein d\'une autorité de régulation reconnue.',
                        },
                        {
                            icon: Users,
                            color: 'bg-amber-50 border-amber-100 text-amber-600',
                            title: 'Équipes expertes',
                            desc: 'Intégrez des équipes pluridisciplinaires au service de l\'intérêt général.',
                        },
                    ].map(({ icon: Icon, color, title, desc }) => (
                        <div key={title} className="bg-white rounded-xl border border-secondary-100 shadow-sm p-7 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-black text-secondary-900 uppercase tracking-tighter text-sm">{title}</p>
                                <p className="text-secondary-500 font-medium text-xs leading-relaxed mt-1.5">{desc}</p>
                            </div>
                            <Link href="/offres-emploi" className="mt-auto inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary-600 opacity-100 transition-opacity">
                                Voir les offres <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="bg-primary-900 border-t border-white/10 mt-auto">
                <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 rounded-lg px-2 py-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo_arca_nouveau-2.png" alt="ARCA" className="h-5 w-auto object-contain" />
                        </div>
                        <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                            © {new Date().getFullYear()} ARCA — Tous droits réservés
                        </p>
                    </div>
                    <p className="text-[11px] font-medium text-white/30 italic">
                        Autorité de Régulation et de Contrôle des Assurances
                    </p>
                </div>
            </footer>
        </div>
    );
}
