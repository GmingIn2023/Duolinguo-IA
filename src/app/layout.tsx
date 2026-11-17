import type { Metadata, Viewport } from "next";
import { Archivo, Geist } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "https://duolinguo-ia.onrender.com"),
  title: { default: "Gusgus.ia — Way of Learning AI", template: "%s · Gusgus.ia" },
  description: "Apprends l'IA en français : des cours à pratiquer, des quiz qui t'expliquent tes erreurs et des révisions qui reviennent avant que tu oublies.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Gusgus.ia",
    title: "Gusgus.ia — Apprends l'IA comme une langue",
    description: "Un test de niveau en 10 questions, des cours à pratiquer, des quiz qui expliquent, des révisions qui reviennent avant l'oubli.",
  },
  // the image itself comes from src/app/opengraph-image.tsx, which feeds both og:image and twitter:image
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#f1f1ee" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${archivo.variable} ${geist.variable}`}>
      <body>{children}</body>
    </html>
  );
}
