import type { ReactNode } from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[#f0f4f8] flex flex-col">
            {/* Header ARCA */}
            <header className="bg-[#004b61] sticky top-0 z-40 shadow-lg shadow-primary-900/20">
                <div className="max-w-6xl mx-auto px-6 py-0 flex items-stretch justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center py-2 group">
                        <div className="bg-white rounded-xl px-3 py-1.5 shadow-sm flex items-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/logo_arca_nouveau-2.png"
                                alt="ARCA"
                                width={120}
                                height={39}
                                className="block h-8 w-auto max-w-[120px] object-contain"
                            />
                        </div>
                    </Link>

                    {/* Nav */}
                    <nav className="flex items-center gap-1">
                        <Link
                            href="/offres-emploi"
                            className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        >
                            Offres d&apos;emploi
                        </Link>
                        <Link
                            href="/login"
                            className="ml-2 flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white/80 transition-colors border-l border-white/10"
                        >
                            <Shield className="w-3 h-3" />
                            Admin
                        </Link>
                    </nav>
                </div>

                {/* Barre accent rouge → jaune */}
                <div className="h-0.5 bg-gradient-to-r from-accent-red-500 via-accent-yellow-500 to-transparent" />
            </header>

            <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
                {children}
            </main>

            <footer className="bg-[#004b61] border-t border-white/10 mt-auto">
                <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 rounded-lg px-2 py-1 flex items-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo_arca_nouveau-2.png" alt="ARCA" width={75} height={25} className="block h-5 w-auto max-w-[75px] object-contain" />
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
