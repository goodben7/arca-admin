'use client';

import Link from 'next/link';
import { differenceInYears, format, addYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    AlertCircle,
    CheckCircle2,
    Heart,
    Loader2,
    CalendarDays,
    Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { RetirementEligibility } from '@/lib/api/employee';
import { translateEligibilityReason } from '@/lib/employees/journeyLabels';
import { STATUS, type Employee } from '@/types/employee';
import { cn } from '@/lib/utils';

const RETIREMENT_AGE_YEARS = 65;
const TENURE_YEARS = 35;

interface EmployeeRetirementCardProps {
    employee: Employee;
    employeeId: string;
    eligibility: RetirementEligibility | null;
    loading?: boolean;
    onRetire?: () => void;
    retiring?: boolean;
}

function ageYears(birthDate?: string): number | null {
    if (!birthDate) return null;
    return differenceInYears(new Date(), new Date(birthDate));
}

function tenureYears(hireDate?: string): number | null {
    if (!hireDate) return null;
    return differenceInYears(new Date(), new Date(hireDate));
}

/** Date indicative à laquelle l’âge légal (65 ans) est atteint. */
function ageEligibilityDate(birthDate?: string): Date | null {
    if (!birthDate) return null;
    return addYears(new Date(birthDate), RETIREMENT_AGE_YEARS);
}

/** Date indicative à laquelle l’ancienneté (35 ans) est atteinte. */
function tenureEligibilityDate(hireDate?: string): Date | null {
    if (!hireDate) return null;
    return addYears(new Date(hireDate), TENURE_YEARS);
}

export function EmployeeRetirementCard({
    employee,
    employeeId,
    eligibility,
    loading,
    onRetire,
    retiring,
}: EmployeeRetirementCardProps) {
    const age = ageYears(employee.birthDate);
    const tenure = tenureYears(employee.hireDate);
    const ageDate = ageEligibilityDate(employee.birthDate);
    const tenureDate = tenureEligibilityDate(employee.hireDate);
    const isRetired = employee.status === STATUS.RETIRED;
    const isActive = employee.status === STATUS.ACTIVE;
    const missingBirth = !employee.birthDate;
    const missingHire = !employee.hireDate;

    const earliestEligible =
        ageDate && tenureDate
            ? ageDate < tenureDate
                ? { date: ageDate, via: 'âge (65 ans)' as const }
                : { date: tenureDate, via: 'ancienneté (35 ans)' as const }
            : ageDate
                ? { date: ageDate, via: 'âge (65 ans)' as const }
                : tenureDate
                    ? { date: tenureDate, via: 'ancienneté (35 ans)' as const }
                    : null;

    const now = new Date();
    const eligibleByDates =
        (age !== null && age >= RETIREMENT_AGE_YEARS) ||
        (tenure !== null && tenure >= TENURE_YEARS);

    return (
        <section
            className={cn(
                'rounded-2xl border overflow-hidden',
                isRetired
                    ? 'border-secondary-200 bg-secondary-50/40'
                    : eligibility?.eligible
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : 'border-border bg-white',
            )}
        >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
                <div className="flex items-start gap-3">
                    <div
                        className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                            isRetired
                                ? 'bg-secondary-100 border-secondary-200 text-secondary-600'
                                : eligibility?.eligible
                                    ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                                    : 'bg-primary-50 border-primary-100 text-primary-700',
                        )}
                    >
                        <Heart className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Retraite</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Règle ARCA : âge ≥ {RETIREMENT_AGE_YEARS} ans <strong>ou</strong> ancienneté ≥ {TENURE_YEARS} ans
                        </p>
                    </div>
                </div>
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                ) : isRetired ? (
                    <Badge variant="secondary">Retraité</Badge>
                ) : eligibility?.eligible ? (
                    <Badge variant="success">Éligible</Badge>
                ) : (
                    <Badge variant="warning">Pas encore éligible</Badge>
                )}
            </div>

            <div className="px-5 py-4 space-y-4">
                {isRetired ? (
                    <div className="flex items-start gap-2 text-sm text-secondary-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <p>
                            Départ enregistré
                            {employee.retiredAt
                                ? ` le ${format(new Date(employee.retiredAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}`
                                : ''}
                            .
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div className="rounded-xl border border-border/80 bg-muted/20 px-3.5 py-3">
                                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-secondary-400">
                                    <CalendarDays className="h-3.5 w-3.5" /> Âge
                                </div>
                                <p className="mt-1 text-sm font-semibold text-foreground">
                                    {missingBirth
                                        ? 'Date de naissance manquante'
                                        : `${age} ans`}
                                </p>
                                {ageDate && (
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {ageDate <= now
                                            ? 'Seuil 65 ans atteint'
                                            : `65 ans le ${format(ageDate, 'd MMM yyyy', { locale: fr })}`}
                                    </p>
                                )}
                            </div>
                            <div className="rounded-xl border border-border/80 bg-muted/20 px-3.5 py-3">
                                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-secondary-400">
                                    <Briefcase className="h-3.5 w-3.5" /> Ancienneté
                                </div>
                                <p className="mt-1 text-sm font-semibold text-foreground">
                                    {missingHire
                                        ? 'Date d’embauche manquante'
                                        : `${tenure} an${(tenure ?? 0) > 1 ? 's' : ''}`}
                                </p>
                                {tenureDate && (
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {tenureDate <= now
                                            ? 'Seuil 35 ans atteint'
                                            : `35 ans le ${format(tenureDate, 'd MMM yyyy', { locale: fr })}`}
                                    </p>
                                )}
                            </div>
                        </div>

                        {missingBirth && (
                            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3.5 py-3 text-sm text-amber-900">
                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium">Complétez la date de naissance</p>
                                    <p className="text-xs mt-0.5 text-amber-800/80">
                                        Sans cette date, l’éligibilité par âge ne peut pas être calculée.
                                    </p>
                                    <Link
                                        href={`/m/personnel/employees/${employeeId}/edit`}
                                        className="inline-block mt-2 text-xs font-semibold text-primary-700 hover:underline"
                                    >
                                        Modifier le dossier →
                                    </Link>
                                </div>
                            </div>
                        )}

                        {earliestEligible && !eligibleByDates && (
                            <p className="text-sm text-secondary-600">
                                Première échéance indicative :{' '}
                                <strong className="text-foreground">
                                    {format(earliestEligible.date, 'd MMMM yyyy', { locale: fr })}
                                </strong>{' '}
                                via {earliestEligible.via}.
                            </p>
                        )}

                        {eligibility && eligibility.reasons.length > 0 && (
                            <ul className="space-y-1 text-sm text-secondary-600 list-disc pl-4">
                                {eligibility.reasons.map((r, i) => (
                                    <li key={i}>{translateEligibilityReason(r)}</li>
                                ))}
                            </ul>
                        )}

                        {isActive && (
                            <div className="pt-1 flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    className="gap-1.5"
                                    disabled={!eligibility?.eligible || retiring}
                                    onClick={onRetire}
                                    title={
                                        eligibility && !eligibility.eligible
                                            ? eligibility.reasons.map(translateEligibilityReason).join('\n')
                                            : undefined
                                    }
                                >
                                    {retiring ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Heart className="h-4 w-4" />
                                    )}
                                    Déclarer le départ en retraite
                                </Button>
                                {!eligibility?.eligible && (
                                    <span className="text-xs text-muted-foreground">
                                        Action disponible dès que les critères API sont remplis
                                    </span>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}


