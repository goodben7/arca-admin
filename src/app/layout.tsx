import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ARCA SIRH",
  description: "Plateforme RH de l'Autorité de Régulation et de Contrôle des Assurances",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`h-full w-full light ${poppins.variable}`}>
      <body className={`${poppins.className} h-full w-full m-0 p-0 bg-background text-foreground antialiased`}>
        {children}
      </body>
    </html>
  );
}
