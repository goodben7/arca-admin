import Link from 'next/link';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface ActionItem {
    icon: LucideIcon;
    label: string;
    href: string;
}

interface DashboardActionInboxProps {
    items: ActionItem[];
    pendingCount: number;
}

export function DashboardActionInbox({ items, pendingCount }: DashboardActionInboxProps) {
    if (items.length === 0) {
        return (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-5">
                <p className="text-sm font-semibold text-emerald-900">Tout est à jour</p>
                <p className="text-xs text-emerald-700/80 mt-1">Aucune validation en attente de votre part.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-amber-200/80 flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-foreground">Vos priorités</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {pendingCount} action{pendingCount > 1 ? 's' : ''} nécessite{pendingCount > 1 ? 'nt' : ''} votre attention
                    </p>
                </div>
                <span className="shrink-0 min-w-[1.75rem] h-7 px-2 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                    {pendingCount}
                </span>
            </div>
            <ul>
                {items.map((item, i) => (
                    <li key={i} className="border-b border-amber-200/60 last:border-0">
                        <Link
                            href={item.href}
                            className="flex items-center gap-3 px-5 py-3.5 hover:bg-amber-100/60 transition-colors group"
                        >
                            <item.icon className="w-4 h-4 text-amber-700 shrink-0" />
                            <span className="text-sm font-medium text-foreground flex-1">{item.label}</span>
                            <ArrowRight className="w-4 h-4 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
