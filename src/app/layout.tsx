import type { Metadata, Viewport } from "next";
import { Archivo, Geist } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Gusgus — Way of Learning AI", template: "%s · Gusgus" },
  description: "Apprends l'IA en cours de 5 minutes : des quiz qui corrigent tes erreurs et des révisions qui reviennent au bon moment.",
};

export const viewport: Viewport = { themeColor: "#f1f1ee" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${archivo.variable} ${geist.variable}`}>
      <body>{children}</body>
    </html>
  );
}
