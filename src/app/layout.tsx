import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedGrid Sentinel — Intelligent Hospital Microgrids",
  description:
    "Intelligent hospital microgrid digital twin and energy resilience platform. Predictive Energy Resilience. Uninterrupted Critical Care.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-navy-950 font-sans text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
