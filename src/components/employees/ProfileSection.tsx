interface ProfileSectionProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
}

export function ProfileSection({
    title,
    description,
    action,
    children,
    className,
    contentClassName,
}: ProfileSectionProps) {
    return (
        <section className={className}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                    <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                    {description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                    )}
                </div>
                {action}
            </div>
            <div className={contentClassName}>{children}</div>
        </section>
    );
}
