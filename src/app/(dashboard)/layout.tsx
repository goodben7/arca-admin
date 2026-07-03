import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardPreloader } from "@/components/layout/DashboardPreloader";
import { DashboardCanvas } from "@/components/layout/DashboardCanvas";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { ToastContainer } from "@/components/ui/ToastContainer";

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
        <SidebarProvider>
            <DashboardPreloader />
            <ToastContainer />
            <div className="flex h-screen w-full max-w-none overflow-hidden bg-background p-3 gap-3">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                    <main className="flex-1 overflow-y-auto relative w-full">
                        <div className="p-4 md:p-5 lg:p-6 space-y-4">
                            <Navbar />
                            <DashboardCanvas>
                                {children}
                            </DashboardCanvas>
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
