"use client";

import { useMemo } from "react";
import { clsx } from "clsx";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { evaluateSolarForecast } from "@/engine";
import { AXIS_PROPS, GRID_PROPS, LEGEND_STYLE, TOOLTIP_LABEL, TOOLTIP_STYLE } from "@/lib/chart-theme";
import { fmtPct } from "@/lib/format";
import { Badge, Card, Note } from "./ui";

const LAYERS = [
  { layer: "Dispatch & fuel-runway governor", kind: "Deterministic rules (safety-critical)", why: "Must be explainable, testable and identical on every run — never a black box near an ICU." },
  { layer: "Solar day-ahead forecast", kind: "Statistical ML (OLS blend)", why: "Trained on NASA POWER 2022–23, scored on held-out 2024; feeds the governor's runway." },
  { layer: "Resilience probabilities", kind: "Monte Carlo simulation", why: "Published generator failure statistics × measured weather × supply-chain uncertainty." },
  { layer: "Demand forecast & anomalies", kind: "Statistical (synthetic until pilot metering)", why: "Labelled synthetic; replaced by circuit-level metering in month 1–3." },
  { layer: "Natural-language assistant", kind: "Not built (deliberately)", why: "No LLM decides or reports readings; every message on screen and SMS is generated from engine state." },
];

export function SolarForecastCard() {
  const r = useMemo(() => evaluateSolarForecast(), []);
  const data = r.series.filter((_, i) => i % 2 === 0).map((d) => ({ ...d, label: d.day }));
  const best = r.models.reduce((a, m) => (m.rmseKwhM2 < a.rmseKwhM2 ? m : a), r.models[0]);
  const k07 = r.confidenceCoverage.find((c) => c.k === 0.7)!;
  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <Card
        title="Solar forecasting on real, held-out data"
        subtitle={`Maiduguri daily insolation · trained on 2022–2023 · tested on all ${r.testDays} scored days of 2024 (never seen in training)`}
        right={<Badge tone="good">real data</Badge>}
      >
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="day" {...AXIS_PROPS} tickFormatter={(d) => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Math.min(11, Math.floor(Number(d) / 30.5))]} />
            <YAxis {...AXIS_PROPS} width={36} domain={[0, 8]} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} labelFormatter={(d) => `Day ${d} of 2024`} formatter={(v: number, k: string) => [`${v} kWh/m²`, k]} />
            <Legend {...LEGEND_STYLE} />
            <Line dataKey="actual" name="Measured (NASA POWER)" stroke="#E2E8F0" strokeWidth={1.2} dot={false} isAnimationActive={false} />
            <Line dataKey="forecast" name="Learned blend forecast" stroke="#45E0A0" strokeWidth={1.6} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-slate-400">
              <tr>
                <th className="py-1 pr-2">Model</th>
                <th className="py-1 pr-2">MAE kWh/m²</th>
                <th className="py-1 pr-2">RMSE</th>
                <th className="py-1 pr-2">MAE %</th>
                <th className="py-1 pr-2">Skill vs climatology</th>
              </tr>
            </thead>
            <tbody>
              {r.models.map((m) => (
                <tr key={m.id} className={clsx("border-t border-surface-border/50", m.id === best.id ? "text-cyan" : "text-slate-200")} title={m.description}>
                  <td className="py-1 pr-2">{m.label}</td>
                  <td className="py-1 pr-2 num">{m.maeKwhM2.toFixed(3)}</td>
                  <td className="py-1 pr-2 num">{m.rmseKwhM2.toFixed(3)}</td>
                  <td className="py-1 pr-2 num">{fmtPct(m.maePct)}</td>
                  <td className="py-1 pr-2 num">{m.skill >= 0 ? "+" : ""}{fmtPct(m.skill)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>
          Blend fitted by least squares on 2022–2023 only: forecast = {r.blend.a}·(3-day mean) + {r.blend.b}·climatology {r.blend.c >= 0 ? "+" : "−"} {Math.abs(r.blend.c)}.
          Honest result: it beats naive persistence clearly and climatology modestly. Its main job is calibration — on held-out 2024 the sun delivered ≥ 70 % of the
          3-day forecast on <b>{fmtPct(k07.coverage)}</b> of days, which is why the governor counts on exactly 70 % of forecast solar.
        </Note>
      </Card>
      <Card title="What is AI here — and what deliberately is not" subtitle="Each layer, its method and why">
        <div className="space-y-2">
          {LAYERS.map((l) => (
            <div key={l.layer} className="rounded-lg border border-surface-border/60 bg-navy-950/50 p-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-white">{l.layer}</span>
                <span className="text-[10px] font-semibold text-cyan">{l.kind}</span>
              </div>
              <p className="mt-0.5 text-[11.5px] leading-snug text-slate-400">{l.why}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
