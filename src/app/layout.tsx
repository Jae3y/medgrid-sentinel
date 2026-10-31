import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });

export const metadata: Metadata = {
  title: "MedGrid Sentinel — Intelligent Hospital Microgrids",
  description:
    "Intelligent hospital microgrid digital twin and energy resilience platform. Predictive Energy Resilience. Uninterrupted Critical Care.",
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/icon.svg` },
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/manifest.webmanifest`,
  openGraph: {
    title: "MedGrid Sentinel — Intelligent Hospital Microgrids",
    description:
      "Deterministic digital twin for hospital energy resilience: critical-service continuity and diesel displacement, computed and verified.",
    siteName: "MedGrid Sentinel",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A1A1C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={archivo.variable}>
      <body className="min-h-screen font-sans text-slate-100 antialiased">{children}</body>
    </html>
  );
}
