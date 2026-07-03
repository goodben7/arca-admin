import { cn } from '@/lib/utils';

interface PageShellProps {
    children: React.ReactNode;
    className?: string;
    ambient?: boolean;
}

export function PageShell({ children, className, ambient = false }: PageShellProps) {
    return (
        <div className={cn('relative space-y-6 pb-8 page-enter-stack', className)}>
            {ambient && (
                <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
                    <div className="ambient-glow-blue -top-40 -left-40 w-[500px] h-[500px]" />
                    <div className="ambient-glow-yellow top-1/3 -right-40 w-[400px] h-[400px]" />
                    <div className="ambient-glow-red bottom-0 left-1/3 w-[350px] h-[350px]" />
                </div>
            )}
            {children}
        </div>
    );
}
