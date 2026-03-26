'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchRedirect() {
    const router = useRouter();
    const [value, setValue] = useState('');

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const q = value.trim();
        if (q) {
            router.push(`/offres-emploi?q=${encodeURIComponent(q)}`);
        } else {
            router.push('/offres-emploi');
        }
    }

    return (
        <form onSubmit={handleSubmit} className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Rechercher une autre offre..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-secondary-200 rounded-2xl text-sm font-medium text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 shadow-sm transition-all"
            />
        </form>
    );
}
