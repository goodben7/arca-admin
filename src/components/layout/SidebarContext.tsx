'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextValue {
    collapsed: boolean;
    toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
    collapsed: false,
    toggle: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);

    // Persister la préférence
    useEffect(() => {
        const stored = localStorage.getItem('sidebar-collapsed');
        if (stored === 'true') setCollapsed(true);
    }, []);

    const toggle = () => {
        setCollapsed((v) => {
            localStorage.setItem('sidebar-collapsed', String(!v));
            return !v;
        });
    };

    return (
        <SidebarContext.Provider value={{ collapsed, toggle }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    return useContext(SidebarContext);
}
