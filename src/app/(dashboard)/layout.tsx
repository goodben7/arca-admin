import type { Metadata } from "next";
import { AppChrome } from "@/components/layout/AppChrome";

export const metadata: Metadata = {
    title: {
        template: '%s | ARCA SIRH',
        default: 'Modules | ARCA SIRH',
    },
    description: "Plateforme moderne de gestion administrative du cycle de vie des employés.",
};

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <AppChrome>{children}</AppChrome>;
}
