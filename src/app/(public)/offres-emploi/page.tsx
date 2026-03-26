import { getPublishedJobOffers, getPublicDepartments } from '@/lib/api/jobOffer';
import { JobOffer } from '@/types/jobOffer';
import OffresClient from './OffresClient';

export const dynamic = 'force-dynamic';

export default async function OffresEmploiPage() {
    let offers: JobOffer[] = [];
    let deptMap: Record<string, string> = {};
    let fetchError: string | null = null;

    try {
        const [offersData, deptsData] = await Promise.all([
            getPublishedJobOffers(),
            getPublicDepartments(),
        ]);
        offers = offersData;

        deptsData.forEach((d: any) => {
            if (d.id) deptMap[d.id] = d.name;
            if (d['@id']) deptMap[d['@id']] = d.name;
        });
    } catch (e: any) {
        fetchError = e?.message || 'Impossible de charger les offres.';
    }

    return <OffresClient offers={offers} deptMap={deptMap} fetchError={fetchError} />;
}
