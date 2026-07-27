'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { AppModule } from '@/lib/modules/registry';
import { Star } from 'lucide-react';

interface AppTileProps {
    module: AppModule;
    favorite?: boolean;
    onToggleFavorite?: (slug: string) => void;
}

/**
 * Carte module épurée : icône couleur · nom · description · favori.
 * Toute la carte est cliquable (lien étiré), le bouton favori reste distinct.
 */
export function AppTile({ module, favorite, onToggleFavorite }: AppTileProps) {
    const Icon = module.icon;
    const soon = module.status === 'soon';

    return (
        <article
            className={cn(
                'group relative flex items-start gap-4 rounded-2xl border bg-surface/90 p-4 backdrop-blur-[2px] transition-all duration-200',
                soon
                    ? 'border-border-subtle opacity-70'
                    : 'border-border-subtle/80 shadow-sm hover:border-primary-200 hover:bg-surface hover:shadow-float hover:-translate-y-0.5'
            )}
        >
            {!soon && (
                <Link
                    href={module.href}
                    className="absolute inset-0 z-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                    aria-label={`Ouvrir ${module.shortName}`}
                />
            )}

            <div
                className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform',
                    module.accent.bg,
                    !soon && 'group-hover:scale-[1.03]'
                )}
            >
                <Icon className="h-6 w-6" strokeWidth={1.75} />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                    <h3 className="truncate text-[15px] font-semibold tracking-tight text-secondary-900">
                        {module.shortName}
                    </h3>
                    {soon && (
                        <span className="shrink-0 rounded-md bg-accent-yellow-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#9A7200]">
                            Bientôt
                        </span>
                    )}
                </div>
                <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-secondary-500">
                    {module.description}
                </p>
            </div>

            {onToggleFavorite && !soon && (
                <button
                    type="button"
                    onClick={() => onToggleFavorite(module.slug)}
                    className={cn(
                        'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                        favorite
                            ? 'bg-[#FFF8E7] text-accent-yellow-600'
                            : 'text-secondary-300 opacity-0 hover:bg-muted hover:text-accent-yellow-600 group-hover:opacity-100'
                    )}
                    aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                    <Star className={cn('h-4 w-4', favorite && 'fill-current')} />
                </button>
            )}
        </article>
    );
}
