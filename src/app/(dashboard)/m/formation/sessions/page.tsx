'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
    Plus,
    Loader2,
    AlertCircle,
    List,
    CalendarDays,
    MapPin,
    Users,
    Clock,
    ChevronRight,
    X,
    BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getAllTrainingSessions } from '@/lib/api/trainingSession';
import { TrainingSession, STATUS_PLANNED, STATUS_ONGOING, STATUS_COMPLETED, STATUS_CANCELLED } from '@/types/trainingSession';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/layout/PageHeader';

// ── Localizer ─────────────────────────────────────────────────────────────────
const locales = { fr };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { locale: fr }),
    getDay,
    locales,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatusLabel(status: string) {
    switch (status) {
        case STATUS_PLANNED:   return 'Planifiée';
        case STATUS_ONGOING:   return 'En cours';
        case STATUS_COMPLETED: return 'Terminée';
        case STATUS_CANCELLED: return 'Annulée';
        default:               return status;
    }
}

function getStatusClass(status: string) {
    switch (status) {
        case STATUS_PLANNED:   return 'bg-sky-50 text-sky-700 border border-sky-200';
        case STATUS_ONGOING:   return 'bg-amber-50 text-amber-700 border border-amber-200';
        case STATUS_COMPLETED: return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        case STATUS_CANCELLED: return 'bg-rose-50 text-rose-700 border border-rose-200';
        default:               return 'bg-secondary-50 text-secondary-600 border border-secondary-200';
    }
}

function getCalendarColor(status: string) {
    switch (status) {
        case STATUS_PLANNED:   return { bg: '#0ea5e9', border: '#0284c7' };
        case STATUS_ONGOING:   return { bg: '#f59e0b', border: '#d97706' };
        case STATUS_COMPLETED: return { bg: '#10b981', border: '#059669' };
        case STATUS_CANCELLED: return { bg: '#f43f5e', border: '#e11d48' };
        default:               return { bg: '#94a3b8', border: '#64748b' };
    }
}

// ── Session Modal (calendrier) ────────────────────────────────────────────────
function SessionModal({ session, onClose, onView }: {
    session: TrainingSession;
    onClose: () => void;
    onView: (id: string) => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center shrink-0">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-secondary-900 uppercase tracking-tight leading-tight">
                                {session.title}
                            </h3>
                            <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusClass(session.status)}`}>
                                {getStatusLabel(session.status)}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center hover:bg-secondary-200 transition-colors shrink-0">
                        <X className="w-4 h-4 text-secondary-600" />
                    </button>
                </div>

                <div className="space-y-3 bg-secondary-50 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-secondary-400 shrink-0" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Période</p>
                            <p className="text-sm font-bold text-secondary-900">
                                {format(new Date(session.startDate), 'dd MMM yyyy HH:mm', { locale: fr })}
                                {' → '}
                                {format(new Date(session.endDate), 'dd MMM yyyy HH:mm', { locale: fr })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-secondary-400 shrink-0" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Lieu</p>
                            <p className="text-sm font-bold text-secondary-900">{session.location}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-secondary-400 shrink-0" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Capacité / Formateur</p>
                            <p className="text-sm font-bold text-secondary-900">{session.capacity} pers. · {session.trainer}</p>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={() => onView(session.id)}
                    className="w-full rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest text-xs py-5 flex items-center justify-center gap-2"
                >
                    Voir les détails
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TrainingSessionsPage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<TrainingSession[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [search, setSearch] = useState('');
    const [calView, setCalView] = useState<View>(Views.MONTH);
    const [calDate, setCalDate] = useState(new Date());
    const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);

    useEffect(() => {
        getAllTrainingSessions()
            .then(setSessions)
            .catch((e: Error) => setFetchError(e.message))
            .finally(() => setIsFetching(false));
    }, []);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return sessions;
        return sessions.filter(
            (s) =>
                s.title.toLowerCase().includes(q) ||
                s.trainer.toLowerCase().includes(q) ||
                s.location.toLowerCase().includes(q) ||
                s.status.toLowerCase().includes(q)
        );
    }, [sessions, search]);

    // Événements pour le calendrier
    const calEvents = useMemo(
        () =>
            sessions.map((s) => ({
                id: s.id,
                title: s.title,
                start: new Date(s.startDate),
                end: new Date(s.endDate),
                resource: s,
            })),
        [sessions]
    );

    const eventStyleGetter = (event: { resource: TrainingSession }) => {
        const { bg, border } = getCalendarColor(event.resource.status);
        return {
            style: {
                backgroundColor: bg,
                borderColor: border,
                borderRadius: '8px',
                color: 'white',
                fontWeight: '700',
                fontSize: '11px',
                border: `1px solid ${border}`,
                padding: '2px 6px',
            },
        };
    };

    return (
        <>
            {selectedSession && (
                <SessionModal
                    session={selectedSession}
                    onClose={() => setSelectedSession(null)}
                    onView={(id) => router.push(`/m/formation/sessions/${id}`)}
                />
            )}

            <PageShell>
                <PageHeader
                    title="Séances de formation"
                    description={`${sessions.length} session(s) au total`}
                    actions={
                        <>
                            <div className="flex items-center bg-secondary-100 rounded-2xl p-1 gap-1">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white shadow text-secondary-900' : 'text-secondary-400 hover:text-secondary-700'}`}
                                >
                                    <List className="w-3.5 h-3.5" /> Liste
                                </button>
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-secondary-900' : 'text-secondary-400 hover:text-secondary-700'}`}
                                >
                                    <CalendarDays className="w-3.5 h-3.5" /> Calendrier
                                </button>
                            </div>
                            <Button
                                onClick={() => router.push('/m/formation/sessions/create')}
                                className="rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest text-xs px-6 py-5 flex items-center gap-2 shadow-lg shadow-primary-200"
                            >
                                <Plus className="w-4 h-4" />
                                Nouvelle session
                            </Button>
                        </>
                    }
                />

                {/* Légende statuts */}
                <div className="flex items-center gap-3 flex-wrap">
                    {[STATUS_PLANNED, STATUS_ONGOING, STATUS_COMPLETED, STATUS_CANCELLED].map((s) => (
                        <span key={s} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusClass(s)}`}>
                            {getStatusLabel(s)}
                        </span>
                    ))}
                </div>

                {isFetching && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                        <p className="text-secondary-400 font-bold uppercase tracking-widest text-[10px]">Chargement...</p>
                    </div>
                )}

                {fetchError && (
                    <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-2xl text-destructive text-sm font-bold flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {fetchError}
                    </div>
                )}

                {!isFetching && !fetchError && (
                    <>
                        {/* ── VUE LISTE ── */}
                        {viewMode === 'list' && (
                            <div className="space-y-4">
                                {/* Recherche */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Rechercher par titre, formateur, lieu, statut..."
                                        className="w-full h-12 pl-5 pr-5 bg-white border border-secondary-200 rounded-2xl text-sm font-medium text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 shadow-sm transition-all"
                                    />
                                </div>

                                {filtered.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <CalendarDays className="w-12 h-12 text-secondary-200" />
                                        <p className="text-secondary-400 font-bold uppercase tracking-widest text-[10px]">
                                            Aucune session trouvée
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {filtered.map((session) => (
                                            <div
                                                key={session.id}
                                                onClick={() => router.push(`/m/formation/sessions/${session.id}`)}
                                                className="bg-white rounded-xl border border-secondary-100 shadow-sm hover:shadow-xl hover:shadow-secondary-200/50 hover:-translate-y-1 transition-all cursor-pointer p-6 space-y-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shrink-0">
                                                        <BookOpen className="w-5 h-5 text-white" />
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusClass(session.status)}`}>
                                                        {getStatusLabel(session.status)}
                                                    </span>
                                                </div>

                                                <div>
                                                    <h3 className="font-black text-secondary-900 text-sm uppercase tracking-tight leading-tight line-clamp-2">
                                                        {session.title}
                                                    </h3>
                                                    <p className="text-xs text-secondary-400 font-medium mt-1">
                                                        {session.trainer}
                                                    </p>
                                                </div>

                                                <div className="space-y-2 pt-2 border-t border-secondary-100">
                                                    <div className="flex items-center gap-2 text-xs text-secondary-500 font-medium">
                                                        <Clock className="w-3.5 h-3.5 shrink-0" />
                                                        <span>
                                                            {format(new Date(session.startDate), 'dd MMM yyyy', { locale: fr })}
                                                            {' → '}
                                                            {format(new Date(session.endDate), 'dd MMM yyyy', { locale: fr })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-secondary-500 font-medium">
                                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="truncate">{session.location}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-secondary-500 font-medium">
                                                        <Users className="w-3.5 h-3.5 shrink-0" />
                                                        <span>{session.capacity} participant(s)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── VUE CALENDRIER ── */}
                        {viewMode === 'calendar' && (
                            <div className="bg-white rounded-xl border border-secondary-100 shadow-sm overflow-hidden p-6">
                                <style>{`
                                    .rbc-calendar { font-family: inherit; }
                                    .rbc-header { padding: 10px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; border-color: #f1f5f9; }
                                    .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border-color: #f1f5f9; border-radius: 16px; overflow: hidden; }
                                    .rbc-day-bg + .rbc-day-bg { border-color: #f1f5f9; }
                                    .rbc-month-row + .rbc-month-row { border-color: #f1f5f9; }
                                    .rbc-off-range-bg { background: #f8fafc; }
                                    .rbc-today { background: #eff6ff; }
                                    .rbc-toolbar button { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 12px; padding: 6px 14px; border-color: #e2e8f0; color: #475569; }
                                    .rbc-toolbar button:hover { background: #f1f5f9; color: #1e293b; }
                                    .rbc-toolbar button.rbc-active { background: #004b61; color: white; border-color: #004b61; }
                                    .rbc-toolbar-label { font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; color: #1e293b; }
                                    .rbc-event { cursor: pointer; }
                                    .rbc-show-more { font-size: 10px; font-weight: 900; color: #004b61; }
                                `}</style>
                                <Calendar
                                    localizer={localizer}
                                    events={calEvents}
                                    view={calView}
                                    onView={setCalView}
                                    date={calDate}
                                    onNavigate={setCalDate}
                                    style={{ height: 620 }}
                                    culture="fr"
                                    messages={{
                                        next: '›',
                                        previous: '‹',
                                        today: "Aujourd'hui",
                                        month: 'Mois',
                                        week: 'Semaine',
                                        day: 'Jour',
                                        agenda: 'Agenda',
                                        showMore: (total) => `+${total} de plus`,
                                        noEventsInRange: 'Aucune session sur cette période.',
                                    }}
                                    eventPropGetter={eventStyleGetter}
                                    onSelectEvent={(event) => setSelectedSession(event.resource)}
                                    popup
                                />
                            </div>
                        )}
                    </>
                )}
            </PageShell>
        </>
    );
}
