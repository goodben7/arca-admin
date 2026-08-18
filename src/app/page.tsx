import Link from 'next/link';
import {
    ArrowRight, Briefcase, Building2, Calendar, LogIn,
    Users, GraduationCap, Target, Clock, ShieldCheck,
} from 'lucide-react';
import { getPublishedJobOffers, getPublicDepartments } from '@/lib/api/jobOffer';
import { JobOffer } from '@/types/jobOffer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

function formatDate(dateStr?: string) {
    if (!dateStr) return null;
    try {
        return format(new Date(dateStr), 'd MMMM yyyy', { locale: fr });
    } catch {
        return null;
    }
}

function resolveDept(dept: string, deptMap: Record<string, string>): string {
    if (!dept) return '—';
    if (deptMap[dept]) return deptMap[dept];
    const last = dept.split('/').filter(Boolean).pop() || dept;
    return deptMap[last] || last;
}

const MODULES = [
    { icon: Users, title: 'Personnel', desc: 'Dossiers collaborateurs, contrats et organisation.' },
    { icon: Briefcase, title: 'Recrutement', desc: 'Demandes, offres et candidatures de A à Z.' },
    { icon: GraduationCap, title: 'Formation', desc: 'Catalogue, séances et inscriptions.' },
    { icon: Target, title: 'Carrière', desc: 'Objectifs, évaluations et plans de succession.' },
    { icon: Clock, title: 'Temps', desc: 'Congés et absences au quotidien.' },
    { icon: ShieldCheck, title: 'Sécurité', desc: 'Profils, accès et gouvernance.' },
];

export default async function LandingPage() {
    let offers: JobOffer[] = [];
    const deptMap: Record<string, string> = {};

    try {
        const [offersData, deptsData] = await Promise.all([
            getPublishedJobOffers(),
            getPublicDepartments(),
        ]);
        offers = offersData;
        deptsData.forEach((d) => {
            if (d.id) deptMap[d.id] = d.name;
            if (d['@id']) deptMap[d['@id']] = d.name;
        });
    } catch {
        offers = [];
    }

    const preview = offers.slice(0, 6);

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
                        <a href="#solution" className="px-3.5 py-1.5 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                            Solution RH
                        </a>
                        <Link href="/login" className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-white bg-white/15 hover:bg-white/25 rounded-lg transition-all">
                            <LogIn className="w-3.5 h-3.5" />
                            Connexion
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
                    <div className="flex-1 space-y-5">
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3.5 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-yellow-400 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/70">
                                ARCA SIRH
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.02]">
                            La plateforme RH<br />
                            de l&apos;AR<span className="text-accent-red-400">CA</span>
                            <span className="text-accent-yellow-400">.</span>
                        </h1>

                        <p className="text-white/55 font-medium text-sm md:text-base max-w-lg leading-relaxed">
                            ARCA SIRH centralise le cycle de vie collaborateur — personnel, recrutement,
                            formation, carrière et temps — pour l&apos;Autorité de Régulation et de Contrôle des Assurances.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                            <a
                                href="#offres"
                                className="inline-flex items-center gap-2 bg-accent-red-500 hover:bg-accent-red-600 active:scale-95 text-white font-black uppercase tracking-widest text-[10px] px-5 py-3 rounded-xl shadow-lg shadow-accent-red-900/25 transition-all duration-200"
                            >
                                <Briefcase className="w-3.5 h-3.5 text-accent-yellow-400" />
                                Offres internes
                                {offers.length > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/15 text-[10px] font-black">
                                        {offers.length}
                                    </span>
                                )}
                            </a>
                        </div>
                    </div>

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

                <div
                    className="absolute bottom-0 left-0 right-0 h-12 bg-background"
                    style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }}
                />
            </section>

            {/* ── SOLUTION ── */}
            <section id="solution" className="max-w-6xl mx-auto px-6 py-14 w-full scroll-mt-28">
                <div className="mb-8 max-w-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent-red-500 mb-2">Solution en main</p>
                    <h2 className="text-2xl font-black text-secondary-900 tracking-tight">
                        Une solution RH prête à l&apos;emploi pour l&apos;ARCA
                    </h2>
                    <p className="text-secondary-500 text-sm mt-2 leading-relaxed">
                        Une plateforme unifiée pour piloter les ressources humaines au quotidien,
                        du recrutement à la mobilité, en passant par la formation, la carrière et le temps.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {MODULES.map(({ icon: Icon, title, desc }) => (
                        <div
                            key={title}
                            className="bg-white rounded-xl border border-secondary-100 shadow-sm p-5 flex gap-4 hover:shadow-md transition-shadow"
                        >
                            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-secondary-900 text-sm">{title}</p>
                                <p className="text-secondary-500 text-xs leading-relaxed mt-1">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── OFFRES INTERNES ── */}
            <section id="offres" className="max-w-6xl mx-auto px-6 pb-16 w-full scroll-mt-28">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-accent-red-500 mb-2">Carrières</p>
                        <h2 className="text-2xl font-black text-secondary-900 tracking-tight">
                            Offres internes
                        </h2>
                        <p className="text-secondary-500 text-sm mt-2 max-w-lg">
                            Postes ouverts à l&apos;ARCA. Consultez les opportunités et postulez en ligne.
                        </p>
                    </div>
                    <Link
                        href="/offres-emploi"
                        className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary-600 hover:text-primary-700"
                    >
                        Voir toutes les offres <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {preview.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-secondary-100 p-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-secondary-50 flex items-center justify-center mx-auto mb-3">
                            <Briefcase className="w-6 h-6 text-secondary-300" />
                        </div>
                        <p className="font-semibold text-secondary-800">Aucune offre publiée</p>
                        <p className="text-sm text-secondary-400 mt-1">
                            De nouvelles opportunités internes seront affichées ici.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {preview.map((offer) => {
                            const publishedDate = formatDate(offer.publishedAt);
                            const deptLabel = resolveDept(offer.department, deptMap);
                            return (
                                <Link
                                    key={offer.id}
                                    href={`/offres-emploi/${offer.id}`}
                                    className="group bg-white rounded-xl border border-secondary-100 shadow-sm hover:shadow-lg hover:shadow-primary-100/40 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
                                >
                                    <div className="h-1 bg-gradient-to-r from-accent-red-500 via-accent-yellow-500 to-primary-400" />
                                    <div className="p-6 flex flex-col flex-1 gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="shrink-0 w-10 h-10 rounded-xl bg-primary-900/5 border border-primary-900/10 flex items-center justify-center group-hover:bg-primary-900/10 transition-colors">
                                                <Briefcase className="w-4 h-4 text-primary-900" />
                                            </div>
                                            <div className="min-w-0 flex-1 pt-0.5">
                                                <h3 className="font-black text-secondary-900 uppercase tracking-tighter text-sm leading-tight line-clamp-2">
                                                    {offer.title}
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5 mt-auto">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-3.5 h-3.5 shrink-0 text-secondary-400" />
                                                <span className="text-xs font-bold text-secondary-600 uppercase tracking-wide truncate">
                                                    {deptLabel}
                                                </span>
                                            </div>
                                            {publishedDate && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 shrink-0 text-secondary-300" />
                                                    <span className="text-xs font-medium text-secondary-400">
                                                        Publiée le {publishedDate}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary-600">
                                            Consulter <ArrowRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
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
                            © {new Date().getFullYear()} ARCA SIRH
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
