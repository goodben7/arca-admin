import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
    title: {
        template: '%s | ARCA SIRH',
        default: 'Dashboard | ARCA SIRH',
    },
    description: "Plateforme moderne de gestion administrative du cycle de vie des employés.",
};

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
