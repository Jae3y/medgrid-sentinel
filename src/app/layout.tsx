import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedGrid Sentinel — Intelligent Hospital Microgrids",
  description:
    "Intelligent hospital microgrid digital twin and energy resilience platform. Predictive Energy Resilience. Uninterrupted Critical Care.",
  openGraph: {
    title: "MedGrid Sentinel — Intelligent Hospital Microgrids",
    description:
      "Deterministic digital twin for hospital energy resilience: critical-service continuity and diesel displacement, computed and verified.",
    siteName: "MedGrid Sentinel",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#060D1F",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans text-slate-100 antialiased">{children}</body>
    </html>
  );
}
