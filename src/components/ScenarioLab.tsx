"use client";

import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { SCENARIOS, buildBaselineConfig, runSimulation } from "@/engine";
import { fmtHour12, fmtKwh, fmtNaira, fmtPct } from "@/lib/format";
import { Badge, Card, Note } from "./ui";
import { Play, FlaskConical } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Row {
  id: string;
  name: string;
  outageHours: number;
  criticalServiceHours: number;
  continuity: number;
  diesel: number;
  baselineDiesel: number;
  unserved: number;
  opex: number;
}

export function ScenarioLab() {
  const { config, sim, baseline, scenarioId, runScenario } = useApp();

  // Lazily evaluate all scenarios for the comparison table (cheap: 96×3 steps each).
  const rows: Row[] = useMemo(
    () =>
      SCENARIOS.map((s) => {
        const cfg = s.build();
        const proposed = runSimulation(cfg);
        const bl = runSimulation(buildBaselineConfig(cfg));
        const m = proposed.metrics;
        return {
          id: s.id,
          name: s.name,
          outageHours: m.outageHours,
          criticalServiceHours: m.criticalServiceHours,
          continuity: m.outageHours > 0 ? m.criticalServiceHours / m.outageHours : 1,
          diesel: m.dieselLitres,
          baselineDiesel: bl.metrics.dieselLitres,
          unserved: m.unservedKwh[1] + m.unservedKwh[2] + m.unservedKwh[3],
          opex: m.opexNaira,
        };
      }),
    []
  );

  const chartData = rows.map((r) => ({
    name: r.id,
    "Baseline diesel (L)": Math.round(r.baselineDiesel),
    "Sentinel diesel (L)": Math.round(r.diesel),
  }));

  const active = sim.metrics;

  return (
    <div className="space-y-4">
      <Card
        title="Scenario laboratory"
        subtitle="Ten deterministic scenarios — identical inputs always produce identical results (unit-tested)"
        right={
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <FlaskConical size={14} /> active: {scenarioId === "custom" ? "custom config" : `Scenario ${scenarioId}`}
          </span>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => runScenario(s.id)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                scenarioId === s.id
                  ? "border-cyan/60 bg-navy-800"
                  : "border-surface-border bg-surface/60 hover:border-cyan/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{s.name}</span>
                {s.briefScenario && <Badge tone="cyan">brief</Badge>}
              </div>
              <p className="mt-1 text-xs leading-snug text-slate-400">{s.description}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-cyan">
                <Play size={11} /> Run scenario
              </span>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Critical-service continuity" subtitle="Energy-weighted hours of Tier-1+2 service maintained during outages">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="py-1.5 pr-2">Scenario</th>
                  <th className="py-1.5 pr-2">Outage h</th>
                  <th className="py-1.5 pr-2">Critical h</th>
                  <th className="py-1.5 pr-2">Continuity</th>
                  <th className="py-1.5 pr-2">Unserved kWh</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={`border-t border-surface-border/50 ${scenarioId === r.id ? "text-cyan" : "text-slate-200"}`}>
                    <td className="py-1.5 pr-2 font-semibold">{r.id}</td>
                    <td className="py-1.5 pr-2 font-mono">{r.outageHours.toFixed(1)}</td>
                    <td className="py-1.5 pr-2 font-mono">{r.criticalServiceHours.toFixed(2)}</td>
                    <td className="py-1.5 pr-2 font-mono">
                      {r.outageHours > 0 ? fmtPct(r.continuity) : "—"}
                    </td>
                    <td className={`py-1.5 pr-2 font-mono ${r.unserved > 1 ? "text-energy-red" : ""}`}>
                      {r.unserved.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note>
            Scenarios G (generator failure) and I (undersized) deliberately show deficits —
            identifying a failing design is part of the platform&apos;s value.
          </Note>
        </Card>

        <Card title="Diesel consumption vs diesel-only baseline" subtitle="Litres over the 3-day simulation window of each scenario">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -8 }}>
                <CartesianGrid stroke="#1B3A63" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748B", fontSize: 10 }} unit=" L" width={58} />
                <Tooltip
                  contentStyle={{ background: "#0B1F3A", border: "1px solid #24466E", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#94A3B8" }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Baseline diesel (L)" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Sentinel diesel (L)" fill="#22D3EE" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card
        title={`Active run — Scenario ${scenarioId === "custom" ? "(custom)" : scenarioId}`}
        subtitle={config.facility.name}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniStat label="Demand (72 h)" value={fmtKwh(active.totalDemandKwh)} />
          <MiniStat label="Solar used" value={fmtKwh(active.pvUsedKwh)} />
          <MiniStat label="Diesel" value={`${active.dieselLitres.toFixed(0)} L`} />
          <MiniStat label="Baseline diesel" value={`${baseline.metrics.dieselLitres.toFixed(0)} L`} />
          <MiniStat label="Opex (72 h)" value={fmtNaira(active.opexNaira)} />
          <MiniStat label="Baseline opex" value={fmtNaira(baseline.metrics.opexNaira)} />
          <MiniStat
            label="Renewable share"
            value={fmtPct(active.renewableShare)}
          />
          <MiniStat
            label="Events"
            value={`${sim.events.length}`}
          />
        </div>
        <div className="mt-3 max-h-56 space-y-1 overflow-y-auto">
          {sim.events.map((e, i) => (
            <div key={i} className="flex items-start gap-2 rounded-md bg-navy-950/60 px-2.5 py-1.5">
              <span
                className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                  e.severity === "critical" ? "bg-energy-red" : e.severity === "warning" ? "bg-energy-amber" : "bg-cyan"
                }`}
              />
              <span className="w-24 shrink-0 font-mono text-[10px] text-slate-500">
                D{e.day + 1} {fmtHour12(e.hour)}
              </span>
              <span className="text-[11px] leading-snug text-slate-300">{e.message}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-surface-border bg-navy-950/60 p-3">
      <div className="label">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}
