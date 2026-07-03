interface DashboardCanvasProps {
    children: React.ReactNode;
}

export function DashboardCanvas({ children }: DashboardCanvasProps) {
    return (
        <div className="relative min-h-full">
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
                <div className="absolute inset-0 dashboard-ambient" />
                <div className="absolute inset-0 dashboard-grid-overlay opacity-60" />
                <div className="ambient-glow-blue -top-32 left-[10%] w-[520px] h-[520px]" />
                <div className="ambient-glow-yellow top-[15%] -right-32 w-[420px] h-[420px]" />
                <div className="ambient-glow-red bottom-[-10%] left-[35%] w-[380px] h-[380px]" />
            </div>
            {children}
        </div>
    );
}
