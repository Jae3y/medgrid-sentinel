"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Dice5, Play, ShieldCheck } from "lucide-react";
import {
  runMonteCarloAsync,
  singleGensetReliability,
  RELIABILITY_CLASSES,
  DEFAULT_MC,
  STRATEGIES,
  type MonteCarloResult,
  type ReliabilityClass,
} from "@/engine";
import { useApp } from "@/lib/store";
import { Badge, Card, Note, Row } from "./ui";
import { fmtNum, fmtPct } from "@/lib/format";
import { AXIS_PROPS, GRID_PROPS, LEGEND_STYLE, TOOLTIP_LABEL, TOOLTIP_STYLE } from "@/lib/chart-theme";

const COLORS: Record<string, string> = { baseline: "#94A3B8", conventional: "#F59E0B", sentinel: "#22D3EE", nrel: "#64748B" };
const LABEL = (k: string) => (k === "nrel" ? "NREL single-EDG formula" : STRATEGIES.find((s) => s.id === k)?.short ?? k);

const DURATIONS = [
  { h: 72, label: "3 days" },
  { h: 168, label: "7 days" },
  { h: 336, label: "14 days" },
  { h: 936, label: "39 days" },
];

export function ResiliencePage() {
  const mission = useApp((s) => s.mission);
  const [cls, setCls] = useState<ReliabilityClass["id"]>("nrc");
  const [hours, setHours] = useState(336);
  const [trials, setTrials] = useState(120);
  const [repair, setRepair] = useState(72);
  const [supply, setSupply] = useState(mission.weeklySupplyLitres ?? 6000);
  const [res, setRes] = useState<MonteCarloResult | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const runId = useRef(0);

  const run = useCallback(async () => {
    const id = ++runId.current;
    setProgress(0);
    const r = await runMonteCarloAsync(
      {
        trials,
        outageHours: hours,
        reliabilityClassId: cls,
        repairMeanHours: repair,
        hardware: { pvKwp: mission.pvKwp, batteryKwh: mission.batteryKwh, inverterKw: mission.inverterKw, weeklySupplyLitres: supply },
      },
      (d, t) => id === runId.current && setProgress(d / t),
      () => id !== runId.current
    );
    if (r && id === runId.current) {
      setRes(r);
      setProgress(null);
    }
  }, [trials, hours, cls, repair, supply, mission.pvKwp, mission.batteryKwh, mission.inverterKw]);

  useEffect(() => {
    run();
    return () => {
      runId.current++;
    };
    // run once on mount with defaults
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const relClass = RELIABILITY_CLASSES.find((c) => c.id === cls)!;
  const survivalData = useMemo(() => {
    if (!res) return [];
    const H = res.options.outageHours;
    const step = H > 400 ? 6 : H > 200 ? 3 : 1;
    const out: Record<string, number>[] = [];
    for (let h = 0; h <= H; h += step) {
      const row: Record<string, number> = { h };
      for (const k of Object.keys(res.byStrategy)) row[k] = Math.round(res.byStrategy[k].survival[h] * 1000) / 10;
      row.nrel = Math.round(singleGensetReliability(res.reliability, h) * 1000) / 10;
      out.push(row);
    }
    return out;
  }, [res]);

  const histData = useMemo(() => {
    if (!res) return [];
    const H = res.options.outageHours;
    const bins = 10;
    const rows = Array.from({ length: bins }, (_, i) => ({ bin: `${Math.round((i * H) / bins)}–${Math.round(((i + 1) * H) / bins)}`, baseline: 0, conventional: 0, sentinel: 0 } as Record<string, number | string>));
    for (const k of ["baseline", "conventional", "sentinel"]) {
      for (const v of res.byStrategy[k]?.criticalHours ?? []) {
        const i = Math.min(bins - 1, Math.floor((v / H) * bins));
        rows[i][k] = (rows[i][k] as number) + 1;
      }
    }
    return rows;
  }, [res]);

  const at = (k: string, h: number) => (res ? res.byStrategy[k].survival[Math.min(h, res.options.outageHours)] : 0);

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="cyan"><Dice5 size={11} /> Monte Carlo resilience</Badge>
          <Badge>NREL/TP-5C00-76553 generator data</Badge>
          <Badge>NASA POWER Maiduguri 2022–2024</Badge>
          <Badge>Common random numbers</Badge>
        </div>
        <h2 className="mt-3 text-xl font-bold text-white">How likely is the ICU to stay powered through the next line outage?</h2>
        <p className="mt-1 max-w-4xl text-sm text-slate-400">
          One replay shows what happened once. Each trial here draws a random outage start across three measured weather years, a generator
          failure-to-start and failures-while-running from published reliability statistics, a repair time, the starting tank level, and late or
          cancelled deliveries — then runs all three controllers against that identical trial.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Card title="Trial design">
          <div className="space-y-4">
            <div>
              <div className="label mb-1.5">Generator maintenance class</div>
              <div className="space-y-1.5">
                {RELIABILITY_CLASSES.map((c) => (
                  <button key={c.id} onClick={() => setCls(c.id)} className={clsx("w-full rounded-lg border px-2.5 py-1.5 text-left text-[11px]", cls === c.id ? "border-cyan/60 bg-cyan/10 text-white" : "border-surface-border text-slate-400 hover:text-white")}>
                    <div className="font-semibold">{c.label}</div>
                    <div className="num font-mono text-[10px] text-slate-500">FTS {fmtPct(c.failToStartProb, 2)} · MTTF {fmtNum(c.mttfHours)} h</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="label mb-1.5">Outage duration</div>
              <div className="grid grid-cols-4 gap-1">
                {DURATIONS.map((d) => (
                  <button key={d.h} onClick={() => setHours(d.h)} className={clsx("rounded-md border px-1 py-1 text-[11px]", hours === d.h ? "border-cyan/60 bg-cyan/10 text-white" : "border-surface-border text-slate-400")}>{d.label}</button>
                ))}
              </div>
            </div>
            <label className="block">
              <div className="flex justify-between"><span className="label">Mean repair incl. logistics</span><span className="num font-mono text-sm text-white">{repair} h</span></div>
              <input type="range" min={24} max={168} step={12} value={repair} onChange={(e) => setRepair(Number(e.target.value))} className="w-full accent-cyan" aria-label="Mean repair hours" />
              <div className="text-[11px] text-slate-500">U.S. PREP data: 37 h. NE Nigeria assumed longer.</div>
            </label>
            <label className="block">
              <div className="flex justify-between"><span className="label">Diesel per week</span><span className="num font-mono text-sm text-white">{fmtNum(supply)} L</span></div>
              <input type="range" min={2000} max={16000} step={1000} value={supply} onChange={(e) => setSupply(Number(e.target.value))} className="w-full accent-cyan" aria-label="Weekly diesel" />
              <div className="text-[11px] text-slate-500">30% of deliveries late (≤ 96 h), 10% never arrive.</div>
            </label>
            <div>
              <div className="label mb-1.5">Trials</div>
              <div className="grid grid-cols-3 gap-1">
                {[60, 120, 300].map((n) => (
                  <button key={n} onClick={() => setTrials(n)} className={clsx("rounded-md border px-1 py-1 text-[11px]", trials === n ? "border-cyan/60 bg-cyan/10 text-white" : "border-surface-border text-slate-400")}>{n}</button>
                ))}
              </div>
            </div>
            <button onClick={run} disabled={progress !== null} className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan px-3 py-2 text-sm font-semibold text-navy-950 transition hover:bg-cyan-soft disabled:opacity-60">
              <Play size={14} /> {progress !== null ? `Running… ${Math.round(progress * 100)}%` : "Run Monte Carlo"}
            </button>
            {progress !== null && (
              <div className="h-1.5 overflow-hidden rounded-full bg-navy-800"><div className="h-full bg-cyan transition-all" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
            )}
            {res && <div className="num font-mono text-[10px] text-slate-500">{res.options.trials} trials × 3 controllers · {fmtNum(res.elapsedMs)} ms · seed {res.options.seed}</div>}
          </div>
        </Card>

        <div className="space-y-5">
          {res && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { h: 72, label: "3 days" },
                { h: 168, label: "7 days" },
                { h: res.options.outageHours, label: "whole outage" },
              ].filter((x, i, a) => x.h <= res.options.outageHours && a.findIndex((y) => y.h === x.h) === i).map((x) => (
                <div key={x.h} className="card p-3.5">
                  <div className="label">P(Tier-1 kept through {x.label})</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="num text-2xl font-bold text-cyan">{fmtPct(at("sentinel", x.h), 0)}</span>
                    <span className="text-xs text-slate-500">Sentinel</span>
                  </div>
                  <div className="num text-xs text-slate-400">
                    status quo {fmtPct(at("baseline", x.h), 0)} · hybrid {fmtPct(at("conventional", x.h), 0)}
                  </div>
                </div>
              ))}
              <div className="card p-3.5">
                <div className="label">Mean Tier-1 hours</div>
                <div className="num mt-1 text-2xl font-bold text-white">{fmtNum(res.byStrategy.sentinel.meanTier1Hours)} <span className="text-sm text-slate-500">/ {res.options.outageHours}</span></div>
                <div className="num text-xs text-slate-400">status quo {fmtNum(res.byStrategy.baseline.meanTier1Hours)} h</div>
              </div>
            </div>
          )}
          <Card title="Survival curve — P(no sustained Tier-1 interruption) vs hours into the outage" subtitle="Grey dashed: NREL's closed-form single-generator reliability R(t) = OA·(1−FTS)·e^(−t/MTTF) for the selected class — fuel assumed unlimited. The simulated curves add fuel logistics, weather and storage.">
            {res ? (
              <ResponsiveContainer width="100%" height={290}>
                <LineChart data={survivalData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} />
                  <XAxis dataKey="h" type="number" domain={[0, res.options.outageHours]} {...AXIS_PROPS} tickFormatter={(h) => (h >= 48 ? `${Math.round(h / 24)}d` : `${h}h`)} />
                  <YAxis {...AXIS_PROPS} width={40} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} labelFormatter={(h) => `${h} h into outage`} formatter={(v: number, k: string) => [`${v}%`, LABEL(k)]} />
                  <Legend {...LEGEND_STYLE} formatter={LABEL} />
                  <Line dataKey="nrel" stroke={COLORS.nrel} strokeDasharray="5 4" dot={false} strokeWidth={1.4} isAnimationActive={false} />
                  {["baseline", "conventional", "sentinel"].map((k) => (
                    <Line key={k} dataKey={k} stroke={COLORS[k]} dot={false} strokeWidth={k === "sentinel" ? 2.6 : 1.6} isAnimationActive={false} type="stepAfter" />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[290px] items-center justify-center text-sm text-slate-400">Sampling trials…</div>
            )}
          </Card>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="Distribution of critical-service hours (Tier 1+2)" subtitle="Trials per bin — wider spread = less predictable care.">
              {res && (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={histData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis dataKey="bin" {...AXIS_PROPS} interval={1} />
                    <YAxis {...AXIS_PROPS} width={32} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} formatter={(v: number, k: string) => [`${v} trials`, LABEL(k)]} />
                    <Legend {...LEGEND_STYLE} formatter={LABEL} />
                    {["baseline", "conventional", "sentinel"].map((k) => <Bar key={k} dataKey={k} fill={COLORS[k]} radius={[3, 3, 0, 0]} isAnimationActive={false} />)}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card title="Trial statistics" right={<ShieldCheck size={16} className="text-cyan" />}>
              {res &&
                (["baseline", "conventional", "sentinel"] as const).map((k) => {
                  const r = res.byStrategy[k];
                  return (
                    <div key={k} className="mb-2">
                      <div className={clsx("text-xs font-semibold", k === "sentinel" ? "text-cyan" : "text-slate-300")}>{LABEL(k)}</div>
                      <Row k="Critical hours p10 · p50 · p90" v={`${fmtNum(r.p10CriticalHours)} · ${fmtNum(r.p50CriticalHours)} · ${fmtNum(r.p90CriticalHours)}`} mono />
                      <Row k="Zero Tier-1 breaks (any length)" v={fmtPct(r.pZeroBreaks, 0)} mono />
                      <Row k="Mean diesel · generator hours" v={`${fmtNum(r.meanDieselLitres)} L · ${fmtNum(r.meanGensetRunHours)} h`} mono />
                    </div>
                  );
                })}
            </Card>
          </div>
          <Note>
            Reliability inputs are the mean values of NREL/TP-5C00-76553 Tables 3–4 ({relClass.label}: FTS {fmtPct(relClass.failToStartProb, 2)}, MTTF {fmtNum(relClass.mttfHours)} h).
            The engine reproduces the report&apos;s headline — a well-maintained single generator is ≈ 80 % reliable over two weeks — as a unit test.
            Tank, delivery, delay and repair assumptions are explicit and editable; default {DEFAULT_MC.trials}-trial runs take a few seconds in the browser.
          </Note>
        </div>
      </div>
    </div>
  );
}
