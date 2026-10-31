"use client";

import { Badge, Card, Note, Row } from "./ui";

const REFERENCES: { org: string; title: string; url: string; date: string; finding: string; confidence: "high" | "medium" }[] = [
  {
    org: "NASA Langley Research Center — POWER Project",
    title: "Hourly all-sky surface irradiance (ALLSKY_SFC_SW_DWN) and 2 m temperature (T2M), community RE",
    url: "https://power.larc.nasa.gov/",
    date: "retrieved 31 Oct 2026",
    finding:
      "Measured (satellite-derived) weather for Maiduguri 2022–2024 and seven more sites. Drives PV yield, the outage replay, Monte Carlo weather, forecaster training (2022–23) and held-out testing (2024), and the fleet screen.",
    confidence: "high",
  },
  {
    org: "NREL — Marqusee, Ericson & Jenket",
    title: "Emergency Diesel Generator Reliability and Installation Energy Security (NREL/TP-5C00-76553, 2020)",
    url: "https://docs.nlr.gov/docs/fy20osti/76553.pdf",
    date: "April 2020",
    finding:
      "Failure-to-start 0.13% / 0.66% / 1.65% and run-time MTTF 1,662 / 636 / 61 h for well-, average- and poorly-maintained sets; repair incl. logistics 37 h. The engine reproduces the report's ‘≈ 80% reliable over two weeks' as a unit test.",
    confidence: "high",
  },
  {
    org: "Transmission Company of Nigeria (via Channels TV, VON, The Cable)",
    title: "Gombe–Damaturu–Maiduguri 330 kV line: tower 372 vandalised 22 Sep 2024; restored 31 Oct 2024",
    url: "https://von.gov.ng/borno-state-transmission-company-of-nigeria-restores-electricity-supply-in-maiduguri/",
    date: "Sep–Oct 2024",
    finding: "Defines the replay window. Maiduguri was partly fed by its emergency gas plant meanwhile — modelled with the residual-supply slider.",
    confidence: "high",
  },
  {
    org: "ICIR",
    title: "Zulum donates Govt House diesel to hospitals in darkness during unannounced visit",
    url: "https://www.icirnigeria.org/zulum-donates-govt-house-diesel-to-hospitals-in-darkness-during-unannounced-visit/",
    date: "3 Dec 2022",
    finding: "Two Maiduguri hospitals dark for days; generators functional but no diesel. The root-cause evidence: fuel, not kW.",
    confidence: "high",
  },
  {
    org: "WHO · World Bank · IRENA · SEforALL",
    title: "Energizing Health: Accelerating Electricity Access in Health-Care Facilities",
    url: "https://www.who.int/news/item/14-01-2023-close-to-one-billion-people-globally-are-served-by-health-care-facilities-with-no-electricity-access-or-with-unreliable-electricity",
    date: "Jan 2023",
    finding: "Only 50% of hospitals in sub-Saharan Africa report reliable electricity; ~1 billion people served by facilities without reliable power.",
    confidence: "high",
  },
  {
    org: "EM-ONE Energy / RIPLE",
    title: "NSIA-LUTH Cancer Centre microgrid: 300 kWp PV + 1.1 MWh storage, energy-as-a-service under a PPA",
    url: "https://www.emone.energy/news/emone-riple",
    date: "12 Mar 2025",
    finding: "Nigerian precedent for the EaaS structure (flat monthly fee; developer finances, operates, maintains). Performance figures are projected by the developer.",
    confidence: "high",
  },
  {
    org: "World Bank Enterprise Surveys",
    title: "Nigeria: power outages in a typical month",
    url: "https://www.enterprisesurveys.org/",
    date: "2014 round",
    finding: "32.8 outages per month → feeder regime of 1.08 interruptions/day. Durations are an explicit assumption (median 4 h).",
    confidence: "medium",
  },
  {
    org: "NERC · fuel price trackers · NFEM",
    title: "Band A ₦206.80/kWh (May 2024 order); diesel ₦1,900–2,020/L retail, Oct 2026; ₦1,331–1,334/$",
    url: "https://nerc.gov.ng/",
    date: "2024–2026",
    finding: "Tariff ₦207/kWh, diesel ₦1,950/L, FX ₦1,335/$ — all with sensitivity cases on the Financials tab.",
    confidence: "medium",
  },
  {
    org: "BloombergNEF (via Energy-Storage.news)",
    title: "Battery price & energy storage system cost surveys 2025",
    url: "https://www.energy-storage.news/",
    date: "Dec 2025",
    finding: "Global turnkey BESS ≈ $117/kWh; we use $260/kWh installed in Nigeria (import, logistics, security premia) and test ±30%.",
    confidence: "medium",
  },
];

const ASSUMPTIONS: [string, string, string][] = [
  ["Facility loads", "250-bed referral hospital, 16 circuits, 6.77 MWh/day (T1 86 kW · T2 104 kW · T3 93 kW avg)", "Illustrative — editable; replaced by circuit metering in pilot months 1–3"],
  ["Solar", "kWp × G/1000 × PR 0.82 × temperature derate (−0.35 %/°C, NOCT 45 °C), measured G and T", "GHI used as plane-of-array (12° N, low tilt) — documented"],
  ["Battery", "η = 0.95 each way, floors 15% (island) / 80% reserve (grid), Sentinel clinical reserve 2 h of Tier 1", "No ageing inside a run; replacement in year 12"],
  ["Generator", "10 L/h + 0.27 L/kWh; 15 s start-to-transfer; failures from NREL classes", "Typical two-term curve; measured curve in pilot"],
  ["Fuel logistics", "10,000 L tank, deliveries every 3.5 days (6,000 L/week default)", "Supply curve 0–16,000 L/week shown; Monte Carlo adds delays and misses"],
  ["Economics", "Full measured year, 20 years, O&M 1.5%/yr, platform $12k + $4.8k/yr, replacements year 12", "Sensitivity on every major input"],
  ["CO₂", "2.68 kg CO₂ per litre of diesel", "Stationary combustion factor"],
];

export function SourcesPage() {
  return (
    <div className="space-y-4">
      <Card title="Research references" subtitle="Every material external input, where it came from, and how sure we are">
        <div className="grid gap-3 lg:grid-cols-2">
          {REFERENCES.map((r, i) => (
            <div key={i} className="rounded-xl border border-surface-border/60 bg-navy-950/60 p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={r.confidence === "high" ? "good" : "warn"}>{r.confidence} confidence</Badge>
                <span className="text-[13px] font-semibold text-white">{r.org}</span>
                <span className="text-[12px] text-slate-500">{r.date}</span>
              </div>
              <div className="mt-1.5 text-[13px] text-slate-200">{r.title}</div>
              <p className="mt-1 text-[12.5px] leading-snug text-slate-400">{r.finding}</p>
              <a href={r.url} target="_blank" rel="noreferrer" className="mt-1 inline-block break-all text-[12px] text-cyan hover:underline">
                {r.url}
              </a>
            </div>
          ))}
        </div>
        <Note>Full register with access dates: docs/DATA_SOURCES.md. Search snippets were treated as leads; primary pages and documents were opened where possible.</Note>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Model assumptions" subtitle="Each assumption names how it is handled">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="py-1.5 pr-2 font-medium">Area</th>
                <th className="py-1.5 pr-2 font-medium">Assumption</th>
                <th className="py-1.5 font-medium">Handling</th>
              </tr>
            </thead>
            <tbody>
              {ASSUMPTIONS.map(([a, v, s], i) => (
                <tr key={i} className="border-t border-surface-border/50 align-top text-slate-300">
                  <td className="py-1.5 pr-2 font-semibold text-white">{a}</td>
                  <td className="py-1.5 pr-2">{v}</td>
                  <td className="py-1.5 text-slate-400">{s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Known limitations" subtitle="Stated plainly">
          <Row k="Simulation, not measurement" v="Hospital loads are illustrative; the pilot starts with metering and shadow mode" />
          <Row k="Supervisory, not protection" v="Never replaces relays, ATS or certified inverter controls" />
          <Row k="15-minute resolution" v="Transfer breaks counted as interruptions; sub-second transients out of scope" />
          <Row k="Synthetic power quality" v="Voltage/frequency events are scenario values (IEEE 1159 vocabulary); no harmonics claimed" />
          <Row k="Replay assumption" v="Hospital feeder dark for all 39 days (residual supply adjustable)" />
          <Row k="Single-node model" v="No internal network power flow; circuit detail arrives with measured data" />
          <Note>Complete register: docs/ASSUMPTIONS_AND_LIMITATIONS.md and docs/RESEARCH_LIMITATIONS.md.</Note>
        </Card>
      </div>
    </div>
  );
}
