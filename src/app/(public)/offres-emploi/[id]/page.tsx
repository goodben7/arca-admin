import Link from 'next/link';
import { ArrowLeft, Building2, Calendar, Clock, FileText } from 'lucide-react';
import { getJobOfferById, getPublicDepartments } from '@/lib/api/jobOffer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { notFound } from 'next/navigation';
import SearchRedirect from './SearchRedirect';
import CandidatureForm from './CandidatureForm';

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
    const parts = dept.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || dept;
    return deptMap[last] || last;
}

type Props = { params: Promise<{ id: string }> };

export default async function OffreDetailPage({ params }: Props) {
    const { id } = await params;

    let offer;
    try {
        offer = await getJobOfferById(id);
    } catch {
        notFound();
    }

    if (!offer || offer.status !== 'PUBLISHED') notFound();

    const deptsData = await getPublicDepartments().catch(() => []);
    const deptMap: Record<string, string> = {};
    deptsData.forEach((d: any) => {
        if (d.id) deptMap[d.id] = d.name;
        if (d['@id']) deptMap[d['@id']] = d.name;
    });

    const deptName = resolveDept(offer.department, deptMap);
    const publishedDate = formatDate(offer.publishedAt);

    return (
        <div className="space-y-8 max-w-3xl mx-auto">

            {/* Barre de recherche + retour */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Link
                    href="/offres-emploi"
                    className="inline-flex items-center gap-2 text-secondary-400 hover:text-secondary-700 font-black text-[11px] uppercase tracking-widest transition-colors shrink-0"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Toutes les offres
                </Link>
                <div className="flex-1">
                    <SearchRedirect />
                </div>
            </div>

            {/* Hero de l'offre */}
            <div className="relative overflow-hidden rounded-3xl bg-[#004b61] shadow-2xl shadow-primary-900/20">
                {/* Déco */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-30%] right-[-10%] w-[400px] h-[400px] bg-primary-400/10 rounded-full blur-[80px]" />
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-red-500 via-accent-yellow-500 to-transparent" />
                </div>

                <div className="relative z-10 px-8 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                                Poste ouvert
                            </span>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-tight">
                            {offer.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-1.5 text-white/60">
                                <Building2 className="w-4 h-4" />
                                <span className="text-sm font-bold">{deptName}</span>
                            </div>
                            {publishedDate && (
                                <div className="flex items-center gap-1.5 text-white/40">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm font-medium">Publiée le {publishedDate}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Logo ARCA dans le hero */}
                    <div className="hidden md:flex shrink-0 bg-white rounded-2xl items-center justify-center px-4 py-3 shadow-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo_arca_nouveau-2.png" alt="ARCA" className="w-28 h-auto object-contain" />
                    </div>
                </div>
            </div>

            {/* Informations clés */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InfoCard icon={Building2} label="Département" value={deptName} />
                <InfoCard icon={Calendar} label="Date de publication" value={publishedDate || '—'} />
                <InfoCard icon={Clock} label="Statut" value="Ouvert aux candidatures" valueClass="text-emerald-600" />
            </div>

            {/* Description du poste */}
            {offer.description && (
                <div className="bg-white rounded-3xl border border-secondary-100 shadow-sm p-8 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#004b61]/5 border border-[#004b61]/10 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-[#004b61]" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Description du poste</p>
                    </div>
                    <div className="prose prose-sm max-w-none text-secondary-700 font-medium leading-relaxed whitespace-pre-wrap">
                        {offer.description}
                    </div>
                </div>
            )}

            {/* Formulaire de candidature */}
            <CandidatureForm jobOfferId={offer.id} jobOfferTitle={offer.title} />

        </div>
    );
}

function InfoCard({
    icon: Icon,
    label,
    value,
    valueClass = 'text-secondary-900',
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    valueClass?: string;
}) {
    return (
        <div className="bg-white rounded-2xl border border-secondary-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#004b61]/5 border border-[#004b61]/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-[#004b61]" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">{label}</p>
                <p className={`font-black text-sm mt-0.5 uppercase tracking-tight ${valueClass}`}>{value}</p>
            </div>
        </div>
    );
}
