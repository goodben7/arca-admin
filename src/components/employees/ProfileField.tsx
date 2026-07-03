interface ProfileFieldProps {
    label: string;
    value?: string | null;
    className?: string;
}

export function ProfileField({ label, value, className }: ProfileFieldProps) {
    return (
        <div className={className}>
            <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">{value?.trim() ? value : '—'}</dd>
        </div>
    );
}
