"use client";

import { Card, Note, Row } from "./ui";
import { Badge } from "./ui";

const REFERENCES: { org: string; title: string; url: string; date: string; finding: string; confidence: "high" | "medium" }[] = [
  {
    org: "EM-ONE Energy / RIPLE",
    title: "300 kWp solar PV + 1.1 MWh BESS microgrid at NSIA-LUTH Cancer Centre, Lagos",
    url: "https://www.emone.energy/news/emone-riple",
    date: "March 2025",
    finding:
      "Real Nigerian precedent: solar+storage microgrid for a critical-care facility under an Energy-as-a-Service style structure. Anchors our facility scale and financing narrative.",
    confidence: "high",
  },
  {
    org: "ICIR / APGC (industry counts)",
    title: "Nigeria national grid disturbances 2024",
    url: "https://www.icirnigeria.org/",
    date: "2024–2025",
    finding:
      "12+ grid collapses/disturbances recorded in 2024 (162 since 2013 per APGC). NERC quarterly reports recorded fewer officially — we cite the range and the discrepancy explicitly rather than a single inflated number.",
    confidence: "medium",
  },
  {
    org: "NERC (Nigerian Electricity Regulatory Commission)",
    title: "Band A service class tariff, July 2024 order",
    url: "https://nerc.gov.ng/",
    date: "2024–2025",
    finding:
      "Band A ≈ ₦209.5/kWh (min 20 h supply), held through 2025 per Discos. Used as the grid tariff default (₦210); must be re-verified against the current MYTO order at pilot time.",
    confidence: "medium",
  },
  {
    org: "NBS Nigeria (diesel price watch)",
    title: "Automotive gas oil (diesel) retail prices",
    url: "https://nigerianstat.gov.ng/",
    date: "2025–2026",
    finding:
      "National diesel ≈ ₦1,400–1,860/L across 2025-2026, Lagos ≈ ₦1,560/L early 2026. Default ₦1,550/L with ±30% sensitivity — diesel is 6–7× grid cost per kWh, which is the economic engine of this product.",
    confidence: "medium",
  },
  {
    org: "IEA / IRENA / SEforALL (published literature)",
    title: "Healthcare electricity reliability in Sub-Saharan Africa",
    url: "https://www.seforall.org/",
    date: "various",
    finding:
      "Extensive literature documents unreliable supply at health facilities driving diesel dependence. Treated as background context; no specific facility claim in this POC depends on it.",
    confidence: "medium",
  },
  {
    org: "IEEE / IEC standards bodies",
    title: "IEEE 1547 (interconnection), IEEE 1159 (PQ monitoring), IEC 61724 (PV performance), IEC 62619 (battery safety)",
    url: "https://standards.ieee.org/",
    date: "current editions",
    finding:
      "Framework standards informing model structure and vocabulary. The POC does NOT claim certification or compliance — it is a decision-support simulation.",
    confidence: "high",
  },
];

const ASSUMPTIONS: [string, string, string][] = [
  ["Facility loads", "250-bed secondary referral hospital, 16 circuits, ~6.6 MWh/day", "Illustrative reference profile — clearly labelled, fully editable, not measured data"],
  ["Solar model", "P = kWp × G/1000 × PR, PR 0.78, synthetic bell-curve irradiance", "Transparent baseline model; synthetic weather is labelled, not presented as meteorological data"],
  ["Battery", "Energy-based SOC, η_ch = η_dis = 0.95, floors 15% (island) / 80% reserve (grid)", "Lumped one-way efficiencies include inverter; no degradation modelled inside a run"],
  ["Generator", "10 L/h fixed + 0.27 L/kWh marginal (≈0.31 L/kWh at 250 kW)", "Standard two-term approximation; matches medium-speed diesel datasheet ranges"],
  ["Grid", "Band A ₦210/kWh, 500 kW import limit, outages per scenario", "Tariff must be re-verified against current MYTO order"],
  ["Annualization", "320 normal + 45 outage days (12.5 islanded h each)", "Explicit editable mix; 45 days is a conservative composite of national disturbances + local feeder trips"],
  ["Prices", "Diesel ₦1,550/L; FX ₦1,550/$; CapEx $800/kWp, $280/kWh, $120/kW", "2025-26 indicative levels; ±30%/±20% sensitivity included"],
  ["CO₂", "2.68 kg CO₂ per litre of diesel", "DEFRA-class stationary combustion factor"],
];

export function SourcesPage() {
  return (
    <div className="space-y-4">
      <Card title="Research references" subtitle="Every material external claim in this project, with confidence level">
        <div className="space-y-3">
          {REFERENCES.map((r, i) => (
            <div key={i} className="rounded-lg border border-surface-border/60 bg-navy-950/60 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={r.confidence === "high" ? "good" : "warn"}>{r.confidence} confidence</Badge>
                <span className="text-xs font-bold text-white">{r.org}</span>
                <span className="text-[11px] text-slate-500">{r.date}</span>
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-200">{r.title}</div>
              <p className="mt-1 text-xs leading-snug text-slate-400">{r.finding}</p>
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block break-all text-[11px] text-cyan hover:underline"
              >
                {r.url}
              </a>
            </div>
          ))}
        </div>
        <Note>
          Search-result snippets were treated as leads, not citations; figures that could not be
          traced to a primary document are marked medium confidence and flagged for verification.
          Full register: docs/DATA_SOURCES.md.
        </Note>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Model assumptions" subtitle="Each assumption names its mitigation — the model earns trust by disclosure">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="py-1.5 pr-2">Area</th>
                <th className="py-1.5 pr-2">Assumption</th>
                <th className="py-1.5">Status / mitigation</th>
              </tr>
            </thead>
            <tbody>
              {ASSUMPTIONS.map(([a, v, s], i) => (
                <tr key={i} className="border-t border-surface-border/50 text-slate-300">
                  <td className="py-1.5 pr-2 font-semibold text-white">{a}</td>
                  <td className="py-1.5 pr-2">{v}</td>
                  <td className="py-1.5 text-slate-400">{s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Known limitations" subtitle="Stated plainly, as the handbook's honesty expectations require">
          <Row k="Simulated, not measured" v="All facility data is synthetic/illustrative; the pilot plan (M1–3) is metering-first for this reason" />
          <Row k="No real-time control" v="Decision-support only; must never interface with hospital protection systems" />
          <Row k="No storage degradation" v="Within-run cycling is modelled; multi-year degradation is a financial assumption, not a physics model" />
          <Row k="Simplified PQ telemetry" v="Voltage/frequency disturbances are scenario-driven synthetic values (IEEE 1159 vocabulary, not measurements)" />
          <Row k="No harmonics/THD" v="Only implemented with a defined waveform model — deliberately omitted rather than faked" />
          <Row k="Grid dynamics" v="Frequency/voltage dynamics of the national grid are out of scope; only local-bus behaviour is modelled" />
          <Row k="Single-node model" v="No network-level power flow within the facility; feeder-level detail arrives with measured data" />
          <Note>
            The complete register lives in docs/ASSUMPTIONS_AND_LIMITATIONS.md and
            docs/RESEARCH_LIMITATIONS.md; the disclosure statement lists all tools and datasets used.
          </Note>
        </Card>
      </div>
    </div>
  );
}
