"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { clsx } from "clsx";
import { Pause, Play, RotateCcw } from "lucide-react";
import { MAIDUGURI_EVENT, STRATEGIES, type SimResult, type Strategy } from "@/engine";
import { fmtNum } from "@/lib/format";

const MicrogridScene = dynamic(() => import("./MicrogridScene"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-500">Building the 3D model…</div>,
});

const CHOICES: { id: Strategy; label: string }[] = [
  { id: "baseline", label: "Status quo" },
  { id: "conventional", label: "Fixed-rule hybrid" },
  { id: "sentinel", label: "Sentinel" },
];

function stamp(t: number): string {
  const d = new Date(`${MAIDUGURI_EVENT.simStart}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Math.floor(t / 96));
  const h = (t % 96) / 4;
  return `${d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}, ${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
}

/** Cumulative strict critical / Tier-1 hours up to each step (for the running tally). */
function tallies(sim: SimResult) {
  const crit: number[] = [];
  const t1: number[] = [];
  let c = 0;
  let a = 0;
  for (const s of sim.steps) {
    if (s.islanded) {
      const gap = s.startGapSec > 0 && s.startGapSec <= 90;
      if (gap || s.servedKw[1] >= 0.995 * s.demandKw[1]) a += 0.25;
      if (gap || s.servedKw[1] + s.servedKw[2] >= 0.995 * (s.demandKw[1] + s.demandKw[2])) c += 0.25;
    }
    crit.push(c);
    t1.push(a);
  }
  return { crit, t1 };
}

function Status({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-surface-border/40 py-2 last:border-0">
      <div className="flex items-center gap-2.5">
        <span className={clsx("h-2.5 w-2.5 rounded-full", ok ? "bg-energy-green shadow-[0_0_10px_#45E0A0]" : "bg-energy-red shadow-[0_0_10px_#FF4D5E]")} />
        <span className="text-[13px] text-slate-200">{label}</span>
      </div>
      <span className="num text-[13px] text-slate-400">{detail}</span>
    </div>
  );
}

export function OutageTheatre({ results, pvKwp, batteryKwh, tankLitres }: { results: Record<Strategy, SimResult>; pvKwp: number; batteryKwh: number; tankLitres: number }) {
  const [strategy, setStrategy] = useState<Strategy>("sentinel");
  const steps = results.baseline.steps.length;
  // Open on the first night the status-quo hospital loses its life-critical circuits.
  const firstDark = useMemo(() => {
    const i = results.baseline.steps.findIndex((s) => s.islanded && s.demandKw[1] > 0 && s.servedKw[1] < 0.5 * s.demandKw[1]);
    return i > 0 ? i + ((4 - (i % 4)) % 4) : 96 * 3;
  }, [results]);
  const [t, setT] = useState(firstDark);
  const [playing, setPlaying] = useState(false);
  useEffect(() => setT(firstDark), [firstDark]);
  const tallyMap = useMemo(() => Object.fromEntries(CHOICES.map((c) => [c.id, tallies(results[c.id])])) as Record<Strategy, ReturnType<typeof tallies>>, [results]);

  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      if (now - last > 90) {
        last = now;
        setT((v) => {
          if (v + 4 >= steps) {
            setPlaying(false);
            return steps - 1;
          }
          return v + 4;
        });
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing, steps]);

  const sim = results[strategy];
  const step = sim.steps[Math.min(t, steps - 1)];
  const outStart = MAIDUGURI_EVENT.outageStartDay * 96;
  const outEnd = (MAIDUGURI_EVENT.outageStartDay + MAIDUGURI_EVENT.outageDays) * 96;
  const elapsedOutageH = Math.max(0, Math.min(t, outEnd) - outStart) / 4;
  const tally = tallyMap[strategy];
  const frac = (k: 1 | 2 | 3) => (step.demandKw[k] > 0.01 ? step.servedKw[k] / step.demandKw[k] : 1);
  const label = STRATEGIES.find((s) => s.id === strategy)!;

  return (
    <section className="overflow-hidden rounded-[18px] border border-surface-border/70 bg-navy-900">
      <div className="grid xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative h-[440px] md:h-[540px]">
          <MicrogridScene step={step} pvKwp={strategy === "baseline" ? 0 : pvKwp} batteryKwh={strategy === "baseline" ? 0 : batteryKwh} tankLitres={tankLitres} />
          <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-navy-950/80 px-3 py-2">
            <div className="display text-[22px] font-bold leading-none text-white">{stamp(t)}</div>
            <div className="mt-1 text-[12px] text-slate-400">
              {step.islanded ? `Line down · hour ${fmtNum(elapsedOutageH)} of ${fmtNum(MAIDUGURI_EVENT.outageDays * 24)}` : t < outStart ? "Before the line is cut" : "Line restored"}
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-4 left-4 text-[11.5px] text-slate-500">Drag to orbit · every light, level and pulse is read from the simulation</div>
        </div>

        <div className="flex flex-col gap-4 border-t border-surface-border/60 p-5 xl:border-l xl:border-t-0">
          <div>
            <div className="mb-2 text-[12px] text-slate-400">Controller (same hospital, same diesel)</div>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-navy-950 p-1" role="radiogroup" aria-label="Controller">
              {CHOICES.map((c) => (
                <button key={c.id} role="radio" aria-checked={strategy === c.id} onClick={() => setStrategy(c.id)} className={clsx("rounded-lg px-2 py-2 text-[12.5px] font-semibold transition-colors", strategy === c.id ? (c.id === "sentinel" ? "bg-cyan text-navy-950" : "bg-navy-700 text-white") : "text-slate-400 hover:text-white")}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="mt-1.5 text-[11.5px] text-slate-500">{label.hardware}</div>
          </div>

          <div>
            <Status ok={frac(1) >= 0.995} label="ICU, theatres, cold chain" detail={`${fmtNum(step.servedKw[1])} / ${fmtNum(step.demandKw[1])} kW`} />
            <Status ok={frac(2) >= 0.995} label="Wards, lab, pharmacy" detail={`${fmtNum(step.servedKw[2])} / ${fmtNum(step.demandKw[2])} kW`} />
            <Status ok={frac(3) >= 0.995} label="Admin, laundry, cooling" detail={step.deferredKw[3] > 0.5 ? "deferred" : `${fmtNum(step.servedKw[3])} / ${fmtNum(step.demandKw[3])} kW`} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-navy-950 p-3">
              <div className="text-[12px] text-slate-400">Critical hours kept</div>
              <div className="display num text-[30px] font-bold leading-tight text-white">{fmtNum(tally.crit[t])}</div>
              <div className="num text-[11.5px] text-slate-500">of {fmtNum(elapsedOutageH)} so far</div>
            </div>
            <div className="rounded-xl bg-navy-950 p-3">
              <div className="text-[12px] text-slate-400">Diesel on site</div>
              <div className={clsx("display num text-[30px] font-bold leading-tight", step.fuelLitres < 3 ? "text-energy-red" : "text-white")}>{fmtNum(step.fuelLitres)}</div>
              <div className="text-[11.5px] text-slate-500">litres of {fmtNum(tankLitres)}</div>
            </div>
          </div>

          <div className="mt-auto">
            <input type="range" min={0} max={steps - 1} step={4} value={t} onChange={(e) => { setPlaying(false); setT(Number(e.target.value)); }} className="w-full accent-cyan" aria-label="Time in the outage" />
            <div className="mt-2 flex gap-2">
              <button onClick={() => { if (t >= steps - 5) setT(outStart); setPlaying((p) => !p); }} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan px-3 py-2 text-[13px] font-semibold text-navy-950 hover:bg-cyan-soft">
                {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? "Pause" : "Play the outage"}
              </button>
              <button onClick={() => { setPlaying(false); setT(firstDark); }} className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-2 text-[13px] text-slate-300 hover:text-white" title="Jump to the moment the status-quo hospital first loses its life-critical circuits">
                <RotateCcw size={14} /> First blackout
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
