"use client";

import { AppShell } from "@/components/AppShell";
import { Dashboard } from "@/components/Dashboard";
import { DigitalTwin } from "@/components/DigitalTwin";
import { ScenarioLab } from "@/components/ScenarioLab";
import { Financials } from "@/components/Financials";
import { Intelligence } from "@/components/Intelligence";
import { BriefPage } from "@/components/BriefPage";
import { SourcesPage } from "@/components/SourcesPage";
import { useApp } from "@/lib/store";

export default function Home() {
  const tab = useApp((s) => s.tab);
  return (
    <AppShell>
      {tab === "dashboard" && <Dashboard />}
      {tab === "twin" && <DigitalTwin />}
      {tab === "scenarios" && <ScenarioLab />}
      {tab === "financials" && <Financials />}
      {tab === "intelligence" && <Intelligence />}
      {tab === "brief" && <BriefPage />}
      {tab === "sources" && <SourcesPage />}
    </AppShell>
  );
}
