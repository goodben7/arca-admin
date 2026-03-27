import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "ARCA SIRH - Administration RH",
  description: "Système d'Information Ressources Humaines de l'ARCA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className={`${poppins.variable} font-sans h-full bg-background text-foreground antialiased`}>
        {children}
      </body>
    </html>
  );
}
