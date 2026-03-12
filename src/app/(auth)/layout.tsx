import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Connexion | ARCA SIRH",
    description: "Connectez-vous à votre espace de gestion ARCA SIRH.",
};

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-secondary-50">
            {children}
        </div>
    );
}
