"use client";

import { useApp } from "@/lib/store";
import { fmtKwh, fmtNaira, fmtNum, fmtPct } from "@/lib/format";
import { Badge, Card, Kpi, Note, Row } from "./ui";
import { BookOpenCheck, Scale, Target } from "lucide-react";

export function BriefPage() {
  const { sim, baseline, econ } = useApp();
  const m = sim.metrics;
  const b = baseline.metrics;
  const dieselAvoided = b.dieselLitres - m.dieselLitres;

  return (
    <div className="space-y-4">
      <Card
        title="Official problem brief — locked"
        subtitle="Anneru IAS Global Energy Hackathon 2026 · Appendix B (Innovator Handbook p. 34)"
        right={<Badge tone="cyan"><BookOpenCheck size={11} /> Track 2 · Digital Solutions & AI · Setting B</Badge>}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-cyan/30 bg-navy-800/60 p-4">
            <div className="label text-cyan">Brief #13</div>
            <div className="text-lg font-bold text-white">Power for a city the grid can&apos;t protect</div>
            <p className="mt-1 text-xs text-slate-400">
              Full partner brief text is released at the Kick-off; the published success metrics
              below are from the Innovator Handbook and govern this build.
            </p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface/60 p-4">
            <div className="label">Success metric 1</div>
            <div className="text-sm font-semibold text-white">
              Hours of critical service maintained during a line outage
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Our definition (documented): energy-weighted hours where Tier-1 (life-critical) +
              Tier-2 (clinical priority) demand is ≥99% served, across all islanded hours.
            </p>
          </div>
          <div className="rounded-xl border border-surface-border bg-surface/60 p-4">
            <div className="label">Success metric 2</div>
            <div className="text-sm font-semibold text-white">Diesel litres avoided</div>
            <p className="mt-1 text-xs text-slate-400">
              Simulated litres vs the diesel-only backup baseline over identical scenarios and
              an explicit 45-outage-day annual mix.
            </p>
          </div>
        </div>
        <Note>
          Named community: hospitals and clinics in Nigerian urban centres served by feeders that
          fail during national grid disturbances (12+ grid collapses recorded in 2024 by
          industry/media counts; NERC&apos;s official count is lower — see Data &amp; Sources). Named
          user: the hospital facility/works engineer. Named payer: hospital management or an
          energy-service provider under EaaS.
        </Note>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={<Target size={18} />} label="Metric 1 — critical service" value={`${m.criticalServiceHours.toFixed(2)} / ${m.outageHours.toFixed(1)} h`} sub="maintained in active scenario" tone={m.unservedKwh[1] < 1 ? "good" : "warn"} />
        <Kpi icon={<Scale size={18} />} label="Metric 2 — diesel avoided (3-day run)" value={`${fmtNum(dieselAvoided)} L`} sub={`${fmtPct(dieselAvoided / Math.max(1, b.dieselLitres))} vs baseline`} tone="good" />
        <Kpi label="Annualized diesel avoided" value={`${fmtNum(econ.dieselLitresAvoidedPerYear)} L`} sub="320 normal + 45 outage days" tone="good" />
        <Kpi label="Annualized CO₂ avoided" value={`${fmtNum(econ.co2TonnesAvoidedPerYear, 1)} t`} sub="2.68 kg CO₂/L diesel" tone="good" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Baseline vs Sentinel — active scenario" subtitle="Same loads, same outage schedule; only the system differs">
          <Row k="Critical-service hours in outages" v={`${m.criticalServiceHours.toFixed(2)} h vs ${b.criticalServiceHours.toFixed(2)} h`} mono />
          <Row k="Diesel litres (72 h)" v={`${m.dieselLitres.toFixed(0)} L vs ${b.dieselLitres.toFixed(0)} L`} mono />
          <Row k="Generator runtime" v={`${m.gensetRuntimeH.toFixed(1)} h vs ${b.gensetRuntimeH.toFixed(1)} h`} mono />
          <Row k="Grid energy" v={`${fmtKwh(m.gridKwh)} vs ${fmtKwh(b.gridKwh)}`} mono />
          <Row k="Operating cost (72 h)" v={`${fmtNaira(m.opexNaira)} vs ${fmtNaira(b.opexNaira)}`} mono />
          <Row k="CO₂ (72 h)" v={`${fmtNum(m.co2Kg)} kg vs ${fmtNum(b.co2Kg)} kg`} mono />
          <Row k="Unserved Tier-1 energy" v={`${m.unservedKwh[1].toFixed(2)} kWh — reported honestly, never hidden`} mono />
        </Card>

        <Card title="Appendix A — solution outline" subtitle="The handbook's one-page template, filled from the live model">
          <Row k="Challenge track & setting" v="Track 2 (Digital Solutions & AI) · Setting B (non-residential)" />
          <Row k="Community & target user" v="Urban Nigerian hospitals on unreliable feeders; facility engineer (user), hospital/EaaS provider (payer)" />
          <Row k="The problem" v="Grid collapses force hospitals onto diesel; fuel logistics and cost threaten continuity of surgery, ICU and cold chain" />
          <Row k="Proposed solution" v="Digital twin + intelligent dispatch for hospital microgrids: PV + battery + genset orchestrated to maximize critical-service hours per diesel litre" />
          <Row k="48-hour POC" v="This application: deterministic 15-min simulation engine (57 tests), digital twin, 10-scenario lab, financial engine, predictive intelligence" />
          <Row k="Brief metric moved" v={`Critical-service hours: ${m.criticalServiceHours.toFixed(2)} h maintained; diesel cut ${fmtPct(dieselAvoided / Math.max(1, b.dieselLitres))} in the outage scenario`} />
          <Row k="Estimated cost & who pays" v={`${fmtNaira(econ.capex.totalNaira)} CapEx; hospital-owned or EaaS at ${fmtNum(econ.eaasTariffNairaPerKwh)} ₦/kWh`} />
          <Row k="6–18 month deployment" v="M1–3 facility audit → M4–6 engineering + agreements → M7–12 pilot with an energy-service partner → M13–18 replication" />
          <Row k="Biggest risk" v="Simulated (not measured) facility data — mitigated by the pilot's metering-first design; see Assumptions & Limitations" />
          <Row k="Prior work disclosure" v="All features built during the sprint; see disclosure statement in the submission package" />
        </Card>
      </div>

      <Card title="How to read the numbers">
        <p className="text-xs leading-relaxed text-slate-300">
          Every figure in this application is computed by the deterministic engine in{" "}
          <span className="font-mono text-cyan">src/engine/</span> from the documented equations in{" "}
          <span className="font-mono">docs/POWER_SYSTEM_MODEL.md</span> — nothing is hard-coded
          copy. The active scenario&apos;s results recompute live when you change any input on the
          Digital Twin tab. Facility loads, tariffs and prices are illustrative defaults labelled
          as such; the engine itself is data-agnostic and accepts measured facility data.
        </p>
      </Card>
    </div>
  );
}
