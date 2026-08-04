'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Briefcase, Calendar, Building2, AlertCircle, Search, X } from 'lucide-react';
import { JobOffer } from '@/types/jobOffer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
    const parts = dept.split('/').filter(Boolean);
    const lastSegment = parts[parts.length - 1] || dept;
    return deptMap[lastSegment] || lastSegment;
}

type Props = {
    offers: JobOffer[];
    deptMap: Record<string, string>;
    fetchError: string | null;
};

export default function OffresClient({ offers, deptMap, fetchError }: Props) {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return offers;
        return offers.filter((o) => {
            const dept = resolveDept(o.department, deptMap).toLowerCase();
            return (
                (o.title || '').toLowerCase().includes(q) ||
                dept.includes(q)
            );
        });
    }, [offers, deptMap, search]);

    return (
        <div className="space-y-8">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-xl bg-primary-900 px-8 py-10 md:px-12 md:py-14 shadow-2xl shadow-primary-900/20">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] bg-primary-400/10 rounded-full blur-[100px]" />
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }}
                    />
                    {/* Barre accent */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-red-500 via-accent-yellow-500 to-transparent" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
                            Carrières ARCA
                        </p>
                        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-tight">
                            Offres internes
                        </h1>
                        <p className="text-white/50 font-medium text-sm max-w-lg">
                            Découvrez les postes ouverts à l&apos;ARCA et postulez en ligne.
                        </p>
                    </div>

                    {!fetchError && (
                        <div className="shrink-0 inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-2xl px-5 py-3">
                            <Briefcase className="w-4 h-4 text-accent-yellow-400" />
                            <span className="text-white font-black text-sm uppercase tracking-widest">
                                {offers.length} poste{offers.length !== 1 ? 's' : ''} disponible{offers.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Barre de recherche */}
            {!fetchError && offers.length > 0 && (
                <div className="relative max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher par titre ou département..."
                        className="w-full pl-11 pr-10 py-3.5 bg-white border border-secondary-200 rounded-2xl text-sm font-medium text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 shadow-sm transition-all"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded-lg transition-all"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}

            {/* Contenu */}
            {fetchError ? (
                <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-accent-red-50 border border-accent-red-100 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-accent-red-500" />
                    </div>
                    <div>
                        <p className="font-black text-secondary-800 uppercase tracking-tight">Erreur de chargement</p>
                        <p className="text-secondary-500 font-medium text-sm mt-1">{fetchError}</p>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-secondary-100 flex items-center justify-center">
                        <Search className="w-8 h-8 text-secondary-400" />
                    </div>
                    <div>
                        <p className="font-black text-secondary-700 uppercase tracking-tight">
                            {search ? 'Aucun résultat' : 'Aucune offre disponible'}
                        </p>
                        <p className="text-secondary-400 font-medium text-sm mt-1 italic">
                            {search
                                ? `Aucune offre ne correspond à "${search}"`
                                : 'Revenez bientôt, de nouvelles opportunités arrivent régulièrement.'}
                        </p>
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="mt-3 text-xs font-black uppercase tracking-widest text-primary-600 hover:text-primary-700"
                            >
                                Effacer la recherche
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {search && (
                        <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest">
                            {filtered.length} résultat{filtered.length > 1 ? 's' : ''} pour &ldquo;{search}&rdquo;
                        </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map((offer) => (
                            <OfferCard key={offer.id} offer={offer} deptMap={deptMap} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function OfferCard({ offer, deptMap }: { offer: JobOffer; deptMap: Record<string, string> }) {
    const publishedDate = formatDate(offer.publishedAt);
    const deptLabel = resolveDept(offer.department, deptMap);

    return (
        <article className="group bg-white rounded-xl border border-secondary-100 shadow-sm hover:shadow-lg hover:shadow-primary-100/40 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
            {/* Bande accent */}
            <div className="h-1 bg-gradient-to-r from-accent-red-500 via-accent-yellow-500 to-primary-400" />

            <div className="p-6 flex flex-col flex-1 gap-4">
                {/* Icône + titre */}
                <div className="flex items-start gap-3">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-primary-900/5 border border-primary-900/10 flex items-center justify-center group-hover:bg-primary-900/10 transition-colors">
                        <Briefcase className="w-4.5 h-4.5 text-primary-900" />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                        <h2 className="font-black text-secondary-900 uppercase tracking-tighter text-sm leading-tight line-clamp-2">
                            {offer.title}
                        </h2>
                    </div>
                </div>

                {/* Métadonnées */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 shrink-0 text-secondary-400" />
                        <span className="text-xs font-bold text-secondary-600 uppercase tracking-wide truncate">
                            {deptLabel}
                        </span>
                    </div>
                    {publishedDate && (
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 shrink-0 text-secondary-300" />
                            <span className="text-xs font-medium text-secondary-400 italic">
                                Publiée le {publishedDate}
                            </span>
                        </div>
                    )}
                </div>

                {/* Extrait description */}
                {offer.description && (
                    <p className="text-xs text-secondary-500 font-medium leading-relaxed line-clamp-3 flex-1">
                        {offer.description}
                    </p>
                )}

                {/* Footer carte */}
                <div className="flex items-center justify-between pt-4 border-t border-secondary-100">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Ouvert
                    </span>
                    <Link
                        href={`/offres-emploi/${offer.id}`}
                        className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-primary-900 hover:bg-primary-950 active:scale-95 rounded-xl px-4 py-2 transition-all shadow-sm"
                    >
                        Voir l&apos;offre
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </article>
    );
}
