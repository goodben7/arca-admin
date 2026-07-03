interface ChartTooltipProps {
    active?: boolean;
    payload?: Array<{ name?: string; value?: number; color?: string; payload?: { name?: string } }>;
}

export function ChartTooltip({ active, payload }: ChartTooltipProps) {
    if (!active || !payload?.length) return null;
    const label = payload[0]?.payload?.name ?? payload[0]?.name;
    return (
        <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-card">
            {label && <p className="text-xs text-muted-foreground mb-1">{label}</p>}
            {payload.map((entry, i) => (
                <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
                    {entry.name}: {entry.value}
                </p>
            ))}
        </div>
    );
}
