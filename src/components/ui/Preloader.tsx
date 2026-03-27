'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface PreloaderProps {
    message?: string;
    visible: boolean;
}

export function Preloader({ message = 'Chargement…', visible }: PreloaderProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (visible) setMounted(true);
    }, [visible]);

    if (!mounted) return null;

    return (
        <div
            className={cn(
                'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#004b61] transition-opacity duration-500',
                visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            onTransitionEnd={() => { if (!visible) setMounted(false); }}
        >
            {/* Halos ambiant */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#C1272D]/5 blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#FDB913]/3 blur-[150px] pointer-events-none" />

            {/* Grille décorative */}
            <div
                className="absolute inset-0 opacity-[0.025] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
            />

            {/* Contenu centré */}
            <div className="relative flex flex-col items-center gap-10">
                {/* Logo */}
                <div className="relative">
                    <div className="absolute inset-0 rounded-3xl bg-white/20 blur-xl scale-150" />
                    <div className="relative w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl p-4 border border-white/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/logo_arca_nouveau-2.png"
                            alt="ARCA"
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>

                {/* Marque */}
                <div className="text-center space-y-1">
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-black tracking-tighter text-white">AR</span>
                        <span className="text-5xl font-black tracking-tighter text-[#C1272D]">CA</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FDB913] mb-1 ml-0.5 animate-pulse" />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">
                        Système d'Information RH
                    </p>
                </div>

                {/* Barre de progression tricolore */}
                <div className="w-64 space-y-3">
                    <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#007398] via-[#C1272D] to-[#FDB913] animate-[preloader-bar_1.6s_ease-in-out_infinite]" />
                    </div>
                    <p className="text-center text-[11px] font-black uppercase tracking-[0.25em] text-white/30">
                        {message}
                    </p>
                </div>

                {/* Points pulsants */}
                <div className="flex items-center gap-2">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="w-2 h-2 rounded-full bg-white/40 animate-[preloader-dot_1.2s_ease-in-out_infinite]"
                            style={{ animationDelay: `${i * 0.2}s` }}
                        />
                    ))}
                </div>
            </div>

            <style jsx global>{`
                @keyframes preloader-bar {
                    0%   { width: 0%;   margin-left: 0; }
                    50%  { width: 80%;  margin-left: 10%; }
                    100% { width: 0%;   margin-left: 100%; }
                }
                @keyframes preloader-dot {
                    0%, 100% { opacity: 0.2; transform: scale(0.8); }
                    50%      { opacity: 1;   transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
}
