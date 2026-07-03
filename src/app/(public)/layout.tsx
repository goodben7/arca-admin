import type { ReactNode } from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="sticky top-0 z-40 p-4 md:p-6">
                <div className="max-w-6xl mx-auto rounded-2xl shadow-float px-5 py-2.5 flex items-center justify-between bg-primary-900 border border-white/10">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="bg-white rounded-lg px-2.5 py-1 shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo_arca_nouveau-2.png" alt="ARCA" className="h-7 w-auto object-contain" />
                        </div>
                    </Link>

                    <nav className="flex items-center gap-1 p-1 rounded-xl bg-white/10">
                        <Link
                            href="/offres-emploi"
                            className="px-3.5 py-1.5 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        >
                            Offres d&apos;emploi
                        </Link>
                        <Link
                            href="/login"
                            className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        >
                            <Shield className="w-3.5 h-3.5" />
                            Admin
                        </Link>
                    </nav>
                </div>
                <div className="max-w-6xl mx-auto mt-2 flex h-1 rounded-full overflow-hidden gap-0.5 px-1">
                    <div className="flex-[3] bg-primary-500 rounded-l-full" />
                    <div className="flex-[1] bg-accent-red-500" />
                    <div className="flex-[1] bg-accent-yellow-500 rounded-r-full" />
                </div>
            </header>

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-6 py-8 md:py-10">
                {children}
            </main>

            <footer className="mt-auto p-4 md:p-6">
                <div className="max-w-6xl mx-auto surface-elevated rounded-3xl px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-muted rounded-xl px-2 py-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/logo_arca_nouveau-2.png" alt="ARCA" className="h-5 w-auto object-contain" />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">
                            © {new Date().getFullYear()} ARCA — Tous droits réservés
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                        Autorité de Régulation et de Contrôle des Assurances
                    </p>
                </div>
            </footer>
        </div>
    );
}
