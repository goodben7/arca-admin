export function SidebarAmbient() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="sidebar-orb sidebar-orb-blue" />
            <div className="sidebar-orb sidebar-orb-yellow" />
            <div className="sidebar-orb sidebar-orb-red" />
            <div className="sidebar-orb sidebar-orb-blue-sm" />
            <div className="sidebar-orb sidebar-orb-yellow-sm" />
        </div>
    );
}
