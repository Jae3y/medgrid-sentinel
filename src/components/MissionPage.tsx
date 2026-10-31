"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2, Fuel, MapPin, Radio, ShieldCheck, Smartphone, Sun, Zap } from "lucide-react";
import {
  compareStrategies,
  smsFeed,
  ussdStatus,
  STRATEGIES,
  MAIDUGURI_EVENT,
  type SimResult,
  type Strategy,
} from "@/engine";
import { missionConfig, useApp } from "@/lib/store";
import { Badge, Card, Note } from "./ui";
import { OutageTheatre } from "./OutageTheatre";
import { fmtNum } from "@/lib/format";
import { AXIS_PROPS, GRID_PROPS, LEGEND_STYLE, TOOLTIP_LABEL, TOOLTIP_STYLE } from "@/lib/chart-theme";

const STRAT_COLOR: Record<Strategy, string> = {
  baseline: "#A3AEC2",
  baseline_rationed: "#C084FC",
  conventional: "#F2B544",
  sentinel: "#45E0A0",
};

type Cell = "grid" | "full" | "deferred" | "essential" | "t1only" | "lost";
const CELL_COLOR: Record<Cell, string> = {
  grid: "#1A3739",
  full: "#45E0A0",
  deferred: "#2F9E8F",
  essential: "#F2B544",
  t1only: "#FB923C",
  lost: "#FF4D5E",
};
const CELL_LABEL: Record<Cell, string> = {
  grid: "Grid connected",
  full: "Island · full service",
  deferred: "Island · Tier-3 deferred",
  essential: "Island · Tier-2 reduced",
  t1only: "Island · Tier-1 only",
  lost: "Tier-1 LOST",
};

function hourlyCells(sim: SimResult): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i + 4 <= sim.steps.length; i += 4) {
    let worst = -1;
    let cell: Cell = "grid";
    for (let k = 0; k < 4; k++) {
      const s = sim.steps[i + k];
      let c: Cell;
      let rank: number;
      if (!s.islanded) [c, rank] = ["grid", 0];
      else {
        const d1 = s.demandKw[1];
        const short1 = d1 > 0 && s.servedKw[1] < 0.995 * d1 && !(s.startGapSec > 0 && s.startGapSec <= 90);
        const dc = s.demandKw[1] + s.demandKw[2];
        const shortCrit = s.servedKw[1] + s.servedKw[2] < 0.995 * dc && !(s.startGapSec > 0 && s.startGapSec <= 90);
        if (short1) [c, rank] = ["lost", 5];
        else if (s.serviceLevel === 0) [c, rank] = ["t1only", 4];
        else if (shortCrit || s.serviceLevel === 1) [c, rank] = ["essential", 3];
        else if (s.serviceLevel === 2 || s.unservedKw[3] > 0.01 * s.demandKw[3]) [c, rank] = ["deferred", 2];
        else [c, rank] = ["full", 1];
      }
      if (rank > worst) {
        worst = rank;
        cell = c;
      }
    }
    cells.push(cell);
  }
  return cells;
}

function dateLabel(start: string, day: number): string {
  const d = new Date(`${start}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + day);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
}

function ServiceRibbon({ results }: { results: Record<Strategy, SimResult> }) {
  const start = MAIDUGURI_EVENT.simStart;
  const rows = STRATEGIES.map((s) => ({ s, cells: hourlyCells(results[s.id]) }));
  const hours = rows[0].cells.length;
  const W = 1000;
  const rowH = 22;
  const cw = W / hours;
  const days = Math.floor(hours / 24);
  return (
    <div>
      <div className="space-y-2.5">
        {rows.map(({ s, cells }) => {
          const m = results[s.id].metrics;
          return (
            <div key={s.id}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-[11px]">
                <span className={clsx("font-semibold", s.id === "sentinel" ? "text-cyan" : "text-slate-300")}>{s.label}</span>
                <span className="num text-slate-400">
                  {fmtNum(m.criticalMaintainedHours)} h critical · {fmtNum(m.tier1MaintainedHours)} h Tier-1
                </span>
              </div>
              <svg viewBox={`0 0 ${W} ${rowH}`} className="h-5 w-full" preserveAspectRatio="none" role="img" aria-label={`${s.label} hourly service`}>
                {cells.map((c, i) => (
                  <rect key={i} x={i * cw} y={0} width={cw + 0.4} height={rowH} fill={CELL_COLOR[c]} />
                ))}
              </svg>
            </div>
          );
        })}
      </div>
      <svg viewBox={`0 0 ${W} 16`} className="mt-1 h-4 w-full" preserveAspectRatio="none" aria-hidden>
        {Array.from({ length: days + 1 }, (_, d) =>
          d % 3 === 0 ? (
            <text key={d} x={d * 24 * cw} y={12} fill="#8FA9A6" fontSize={10} textAnchor={d === 0 ? "start" : "middle"}>
              {dateLabel(start, d)}
            </text>
          ) : null
        )}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {(Object.keys(CELL_COLOR) as Cell[]).map((c) => (
          <span key={c} className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CELL_COLOR[c] }} />
            {CELL_LABEL[c]}
          </span>
        ))}
      </div>
    </div>
  );
}

function FuelChart({ results }: { results: Record<Strategy, SimResult> }) {
  const data = useMemo(() => {
    const n = results.baseline.steps.length;
    const out: Record<string, number | string>[] = [];
    for (let t = 0; t < n; t += 8) {
      const row: Record<string, number | string> = { day: t / 96, label: dateLabel(MAIDUGURI_EVENT.simStart, Math.floor(t / 96)) };
      for (const s of STRATEGIES) row[s.id] = Math.round(results[s.id].steps[t].fuelLitres);
      out.push(row);
    }
    return out;
  }, [results]);
  return (
    <ResponsiveContainer width="100%" height={230}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="day" type="number" domain={[0, MAIDUGURI_EVENT.horizonDays]} tickFormatter={(d) => dateLabel(MAIDUGURI_EVENT.simStart, Math.floor(d))} ticks={[0, 7, 14, 21, 28, 35, 42]} {...AXIS_PROPS} />
        <YAxis {...AXIS_PROPS} width={52} tickFormatter={(v) => `${fmtNum(v / 1000, 0)}k L`} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} labelFormatter={(d) => dateLabel(MAIDUGURI_EVENT.simStart, Math.floor(Number(d)))} formatter={(v: number, k: string) => [`${fmtNum(v)} L`, STRATEGIES.find((s) => s.id === k)?.short ?? k]} />
        <Legend {...LEGEND_STYLE} formatter={(k: string) => STRATEGIES.find((s) => s.id === k)?.short ?? k} />
        <ReferenceLine x={MAIDUGURI_EVENT.outageStartDay} stroke="#FF4D5E" strokeDasharray="3 3" />
        <ReferenceLine x={MAIDUGURI_EVENT.outageStartDay + MAIDUGURI_EVENT.outageDays} stroke="#45E0A0" strokeDasharray="3 3" />
        {STRATEGIES.map((s) => (
          <Line key={s.id} dataKey={s.id} stroke={STRAT_COLOR[s.id]} dot={false} strokeWidth={s.id === "sentinel" ? 2.4 : 1.4} isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

const SUPPLY_LEVELS = [0, 2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000];

function SupplyCurve() {
  const { mission, stress } = useApp();
  const [data, setData] = useState<Record<string, number>[] | null>(null);
  const [metric, setMetric] = useState<"crit" | "t1">("crit");
  const [progress, setProgress] = useState(0);
  const key = JSON.stringify({ ...mission, weeklySupplyLitres: 0, stress });
  const keyRef = useRef(key);
  useEffect(() => {
    keyRef.current = key;
    let cancelled = false;
    setData(null);
    setProgress(0);
    (async () => {
      const rows: Record<string, number>[] = [];
      for (let i = 0; i < SUPPLY_LEVELS.length; i++) {
        await new Promise((r) => setTimeout(r, 0));
        if (cancelled) return;
        const res = compareStrategies(missionConfig({ ...mission, weeklySupplyLitres: SUPPLY_LEVELS[i] }, stress));
        const row: Record<string, number> = { supply: SUPPLY_LEVELS[i] };
        for (const s of STRATEGIES) {
          row[`crit_${s.id}`] = Math.round(res[s.id].metrics.criticalMaintainedHours);
          row[`t1_${s.id}`] = Math.round(res[s.id].metrics.tier1MaintainedHours);
        }
        rows.push(row);
        setProgress((i + 1) / SUPPLY_LEVELS.length);
      }
      if (!cancelled) setData(rows);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const current = mission.weeklySupplyLitres ?? 6000;
  return (
    <Card
      title={metric === "crit" ? "Critical-service hours (Tier 1+2) vs weekly diesel supply" : "Life-critical Tier-1 hours vs weekly diesel supply"}
      subtitle="Same outage, same weather, 9 supply levels × 4 strategies (36 full replays). Where fuel is plentiful every option converges; where the supply chain binds, the controller decides who stays powered."
      right={
        <div className="flex shrink-0 rounded-lg border border-surface-border p-0.5 text-[11px]">
          {(["crit", "t1"] as const).map((m) => (
            <button key={m} onClick={() => setMetric(m)} className={clsx("rounded-md px-2 py-0.5", metric === m ? "bg-cyan/15 text-cyan" : "text-slate-400")}>
              {m === "crit" ? "Tier 1+2" : "Tier 1"}
            </button>
          ))}
        </div>
      }
    >
      {!data ? (
        <div className="flex h-[240px] flex-col items-center justify-center gap-3 text-xs text-slate-400">
          <div className="h-1.5 w-56 overflow-hidden rounded-full bg-navy-800">
            <div className="h-full bg-cyan transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          Running replays… {Math.round(progress * 100)}%
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="supply" {...AXIS_PROPS} tickFormatter={(v) => `${v / 1000}k`} />
            <YAxis {...AXIS_PROPS} width={44} domain={[0, 940]} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} labelFormatter={(v) => `${fmtNum(Number(v))} L/week`} formatter={(v: number, k: string) => [`${fmtNum(v)} h`, STRATEGIES.find((s) => k.endsWith(s.id))?.short ?? k]} />
            <Legend {...LEGEND_STYLE} formatter={(k: string) => STRATEGIES.find((s) => k.endsWith(s.id))?.short ?? k} />
            <ReferenceLine x={current} stroke="#45E0A0" strokeDasharray="3 3" label={{ value: "selected", fill: "#45E0A0", fontSize: 10, position: "top" }} />
            {STRATEGIES.map((s) => (
              <Line key={s.id} dataKey={`${metric}_${s.id}`} stroke={STRAT_COLOR[s.id]} strokeWidth={s.id === "sentinel" ? 2.6 : 1.5} dot={{ r: 2 }} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
      <Note>
        X-axis: litres delivered per week in two drops (tank 10,000 L). The same hospital burns ≈3,360 L/week in a normal year on this
        feeder (full-year simulation); a line outage multiplies the need roughly fourfold. Honest trade-off: below ~5,000 L/week Sentinel
        deliberately sacrifices Tier-2 hours to keep Tier-1 (ICU, theatres, cold chain) on — switch to “Tier 1” to see it.
      </Note>
    </Card>
  );
}

function SmsPhone({ sim }: { sim: SimResult }) {
  const feed = useMemo(() => smsFeed(sim, 12), [sim]);
  const lastIslanded = useMemo(() => {
    const i = sim.steps.findIndex((s) => s.islanded && s.day >= 10);
    return sim.steps[i >= 0 ? i : 0];
  }, [sim]);
  const ussd = ussdStatus(lastIslanded, sim.config.battery.nominalKwh, sim.config.battery.minSocFrac, sim.config.battery.dischargeEff);
  return (
    <Card
      title="Field channel — works on any phone"
      subtitle="Sentinel's alerts as single-segment SMS (≤160 GSM-7 chars) and a USSD status menu for the duty engineer. Generated from the replay; nothing is sent from the prototype."
      right={<span className="shrink-0 whitespace-nowrap"><Badge tone="cyan"><Smartphone size={12} /> feature phone</Badge></span>}
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
        <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
          {feed.map((a, i) => (
            <div key={i} className={clsx("rounded-lg border px-2.5 py-1.5 font-mono text-[11px] leading-snug", a.severity === "critical" ? "border-energy-red/40 bg-energy-red/5 text-red-200" : a.severity === "warning" ? "border-energy-amber/30 bg-energy-amber/5 text-amber-100" : "border-surface-border/60 bg-navy-950/60 text-slate-300")}>
              {a.text}
              <span className="ml-2 text-[10px] text-slate-500">{a.chars}/160</span>
            </div>
          ))}
        </div>
        <div className="mx-auto w-[190px] rounded-[22px] border-4 border-slate-700 bg-slate-900 p-3 shadow-inner">
          <div className="mb-2 text-center text-[9px] uppercase tracking-widest text-slate-500">*347*7# · USSD</div>
          <pre className="whitespace-pre-wrap rounded-md bg-[#9BBC0F]/90 p-2 font-mono text-[10.5px] leading-tight text-[#0F380F]">{ussd}</pre>
          <div className="mt-2 grid grid-cols-3 gap-1">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((k) => (
              <div key={k} className="rounded bg-slate-800 py-0.5 text-center text-[10px] text-slate-400">{k}</div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt, hint }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string; hint?: string }) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-2">
        <span className="label">{label}</span>
        <span className="num text-sm font-semibold text-white">{fmt(local)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={local}
        onChange={(e) => setLocal(Number(e.target.value))}
        onMouseUp={() => onChange(local)}
        onTouchEnd={() => onChange(local)}
        onKeyUp={() => onChange(local)}
        className="mt-1.5 w-full accent-cyan"
        aria-label={label}
      />
      {hint && <div className="text-[11px] text-slate-500">{hint}</div>}
    </label>
  );
}

const HARDWARE = [
  { id: "ref", label: "Reference (optimizer)", pvKwp: 600, batteryKwh: 600, inverterKw: 510 },
  { id: "luth", label: "NSIA-LUTH-class", pvKwp: 300, batteryKwh: 1100, inverterKw: 370 },
  { id: "small", label: "Half-size", pvKwp: 300, batteryKwh: 300, inverterKw: 260 },
];

export function MissionPage() {
  const { mission, stress, setMission, setStress, missionResults, missionMs } = useApp();
  const results = missionResults!;
  const sen = results.sentinel.metrics;
  // Islanded hours from the engine: 39 days + the 30-min reconnection delay.
  const outageH = sen.outageHours;
  const base = results.baseline.metrics;
  const conv = results.conventional.metrics;
  const supply = mission.weeklySupplyLitres ?? 6000;
  const hw = HARDWARE.find((h) => h.pvKwp === mission.pvKwp && h.batteryKwh === mission.batteryKwh)?.id ?? "ref";
  const hoursGained = sen.criticalMaintainedHours - base.criticalMaintainedHours;
  const litresSaved = base.dieselLitres - sen.dieselLitres;
  const governorEvents = results.sentinel.events.filter((e) => ["governor", "fuel_out", "genset_ftr", "genset_fts", "fuel_missed", "outage_start", "grid_reconnect"].includes(e.type)).slice(0, 14);

  return (
    <div className="space-y-5">
      <OutageTheatre results={results} pvKwp={mission.pvKwp ?? 600} batteryKwh={mission.batteryKwh ?? 600} tankLitres={mission.tankLitres ?? 10000} />

      {/* The brief's metric, as one ledger rather than four look-alike cards */}
      <section className="grid overflow-hidden rounded-[18px] border border-surface-border/70 bg-surface/60 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { k: "Critical-service hours kept", v: `${fmtNum(sen.criticalMaintainedHours)}`, unit: `of ${fmtNum(outageH)} h`, note: `Status quo ${fmtNum(base.criticalMaintainedHours)} h — Sentinel keeps ${fmtNum(hoursGained)} more hours of Tier 1 and 2 care.`, tone: "text-energy-green" },
          { k: "Diesel litres avoided", v: `${fmtNum(litresSaved)}`, unit: "litres", note: `${fmtNum(sen.dieselLitres)} L burned against ${fmtNum(base.dieselLitres)} L — twice the care on less fuel.`, tone: "text-energy-green" },
          { k: "Life-critical hours", v: `${fmtNum(sen.tier1MaintainedHours)}`, unit: `of ${fmtNum(outageH)} h`, note: `ICU, theatres and cold chain never lose power. Status quo: ${base.tier1Interruptions} interruptions.`, tone: "text-white" },
          { k: "What the software alone adds", v: `+${fmtNum(sen.criticalMaintainedHours - conv.criticalMaintainedHours)}`, unit: "hours", note: "Against a fixed-rule inverter on the identical solar, battery and generator.", tone: "text-white" },
        ].map((m, i) => (
          <div key={m.k} className={clsx("p-5", i > 0 && "border-t border-surface-border/60 sm:border-t-0 sm:border-l")}>
            <div className="text-[13px] text-slate-400">{m.k}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={clsx("display num text-[44px] font-bold leading-none", m.tone)}>{m.v}</span>
              <span className="text-[13px] text-slate-400">{m.unit}</span>
            </div>
            <p className="mt-2 text-[13px] leading-snug text-slate-400">{m.note}</p>
          </div>
        ))}
      </section>

      <p className="max-w-[78ch] text-[14.5px] leading-relaxed text-slate-400">
        On 22 September 2024 insurgents brought down tower 372 on the Gombe–Damaturu–Maiduguri 330 kV line; the city was cut off until
        31 October. In December 2022 two Maiduguri hospitals sat dark for days with working generators and empty tanks. This replay runs that
        39-day outage, on NASA POWER weather measured for those exact dates, for an illustrative 250-bed referral hospital — four controllers,
        identical loads, deliveries and failures. Simulation, not measured hospital data.
      </p>

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* Controls */}
        <Card title="Replay controls" subtitle={`Every change re-runs 4 × ${fmtNum(MAIDUGURI_EVENT.horizonDays * 96)} steps${missionMs > 0 ? ` (${missionMs.toFixed(0)} ms)` : ""}`}>
          <div className="space-y-4">
            <Slider label="Diesel delivered per week" value={supply} min={0} max={16000} step={1000} onChange={(v) => setMission({ weeklySupplyLitres: v })} fmt={(v) => `${fmtNum(v)} L`} hint={`${(supply / 3360).toFixed(1)}× normal weekly use · ₦${fmtNum((supply * 1950) / 1e6, 1)}M/week at ₦1,950/L`} />
            <Slider label="Grid hours/day during outage" value={mission.residualGridHoursPerDay ?? 0} min={0} max={12} step={1} onChange={(v) => setMission({ residualGridHoursPerDay: v })} fmt={(v) => `${v} h`} hint="Residual city supply (e.g. emergency gas plant) from 17:00" />
            <div>
              <div className="label mb-1.5">Hardware</div>
              <div className="grid grid-cols-3 gap-1.5">
                {HARDWARE.map((h) => (
                  <button key={h.id} onClick={() => setMission({ pvKwp: h.pvKwp, batteryKwh: h.batteryKwh, inverterKw: h.inverterKw })} className={clsx("rounded-lg border px-2 py-1.5 text-left text-[11px] leading-tight", hw === h.id ? "border-cyan/60 bg-cyan/10 text-white" : "border-surface-border text-slate-400 hover:text-white")}>
                    <div className="font-semibold">{h.label}</div>
                    <div className="num text-[10px] text-slate-500">{h.pvKwp} kWp · {h.batteryKwh} kWh</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 border-t border-surface-border/60 pt-3">
              <div className="label">Stress events (same for all four)</div>
              <label className="flex items-center justify-between gap-2 text-xs text-slate-300">
                <span>Generator trips after 150 run-hours (72 h repair)</span>
                <input type="checkbox" className="h-4 w-4 accent-cyan" checked={stress.gensetFailAtRunHours > 0} onChange={(e) => setStress({ gensetFailAtRunHours: e.target.checked ? 150 : 0 })} />
              </label>
              <label className="flex items-center justify-between gap-2 text-xs text-slate-300">
                <span>Convoy cancelled (4th delivery never arrives)</span>
                <input type="checkbox" className="h-4 w-4 accent-cyan" checked={stress.missedDelivery >= 0} onChange={(e) => setStress({ missedDelivery: e.target.checked ? 3 : -1 })} />
              </label>
            </div>
            <Note>
              Tank 10,000 L, 60% full at the start; deliveries every 3.5 days. The generator is the same 400 kW set for the hybrid
              strategies; the status quo gets a larger set sized to the full facility (no PV/battery).
            </Note>
          </div>
        </Card>

        <div className="space-y-5">
          <Card title="Hour-by-hour service through the outage" subtitle="Each cell is one hour; the worst quarter-hour sets its colour. Red = life-critical Tier-1 circuits (ICU, theatres, cold chain, oxygen, ED) without power.">
            <ServiceRibbon results={results} />
          </Card>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {STRATEGIES.map((s) => {
              const m = results[s.id].metrics;
              const isS = s.id === "sentinel";
              return (
                <div key={s.id} className={clsx("card p-3.5", isS && "border-cyan/50 ring-1 ring-cyan/30")}>
                  <div className="flex items-center justify-between gap-2">
                    <div className={clsx("text-xs font-semibold", isS ? "text-cyan" : "text-slate-300")}>{s.short}</div>
                    <span className="text-[10px] text-slate-500">{s.hardware}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                    <span className="text-slate-400">Critical hours</span>
                    <span className={clsx("num text-right num font-semibold", m.criticalMaintainedHours >= outageH ? "text-energy-green" : "text-white")}>{fmtNum(m.criticalMaintainedHours)}</span>
                    <span className="text-slate-400">Tier-1 hours</span>
                    <span className={clsx("num text-right num font-semibold", m.tier1MaintainedHours >= outageH ? "text-energy-green" : "text-energy-red")}>{fmtNum(m.tier1MaintainedHours)}</span>
                    <span className="text-slate-400">Diesel burned</span>
                    <span className="num text-right num text-white">{fmtNum(m.dieselLitres)} L</span>
                    <span className="text-slate-400">Empty-tank hours</span>
                    <span className={clsx("num text-right num", m.fuelOutHours > 0 ? "text-energy-red" : "text-white")}>{fmtNum(m.fuelOutHours)}</span>
                    <span className="text-slate-400">Tier-1 breaks</span>
                    <span className="num text-right num text-white">{m.tier1Interruptions}</span>
                    <span className="text-slate-400">Load deferred</span>
                    <span className="num text-right num text-white">{fmtNum(m.deferredKwh / 1000, 1)} MWh</span>
                    <span className="text-slate-400">Generator hours</span>
                    <span className="num text-right num text-white">{fmtNum(m.gensetRuntimeH)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Diesel in the tank" subtitle="Litres on site, sampled every 2 h. Saw-teeth are deliveries; a line on the floor is a dark hospital." right={<Fuel size={16} className="text-energy-amber" />}>
          <FuelChart results={results} />
        </Card>
        <SupplyCurve />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Why Sentinel decided what it decided" subtitle="Fuel-runway governor log (first entries) — every decision states the arithmetic behind it." right={<ShieldCheck size={16} className="text-cyan" />}>
          <div className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
            {governorEvents.map((e, i) => (
              <div key={i} className="flex gap-2 rounded-lg border border-surface-border/50 bg-navy-950/50 px-2.5 py-1.5 text-[11.5px] leading-snug">
                {e.severity === "critical" ? <AlertTriangle size={13} className="mt-0.5 shrink-0 text-energy-red" /> : e.severity === "warning" ? <Radio size={13} className="mt-0.5 shrink-0 text-energy-amber" /> : <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-energy-green" />}
                <div>
                  <span className="num mr-1.5 num text-[10.5px] text-slate-500">{dateLabel(MAIDUGURI_EVENT.simStart, e.day)} {String(Math.floor(e.hour)).padStart(2, "0")}:{String(Math.round((e.hour % 1) * 60)).padStart(2, "0")}</span>
                  <span className="text-slate-300">{e.message}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <SmsPhone sim={results.sentinel} />
      </div>

      <Note>
        How the brief&apos;s metrics are computed: <b>critical-service hours</b> = islanded hours in which ≥ 99.5 % of Tier-1 and Tier-2 demand was
        served (a ≤ 90 s generator transfer break is counted separately as an interruption); <b>diesel litres avoided</b> = status-quo litres −
        Sentinel litres over the same window. Loads are an illustrative 250-bed referral profile; weather is NASA POWER measured hourly data for
        Maiduguri (22 Sep – 31 Oct 2024); prices: diesel ₦1,950/L (Oct-2026 retail range). Simulation, not field-measured performance.
      </Note>
    </div>
  );
}
