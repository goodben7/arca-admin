'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface SidebarContextValue {
    collapsed: boolean;
    mobileOpen: boolean;
    toggle: () => void;
    openMobile: () => void;
    closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
    collapsed: false,
    mobileOpen: false,
    toggle: () => {},
    openMobile: () => {},
    closeMobile: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('sidebar-collapsed');
        if (stored === 'true') setCollapsed(true);
    }, []);

    const toggle = useCallback(() => {
        setCollapsed((v) => {
            localStorage.setItem('sidebar-collapsed', String(!v));
            return !v;
        });
    }, []);

    const openMobile = useCallback(() => setMobileOpen(true), []);
    const closeMobile = useCallback(() => setMobileOpen(false), []);

    return (
        <SidebarContext.Provider value={{ collapsed, mobileOpen, toggle, openMobile, closeMobile }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    return useContext(SidebarContext);
}
