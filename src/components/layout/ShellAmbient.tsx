/** Ambiance ARCA partagée — teintes, motif, filigrane. */
export function ShellAmbient() {
    return (
        <div className="shell-ambient" aria-hidden>
            <div className="shell-ambient-mesh" />
            <div className="shell-ambient-dots" />
            <div className="sidebar-orb sidebar-orb-blue opacity-50" style={{ top: '8%', left: '-6%', width: 200, height: 200 }} />
            <div className="sidebar-orb sidebar-orb-red opacity-40" style={{ top: '35%', right: '-4%', left: 'auto', width: 160, height: 160 }} />
            <div className="sidebar-orb sidebar-orb-yellow opacity-45" style={{ top: '62%', right: '20%', left: 'auto', bottom: 'auto', width: 150, height: 150 }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_arca_nouveau-2.png" alt="" className="shell-watermark" />
        </div>
    );
}
