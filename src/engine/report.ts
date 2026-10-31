/**
 * Reporting & export layer: turns simulation results into files a hospital engineer,
 * financier or judge can take away — a plain-text/Markdown summary, an hourly CSV for every
 * controller, and a machine-readable JSON. Pure functions (tested); the UI only downloads them.
 */

import type { SimResult, Strategy } from "./types";
import { STRATEGIES } from "./simulate";

const r1 = (v: number, d = 0) => (Number.isFinite(v) ? Number(v.toFixed(d)) : null);

function calendar(start: string | undefined, t: number): string {
  if (!start) return `day ${Math.floor(t / 96) + 1}`;
  const d = new Date(`${start}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Math.floor(t / 96));
  return d.toISOString().slice(0, 10);
}

/** Hourly CSV (one row per hour per controller): energy-weighted hourly means. */
export function hourlyCsv(results: Partial<Record<Strategy, SimResult>>): string {
  const head = [
    "controller",
    "date",
    "hour",
    "grid_connected",
    "tier1_demand_kw",
    "tier1_served_kw",
    "tier2_demand_kw",
    "tier2_served_kw",
    "tier3_demand_kw",
    "tier3_served_kw",
    "tier3_deferred_kw",
    "pv_kw",
    "battery_kw",
    "soc_pct",
    "generator_kw",
    "diesel_l",
    "tank_l",
    "service_level",
  ];
  const rows: string[] = [head.join(",")];
  for (const s of STRATEGIES) {
    const sim = results[s.id];
    if (!sim) continue;
    for (let i = 0; i + 4 <= sim.steps.length; i += 4) {
      const q = sim.steps.slice(i, i + 4);
      const mean = (f: (x: (typeof q)[number]) => number) => q.reduce((a, x) => a + f(x), 0) / q.length;
      const last = q[q.length - 1];
      rows.push(
        [
          s.id,
          calendar(sim.config.calendarStart, i),
          Math.floor((i % 96) / 4),
          q.every((x) => x.gridConnected) ? 1 : 0,
          r1(mean((x) => x.demandKw[1]), 1),
          r1(mean((x) => x.servedKw[1]), 1),
          r1(mean((x) => x.demandKw[2]), 1),
          r1(mean((x) => x.servedKw[2]), 1),
          r1(mean((x) => x.demandKw[3]), 1),
          r1(mean((x) => x.servedKw[3]), 1),
          r1(mean((x) => x.deferredKw[3]), 1),
          r1(mean((x) => x.pvKw), 1),
          r1(mean((x) => x.battKw), 1),
          r1(last.socFrac * 100, 1),
          r1(mean((x) => x.gensetKw), 1),
          r1(q.reduce((a, x) => a + x.dieselLph * 0.25, 0), 2),
          Number.isFinite(last.fuelLitres) ? r1(last.fuelLitres, 0) : "",
          Math.min(...q.map((x) => x.serviceLevel)),
        ].join(",")
      );
    }
  }
  return rows.join("\n") + "\n";
}

export interface ReportSummaryRow {
  controller: Strategy;
  label: string;
  outageHours: number;
  criticalHours: number;
  tier1Hours: number;
  dieselLitres: number;
  dieselAvoidedLitres: number;
  fuelOutHours: number;
  tier1Interruptions: number;
  deferredMWh: number;
  generatorHours: number;
  solarMWh: number;
}

export function summaryRows(results: Partial<Record<Strategy, SimResult>>): ReportSummaryRow[] {
  const base = results.baseline?.metrics.dieselLitres ?? 0;
  return STRATEGIES.filter((s) => results[s.id]).map((s) => {
    const m = results[s.id]!.metrics;
    return {
      controller: s.id,
      label: s.label,
      outageHours: r1(m.outageHours, 2)!,
      criticalHours: r1(m.criticalMaintainedHours, 2)!,
      tier1Hours: r1(m.tier1MaintainedHours, 2)!,
      dieselLitres: r1(m.dieselLitres)!,
      dieselAvoidedLitres: r1(base - m.dieselLitres)!,
      fuelOutHours: r1(m.fuelOutHours, 2)!,
      tier1Interruptions: m.tier1Interruptions,
      deferredMWh: r1(m.deferredKwh / 1000, 2)!,
      generatorHours: r1(m.gensetRuntimeH, 2)!,
      solarMWh: r1(m.pvUsedKwh / 1000, 2)!,
    };
  });
}

/** Markdown report (also readable as plain text). */
export function markdownReport(
  results: Partial<Record<Strategy, SimResult>>,
  context: { title: string; scenario: string; assumptions: string[]; generatedAt?: string }
): string {
  const rows = summaryRows(results);
  const sen = rows.find((r) => r.controller === "sentinel");
  const base = rows.find((r) => r.controller === "baseline");
  const lines: string[] = [];
  lines.push(`# ${context.title}`, "");
  lines.push(`Generated ${context.generatedAt ?? new Date().toISOString()} by MedGrid Sentinel (simulation, not field measurement).`, "");
  lines.push(`**Scenario:** ${context.scenario}`, "");
  if (sen && base) {
    lines.push("## Brief #13 metric", "");
    lines.push(`- Critical-service hours maintained: **${sen.criticalHours} h** (status quo ${base.criticalHours} h) of ${sen.outageHours} islanded hours`);
    lines.push(`- Diesel litres avoided vs status quo: **${sen.dieselAvoidedLitres} L** (${sen.dieselLitres} L vs ${base.dieselLitres} L)`);
    lines.push(`- Life-critical (Tier-1) hours: **${sen.tier1Hours} h** (status quo ${base.tier1Hours} h); Tier-1 interruptions ${sen.tier1Interruptions} vs ${base.tier1Interruptions}`, "");
  }
  lines.push("## All controllers (identical hardware inputs, fuel, weather and failures)", "");
  lines.push("| Controller | Critical h | Tier-1 h | Diesel L | Avoided L | Empty-tank h | Tier-1 breaks | Deferred MWh | Generator h |");
  lines.push("|---|---:|---:|---:|---:|---:|---:|---:|---:|");
  for (const r of rows) {
    lines.push(`| ${r.label} | ${r.criticalHours} | ${r.tier1Hours} | ${r.dieselLitres} | ${r.dieselAvoidedLitres} | ${r.fuelOutHours} | ${r.tier1Interruptions} | ${r.deferredMWh} | ${r.generatorHours} |`);
  }
  lines.push("", "## Assumptions", "");
  for (const a of context.assumptions) lines.push(`- ${a}`);
  lines.push(
    "",
    "## Definitions",
    "",
    "- Critical-service hours: islanded hours in which ≥ 99.5 % of Tier-1 and Tier-2 demand was served (≤ 90 s generator transfer breaks counted as interruptions, not lost hours).",
    "- Diesel litres avoided: status-quo litres − controller litres over the same window.",
    "- Loads are an illustrative 250-bed referral profile; weather is NASA POWER measured hourly data.",
    ""
  );
  return lines.join("\n");
}

/** Machine-readable bundle. */
export function jsonReport(results: Partial<Record<Strategy, SimResult>>, context: Record<string, unknown>): string {
  return JSON.stringify(
    {
      generator: "MedGrid Sentinel",
      context,
      summary: summaryRows(results),
      governorDecisions: (results.sentinel?.events ?? [])
        .filter((e) => e.type === "governor" || e.type.startsWith("fuel") || e.type.startsWith("genset"))
        .map((e) => ({ day: e.day, hour: e.hour, type: e.type, message: e.message })),
    },
    null,
    2
  );
}
